const locationInput = document.getElementById("locationInput");
const loader = document.getElementById("loader");
const errorElement = document.getElementById("error");
const weatherInfo = document.getElementById("weatherInfo");
const locationName = document.getElementById("locationName");
const currentDescription = document.getElementById("currentDescription");
const currentTemperature = document.getElementById("currentTemperature");
const currentTime = document.getElementById("currentTime");
const currentIcon = document.getElementById("currentIcon");
const hourlyForecast = document.getElementById("hourlyForecast");
const locationSuggestions = document.getElementById("locationSuggestions");

let debounceTimer;

locationInput.addEventListener("input", () => {
  const query = locationInput.value.trim();
  if (!query) {
    locationSuggestions.classList.add("hidden");
    return;
  }

  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => fetchLocationSuggestions(query), 500);
});

async function fetchLocationSuggestions(query) {
  try {
    const geoResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`
    );
    const geoData = await geoResponse.json();

    if (!geoData.results || geoData.results.length === 0) {
      locationSuggestions.innerHTML = `<li>No results found</li>`;
      locationSuggestions.classList.remove("hidden");
      return;
    }

    displayLocationSuggestions(geoData.results);
  } catch (error) {
    locationSuggestions.innerHTML = `<li>Error fetching suggestions</li>`;
    locationSuggestions.classList.remove("hidden");
  }
}

function displayLocationSuggestions(suggestions) {
  locationSuggestions.innerHTML = suggestions
    .map(
      (loc) =>
        `<li data-lat="${loc.latitude}" data-lon="${loc.longitude}">${loc.name}, ${loc.country}</li>`
    )
    .join("");
  locationSuggestions.classList.remove("hidden");

  // Attach click event to each suggestion
  locationSuggestions.querySelectorAll("li").forEach((item) => {
    item.addEventListener("click", (e) => {
      const latitude = e.target.dataset.lat;
      const longitude = e.target.dataset.lon;
      const locationName = e.target.textContent;

      // Set input value to the selected location
      locationInput.value = locationName;
      locationSuggestions.classList.add("hidden");

      // Fetch weather data for the selected location
      fetchWeatherByCoordinates(latitude, longitude, locationName);
    });
  });
}

function fetchWeatherByCoordinates(latitude, longitude, locationName) {
  loader.classList.remove("hidden");
  errorElement.classList.add("hidden");
  weatherInfo.classList.add("hidden");
  hourlyForecast.innerHTML = "";

  fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&hourly=temperature_2m,precipitation_probability,weather_code&timezone=auto`
  )
    .then((response) => response.json())
    .then((weatherData) => {
      displayWeather(weatherData, locationName);
    })
    .catch((error) => {
      errorElement.textContent =
        error.message || "Failed to fetch weather data.";
      errorElement.classList.remove("hidden");
    })
    .finally(() => {
      loader.classList.add("hidden");
    });
}

function displayWeather(weatherData, location) {
  locationName.textContent = location;
  currentDescription.textContent = getWeatherDescription(weatherData.current.weather_code);
  currentTemperature.textContent = `${Math.round(weatherData.current.temperature_2m)}°C`;
  currentTime.textContent = new Date(weatherData.current.time).toLocaleString();
  currentIcon.innerHTML = getWeatherIcon(weatherData.current.weather_code);

  const currentHourIndex = weatherData.hourly.time.findIndex(
    (time) => new Date(time).getTime() > Date.now()
  );

  for (let i = currentHourIndex; i < currentHourIndex + 6; i++) {
    const time = weatherData.hourly.time[i];
    const temp = weatherData.hourly.temperature_2m[i];
    const rain = weatherData.hourly.precipitation_probability[i];
    const code = weatherData.hourly.weather_code[i];

    const forecastCard = document.createElement("div");
    forecastCard.classList.add("card");

    forecastCard.innerHTML = `
      <div class="card-content text-center">
        <p>${new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
        <div>${getWeatherIcon(code)}</div>
        <p>${Math.round(temp)}°C</p>
        <p>${rain}% rain</p>
      </div>
    `;

    hourlyForecast.appendChild(forecastCard);
  }

  weatherInfo.classList.remove("hidden");
}

function getWeatherIcon(weatherCode) {
  if (weatherCode >= 200 && weatherCode < 600) return "🌧️";
  if (weatherCode >= 600 && weatherCode < 700) return "❄️";
  if (weatherCode === 800) return "☀️";
  return "☁️";
}

function getWeatherDescription(weatherCode) {
  if (weatherCode >= 200 && weatherCode < 300) return "Thunderstorm";
  if (weatherCode >= 300 && weatherCode < 400) return "Drizzle";
  if (weatherCode >= 500 && weatherCode < 600) return "Rain";
  if (weatherCode >= 600 && weatherCode < 700) return "Snow";
  if (weatherCode >= 700 && weatherCode < 800) return "Atmosphere";
  if (weatherCode === 800) return "Clear";
  return "Clouds";
}


