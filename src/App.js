import React, { useState } from "react";
import "./App.css";

function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const weatherIconMap = {
    0: "fa-sun yellow", // Clear sky
    1: "fa-cloud-sun", // Mainly clear
    2: "fa-cloud", // Partly cloudy
    3: "fa-cloud", // Overcast
    45: "fa-smog", // Fog
    48: "fa-smog", // depositing rime fog??
    51: "fa-cloud-rain", // Drizzle: light
    53: "fa-cloud-rain", // Drizzle: moderate
    55: "fa-cloud-rain", // Drizzle: dense
    61: "fa-cloud-showers-heavy", // Rain: Slight
    63: "fa-cloud-showers-heavy", // Rain: moderate
    65: "fa-cloud-showers-heavy", // Rain: heavy
    // 66: "", // Freezing Rain: Light
    // 67: "", // Freezing Rain: heavy
    71: "fa-snowflake", // Snow fall
    // 73: "", // Snow fall: moderate
    // 75: "", // Snow fall: heavy
    // 77: "", // Snow grains??
    80: "fa-cloud-rain", // Rain showers: Slight
    81: "fa-cloud-rain", // Rain showers: moderate
    82: "fa-cloud-rain", // Rain showers: violent
    // 85: "", // Snow showers: slight
    // 86: "", // Snow showers: heavy
    95: "fa-poo-storm", // Thunderstorm
    // 96: "", // Thunderstorm with slight hail
    // 99: "", // Thunderstorm with heavy hail
  };

  // Converts city name to latitude & longitude
  async function fetchCoordinates(cityName) {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      cityName
    )}&count=1`;
    const response = await fetch(geoUrl);
    const data = await response.json();

    // If the API returns results, grab the first match's coordinates
    if (data.results && data.results.length > 0) {
      const { latitude, longitude } = data.results[0];
      return { latitude, longitude };
    } else {
      // If no results, throw error
      throw new Error("Location not found. Please try another city.");
    }
  }

  // Retrieve forecast data
  async function fetchWeather(latitude, longitude) {
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&forecast_days=6&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`;
    const response = await fetch(weatherUrl);
    const data = await response.json();
    return data;
  }

  // Submit search form
  async function handleSearch(event) {
    event.preventDefault(); // Prevent the form from refreshing the page

    if (!searchQuery) return;

    // Reset states before fetching
    setLoading(true);
    setError("");
    setForecast(null);

    try {
      // Get lat/long from the city
      const { latitude, longitude } = await fetchCoordinates(searchQuery);

      // Get weather data using the lat/long we just got
      const weatherData = await fetchWeather(latitude, longitude);

      // Update forecast state with the fetched data
      setForecast(weatherData);
    } catch (err) {
      // If any error occurs (e.g., location not found, network error), display it
      setError(err.message);
    }

    // Stop loading after the process is done
    setLoading(false);
  }

  // Setup date format
  function formatDate(dateString, timezone) {
    const d = new Date(dateString);
    const weekday = d.toLocaleDateString("en-US", {
      weekday: "short",
      timeZone: timezone,
    });
    const dayOfMonth = d.toLocaleDateString("en-US", {
      day: "numeric",
      timeZone: timezone,
    });
    return `${weekday} ${dayOfMonth}`;
  }

  // Get today's weather data from current_weather
  const currentWeather = forecast?.current_weather;
  const timezone = forecast?.timezone;

  const todayFormattedDate =
    currentWeather && timezone ? formatDate(currentWeather.time, timezone) : "";

  const todayIconClass = currentWeather
    ? weatherIconMap[currentWeather.weathercode] || "fa-question"
    : "";

  return (
    <div>
      <h1>5 Day Weather Forecast</h1>

      <form onSubmit={handleSearch} className="search-container">
        <input
          type="text"
          placeholder="Enter city name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>

      {loading && <div className="loader" data-testid="loader"></div>}

      {error && <p className="error">{error}</p>}

      {forecast && currentWeather && (
        <div className="current-weather">
          <div className="current-item">
            <h3>
              {todayFormattedDate}
              <span>{currentWeather.is_day === 1 ? " | Day" : " | Night"}</span>
            </h3>
            <div className="forcast">
              <div className="temps">
                {Math.round(currentWeather.temperature)}°
              </div>
              <div className="icon">
                <i className={`${todayIconClass} fa-solid weather-icon`}></i>
              </div>
            </div>
            <div className="wind-speed">
              <div className="icon">
                <i className="fa-wind fa-solid wind-icon"></i>
              </div>
              <div>{currentWeather.windspeed}mph</div>
            </div>
          </div>
        </div>
      )}

      {forecast && forecast.daily && (
        <div className="forecast-container">
          {forecast.daily.time.slice(1).map((date, index) => {
            const wwCode = forecast.daily.weathercode[index + 1];
            const iconClass = weatherIconMap[wwCode] || "fa-question"; // Default if not found
            const formattedDate = formatDate(date + "T00:00:00", timezone);

            const highTemp = Math.round(
              forecast.daily.temperature_2m_max[index + 1]
            );
            const lowTemp = Math.round(
              forecast.daily.temperature_2m_min[index + 1]
            );

            return (
              <div className="forecast-item" key={date}>
                <h3>{formattedDate}</h3>
                <div className="forcast">
                  <div className="temps">
                    {highTemp}°<span>/{lowTemp}°</span>
                  </div>
                  <div className="icon">
                    <i className={`${iconClass} fa-solid weather-icon`}></i>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default App;
