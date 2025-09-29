import { GoogleGenerativeAI } from '@google/generative-ai'

// Hardcoded API key - replace with your actual key
const API_KEY = 'AIzaSyDlL8BuFnikAlJ6gI8AS9s3JdE865HpoYI'
const genAI = new GoogleGenerativeAI(API_KEY)

export const generateHeaderSlide = async (userContent) => {
  try {
    // Use Gemini 2.5 Flash with maximum token configuration
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        maxOutputTokens: 8192,  // Maximum output tokens
        temperature: 0.7,       // Balanced creativity
        topP: 0.8,             // Nucleus sampling
        topK: 40               // Top-k sampling
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
      "background": {
        "type": "gradient" | "solid" | "pattern",
        "color1": "#hexcolor (primary color)",
        "color2": "#hexcolor (secondary color for gradients)",
        "pattern": "dots" | "lines" | "geometric" | "none" (if pattern type)
      },
      "titleStyle": {
        "fontSize": 48-72,
        "fontFamily": "Arial" | "Helvetica" | "Georgia" | "Times New Roman" | "Inter" | "Poppins",
        "color": "#hexcolor (high contrast)",
        "fontWeight": "bold" | "normal"
      },
      "subtitleStyle": {
        "fontSize": 20-32,
        "fontFamily": "Arial" | "Helvetica" | "Georgia" | "Times New Roman" | "Inter" | "Poppins",
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
        return parsedData
      } catch (parseError) {
        console.error('JSON parsing error:', parseError)
        throw new Error('Failed to parse AI response as valid JSON')
      }
    } else {
      console.error('No JSON found in response:', text)
      throw new Error('No valid JSON found in AI response')
    }
  } catch (error) {
    console.error('Error generating header slide:', error)
    // Return a fallback design
    return {
      title: "Your Content",
      subtitle: "Transformed into a stunning carousel",
      background: {
        type: "gradient",
        color1: "#667eea",
        color2: "#764ba2"
      },
      titleStyle: {
        fontSize: 48,
        fontFamily: "Arial",
        color: "#ffffff",
        fontWeight: "bold"
      },
      subtitleStyle: {
        fontSize: 24,
        fontFamily: "Arial",
        color: "#f8f9fa",
        fontWeight: "normal"
      },
      accentColor: "#ffd700",
      layout: "centered"
    }
  }
}

