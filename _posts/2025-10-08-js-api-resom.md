---
Title: Query, using javascript, the API of reso M, the public transportation of Grenoble
Date:
---

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
		 table { width:100%; border-collapse: collapse; margin-top:8px }
		 th, td { text-align:left; padding:8px; border-bottom:1px solid #eee; vertical-align:middle }
		 th { background:#fafafa; font-weight:600 }
		 small.timeLabel { color:#666; display:block }
		 .delay-good { color: #0a0; font-weight:600 }
		 .delay-warning { color: #b65; font-weight:600 }
		 .delay-bad { color: #c00; font-weight:700 }
		 .occupancy { font-size:90%; color:#333 }
	 </style>
 </head>
 <body>
	 <div class="box">
		 <h1>Reso M — Grenoble Transport Explorer</h1>
		 <p>A tiny, beginner-friendly demo that lists lines, stops and next realtime times.</p>

			<div>
				<label for="modes">1) Choose a mode</label>
				<select id="modes"><option value="">Loading modes…</option></select>
			</div>

			<div>
				<label for="types">2) Choose a type</label>
				<select id="types" disabled><option value="">Select a mode first</option></select>
			</div>

			<div>
				<label for="lines">3) Choose a line</label>
				<select id="lines" disabled><option value="">Select a type first</option></select>
			</div>

		 <div>
			 <label for="stops">2) Choose a stop</label>
			 <select id="stops" disabled><option value="">Select a line first</option></select>
		 </div>

		 <div>
			 <button id="showTimes" disabled>3) Show next times</button>
		 </div>

		<h3>Results</h3>
		<div id="now">Current time: <strong id="currentTime">--:--:--</strong></div>
		<div id="result">Make selections above to see results.</div>
	 </div>

	 <script>
	 // Small helper to set innerText safely
	 const el = id => document.getElementById(id);

	 // Base URL for the Reso M API
	 const BASE = 'https://data.mobilites-m.fr/api/routers/default/index';

	 // DOM elements
		const modesSelect = el('modes');
		const typesSelect = el('types');
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
		 // We'll fetch routes once, then build grouped structures by mode -> type -> routes
		 let routesByMode = {}; // { mode: { type: [route, ...] } }

		 async function loadLines() {
			 modesSelect.innerHTML = '';
			 addOption(modesSelect, '', 'Choose a mode');
			 result.textContent = 'Loading lines…';

			 const url = `${BASE}/routes`;
			 const data = await fetchJson(url);

			 // Group routes by mode then type
			 routesByMode = {};
			 data.forEach(route => {
				 const mode = route.mode || 'OTHER';
				 const type = route.type || 'OTHER';
				 routesByMode[mode] = routesByMode[mode] || {};
				 routesByMode[mode][type] = routesByMode[mode][type] || [];
				 routesByMode[mode][type].push(route);
			 });

			 // Populate modes select
			 const modes = Object.keys(routesByMode).sort();
			 modes.forEach(m => addOption(modesSelect, m, m));

			 // disable dependent selects until chosen
			 typesSelect.innerHTML = '';
			 addOption(typesSelect, '', 'Select a mode first');
			 typesSelect.disabled = true;

			 linesSelect.innerHTML = '';
			 addOption(linesSelect, '', 'Select a type first');
			 linesSelect.disabled = true;

			 result.textContent = 'Modes loaded. Pick a mode.';
		 }

		 // when a mode is chosen, populate types
		 modesSelect.addEventListener('change', () => {
			 const mode = modesSelect.value;
			 typesSelect.innerHTML = '';
			 addOption(typesSelect, '', 'Choose a type');
			 linesSelect.innerHTML = '';
			 addOption(linesSelect, '', 'Select a type first');
			 linesSelect.disabled = true;
			 showBtn.disabled = true;

			 if (!mode) {
				 typesSelect.disabled = true;
				 result.textContent = 'Pick a mode.';
				 return;
			 }

			 const types = Object.keys(routesByMode[mode] || {}).sort();
			 types.forEach(t => addOption(typesSelect, t, t));
			 typesSelect.disabled = false;
			 result.textContent = `Types for ${mode} loaded. Pick a type.`;
		 });

		 // when a type is chosen, populate lines
		 typesSelect.addEventListener('change', () => {
			 const mode = modesSelect.value;
			 const type = typesSelect.value;
			 linesSelect.innerHTML = '';
			 addOption(linesSelect, '', 'Choose a line');
			 showBtn.disabled = true;

			 if (!type) {
				 linesSelect.disabled = true;
				 result.textContent = 'Pick a type.';
				 return;
			 }

			 const list = (routesByMode[mode] && routesByMode[mode][type]) || [];
			 // sort by shortName then id, then populate
			 list.sort((a,b) => (a.shortName||a.id||'').localeCompare(b.shortName||b.id||''));
			 list.forEach(route => {
				 const display = route.shortName ? `${route.shortName} — ${route.longName || ''}`.trim() : (route.id || '');
				 addOption(linesSelect, route.id, display);
			 });

			 linesSelect.disabled = false;
			 result.textContent = 'Lines loaded. Pick a line.';
		 });

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

			// Build a small HTML table of upcoming times with clear columns
				function formatDelaySeconds(d) {
				if (d === 0) return 'On time';
				const sign = d > 0 ? '+' : '-';
				const abs = Math.abs(d);
				const m = Math.floor(abs / 60);
				const s = abs % 60;
				return sign + (m > 0 ? `${m}m${s}s` : `${s}s`);
			}

			function delayClass(d) {
				if (d <= 0) return 'delay-good';
				if (d <= 120) return 'delay-warning';
				return 'delay-bad';
			}

				// current time display and helper to format "from now"
				const currentTimeEl = document.getElementById('currentTime');
				function updateCurrentTime() {
					const now = new Date();
					currentTimeEl.textContent = now.toLocaleTimeString();
				}
				// call once and every second to keep the clock updated
				updateCurrentTime();
				setInterval(updateCurrentTime, 1000);

				function formatFromNow(msDelta) {
					// msDelta = arrivalMs - nowMs
					const s = Math.round(Math.abs(msDelta) / 1000);
					const m = Math.floor(s / 60);
					const sec = s % 60;
					if (msDelta > 0) {
						if (m > 0) return `in ${m}m${sec}s`;
						return `in ${sec}s`;
					} else if (msDelta < 0) {
						if (m > 0) return `${m}m${sec}s ago`;
						return `${sec}s ago`;
					}
					return 'now';
				}

				const rows = data.slice(0, 50).map(item => {
				const sd = Number(item.serviceDay) || 0;
				const scheduledSec = typeof item.scheduledArrival !== 'undefined' ? Number(item.scheduledArrival) : null;
				const realtimeSec = typeof item.realtimeArrival !== 'undefined' ? Number(item.realtimeArrival) : null;
					const arrivalSec = realtimeSec !== null ? realtimeSec : scheduledSec;
					const nowMs = Date.now();
					const arrivalMs = (arrivalSec !== null) ? (sd + arrivalSec) * 1000 : null;
					const fromNow = (arrivalMs !== null) ? formatFromNow(arrivalMs - nowMs) : 'n/a';

				function toTimeString(sec) {
					if (sec === null || typeof sec === 'undefined') return 'n/a';
					return new Date((sd + sec) * 1000).toLocaleTimeString();
				}

				const scheduledTime = scheduledSec !== null ? toTimeString(scheduledSec) : 'n/a';
				const realtimeTime = realtimeSec !== null ? toTimeString(realtimeSec) : 'n/a';

				let delayText = '';
				let delayCss = '';
				if (scheduledSec !== null && realtimeSec !== null) {
					const d = realtimeSec - scheduledSec;
					delayText = formatDelaySeconds(d);
					delayCss = delayClass(d);
				}

				const route = item.route || (item.trip && item.trip.routeId) || '';
				const headsign = item.headsign || (item.trip && item.trip.headsign) || '';
				const occupancy = item.occupancy || (item.occupancyId ? `lvl:${item.occupancyId}` : '') || '';

						return `<tr>
							<td><div><small class="timeLabel">Scheduled</small><strong>${scheduledTime}</strong></div></td>
							<td><div><small class="timeLabel">Realtime</small><strong>${realtimeTime}</strong></div></td>
							<td>${fromNow}</td>
							<td class="${delayCss}">${delayText}</td>
							<td>${route}</td>
							<td>${headsign}</td>
							<td class="occupancy">${occupancy}</td>
						</tr>`;
			}).join('');

					result.innerHTML = `
						<table>
							<thead><tr><th>Scheduled</th><th>Realtime</th><th>From now</th><th>Delay</th><th>Route</th><th>Direction</th><th>Occupancy</th></tr></thead>
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

