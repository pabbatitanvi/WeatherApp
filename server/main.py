from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from geopy.geocoders import Nominatim
import os
import csv
from fuzzywuzzy import fuzz, process
from pymongo import MongoClient
from datetime import datetime
from dotenv import load_dotenv

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])

load_dotenv()

api_key = os.getenv("REACT_APP_WEATHER_API")
geolocator = Nominatim(user_agent="weatherapp")
mongo = MongoClient(os.getenv("REACT_APP_DATABASE"))
db = mongo["weather"]
collection = db["details"]
youtube_api = os.getenv("REACT_APP_YOUTUBE")


def fuzzy_match(user_input):
    city_list=[]
    try:
        with open("server\worldcities.csv", 'r', newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                city_list.append(row["city"])
    except Exception as e:
        print(f"{e}")
        return None
    
    match, score = process.extractOne(user_input, city_list, scorer=fuzz.token_sort_ratio)
    if score>=80:
        return match
    return user_input

def validate_date(sdate, edate):
    try:
        start_date = datetime.strptime(sdate, "%Y-%m-%d")
        end_date = datetime.strptime(edate, "%Y-%m-%d")
        return start_date <= end_date;
    except ValueError:
        return False;


@app.route("/weather")
def weather_info():
    input = request.args.get("input")
    start_date_arg = request.args.get("sdate")
    end_date_arg = request.args.get("edate")

    if not validate_date(start_date_arg, end_date_arg):
        return jsonify({"error": "Date range error"})
    
    if "," in input:
        lat, lon = input.split(",")
        weather_url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}"
        forecast_url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={api_key}"
    elif input.isdigit():
        weather_url= f"https://api.openweathermap.org/data/2.5/weather?zip={input}&appid={api_key}"
        forecast_url= f"https://api.openweathermap.org/data/2.5/forecast?zip={input}&appid={api_key}"
    else:
        check_spell = fuzzy_match(input)
        if check_spell:
            weather_url = f"https://api.openweathermap.org/data/2.5/weather?q={check_spell}&appid={api_key}"
            forecast_url = f"https://api.openweathermap.org/data/2.5/forecast?q={check_spell}&appid={api_key}"
        else:
            return jsonify({"error": "error with city or landmark name"})
        
    reponse_weather = requests.get(weather_url).json()
    response_forecast = requests.get(forecast_url).json()
    start = datetime.strptime(start_date_arg, "%Y-%m-%d")
    end = datetime.strptime(end_date_arg, "%Y-%m-%d")
    filtered_forecast = []
    for item in response_forecast.get("list", []):
        item_date = datetime.strptime(item["dt_txt"].split(" ")[0], "%Y-%m-%d")
        if start <= item_date <= end:
            filtered_forecast.append(item)

    response_forecast["list"] = filtered_forecast
    location = reponse_weather.get("name", input)
    record = {
        "location": location,
        "startDate": start,
        "endDate": end,
        "forecastData": response_forecast,
        "createdDate": datetime.now()
    }
    collection.insert_one(record)
    query = "video about" + reponse_weather.get("name", input) + "city"
    youtube_url = f"https://www.googleapis.com/youtube/v3/search?part=snippet&q={query}&type=video&maxResults=5&key={youtube_api}"
    video_response = requests.get(youtube_url).json()
    return jsonify({"current": reponse_weather, "forecast": response_forecast, "video": video_response})

@app.route("/records")
def get_records():
    try:
        stored_weather = list(collection.find({}, {"_id":0}))
        for date in stored_weather:
            if isinstance(date.get("startDate"), datetime):
                date["startDate"] = date["startDate"].strftime("%Y-%m-%d")
            if isinstance(date.get("endDate"), datetime):
                date["endDate"] = date["endDate"].strftime("%Y-%m-%d")
            if isinstance(date.get("createdDate"), datetime):
                date["createdDate"] = date["createdDate"].strftime("%Y-%m-%d")
        return jsonify({"stored": stored_weather})
    except Exception:
        return jsonify({"error": Exception})

if __name__ == "__main__":
    app.run(debug=True)

