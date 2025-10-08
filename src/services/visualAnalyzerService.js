import { GoogleGenerativeAI } from '@google/generative-ai'

// Get API key from environment variables
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY

if (!API_KEY) {
  console.error('VITE_GEMINI_API_KEY is not defined in environment variables')
  throw new Error('Gemini API key is required. Please set VITE_GEMINI_API_KEY in your .env file')
}

const genAI = new GoogleGenerativeAI(API_KEY)

/**
 * Service for analyzing slide content and suggesting visual elements
 */
export class VisualAnalyzerService {
  constructor() {
    this.model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        maxOutputTokens: 2000,
        temperature: 0.3,
      }
    })
  }

  /**
   * Analyze slide content and suggest visual elements
   * @param {Object} slideData - The slide data containing title, content, etc.
   * @returns {Object} Visual suggestions including datapoints, keywords, and icon
   */
  async analyzeSlideContent(slideData) {
    try {
      const content = this.extractTextContent(slideData)
      
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

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      console.log('🔍 LLM Raw Response:', text)
      
      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const visualSuggestions = JSON.parse(jsonMatch[0])
        console.log('✅ Parsed Visual Suggestions:', visualSuggestions)
        console.log('🎯 Chosen Visual Type:', visualSuggestions.visualType)
        console.log('💭 LLM Reasoning:', visualSuggestions.reasoning)
        
        if (visualSuggestions.visualType === 'datapoints') {
          console.log('📊 Data Points:', visualSuggestions.datapoints)
        } else if (visualSuggestions.visualType === 'keywords') {
          console.log('🔤 Keywords for WordArt:', visualSuggestions.keywords)
        } else if (visualSuggestions.visualType === 'icon') {
          console.log('🎨 Icon Suggestion:', visualSuggestions.icon)
        }
        
        return visualSuggestions
      } else {
        console.warn('❌ No valid JSON found in LLM response:', text)
        console.log('🔄 Using fallback suggestions...')
        return this.getFallbackSuggestions(content)
      }
      
    } catch (error) {
      console.error('Error analyzing slide content:', error)
      return this.getFallbackSuggestions(this.extractTextContent(slideData))
    }
  }

  /**
   * Extract text content from slide data
   * @param {Object} slideData - Slide data object
   * @returns {string} Extracted text content
   */
  extractTextContent(slideData) {
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
    
    return content.trim()
  }

  /**
   * Get fallback suggestions when LLM analysis fails
   * @param {string} content - Text content
   * @returns {Object} Fallback visual suggestions
   */
  getFallbackSuggestions(content) {
    // Simple fallback logic
    const hasNumbers = /\d+%|\d+x|\$\d+|\d+\+|\d+\.\d+/.test(content)
    
    if (hasNumbers) {
      return {
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
      }
    } else {
      return {
        visualType: "keywords",
        datapoints: null,
        keywords: ["Innovation", "Growth", "Success"],
        icon: "Lightbulb",
        reasoning: "Fallback: No numbers detected, suggesting keyword WordArt"
      }
    }
  }
}

// Export singleton instance
export const visualAnalyzerService = new VisualAnalyzerService()
