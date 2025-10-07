const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  const API_KEY = process.env.API_KEY;
  if (!API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'API_KEY not configured in Netlify environment' }) };
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
    return { statusCode: res.status, body: text };
  } catch (err) {
    return { statusCode: 502, body: JSON.stringify({ error: String(err) }) };
  }
};
