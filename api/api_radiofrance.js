/* Beginner-friendly JavaScript for api_radiofrance.html
   - Keeps network logic here so the HTML stays declarative
   - Small helpers and clear error messages make troubleshooting easier
*/
(function(){
  // Base URL of your backend. Update this to your deployed Render URL if different.
  const baseUrl = "https://project-api-fip.onrender.com";

  // Utility: write a value (string or object) to a <pre> by id
  function showPre(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = (typeof value === 'string') ? value : JSON.stringify(value, null, 2);
  }

  // Build headers including API key if the user entered one in the UI
  function buildHeaders() {
    const headers = new Headers();
    const key = (document.getElementById('apiKey') || {}).value || '';
    const mode = (document.getElementById('keyMode') || {}).value || 'none';
    if (!key || mode === 'none') return headers;

    // map known modes to header names/values explicitly
    switch (mode) {
      case 'bearer':
        headers.set('Authorization', `Bearer ${key}`);
        break;
      case 'x-api-key':
        headers.set('x-api-key', key);
        break;
      case 'x-token':
        headers.set('x-token', key);
        break;
      default:
        // fallback: set provided mode as header name
        headers.set(mode, key);
    }
    return headers;
  }

  async function fetchJson(url) {
    const headers = buildHeaders();
    const res = await fetch(url, {cache: 'no-store', headers});
    if (!res.ok) {
      // try to include body text when available to help debugging
      let bodyText = '';
      try { bodyText = await res.text(); } catch (e) { /* ignore */ }
      throw new Error(`${res.status} ${res.statusText}${bodyText ? ' - ' + bodyText : ''}`);
    }
    return res.json();
  }

  // Public functions used by the HTML via data-action attributes
  async function fetchBrands() {
    showPre('brandsOutput', 'Loading brands...');
    try {
      const data = await fetchJson(`${baseUrl}/brands`);
      showPre('brandsOutput', data);
    } catch (err) {
      showPre('brandsOutput', `Error fetching /brands: ${err.message}.\nCheck that the backend is running and that CORS allows this page.`);
    }
  }

  async function fetchWebRadios() {
    const brandId = (document.getElementById('brandId') || {}).value || '';
    if (!brandId.trim()) {
      showPre('webradiosOutput', 'Please enter a Brand ID (e.g. FIP)');
      return;
    }
    showPre('webradiosOutput', 'Loading web radios...');
    try {
      const data = await fetchJson(`${baseUrl}/webradios?brand_id=${encodeURIComponent(brandId)}`);
      showPre('webradiosOutput', data);
    } catch (err) {
      showPre('webradiosOutput', `Error fetching /webradios: ${err.message}.\nIf you see 404, ensure your backend exposes GET /webradios or update baseUrl.`);
    }
  }

  async function fetchTrackInfo() {
    const stationId = (document.getElementById('stationId') || {}).value || '';
    if (!stationId.trim()) {
      showPre('trackOutput', 'Please enter a Station ID');
      return;
    }
    showPre('trackOutput', 'Loading track info...');
    try {
      const url = `${baseUrl}/items/${encodeURIComponent(stationId)}`;
      const data = await fetchJson(url);
      showPre('trackOutput', data);
    } catch (err) {
      showPre('trackOutput', `Error fetching track info: ${err.message}.\nCheck backend routes and CORS.`);
    }
  }

  // Expose functions to the global scope in a small, explicit object used by the HTML
  window.ApiRadioFrance = { fetchBrands, fetchWebRadios, fetchTrackInfo };
})();
