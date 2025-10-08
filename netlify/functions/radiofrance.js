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

  // API key configuration
  // Put your API key here (get it at https://openapi.radiofrance.fr) or set it in environment variables as API_KEY
  const API_KEY = process.env.API_KEY || 'PUT_YOUR_API_KEY_HERE';
  if (!API_KEY || API_KEY === 'PUT_YOUR_API_KEY_HERE') {
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: 'API_KEY not configured. Set process.env.API_KEY or replace the placeholder in this file.' }) };
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