// Helper function to handle large content inputs
export const generateHeaderSlideAdvanced = async (userContent, options = {}) => {
  try {
    // Use Gemini 2.5 Flash with maximum token configuration
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        maxOutputTokens: 8192,  // Maximum output tokens
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
    
    // Enhanced prompt for better results with larger context
    const prompt = `
    You are an expert LinkedIn carousel designer and content strategist with deep knowledge of:
    - LinkedIn's algorithm and engagement patterns
    - Visual design principles for social media
    - Color psychology and typography
    - Industry-specific design trends
    - Mobile-first design considerations
    
    Create a stunning, professional header slide design based on this content: "${userContent}"
    
    Perform a comprehensive analysis:
    1. Content Analysis:
       - Extract the core message and value proposition
       - Identify the target audience and their pain points
       - Determine the emotional tone and urgency
       - Find the most compelling hook or statistic
    
    2. Design Strategy:
       - Choose colors that align with the content's mood and industry
       - Select typography that conveys the right authority level
       - Determine the most effective layout for the message
       - Consider visual hierarchy and readability
    
    3. LinkedIn Optimization:
       - Ensure mobile-first design
       - Optimize for LinkedIn's feed algorithm
       - Create thumb-stopping visual appeal
       - Balance professionalism with engagement
    
    Return a comprehensive JSON object with the following structure:
    {
      "title": "Compelling headline (max 8 words, action-oriented, emotionally engaging)",
      "subtitle": "Supporting text that adds context and value (max 15 words)",
      "background": {
        "type": "gradient" | "solid" | "pattern",
        "color1": "#hexcolor (primary color with psychological impact)",
        "color2": "#hexcolor (secondary color for gradients, complementary)",
        "pattern": "dots" | "lines" | "geometric" | "none" (if pattern type)
      },
      "titleStyle": {
        "fontSize": 48-72,
        "fontFamily": "Arial" | "Helvetica" | "Georgia" | "Times New Roman" | "Inter" | "Poppins" | "Montserrat",
        "color": "#hexcolor (high contrast, brand-aligned)",
        "fontWeight": "bold" | "normal"
      },
      "subtitleStyle": {
        "fontSize": 20-32,
        "fontFamily": "Arial" | "Helvetica" | "Georgia" | "Times New Roman" | "Inter" | "Poppins" | "Montserrat",
        "color": "#hexcolor (complementary to title, readable)",
        "fontWeight": "normal" | "bold"
      },
      "accentColor": "#hexcolor (brand accent color, attention-grabbing)",
      "layout": "centered" | "left-aligned" | "right-aligned",
      "designNotes": "Detailed explanation of design choices, color psychology, and why this design will perform well on LinkedIn",
      "engagementTips": "Specific suggestions for maximizing engagement with this design"
    }
    
    Advanced Design Guidelines:
    - Use color psychology: blue for trust, green for growth, red for urgency, purple for creativity
    - Ensure WCAG AA contrast ratios for accessibility
    - Choose fonts that match the industry (tech: modern, finance: traditional, creative: artistic)
    - Consider cultural context and international audiences
    - Optimize for both desktop and mobile viewing
    - Use visual hierarchy to guide the eye
    - Create emotional connection through design choices
    - Ensure the design tells a story at first glance
    
    Create a visually stunning and professional design that will grab attention, drive engagement, and perform well on LinkedIn's algorithm.
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
        return parsedData
      } catch (parseError) {
        console.error('JSON parsing error:', parseError)
        throw new Error('Failed to parse AI response as valid JSON')
      }
    } else {
      console.error('No JSON found in response:', text)
      throw new Error('No valid JSON found in AI response')
    }
  } catch (error) {
    console.error('Error generating advanced header slide:', error)
    // Return a fallback design
    return {
      title: "Your Content",
      subtitle: "Transformed into a stunning carousel",
      background: {
        type: "gradient",
        color1: "#667eea",
        color2: "#764ba2"
      },
      titleStyle: {
        fontSize: 48,
        fontFamily: "Arial",
        color: "#ffffff",
        fontWeight: "bold"
      },
      subtitleStyle: {
        fontSize: 24,
        fontFamily: "Arial",
        color: "#f8f9fa",
        fontWeight: "normal"
      },
      accentColor: "#ffd700",
      layout: "centered",
      designNotes: "Fallback design due to AI generation error",
      engagementTips: "Consider adding more specific content for better AI analysis"
    }
  }
}

// New function to generate complete carousel with multiple slides
export const generateCarouselSlides = async (userContent) => {
  try {
    // Use Gemini 2.5 Flash with maximum token configuration
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        maxOutputTokens: 8192,  // Maximum output tokens
        temperature: 0.7,       // Balanced creativity
        topP: 0.8,             // Nucleus sampling
        topK: 40               // Top-k sampling
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
    
    // Enhanced prompt for generating a complete carousel
    const prompt = `
    You are an expert LinkedIn carousel designer and content strategist. Create a complete LinkedIn carousel with multiple slides based on this content: "${userContent}"
    
    Generate a JSON object with the following structure:
    {
      "headerSlide": {
        "title": "Compelling headline (max 8 words, action-oriented)",
        "subtitle": "Supporting text (max 15 words)",
        "background": {
          "type": "gradient" | "solid" | "pattern",
          "color1": "#hexcolor",
          "color2": "#hexcolor",
          "pattern": "dots" | "lines" | "geometric" | "none"
        },
        "titleStyle": {
          "fontSize": 80-100,
          "fontFamily": "Arial" | "Helvetica" | "Georgia" | "Times New Roman" | "Inter" | "Poppins" | "Montserrat",
          "color": "#hexcolor",
          "fontWeight": "bold" | "normal"
        },
        "subtitleStyle": {
          "fontSize": 40-50,
          "fontFamily": "Arial" | "Helvetica" | "Georgia" | "Times New Roman" | "Inter" | "Poppins" | "Montserrat",
          "color": "#hexcolor",
          "fontWeight": "normal" | "bold"
        },
        "accentColor": "#hexcolor",
        "layout": "centered" | "left-aligned" | "right-aligned"
      },
      "infoSlides": [
        {
          "slideNumber": 1,
          "title": "Main slide title",
          "subheadings": [
            {
              "heading": "Subheading 1",
              "keyPoints": ["Key point 1 in 2-3 lines", "Key point 2 in 2-3 lines"]
            },
            {
              "heading": "Subheading 2", 
              "keyPoints": ["Key point 1 in 2-3 lines", "Key point 2 in 2-3 lines"]
            }
          ],
          "background": {
            "type": "gradient" | "solid" | "pattern",
            "color1": "#hexcolor",
            "color2": "#hexcolor",
            "pattern": "dots" | "lines" | "geometric" | "none"
          },
          "titleStyle": {
            "fontSize": 60-80,
            "fontFamily": "Arial" | "Helvetica" | "Georgia" | "Times New Roman" | "Inter" | "Poppins" | "Montserrat",
            "color": "#hexcolor",
            "fontWeight": "bold" | "normal"
          },
          "subheadingStyle": {
            "fontSize": 35-45,
            "fontFamily": "Arial" | "Helvetica" | "Georgia" | "Times New Roman" | "Inter" | "Poppins" | "Montserrat",
            "color": "#hexcolor",
            "fontWeight": "bold" | "normal"
          },
          "textStyle": {
            "fontSize": 30-40,
            "fontFamily": "Arial" | "Helvetica" | "Georgia" | "Times New Roman" | "Inter" | "Poppins" | "Montserrat",
            "color": "#hexcolor",
            "fontWeight": "normal"
          },
          "accentColor": "#hexcolor",
          "layout": "centered" | "left-aligned" | "right-aligned"
        }
      ]
    }
    
    Guidelines:
    1. Break the content into 2-4 logical information slides
    2. Each info slide should have 1-3 subheadings
    3. Each subheading should have 1-2 key points (2-3 lines each)
    4. Use EXACTLY the same background colors for ALL info slides (color1 and color2)
    5. Use the same accent color for ALL info slides
    6. Make each slide visually distinct but cohesive
    7. Ensure mobile-first design for LinkedIn
    8. Use professional, engaging typography
    9. Create visual hierarchy with proper spacing
    10. Include relevant statistics or data points where applicable
    11. Make content scannable and LinkedIn-optimized
    12. IMPORTANT: All info slides must have identical background colors for consistency
    
    Create a complete, professional LinkedIn carousel that tells a compelling story.
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
        if (!parsedData.headerSlide || !parsedData.infoSlides) {
          throw new Error('Missing required fields in AI response')
        }
        return parsedData
      } catch (parseError) {
        console.error('JSON parsing error:', parseError)
        throw new Error('Failed to parse AI response as valid JSON')
      }
    } else {
      console.error('No JSON found in response:', text)
      throw new Error('No valid JSON found in AI response')
    }
  } catch (error) {
    console.error('Error generating carousel slides:', error)
    // Return a fallback design
    return {
      headerSlide: {
        title: "Your Content",
        subtitle: "Transformed into a stunning carousel",
        background: {
          type: "gradient",
          color1: "#667eea",
          color2: "#764ba2"
        },
        titleStyle: {
          fontSize: 90,
          fontFamily: "Arial",
          color: "#ffffff",
          fontWeight: "bold"
        },
        subtitleStyle: {
          fontSize: 45,
          fontFamily: "Arial",
          color: "#f8f9fa",
          fontWeight: "normal"
        },
        accentColor: "#ffd700",
        layout: "centered"
      },
      infoSlides: [
        {
          slideNumber: 1,
          title: "Key Insights",
          subheadings: [
            {
              heading: "Main Point",
              keyPoints: ["Your content will be broken down into key insights", "Each point will be clearly presented"]
            }
          ],
          background: {
            type: "gradient",
            color1: "#667eea", // Same as header slide for consistency
            color2: "#764ba2"  // Same as header slide for consistency
          },
          titleStyle: {
            fontSize: 70,
            fontFamily: "Arial",
            color: "#ffffff",
            fontWeight: "bold"
          },
          subheadingStyle: {
            fontSize: 40,
            fontFamily: "Arial",
            color: "#ffffff",
            fontWeight: "bold"
          },
          textStyle: {
            fontSize: 35,
            fontFamily: "Arial",
            color: "#f8f9fa",
            fontWeight: "normal"
          },
          accentColor: "#ffd700",
          layout: "centered"
        }
      ]
    }
  }
}
