const fetch = require('node-fetch');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

exports.handler = async function (event, context) {
  // Respond to preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  const API_KEY = process.env.API_KEY;
  if (!API_KEY) {
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: 'API_KEY not configured in Netlify environment' }) };
  }

  const body = event.body || '';

  try {
    const res = await fetch('https://openapi.radiofrance.fr/v1/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-token': API_KEY,
      },
      body,
    });
    const text = await res.text();
    return { statusCode: res.status, headers: CORS_HEADERS, body: text };
  } catch (err) {
    return { statusCode: 502, headers: CORS_HEADERS, body: JSON.stringify({ error: String(err) }) };
  }
};
