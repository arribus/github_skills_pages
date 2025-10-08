---
Title: use the OpenWeatherMap API to fetch weather data for a specific location
Date: 2025-10-08
---

<p>This demo queries the OpenWeatherMap current weather API from the browser. It is intended for testing/debugging only. If you put this on a public site, be aware that your API key will be visible to visitors.</p>

<p>
  <label for="apiKey">OpenWeatherMap API key:</label>
  <input id="apiKey" placeholder="Insert your API key here" />
</p>

<fieldset>
  <legend>Query by city name</legend>
  <label for="city">City:</label>
  <input id="city" placeholder="Insert a city" />
  <label for="country">Country code (optional):</label>
  <input id="country" placeholder="e.g. FR" style="width:4em" />
  <button id="fetch-by-city">Get weather (city)</button>
  <button id="search-candidates">Search candidates</button>
  <div id="candidates" aria-live="polite"></div>
</fieldset>

<fieldset>
  <legend>Query by coordinates (lat, lon)</legend>
  <label for="lat">Latitude:</label>
  <input id="lat" placeholder="e.g. 45.1885" style="width:7em" />
  <label for="lon">Longitude:</label>
  <input id="lon" placeholder="e.g. 5.7245" style="width:7em" />
  <button id="fetch-by-coords">Get weather (coords)</button>
</fieldset>

<div id="weather-output" aria-live="polite"></div>

<script>
  (function () {
    const apiKeyInput = document.getElementById('apiKey');
    const cityInput = document.getElementById('city');
    const countryInput = document.getElementById('country');
    const fetchCityBtn = document.getElementById('fetch-by-city');
    const latInput = document.getElementById('lat');
    const lonInput = document.getElementById('lon');
    const fetchCoordsBtn = document.getElementById('fetch-by-coords');
    const outputElement = document.getElementById('weather-output');

    function showMessage(msg) { outputElement.textContent = msg; }

    async function fetchFromUrl(apiUrl) {
      outputElement.textContent = 'Loading...';
      try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
          if (response.status === 404) {
            showMessage('Location not found. Please check the inputs.');
          } else {
            showMessage(`Error: ${response.status} ${response.statusText}`);
          }
          return null;
        }
        return await response.json();
      } catch (err) {
        console.error(err);
        showMessage('Network error, see console for details.');
        return null;
      }
    }

    async function fetchByCity() {
      const apiKey = apiKeyInput.value.trim();
      const city = cityInput.value.trim();
      const country = countryInput.value.trim();
      if (!apiKey) return showMessage('Please provide an OpenWeatherMap API key.');
      if (!city) return showMessage('Please enter a city name.');

      const q = country ? `${city},${country}` : city;
      const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(q)}&appid=${encodeURIComponent(apiKey)}&units=metric`;
      const data = await fetchFromUrl(apiUrl);
      if (data) renderData(data);
    }

    // Use OpenWeatherMap direct geocoding API to search candidates for the given city name
    async function searchCandidates() {
      const apiKey = apiKeyInput.value.trim();
      const city = cityInput.value.trim();
      const country = countryInput.value.trim();
      if (!apiKey) return showMessage('Please provide an OpenWeatherMap API key.');
      if (!city) return showMessage('Please enter a city name to search.');

      const q = country ? `${city},${country}` : city;
      const apiUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=5&appid=${encodeURIComponent(apiKey)}`;
      const data = await fetchFromUrl(apiUrl);
      const container = document.getElementById('candidates');
      if (!container) return;
      container.innerHTML = '';
      if (!data || !Array.isArray(data) || data.length === 0) {
        container.textContent = 'No candidates found.';
        return;
      }

      const list = document.createElement('ul');
      data.forEach((c) => {
        const label = `${c.name}${c.state ? ', ' + c.state : ''}${c.country ? ', ' + c.country : ''} (lat: ${c.lat}, lon: ${c.lon})`;
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.textContent = `Use: ${label}`;
        btn.addEventListener('click', () => {
          latInput.value = c.lat;
          lonInput.value = c.lon;
          // Optionally auto-fetch weather for this candidate
          fetchByCoords();
        });
        li.appendChild(btn);
        list.appendChild(li);
      });
      container.appendChild(list);
    }

    async function fetchByCoords() {
      const apiKey = apiKeyInput.value.trim();
      const lat = latInput.value.trim();
      const lon = lonInput.value.trim();
      if (!apiKey) return showMessage('Please provide an OpenWeatherMap API key.');
      if (!lat || !lon) return showMessage('Please provide both latitude and longitude.');

      const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&appid=${encodeURIComponent(apiKey)}&units=metric`;
      const data = await fetchFromUrl(apiUrl);
      if (data) renderData(data);
    }

    function renderData(data) {
      const temperature = data.main?.temp;
      const description = data.weather?.[0]?.description;
      const location = data.name;
      const coord = data.coord;
      const cityId = data.id;
      const country = data.sys?.country;
      const dt = data.dt; // unix time (UTC)
      const tz = data.timezone; // shift in seconds from UTC

      let html = `<p>Temperature in ${location}${country ? (', ' + country) : ''}: ${temperature}°C</p>`;
      html += `<p>Weather: ${description}</p>`;
      html += `<p>Location id: ${cityId}</p>`;
      if (coord) html += `<p>Coordinates: ${coord.lat}, ${coord.lon}</p>`;
      if (typeof dt === 'number') {
        const utc = new Date(dt * 1000).toISOString();
        const localAtLocation = new Date((dt + (tz || 0)) * 1000).toISOString();
        html += `<p>Timestamp (UTC): ${utc}</p>` +
                `<p>Timestamp (local at location): ${localAtLocation} (tz offset: ${tz || 0}s)</p>`;
      }

      html += '\n<details><summary>Raw API response (click to expand)</summary><pre id="raw-json" style="max-height:400px;overflow:auto;background:#f6f8fa;padding:8px;border-radius:4px"></pre></details>';
      outputElement.innerHTML = html;
      const rawPre = document.getElementById('raw-json');
      if (rawPre) rawPre.textContent = JSON.stringify(data, null, 2);
    }

  fetchCityBtn.addEventListener('click', fetchByCity);
  document.getElementById('search-candidates').addEventListener('click', searchCandidates);
    fetchCoordsBtn.addEventListener('click', fetchByCoords);
    cityInput.addEventListener('keyup', (e) => { if (e.key === 'Enter') fetchByCity(); });
    latInput.addEventListener('keyup', (e) => { if (e.key === 'Enter') fetchByCoords(); });
    lonInput.addEventListener('keyup', (e) => { if (e.key === 'Enter') fetchByCoords(); });
  })();
</script>