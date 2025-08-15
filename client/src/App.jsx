import React, { useState } from "react";
import "./App.css";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import{InfoCircle} from 'react-bootstrap-icons'
import{Tooltip, OverlayTrigger} from "react-bootstrap";

function App() {
  const [inputValue, setInputValue] = useState("");
  const [weatherData, setWeatherData] = useState(null);
  const [forecastData, setForecastData] = useState([])
  const [startDate, setStartDate] = useState()
  const [endDate, setEndDate] = useState()
  const [pastWeather, setPastWeather] = useState([])
  const [updatedData, setUpdatedData] = useState([])
  const [video, setVideo] = useState([])

  const handleChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setWeatherData(null);
    setForecastData([])
    setVideo([]);
    
    try {
      const response = await fetch(
        `http://localhost:5000/weather?input=${encodeURIComponent(inputValue)}&sdate=${startDate.toISOString().split("T")[0]}&edate=${endDate.toISOString().split("T")[0]}`
      );
      if (!response.ok) {
        throw new Error("Weather data not found.");
      }

      const data = await response.json();
      setWeatherData(data.current);

      if (data.forecast) {
        const daysForecast = [];
        for (let i = 0; i < data.forecast.list.length; i+= 8) {
          const item = data.forecast.list[i];
            daysForecast.push({
              date: item.dt_txt.split(" ")[0],  
              temp: Math.round(item.main.temp - 273.15),
              description: item.weather[0].description,
              icon: item.weather[0].icon
            });
        }
        setForecastData(daysForecast);
      }
      setVideo(data.video.items)
    } catch (err) {
      return err
    }
  }
  const renderTooltip = (props) => (
    <Tooltip id="button-tooltip" {...props}>
      The Product Manager Accelerator Program is designed to support PM professionals through every stage of their careers. From students looking for entry-level jobs to Directors looking to take on a leadership role, our program has helped over hundreds of students fulfill their career aspirations.

      Our Product Manager Accelerator community are ambitious and committed. Through our program they have learnt, honed and developed new PM and leadership skills, giving them a strong foundation for their future endeavors.

      Here are the examples of services we offer. Check out our website (link under my profile) to learn more about our services.

      🚀 PMA Pro
      End-to-end product manager job hunting program that helps you master FAANG-level Product Management skills, conduct unlimited mock interviews, and gain job referrals through our largest alumni network. 25% of our offers came from tier 1 companies and get paid as high as $800K/year. 

      🚀 AI PM Bootcamp
      Gain hands-on AI Product Management skills by building a real-life AI product with a team of AI Engineers, data scientists, and designers. We will also help you launch your product with real user engagement using our 100,000+ PM community and social media channels. 

      🚀 PMA Power Skills
      Designed for existing product managers to sharpen their product management skills, leadership skills, and executive presentation skills

      🚀 PMA Leader
      We help you accelerate your product management career, get promoted to Director and product executive levels, and win in the board room. 

      🚀 1:1 Resume Review
      We help you rewrite your killer product manager resume to stand out from the crowd, with an interview guarantee.Get started by using our FREE killer PM resume template used by over 14,000 product managers. https://www.drnancyli.com/pmresume

      🚀 We also published over 500+ free training and courses. Please go to my YouTube channel https://www.youtube.com/c/drnancyli and Instagram @drnancyli to start learning for free today.
    </Tooltip>
  );
  const handleClick = async (e) => {
    e.preventDefault()
    setPastWeather([])
    setUpdatedData([])
    try {
      const response = await fetch(
        `http://localhost:5000/records`
      );
      if (!response.ok) {
        throw new Error("Weather data not found.");
      }
      const data = await response.json();
      setPastWeather(data.stored)
      if (data.stored) {
        const uData = [];
        data.stored.forEach(record => {
          for (let i = 0; i < record.forecastData.list.length; i+= 8) {
            const item = record.forecastData.list[i];
              uData.push({
                date: item.dt_txt.split(" ")[0],  
                temp: Math.round(item.main.temp - 273.15),
                description: item.weather[0].description,
              });
          }
        })
        setUpdatedData(uData);
      }
    } catch (err) {
      return err
    }
  }
  return (
    <div className="App">
      <h3>Tanvi Pabbati</h3>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" }}>
        <h1>Weather App</h1>
        <OverlayTrigger placement="right" overlay={renderTooltip}>
          <InfoCircle size={24} style={{ cursor: "pointer" }} />
        </OverlayTrigger>
      </div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter city, landmark, ZIP, or coordinates"
          value={inputValue}
          onChange={handleChange}
          style={{
            width: "250px",
            margin: "10px"
          }}
        />
        <DatePicker
        selected={startDate}
        onChange={(date) => setStartDate(date)}
        minDate={new Date()}
        placeholderText="Select a start date"
        />
        <DatePicker
        selected={endDate}
        onChange={(date) => setEndDate(date)}
        minDate={new Date()}
        placeholderText="Select a end date"
        />
        <button type="submit">Get Weather</button>
      </form>

      {weatherData && (
        <div className="weather-info">
          <h2>{weatherData.name} weather today</h2>
          <p>Temperature: {weatherData.main.temp - 273.15}°C</p>
        </div>
      )}
      {forecastData.length > 0 && (
        <div style={{marginTop: "20px"}}>
          <h2>Forecast</h2>
          <div style={{display: "flex", gap: "15px", justifyContent: "center", alignItems: "center"}}>
            {forecastData.map((day, index) => (
              <div key={index} style={{textAlign: "center"}}>
                <p>{day.date}</p>
                <p>{day.temp}°C</p>
                <p>{day.description}</p>
                <img src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`} alt="weather icon"/>
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "10px" }}>
        {video.map((v) => (
          <div key={v.id.videoId} style={{ width: "300px" }}>
            <a
              href={`https://www.youtube.com/watch?v=${v.id.videoId}`}
              target="_blank"
              rel="noopener noreferrer">
              <img
                src={v.snippet.thumbnails.medium.url}
                style={{ width: "100%" }}/>
              <p>{v.snippet.title}</p>
            </a>
          </div>
          ))}
      </div>
      <form onSubmit={handleClick}>
        <button type="submit">View Past Data</button>
      </form>
      {pastWeather.length > 0 && (
        <div style={{marginTop: "20px"}}>
          <h2>Past Weather Data:</h2>
          <div style={{gap: "15px", justifyContent: "center", alignItems: "center"}}>
            {pastWeather.map((record, index) => (
              <div key={index} style={{textAlign: "center"}}>
                <p>Start Date: {record.startDate} to End Date: {record.endDate}</p>
                <p>Location: {record.location}, Record Creation Date: {record.createdDate}</p>
                <div style={{display: "flex", gap: "15px", justifyContent: "center", alignItems: "center", borderBottom: "2px white solid"}}>
                  {updatedData.map((f, i) => (
                    <div key={i} style={{textAlign: "center"}}>
                      <p>{f.date}</p>
                      <p>{f.temp}°C</p>
                      <p>{f.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
