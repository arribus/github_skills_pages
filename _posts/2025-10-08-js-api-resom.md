---
Title: Query, using javascript, the API of reso M, the public transportation of Grenoble
Date:
---
 
 This short post shows a very simple, beginner-friendly HTML + JavaScript example that queries the public transport API used by Grenoble (Reso M) to:

 1. List available lines
 2. Let the user pick a line
 3. List stops for that line
 4. Let the user pick a stop
 5. Show next scheduled real-time stoptimes for that stop and line

 The example is intentionally small, clean and well-commented so someone new to programming can follow it.

 ## How this works (quick)

 - We use fetch() to call the public API at data.mobilites-m.fr. No API key is required for the routes and stops endpoints.
 - The realtime stoptimes endpoint requires an Origin header. Two common ways to satisfy this are:
	 - Run the HTML page in a browser served over HTTP (the browser automatically adds an Origin header). Opening the file with the file:// scheme may not send the header and can cause the request to be blocked.
	 - Call the API from a server-side script (for example Node.js with axios) and set an Origin header manually. Browsers do not allow client-side scripts to set the Origin header — it's controlled by the browser for security reasons.
 - Keep the code simple: plain HTML, small CSS, and readable JavaScript with comments.

 ## Copy-paste example (save as index.html and serve it)

 Below is a single-file example. Save it as index.html in a folder and serve it with a simple static server (for example: VS Code Live Server, Python -m http.server, or any static server). Then open the page in your browser.

 <!-- Example HTML file -->

 <html lang="en">
 <head>
	 <meta charset="utf-8" />
	 <meta name="viewport" content="width=device-width,initial-scale=1" />
	 <title>Reso M — Grenoble Transport Explorer</title>
	 <style>
		 body { font-family: system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial; margin: 24px; color:#111 }
		 h1 { font-size: 20px }
		 .box { max-width:720px; padding:16px; border:1px solid #eee; border-radius:8px; background:#fafafa }
		 label, select, button { display:block; margin-top:8px }
		 pre { background:#111; color:#eee; padding:10px; border-radius:6px; overflow:auto }
	 </style>
 </head>
 <body>
	 <div class="box">
		 <h1>Reso M — Grenoble Transport Explorer</h1>
		 <p>A tiny, beginner-friendly demo that lists lines, stops and next realtime times.</p>

		 <div>
			 <label for="lines">1) Choose a line</label>
			 <select id="lines"><option value="">Loading lines…</option></select>
		 </div>

		 <div>
			 <label for="stops">2) Choose a stop</label>
			 <select id="stops" disabled><option value="">Select a line first</option></select>
		 </div>

		 <div>
			 <button id="showTimes" disabled>3) Show next times</button>
		 </div>

		 <h3>Results</h3>
		 <div id="result">Make selections above to see results.</div>
	 </div>

	 <script>
	 // Small helper to set innerText safely
	 const el = id => document.getElementById(id);

	 // Base URL for the Reso M API
	 const BASE = 'https://data.mobilites-m.fr/api/routers/default/index';

	 // DOM elements
	 const linesSelect = el('lines');
	 const stopsSelect = el('stops');
	 const showBtn = el('showTimes');
	 const result = el('result');

	 // Populate an option element
	 function addOption(select, value, text) {
		 const opt = document.createElement('option');
		 opt.value = value;
		 opt.textContent = text;
		 select.appendChild(opt);
	 }

	 // Fetch JSON with error handling
	 async function fetchJson(url, options = {}) {
		 try {
			 const r = await fetch(url, options);
			 if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
			 return await r.json();
		 } catch (err) {
			 console.error('Fetch error', err, url);
			 throw err;
		 }
	 }

	 // 1) Load lines and populate the lines select
	 async function loadLines() {
		 linesSelect.innerHTML = '';
		 addOption(linesSelect, '', 'Choose a line');
		 result.textContent = 'Loading lines…';

		 const url = `${BASE}/routes`;
		 const data = await fetchJson(url);

		 // API returns an array of route objects. We'll use id/code and shortName or longName to display.
		 data.sort((a,b) => (a.shortName||a.id||'').localeCompare(b.shortName||b.id||''));
		 data.forEach(route => {
			 const display = route.shortName ? `${route.shortName} — ${route.longName || ''}`.trim() : (route.id || '');
			 addOption(linesSelect, route.id, display);
		 });

		 result.textContent = 'Lines loaded. Pick a line.';
	 }

	 // 2) When a line is picked, load stops for that line
	 async function loadStopsForLine(lineId) {
		 stopsSelect.innerHTML = '';
		 addOption(stopsSelect, '', 'Loading stops…');
		 stopsSelect.disabled = true;
		 showBtn.disabled = true;
		 result.textContent = 'Loading stops…';

		 const encoded = encodeURIComponent(lineId);
		 const url = `${BASE}/routes/${encoded}/stops`;
		 const data = await fetchJson(url);

		 stopsSelect.innerHTML = '';
		 addOption(stopsSelect, '', 'Choose a stop');
		 // The API returns stops — each has id and name
		 data.forEach(s => {
			 addOption(stopsSelect, s.id, `${s.name} (${s.id})`);
		 });

		 stopsSelect.disabled = false;
		 result.textContent = 'Stops loaded. Pick a stop.';
	 }

	 // 3) Fetch stoptimes for a stop (optionally filtered by route)
	 async function loadStoptimes(stopId, routeId) {
		 result.textContent = 'Loading next times…';
		 // Note: the API requires an Origin header when called from a non-browser environment; browsers set it automatically.
		 // We'll pass the route as a query param to filter results for the chosen line.
		 const params = routeId ? `?route=${encodeURIComponent(routeId)}` : '';
		 const url = `${BASE}/stops/${encodeURIComponent(stopId)}/stoptimes${params}`;

			// For modern browsers fetch will include Origin header automatically. We don't need to manually add it.
			let data = await fetchJson(url);

			// Some API responses return an array of 'pattern' objects where each contains a 'times' array
			// (see the example you provided). Normalize so we always have an array of time entries.
			if (Array.isArray(data) && data.length > 0 && data[0].times && Array.isArray(data[0].times)) {
				// flatten all times arrays from each pattern
				data = data.flatMap(p => p.times || []);
			}

			if (!Array.isArray(data) || data.length === 0) {
				result.innerHTML = '<em>No upcoming times found.</em>';
				return;
			}

		 // Build a small HTML table of upcoming times
			const rows = data.slice(0, 20).map(item => {
				// Each item usually contains fields like serviceDay, scheduledArrival, realtimeArrival
				// The API encodes times as seconds since midnight in 'scheduledArrival' and 'realtimeArrival'
				// and 'serviceDay' is the epoch seconds for the service day's midnight. To get a JS Date,
				// compute (serviceDay + arrivalSeconds) * 1000.
				const sd = Number(item.serviceDay) || 0;
				const scheduledSec = Number(item.scheduledArrival) || null;
				const realtimeSec = Number(item.realtimeArrival) || null;

				function toTimeString(sec) {
					if (!sec && sec !== 0) return 'n/a';
					const ms = (sd + sec) * 1000;
					return new Date(ms).toLocaleTimeString();
				}

				const scheduledTime = scheduledSec !== null ? toTimeString(scheduledSec) : 'n/a';
				const realtimeTime = realtimeSec !== null ? toTimeString(realtimeSec) : 'n/a';

				// compute delay in seconds when both values exist
				let delay = '';
				if (scheduledSec !== null && realtimeSec !== null) {
					const d = realtimeSec - scheduledSec; // seconds
					if (d === 0) delay = 'On time';
					else if (d > 0) delay = `+${d}s`;
					else delay = `${d}s`;
				}

				const route = item.route || (item.trip && item.trip.routeId) || '';
				const headsign = item.headsign || (item.trip && item.trip.headsign) || '';
				const realtimeFlag = item.realtime ? 'Yes' : 'No';

				return `<tr>
					<td>${scheduledTime}<br><small>${realtimeTime}</small></td>
					<td>${route}</td>
					<td>${headsign}</td>
					<td>${realtimeFlag}${delay ? '<br><small>' + delay + '</small>' : ''}</td>
				</tr>`;
			}).join('');

		 result.innerHTML = `
			 <table border="0" cellpadding="6" cellspacing="0">
				 <thead><tr><th>Time</th><th>Route</th><th>Direction</th><th>Realtime</th></tr></thead>
				 <tbody>${rows}</tbody>
			 </table>
		 `;
	 }

	 // Event wiring
	 linesSelect.addEventListener('change', async () => {
		 const line = linesSelect.value;
		 if (!line) {
			 stopsSelect.innerHTML = '';
			 addOption(stopsSelect, '', 'Select a line first');
			 stopsSelect.disabled = true;
			 showBtn.disabled = true;
			 result.textContent = 'Pick a line.';
			 return;
		 }
		 await loadStopsForLine(line);
	 });

	 stopsSelect.addEventListener('change', () => {
		 showBtn.disabled = !stopsSelect.value;
	 });

	 showBtn.addEventListener('click', async () => {
		 const stop = stopsSelect.value;
		 const route = linesSelect.value;
		 if (!stop) return;
		 await loadStoptimes(stop, route);
	 });

	 // Start by loading lines on page load
	 loadLines().catch(err => {
		 result.textContent = 'Failed to load lines — open console for details.';
	 });
	 </script>
 </body>
 </html>

 ## Notes and best practices

 - Run this from a local HTTP server so the browser sends a proper Origin header. If you use VS Code Live Server or run `python -m http.server` it will work fine.
 - Keep UI and data logic separated for larger apps. This tiny demo mixes them for clarity.
 - Handle network errors gracefully in production; add loading states and retries where necessary.

