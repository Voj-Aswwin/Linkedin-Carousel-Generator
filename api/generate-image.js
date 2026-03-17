export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get API key from server-side environment variable (not VITE_ prefixed)
    const API_KEY = process.env.PIXAZO_API_KEY

    if (!API_KEY) {
      console.error('PIXAZO_API_KEY is not defined in environment variables')
      return res.status(500).json({ 
        error: 'Server configuration error: Pixazo API key is not set' 
      })
    }

    const { prompt } = req.body

    if (!prompt) {
      return res.status(400).json({ error: 'prompt is required' })
    }

    // Image generation using Pixazo flux-1-schnell
    const endpoint = `https://gateway.pixazo.ai/flux-1-schnell/v1/getData`
    
    let imageUrl = null;
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Ocp-Apim-Subscription-Key': API_KEY
        },
        body: JSON.stringify({
          prompt: prompt,
          num_steps: 4,
          seed: Math.floor(Math.random() * 1000000), // Random seed
          height: 512,
          width: 512
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Image generation failed:', response.statusText, errorText)
        throw new Error(`Image generation failed: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data && data.output) {
        imageUrl = data.output;
      } else {
        throw new Error('No image URL returned from Pixazo API');
      }
    } catch (apiError) {
      console.error('API Error:', apiError);
      return res.status(500).json({ error: 'Failed to generate image URL from Pixazo API' });
    }

    // Fetch the actual image to convert to base64 for canvas compatibility
    try {
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image from URL: ${imageResponse.statusText}`);
      }
      
      const arrayBuffer = await imageResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64Image = buffer.toString('base64');
      
      // Use the content type from the response, defaulting to png
      const contentType = imageResponse.headers.get('content-type') || 'image/png';
      const imageDataUrl = `data:${contentType};base64,${base64Image}`;
      
      return res.status(200).json({ imageDataUrl });
    } catch (fetchError) {
      console.error('Error fetching/converting generated image:', fetchError);
      // Fallback: return the URL directly as imageDataUrl if base64 conversion fails
      return res.status(200).json({ imageDataUrl: imageUrl });
    }
  } catch (error) {
    console.error('Error generating image:', error)
    return res.status(500).json({ 
      error: 'Failed to generate image',
      message: error.message 
    })
  }
}

