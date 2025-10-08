#!/usr/bin/env node
const fetch = require('node-fetch');
const dotenv = require('dotenv');

dotenv.config();
// API key configuration
// Put your API key here (get it at https://openapi.radiofrance.fr) or set it in your environment as API_KEY
const API_KEY = process.env.API_KEY || 'PUT_YOUR_API_KEY_HERE';
if (!API_KEY || API_KEY === 'PUT_YOUR_API_KEY_HERE') {
  console.error('Missing API_KEY. Set API_KEY in your environment or replace the placeholder in scripts/radiofrance_cli.js');
  process.exit(1);
}

const API_URL = 'https://openapi.radiofrance.fr/v1/graphql';

const brandsQuery = `
{
  brands {
    id
    title
  }
}
`;

const webradiosQuery = `
{
  brand(id: FIP) {
    id
    title
    localRadios {
      id
      title
    }
    webRadios {
      id
      title
    }
  }
}
`;

async function postQuery(query) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-token': API_KEY },
    body: JSON.stringify({ query }),
  });
  return res.json();
}

async function fetchBrands() {
  const data = await postQuery(brandsQuery);
  console.log(JSON.stringify(data, null, 2));
  const brands = data.data && data.data.brands;
  if (brands) brands.forEach(b => console.log(b.id));
}

async function fetchWebradios() {
  const data = await postQuery(webradiosQuery);
  console.log(JSON.stringify(data, null, 2));
  const radios = data.data && data.data.brand && data.data.brand.webRadios;
  if (radios) radios.forEach(r => console.log(r.id));
}

function prompt(question) {
  return new Promise(resolve => {
    process.stdout.write(question);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', data => {
      process.stdin.pause();
      resolve(data.toString().trim());
    });
  });
}

async function promptForWebradios() {
  const promptBrand = await prompt('Enter brand ID: ');
  const q = `\n  {\n    brand(id: ${promptBrand}) {\n      id\n      title\n      localRadios { id title }\n      webRadios { id title }\n    }\n  }\n  `;
  const data = await postQuery(q);
  console.log(JSON.stringify(data, null, 2));
  const radios = data.data && data.data.brand && data.data.brand.webRadios;
  if (radios) radios.forEach(r => console.log(r.id));
}

async function promptForTrackinfo() {
  const promptRadio = await prompt('Enter webRadio ID: ');
  const q = `\n  {\n    live(station: ${promptRadio}) {\n      song {\n        track {\n          id\n          title\n          albumTitle\n          label\n          mainArtists\n          authors\n          composers\n          performers\n          productionDate\n          discNumber\n          trackNumber\n        }\n      }\n    }\n  }\n  `;
  const data = await postQuery(q);
  console.log('Response JSON:\n', JSON.stringify(data, null, 2));
  const track = data.data && data.data.live && data.data.live.song && data.data.live.song.track;
  if (track) {
    console.log(`id: ${track.id}`);
    console.log(`title: ${track.title}`);
    console.log(`albumTitle: ${track.albumTitle}`);
    console.log(`label: ${track.label}`);
    console.log(`mainArtists: ${track.mainArtists}`);
    console.log(`performers: ${track.performers}`);
    console.log(`productionDate: ${track.productionDate}`);
  }
}

async function main() {
  await fetchBrands();
  console.log();
  await promptForWebradios();
  console.log();
  await promptForTrackinfo();
  console.log();
}

if (require.main === module) main().catch(err => { console.error(err); process.exit(1); });
