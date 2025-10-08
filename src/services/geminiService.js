import { GoogleGenerativeAI } from '@google/generative-ai'

// Get API key from environment variables
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY

if (!API_KEY) {
  console.error('VITE_GEMINI_API_KEY is not defined in environment variables')
  throw new Error('Gemini API key is required. Please set VITE_GEMINI_API_KEY in your .env file')
}

const genAI = new GoogleGenerativeAI(API_KEY)

export const generateHeaderSlide = async (userContent) => {
  try {
    // Use Gemini 2.5 Flash with maximum token configuration
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        maxOutputTokens: 16384,  // Increased to handle more slides
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
        maxOutputTokens: 16384,  // Increased to handle more slides
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

// Image generation using Gemini 2.0 Flash Experimental
export const generateImageFromPrompt = async (prompt) => {
  try {
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
      throw new Error(`Image generation failed: ${response.statusText}`)
    }
    
    const data = await response.json()
    
    // Extract base64 image data from response
    for (const candidate of data.candidates || []) {
      for (const part of candidate.content?.parts || []) {
        if (part.inlineData?.data) {
          // Return as data URL for easy use in canvas
          return `data:image/png;base64,${part.inlineData.data}`
        }
      }
    }
    
    throw new Error('No image data found in response')
  } catch (error) {
    console.error('Error generating image:', error)
    return null
  }
}

export const generateCarouselSlides = async (userContent) => {
  try {
    // Use Gemini 2.5 Flash with maximum token configuration
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        maxOutputTokens: 16384,  // Increased to handle more slides
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
    
    // Enhanced prompt for generating a complete carousel optimized for LinkedIn storytelling
    const prompt = `
    You are an expert LinkedIn carousel designer and content strategist with deep expertise in storytelling and engagement optimization. Create a compelling LinkedIn carousel that tells a complete story using strategic image placement and bullet-point formatting.

    Based on this content: "${userContent}"
    
    STORYTELLING APPROACH:
    - Use 3-4 strategically placed image slides to enhance the narrative flow
    - Images should be part of the story, not just decorative headers
    - Place images at key story moments: problem introduction, solution reveal, results showcase, call-to-action
    - INTERLEAVE image slides with info slides throughout the carousel for optimal engagement
    - Create a rhythm: info slide → image slide → info slide → image slide (when possible)
    - Use bullet points AND concise paragraphs for better LinkedIn engagement
    - Remove asterisk formatting - keep content clean and professional
    - IMPORTANT: Use the SAME text formatting (fontFamily, fontSize, color, fontWeight) for ALL slides except the header slide
    
    FIRST, analyze the content and generate a cohesive 3-color scheme:
    1. BACKGROUND COLOR: Choose a primary background color that reflects the content's mood and industry
    2. TEXT COLOR: Choose a high-contrast text color that ensures readability
    3. ACCENT COLOR: Choose a vibrant accent color that complements the background and creates visual interest
    
    Color Scheme Guidelines:
    - Use professional, modern color combinations
    - Ensure high contrast for readability
    - Consider color psychology (blue for trust, green for growth, etc.)
    - Choose colors that work well on mobile devices
    - Ensure accessibility and readability
    
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
      "imageSlides": [
        {
          "slideNumber": 1,
          "imagePrompt": "A detailed prompt for AI image generation that captures a key story moment (e.g., 'A professional illustration showing [key concept], modern style, clean background, no text or symbols')",
          "title": "A compelling title that advances the story (max 8 words)",
          "subtitle": "Supporting text that adds value and context to the image (max 20 words)",
          "background": {
            "type": "gradient" | "solid" | "pattern",
            "color1": "#hexcolor",
            "color2": "#hexcolor",
            "pattern": "dots" | "lines" | "geometric" | "none"
          },
          "titleStyle": {
            "fontSize": 50-70,
            "fontFamily": "Arial" | "Helvetica" | "Georgia" | "Times New Roman" | "Inter" | "Poppins" | "Montserrat",
            "color": "#hexcolor",
            "fontWeight": "bold" | "normal"
          },
          "subtitleStyle": {
            "fontSize": 30-40,
            "fontFamily": "Arial" | "Helvetica" | "Georgia" | "Times New Roman" | "Inter" | "Poppins" | "Montserrat",
            "color": "#hexcolor",
            "fontWeight": "normal" | "bold"
          },
          "accentColor": "#hexcolor",
          "layout": "centered" | "left-aligned" | "right-aligned"
        }
      ],
      "infoSlides": [
        {
          "slideNumber": 1,
          "title": "Main slide title",
          "slidePattern": "bulletPoints" | "singleParagraph" | "impactfulLine" | "mixedContent",
          "bulletPoints": [
            "Key point 1 in 1-2 lines maximum",
            "Key point 2 in 1-2 lines maximum",
            "Key point 3 in 1-2 lines maximum"
          ],
          "paragraphs": [
            "Concise paragraph with solid information that conveys the main message effectively. Keep it engaging and informative.",
            "Another paragraph that adds depth to the content while maintaining readability and impact."
          ],
          "impactfulLine": "One powerful, memorable statement that captures the essence of the message",
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
          "bulletStyle": {
            "fontSize": 30-40,
            "fontFamily": "Arial" | "Helvetica" | "Georgia" | "Times New Roman" | "Inter" | "Poppins" | "Montserrat",
            "color": "#hexcolor",
            "fontWeight": "normal"
          },
          "paragraphStyle": {
            "fontSize": 24-32,
            "fontFamily": "Arial" | "Helvetica" | "Georgia" | "Times New Roman" | "Inter" | "Poppins" | "Montserrat",
            "color": "#hexcolor",
            "fontWeight": "normal"
          },
          "accentColor": "#hexcolor",
          "layout": "centered" | "left-aligned" | "right-aligned"
        }
      ],
      "endSlide": {
        "title": "Call-to-action title (e.g., 'Ready to Get Started?')",
        "subtitle": "Compelling CTA message or contact information",
        "ctaText": "Specific action text (e.g., 'Contact Me', 'Learn More', 'Get Started')",
        "background": {
          "type": "gradient" | "solid" | "pattern",
          "color1": "#hexcolor (same as info slides)",
          "color2": "#hexcolor (same as info slides)",
          "pattern": "dots" | "lines" | "geometric" | "none"
        },
        "titleStyle": {
          "fontSize": 60-80,
          "fontFamily": "Arial" | "Helvetica" | "Georgia" | "Times New Roman" | "Inter" | "Poppins" | "Montserrat",
          "color": "#hexcolor",
          "fontWeight": "bold" | "normal"
        },
        "subtitleStyle": {
          "fontSize": 30-40,
          "fontFamily": "Arial" | "Helvetica" | "Georgia" | "Times New Roman" | "Inter" | "Poppins" | "Montserrat",
          "color": "#hexcolor",
          "fontWeight": "normal" | "bold"
        },
        "ctaStyle": {
          "fontSize": 35-45,
          "fontFamily": "Arial" | "Helvetica" | "Georgia" | "Times New Roman" | "Inter" | "Poppins" | "Montserrat",
          "color": "#hexcolor",
          "fontWeight": "bold"
        },
        "accentColor": "#hexcolor (same as other slides)",
        "layout": "centered" | "left-aligned" | "right-aligned"
      }
    }
    
    STORYTELLING GUIDELINES:
    1. Create 3-4 image slides that are strategically placed throughout the story
    2. Each image slide should represent a key story moment: problem, solution, results, or call-to-action
    3. INTERLEAVE image slides with info slides for optimal engagement rhythm
    4. Create a pattern: info → image → info → image (when possible) to maintain audience interest
    5. USE MULTIPLE SLIDE PATTERNS to prevent monotony and enhance narrative flow:
       - "bulletPoints": Traditional bullet points (3-5 points max)
       - "singleParagraph": One impactful paragraph that tells a complete story
       - "impactfulLine": One powerful, memorable statement (great for emphasis)
       - "mixedContent": Combination of bullets + paragraph for complex topics
    6. VARY the slide patterns strategically:
       - Use "impactfulLine" for key insights or statistics
       - Use "singleParagraph" for storytelling moments
       - Use "bulletPoints" for lists and processes
       - Use "mixedContent" for comprehensive topics
    7. Remove all asterisk formatting - keep content clean and professional
    8. Each bullet point should be 1-2 lines maximum
    9. Single paragraphs should be 2-4 sentences maximum
    10. Impactful lines should be 1-2 sentences maximum
    11. Use the same background colors for ALL info slides (color1 and color2)
    12. Use the same accent color for ALL slides
    13. CRITICAL: Use IDENTICAL text formatting for ALL slides except header:
       - Same fontFamily for all bulletStyle, paragraphStyle, and textStyle
       - Same fontSize ratios (bulletStyle: 30-40, paragraphStyle: 24-32, textStyle: 20-28)
       - Same color scheme for all text elements
       - Same fontWeight patterns
    14. Ensure mobile-first design for LinkedIn
    15. Create visual hierarchy with proper spacing
    16. Include relevant statistics or data points where applicable
    17. Make content scannable and LinkedIn-optimized
    18. Generate as many slides as necessary to cover ALL user content
    19. Ensure every important point from the user's content is included
    20. Always create a final "end slide" with a compelling call-to-action
    21. Use a consistent 3-color scheme throughout all slides
    22. Make important words and phrases BOLD using the accent color for emphasis
    23. Image slides should advance the narrative, not just break up text
    24. Each image should have a clear purpose in the story flow
    25. Keep image slide text minimal but impactful - the image tells the story
    26. ALTERNATE between content types to prevent audience fatigue and maintain engagement
    27. CREATE RHYTHM: Mix different slide patterns to create a dynamic, engaging flow
    28. CRITICAL: Every info slide MUST have content - never create empty slides
    29. If a slide pattern doesn't have content, use bulletPoints with relevant information
    30. Ensure bulletPoints, paragraphs, or impactfulLine are always populated with meaningful content
    31. Never leave any info slide without at least one content element
    
    Create a complete, professional LinkedIn carousel that tells a compelling story with strategic image placement and bullet-point formatting. Focus on engagement and storytelling rather than just information delivery.
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
        
        // Generate images for all image slides
        if (parsedData.imageSlides && parsedData.imageSlides.length > 0) {
          console.log(`Generating ${parsedData.imageSlides.length} images for carousel...`)
          for (let i = 0; i < parsedData.imageSlides.length; i++) {
            const imageSlide = parsedData.imageSlides[i]
            if (imageSlide.imagePrompt) {
              console.log(`Generating image ${i + 1}/${parsedData.imageSlides.length}...`)
              const generatedImage = await generateImageFromPrompt(imageSlide.imagePrompt)
              if (generatedImage) {
                imageSlide.generatedImage = generatedImage
                console.log(`Image ${i + 1} generated successfully!`)
              } else {
                console.warn(`Failed to generate image ${i + 1}, slide will not include image`)
              }
            }
          }
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
      imageSlides: [
        {
          slideNumber: 1,
          imagePrompt: "A professional illustration of digital transformation and innovation, modern style, vibrant colors, no text",
          title: "Visualizing Success",
          subtitle: "Transform your content into engaging visual stories",
          background: {
            type: "gradient",
            color1: "#667eea",
            color2: "#764ba2"
          },
          titleStyle: {
            fontSize: 60,
            fontFamily: "Arial",
            color: "#ffffff",
            fontWeight: "bold"
          },
          subtitleStyle: {
            fontSize: 35,
            fontFamily: "Arial",
            color: "#f8f9fa",
            fontWeight: "normal"
          },
          accentColor: "#ffd700",
          layout: "centered"
        }
      ],
      infoSlides: [
        {
          slideNumber: 1,
          title: "Key Insights",
          slidePattern: "bulletPoints",
          bulletPoints: [
            "Your content will be broken down into key insights",
            "Each point will be clearly presented",
            "Optimized for LinkedIn engagement"
          ],
          paragraphs: [
            "This carousel generator transforms your content into engaging visual stories that capture attention and drive engagement on LinkedIn.",
            "Each slide is carefully crafted to maintain reader interest while delivering your message effectively."
          ],
          impactfulLine: "Transform your content into engaging visual stories that drive LinkedIn engagement.",
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
          bulletStyle: {
            fontSize: 35,
            fontFamily: "Arial",
            color: "#f8f9fa",
            fontWeight: "normal"
          },
          paragraphStyle: {
            fontSize: 28,
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
