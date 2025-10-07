# API Radio France

This folder contains a tiny, beginner-friendly script that calls the project's Radio France backend.

Files:
- `api_radiofrance.html` — the script page (simple HTML, accessible, commented).
- `api_radiofrance.css` — small styles, easy to tweak.
- `api_radiofrance.js` — fetch logic; edit `baseUrl` here if your backend is hosted elsewhere.

How to use:
1. Serve the `github_skills_pages` site as you normally do (it can be opened locally as a file for quick tests, but some browsers block fetch() from file:// origins).
2. Open `api/api_radiofrance.html` in your browser.
3. If requests fail with 404, update the `baseUrl` constant in `api_radiofrance.js` to point to your backend (for example your Render app URL).

Notes for beginners:
- Keep UI and behavior separate: change styles in the CSS, behavior in the JS, and structure in the HTML.
- Use the browser devtools network tab to inspect requests and CORS issues.
