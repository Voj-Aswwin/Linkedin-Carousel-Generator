import { GoogleGenerativeAI } from '@google/generative-ai'

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

    const { userContent, options = {} } = req.body

    if (!userContent) {
      return res.status(400).json({ error: 'userContent is required' })
    }

    const genAI = new GoogleGenerativeAI(API_KEY)
    
    // Use Gemini 2.5 Flash with maximum token configuration
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        maxOutputTokens: 16384,
        temperature: options.temperature || 0.7,
        topP: options.topP || 0.8,
        topK: options.topK || 40
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH", 
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    })
    
    const prompt = `
    You are an expert LinkedIn carousel designer and content strategist. Create a stunning, professional header slide design based on this content: "${userContent}"
    
    Analyze the content thoroughly and extract the most compelling elements. Consider:
    - The main value proposition or key message
    - Target audience and their pain points
    - Industry context and trends
    - Emotional triggers that drive engagement
    - Visual hierarchy and readability
    
    Return a comprehensive JSON object with the following structure:
    {
      "title": "Compelling headline (max 8 words, action-oriented)",
      "subtitle": "Supporting text that adds context (max 15 words)",
      "socialHandle": "@social_handle",
      "authorName": "Author Name",
      "authorHandle": "@author_handle",
      "authorImageUrl": "https://example.com/author.jpg",
      "background": {
        "type": "gradient" | "solid" | "pattern",
        "color1": "#hexcolor (primary color)",
        "color2": "#hexcolor (secondary color for gradients)",
        "pattern": "dots" | "lines" | "geometric" | "none" (if pattern type)
      },
      "titleStyle": {
        "fontSize": 48-72,
        "fontFamily": "Arial" | "Helvetica" | "Georgia" | "Times New Roman" | "Inter" | "Poppins" | "Andon",
        "color": "#hexcolor (high contrast)",
        "fontWeight": "bold" | "normal"
      },
      "subtitleStyle": {
        "fontSize": 20-32,
        "fontFamily": "Arial" | "Helvetica" | "Georgia" | "Times New Roman" | "Inter" | "Poppins" | "Andon",
        "color": "#hexcolor (complementary to title)",
        "fontWeight": "normal" | "bold"
      },
      "accentColor": "#hexcolor (brand accent color)",
      "layout": "centered" | "left-aligned" | "right-aligned",
      "designNotes": "Brief explanation of design choices and why they work for this content"
    }
    
    Design Guidelines:
    - Use modern, professional color schemes (avoid overly bright or neon colors)
    - Ensure high contrast for readability
    - Choose fonts that convey the right tone (professional, friendly, authoritative)
    - Consider the content's industry and target audience
    - Make it LinkedIn-optimized (professional yet engaging)
    - Focus on the most compelling aspect of the content
    - Use color psychology to enhance the message
    - Ensure the design works well on mobile devices
    
    Create a visually stunning and professional design that will grab attention and drive engagement on LinkedIn.
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // Parse the JSON response with better error handling
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const parsedData = JSON.parse(jsonMatch[0])
        // Validate required fields
        if (!parsedData.title || !parsedData.subtitle) {
          throw new Error('Missing required fields in AI response')
        }
        return res.status(200).json(parsedData)
      } catch (parseError) {
        console.error('JSON parsing error:', parseError)
        return res.status(500).json({ error: 'Failed to parse AI response as valid JSON' })
      }
    } else {
      console.error('No JSON found in response:', text)
      return res.status(500).json({ error: 'No valid JSON found in AI response' })
    }
  } catch (error) {
    console.error('Error generating header slide:', error)
    return res.status(500).json({ 
      error: 'Failed to generate header slide',
      message: error.message 
    })
  }
}

