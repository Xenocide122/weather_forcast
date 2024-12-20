import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import App from "./App";

// Mock the fetch function to avoid making real API calls
global.fetch = jest.fn();

// Example mock data for geocoding API
const mockGeoData = {
  results: [{ latitude: 30.58955, longitude: -97.847565 }],
};

// Example mock data for weather API
const mockWeatherData = {
  current_weather: {
    temperature: 44.1,
    weathercode: 0,
    is_day: 0,
    windspeed: 5.9,
    time: "2024-12-19T06:30",
  },
  daily: {
    time: [
      "2024-12-19",
      "2024-12-20",
      "2024-12-21",
      "2024-12-22",
      "2024-12-23",
      "2024-12-24",
    ],
    weathercode: [0, 1, 2, 95, 45, 80],
    temperature_2m_max: [62.5, 60.5, 54.1, 59.3, 75.2, 71.9],
    temperature_2m_min: [37.2, 40.6, 32.8, 39.4, 58.4, 55],
  },
  timezone: "America/Chicago",
};

describe("App Component", () => {
  beforeEach(() => {
    fetch.mockReset();
  });

  test("renders heading and search form", () => {
    render(<App />);
    expect(screen.getByText(/5 Day Weather Forecast/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Enter city name.../i)
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /search/i })).toBeInTheDocument();
  });

  test("searching for a city shows loading and then displays forecast", async () => {
    render(<App />);

    // Mock the fetch responses for geocoding and weather
    // First call: geocoding API
    fetch.mockResolvedValueOnce({
      json: async () => mockGeoData,
    });
    // Second call: weather API
    fetch.mockResolvedValueOnce({
      json: async () => mockWeatherData,
    });

    const input = screen.getByPlaceholderText(/Enter city name.../i);
    const button = screen.getByRole("button", { name: /search/i });

    // Type a city and search
    fireEvent.change(input, { target: { value: "Leander" } });
    fireEvent.click(button);

    // Loader on screen
    expect(screen.getByTestId("loader")).toBeInTheDocument();

    // Wait until the forecast is rendered (the loader should disappear)
    await waitFor(() => {
      expect(screen.queryByTestId("loader")).not.toBeInTheDocument();
    });

    // Check if current weather is displayed
    expect(screen.getByText(/Day/i)).toBeInTheDocument(); // based on is_day === 1

    // Check if daily forecast items are displayed, e.g. "Fri 20"
    // This means the daily forecasts are being displayed
    expect(screen.getByText(/Fri 20/i)).toBeInTheDocument();
  });

  test("shows error message if location not found", async () => {
    render(<App />);

    // Mock geocoding call to return no results
    fetch.mockResolvedValueOnce({
      json: async () => ({ results: [] }),
    });

    const input = screen.getByPlaceholderText(/Enter city name.../i);
    const button = screen.getByRole("button", { name: /search/i });

    fireEvent.change(input, { target: { value: "Epsilon Eridani" } });
    fireEvent.click(button);

    // Loader on screen
    expect(screen.getByTestId("loader")).toBeInTheDocument();

    // Wait for the error message
    await waitFor(() => {
      expect(screen.getByText(/Location not found/i)).toBeInTheDocument();
    });
  });
});
