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

  async function fetchJson(url) {
    const res = await fetch(url, {cache: 'no-store'});
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
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
