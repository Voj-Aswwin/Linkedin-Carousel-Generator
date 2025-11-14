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

    const { slideData } = req.body

    if (!slideData) {
      return res.status(400).json({ error: 'slideData is required' })
    }

    const genAI = new GoogleGenerativeAI(API_KEY)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        maxOutputTokens: 2000,
        temperature: 0.3,
      }
    })

    // Extract text content from slide data
    let content = ''
    if (slideData.title?.text) {
      content += slideData.title.text + ' '
    }
    if (slideData.content?.text) {
      content += slideData.content.text + ' '
    }
    if (slideData.leftContent?.text) {
      content += slideData.leftContent.text + ' '
    }
    if (slideData.rightContent?.text) {
      content += slideData.rightContent.text + ' '
    }
    content = content.trim()
    
    const prompt = `
Analyze the following slide content and suggest visual elements to make it engaging:

SLIDE CONTENT:
Title: ${slideData.title?.text || 'No title'}
Content: ${content}

Your task is to suggest ONE of the following visual elements:

1. DATAPOINTS: If the content contains numbers, statistics, percentages, or measurable data, suggest a chart/infographic
2. KEYWORDS: If the content has important concepts, buzzwords, or key terms, suggest WordArt
3. ICON: If the content is conceptual or descriptive, suggest a relevant icon

Return ONLY a JSON object with this exact structure:
{
  "visualType": "datapoints" | "keywords" | "icon",
  "datapoints": {
    "type": "bar" | "pie" | "donut" | "line",
    "data": [
      {"label": "Category 1", "value": 40},
      {"label": "Category 2", "value": 35},
      {"label": "Category 3", "value": 25}
    ],
    "title": "Data Visualization Title"
  },
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "icon": "Lightbulb" | "Target" | "Rocket" | "Shield" | "TrendingUp" | "Users" | "Settings" | "Heart" | "Star" | "CheckCircle",
  "reasoning": "Brief explanation of why this visual element was chosen"
}

Guidelines:
- If content has numbers/percentages/statistics → suggest datapoints
- If content has business terms/concepts → suggest keywords for WordArt
- If content is descriptive/conceptual → suggest relevant icon
- Always provide a visual element - never return empty suggestions
- For datapoints: extract or create meaningful data from the content
- For keywords: extract 3 most important terms (2-4 words each)
- For icons: choose the most relevant icon that represents the content theme
`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const visualSuggestions = JSON.parse(jsonMatch[0])
        return res.status(200).json(visualSuggestions)
      } catch (parseError) {
        console.error('JSON parsing error:', parseError)
        // Return fallback suggestions
        const hasNumbers = /\d+%|\d+x|\$\d+|\d+\+|\d+\.\d+/.test(content)
        const fallback = hasNumbers ? {
          visualType: "datapoints",
          datapoints: {
            type: "bar",
            data: [
              {"label": "Point 1", "value": 40},
              {"label": "Point 2", "value": 35},
              {"label": "Point 3", "value": 25}
            ],
            title: "Data Overview"
          },
          keywords: [],
          icon: "TrendingUp",
          reasoning: "Fallback: Numbers detected, suggesting data visualization"
        } : {
          visualType: "keywords",
          datapoints: null,
          keywords: ["Innovation", "Growth", "Success"],
          icon: "Lightbulb",
          reasoning: "Fallback: No numbers detected, suggesting keyword WordArt"
        }
        return res.status(200).json(fallback)
      }
    } else {
      console.warn('No valid JSON found in LLM response:', text)
      // Return fallback suggestions
      const hasNumbers = /\d+%|\d+x|\$\d+|\d+\+|\d+\.\d+/.test(content)
      const fallback = hasNumbers ? {
        visualType: "datapoints",
        datapoints: {
          type: "bar",
          data: [
            {"label": "Point 1", "value": 40},
            {"label": "Point 2", "value": 35},
            {"label": "Point 3", "value": 25}
          ],
          title: "Data Overview"
        },
        keywords: [],
        icon: "TrendingUp",
        reasoning: "Fallback: Numbers detected, suggesting data visualization"
      } : {
        visualType: "keywords",
        datapoints: null,
        keywords: ["Innovation", "Growth", "Success"],
        icon: "Lightbulb",
        reasoning: "Fallback: No numbers detected, suggesting keyword WordArt"
      }
      return res.status(200).json(fallback)
    }
  } catch (error) {
    console.error('Error analyzing slide content:', error)
    return res.status(500).json({ 
      error: 'Failed to analyze slide content',
      message: error.message 
    })
  }
}