### Server-side example (Node.js + axios)

If you prefer to fetch the realtime stoptimes from a server (or want to set the Origin header yourself), here's a tiny Node.js example using axios. This is useful for scripts, proxies, or when the browser's CORS restrictions get in the way.

```js
// install: npm install axios
const axios = require('axios');

async function getStoptimes(stopCode, routeCode) {
	const base = 'https://data.mobilites-m.fr/api/routers/default/index';
	const url = `${base}/stops/${encodeURIComponent(stopCode)}/stoptimes?route=${encodeURIComponent(routeCode)}&showCancelledTrips=true`;

	const res = await axios.get(url, {
		headers: {
			// the API expects an Origin header in some contexts; set one here from server-side
			origin: 'mon_appli'
		}
	});

	return res.data;
}

getStoptimes('SEM:4020', 'SEM:B').then(d => console.log(JSON.stringify(d, null, 2))).catch(e => console.error(e));
```

Example URL (browser request without header shown for clarity):

```
https://data.mobilites-m.fr/api/routers/default/index/stops/SEM:4020/stoptimes?route=SEM%3AB
```

If you want cancelled trips included, add `&showCancelledTrips=true` to the query string (as shown in the Node example).

### Notes about headers and CORS

- Browsers set the Origin header automatically and won't let JavaScript set it manually. If you see CORS errors in the browser console, consider calling the API from a small server-side proxy (like the Node example above), or run the page from a proper HTTP origin that the API accepts.
- The Node.js example demonstrates how to set an Origin header when calling the API from a server environment.

 ## Quick try (Windows PowerShell)

 Option 1 — Python (if installed):

 ```powershell
 cd path\to\folder; python -m http.server 8000
 ```

 Then open http://localhost:8000 in your browser.

 Option 2 — VS Code Live Server: right click index.html -> Open with Live Server.

 That's it — a tiny interactive example for Reso M (Grenoble). If you want, I can also extract the JavaScript into a separate file, add TypeScript types, or make a Node CLI version.

