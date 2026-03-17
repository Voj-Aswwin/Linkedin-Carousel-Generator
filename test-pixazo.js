require('dotenv').config();
const fetch = require('node-fetch'); // though in modern node it's global

async function test() {
  const url = "https://gateway.pixazo.ai/flux-1-schnell/v1/getData";
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Ocp-Apim-Subscription-Key': process.env.PIXAZO_API_KEY
    },
    body: JSON.stringify({
      prompt: "A simple red apple",
      num_steps: 4,
      seed: 15,
      height: 512,
      width: 512
    })
  });
  
  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

test();
