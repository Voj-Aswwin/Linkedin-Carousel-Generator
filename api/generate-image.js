export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get API key from server-side environment variable (not VITE_ prefixed)
    const API_KEY = process.env.GEMINI_API_KEY

    if (!API_KEY) {
      console.error('GEMINI_API_KEY is not defined in environment variables')
      return res.status(500).json({ 
        error: 'Server configuration error: Gemini API key is not set' 
      })
    }

    const { prompt } = req.body

    if (!prompt) {
      return res.status(400).json({ error: 'prompt is required' })
    }

    // Image generation using Gemini 2.0 Flash Experimental
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${API_KEY}`
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"]  // Enable image generation
        }
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Image generation failed:', response.statusText, errorText)
      throw new Error(`Image generation failed: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    // Extract base64 image data from response
    for (const candidate of data.candidates || []) {
      for (const part of candidate.content?.parts || []) {
        if (part.inlineData?.data) {
          // Return as data URL for easy use in canvas
          const imageDataUrl = `data:image/png;base64,${part.inlineData.data}`
          return res.status(200).json({ imageDataUrl })
        }
      }
    }
    
    return res.status(500).json({ error: 'No image data found in response' })
  } catch (error) {
    console.error('Error generating image:', error)
    return res.status(500).json({ 
      error: 'Failed to generate image',
      message: error.message 
    })
  }
}

