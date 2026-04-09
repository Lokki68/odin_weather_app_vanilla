const API_KEY = '4b93ffd6f864e8fcce4f83fb557d320b'
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather'

const cityInput = document.getElementById('cityInput')
const searchInput = document.getElementById('searchBtn')
const geoBtn = document.getElementById('geoBtn')
const loader = document.getElementById('loader')
const errorMsg = document.getElementById('errorMsg')
const errorText = document.getElementById('errorText')
const weatherCard = document.getElementById('weatherCard')

const weatherIcons = {
  '01d': '☀️',  '01n': '🌙',
  '02d': '⛅',  '02n': '☁️',
  '03d': '☁️',  '03n': '☁️',
  '04d': '☁️',  '04n': '☁️',
  '09d': '🌧️', '09n': '🌧️',
  '10d': '🌦️', '10n': '🌧️',
  '11d': '⛈️', '11n': '⛈️',
  '13d': '❄️',  '13n': '❄️',
  '50d': '🌫️', '50n': '🌫️',
};

function formatTime(unixTimestamp, timezoneOffset) {
  const date = new Date((unixTimestamp + timezoneOffset) * 1000);
  const hours   = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function formatDateTime() {
  const now = new Date();
  const days = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
  const months = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc'];
  return `${days[now.getDay()]}<br>${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

function msToKmh(ms) {
  return (ms * 3.6).toFixed(1);
}

function getWindDirection(deg) {
  const dirs = ['N','NE','E','SE','S','SO','O','NO'];
  return dirs[Math.round(deg / 45) % 8];
}

function showLoader() {
  loader.style.display = 'block'
  errorMsg.style.display = 'none'
  weatherCard.style.display = 'none'
}

function showError(msg) {
  loader.style.display = 'none'
  errorText.textContent = msg
  errorMsg.style.display = 'block'
  weatherCard.style.display = 'none'
}

function showWeather() {
  loader.style.display = 'none'
  errorMsg.style.display = 'none'
  weatherCard.style.display = 'block'
}

function updateUI(data) {
  const tz = data.timezone;

  document.getElementById('cityName').textContent    = data.name;
  document.getElementById('cityCountry').textContent = `${data.sys.country} · ${data.coord.lat.toFixed(2)}°N, ${data.coord.lon.toFixed(2)}°E`;
  document.getElementById('dateTime').innerHTML      = formatDateTime();

  const iconCode = data.weather[0].icon;
  document.getElementById('weatherIcon').textContent = weatherIcons[iconCode] || '🌡️';

  document.getElementById('temperature').textContent  = `${Math.round(data.main.temp)}°C`;
  document.getElementById('feelsLike').textContent    = `Ressenti : ${Math.round(data.main.feels_like)}°C`;
  document.getElementById('description').textContent  = data.weather[0].description;
  document.getElementById('tempMin').textContent      = `${Math.round(data.main.temp_min)}°C`;
  document.getElementById('tempMax').textContent      = `${Math.round(data.main.temp_max)}°C`;

  document.getElementById('humidity').textContent    = `${data.main.humidity} %`;
  document.getElementById('wind').textContent        = `${msToKmh(data.wind.speed)} km/h ${getWindDirection(data.wind.deg || 0)}`;
  document.getElementById('visibility').textContent  = data.visibility ? `${(data.visibility / 1000).toFixed(1)} km` : 'N/A';
  document.getElementById('pressure').textContent    = `${data.main.pressure} hPa`;

  document.getElementById('sunrise').textContent = formatTime(data.sys.sunrise, tz);
  document.getElementById('sunset').textContent  = formatTime(data.sys.sunset, tz);

  showWeather();
}

async function fetchWeatherByCity(city) {
  if (!city.trim()) return;
  showLoader();
  try {
    const res = await fetch(
        `${BASE_URL}?q=${encodeURIComponent(city)}&units=metric&lang=fr&appid=${API_KEY}`
    );
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Erreur inconnue');
    }
    const data = await res.json();
    updateUI(data);
  } catch (e) {
    if (e.message.includes('city not found')) {
      showError('Ville introuvable. Vérifiez l\'orthographe.');
    } else if (e.message.includes('Invalid API key')) {
      showError('Clé API invalide. Vérifiez votre configuration.');
    } else {
      showError(`Erreur : ${e.message}`);
    }
  }
}

async function fetchWeatherByCoords(lat, lon) {
  showLoader();
  try {
    const res = await fetch(
        `${BASE_URL}?lat=${lat}&lon=${lon}&units=metric&lang=fr&appid=${API_KEY}`
    );
    if (!res.ok) throw new Error('Impossible de récupérer la météo.');
    const data = await res.json();
    updateUI(data);
  } catch (e) {
    showError(e.message);
  }
}

function geoLocate() {
  if (!navigator.geolocation) {
    showError('La géolocalisation n\'est pas supportée par votre navigateur.');
    return;
  }
  showLoader();
  navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
      ()    => showError('Impossible d\'obtenir votre position.')
  );
}

searchBtn.addEventListener('click', () => fetchWeatherByCity(cityInput.value));
geoBtn.addEventListener('click', geoLocate);

cityInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') fetchWeatherByCity(cityInput.value);
});

fetchWeatherByCity('Paris');