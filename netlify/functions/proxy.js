const fetch = require('node-fetch');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// Simple proxy: POST { "url": "https://example.com" }
// Returns the fetched content (text) with CORS headers.
exports.handler = async function (event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const url = body && body.url;
    if (!url) {
      return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Missing url in request body' }) };
    }

    // Basic validation: only allow http(s) URLs
    if (!/^https?:\/\//i.test(url)) {
      return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Invalid URL protocol' }) };
    }

    // Fetch the URL server-side to avoid CORS restrictions in the browser
    const res = await fetch(url, { method: 'GET' });
    const text = await res.text();
    return { statusCode: res.status, headers: CORS_HEADERS, body: text };
  } catch (err) {
    return { statusCode: 502, headers: CORS_HEADERS, body: JSON.stringify({ error: String(err) }) };
  }
};
