// API base URL - use relative path for Vercel deployment
// In local development with Vite, use Vercel CLI: `vercel dev`
// This will make serverless functions available at /api/*
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// Check if we're in development mode
const isDevelopment = import.meta.env.DEV

/**
 * Service for analyzing slide content and suggesting visual elements
 */
export class VisualAnalyzerService {
  /**
   * Analyze slide content and suggest visual elements
   * @param {Object} slideData - The slide data containing title, content, etc.
   * @returns {Object} Visual suggestions including datapoints, keywords, and icon
   */
  async analyzeSlideContent(slideData) {
    try {
      const response = await fetch(`${API_BASE_URL}/analyze-slide-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slideData }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        
        // Provide helpful error message for 404 in development
        if (response.status === 404 && isDevelopment) {
          throw new Error(
            'API route not found. For local development, please use Vercel CLI:\n' +
            '1. Install: npm i -g vercel\n' +
            '2. Run: vercel dev\n' +
            '3. Set GEMINI_API_KEY in .env.local\n' +
            'This will start the serverless functions locally.\n' +
            `Original error: ${errorData.error || 'Route not found'}`
          )
        }
        
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const visualSuggestions = await response.json()
      
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
    } catch (error) {
      console.error('Error analyzing slide content:', error)
      const content = this.extractTextContent(slideData)
      return this.getFallbackSuggestions(content)
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
