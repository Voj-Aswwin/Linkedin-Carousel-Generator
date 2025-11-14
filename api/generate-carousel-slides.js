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

    const { userContent } = req.body

    if (!userContent) {
      return res.status(400).json({ error: 'userContent is required' })
    }

    const genAI = new GoogleGenerativeAI(API_KEY)
    
    // Use Gemini 2.5 Flash with maximum token configuration
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        maxOutputTokens: 16384,
        temperature: 0.7,
        topP: 0.8,
        topK: 40
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
        "title": "Compelling headline (max 8 words, action-oriented). Use '\\n' for line breaks. Wrap words to be highlighted with asterisks (*word*).",
        "subtitle": "Supporting text (max 15 words)",
        "background": {
          "type": "gradient" | "solid" | "pattern",
          "color1": "#hexcolor",
          "color2": "#hexcolor",
          "pattern": "dots" | "lines" | "geometric" | "none"
        },
        "titleStyle": {
          "fontSize": 80-100,
          "fontFamily": "Arial" | "Helvetica" | "Georgia" | "Times New Roman" | "Inter" | "Poppins" | "Montserrat" | "Andon",
          "color": "#hexcolor",
          "fontWeight": "bold" | "normal"
        },
        "subtitleStyle": {
          "fontSize": 40-50,
          "fontFamily": "Arial" | "Helvetica" | "Georgia" | "Times New Roman" | "Inter" | "Poppins" | "Montserrat" | "Andon",
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
            "fontFamily": "Arial" | "Helvetica" | "Georgia" | "Times New Roman" | "Inter" | "Poppins" | "Montserrat" | "Andon",
            "color": "#hexcolor",
            "fontWeight": "bold" | "normal"
          },
          "subtitleStyle": {
            "fontSize": 30-40,
            "fontFamily": "Arial" | "Helvetica" | "Georgia" | "Times New Roman" | "Inter" | "Poppins" | "Montserrat" | "Andon",
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
            "fontFamily": "Arial" | "Helvetica" | "Georgia" | "Times New Roman" | "Inter" | "Poppins" | "Montserrat" | "Andon",
            "color": "#hexcolor",
            "fontWeight": "bold" | "normal"
          },
          "bulletStyle": {
            "fontSize": 30-40,
            "fontFamily": "Arial" | "Helvetica" | "Georgia" | "Times New Roman" | "Inter" | "Poppins" | "Montserrat" | "Andon",
            "color": "#hexcolor",
            "fontWeight": "normal"
          },
          "paragraphStyle": {
            "fontSize": 24-32,
            "fontFamily": "Arial" | "Helvetica" | "Georgia" | "Times New Roman" | "Inter" | "Poppins" | "Montserrat" | "Andon",
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
        "imagePrompt": "A professional, high-quality image that visually represents the call to action (e.g., a contact icon, a 'learn more' graphic). Keep it clean and simple.",
        "theme": "Use the same theme as the header slide (background, styles, layout)"
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
        
        // If end slide should mimic header, copy properties
        if (parsedData.endSlide && parsedData.endSlide.theme) {
          const header = parsedData.headerSlide
          parsedData.endSlide = {
            ...parsedData.endSlide,
            background: header.background,
            titleStyle: header.titleStyle,
            subtitleStyle: header.subtitleStyle,
            accentColor: header.accentColor,
            layout: header.layout,
            ctaStyle: {
              ...header.subtitleStyle,
              fontWeight: 'bold',
            }
          }
          delete parsedData.endSlide.theme
        }
        
        // THEME ENFORCEMENT: apply unified theme to info and image slides
        const THEME_BG = '#0F0F10'
        const THEME_TEXT = '#fff4e2'
        const THEME_ACCENT = '#F4B400'

        // Normalize image slides to theme
        if (parsedData.imageSlides && Array.isArray(parsedData.imageSlides)) {
          parsedData.imageSlides.forEach(slide => {
            slide.background = slide.background || { type: 'solid', color1: THEME_BG, color2: THEME_BG }
            slide.background.type = 'solid'
            slide.background.color1 = THEME_BG
            slide.background.color2 = THEME_BG
            slide.titleStyle = {
              fontSize: (slide.titleStyle?.fontSize) || 60,
              fontFamily: slide.titleStyle?.fontFamily || 'Inter',
              color: THEME_TEXT,
              fontWeight: slide.titleStyle?.fontWeight || 'bold'
            }
            slide.subtitleStyle = {
              fontSize: (slide.subtitleStyle?.fontSize) || 28,
              fontFamily: slide.subtitleStyle?.fontFamily || 'Inter',
              color: THEME_TEXT,
              fontWeight: slide.subtitleStyle?.fontWeight || 'normal'
            }
            slide.accentColor = THEME_ACCENT
            slide.layout = slide.layout || 'centered'
          })
        }

        // Normalize info slides to theme
        if (parsedData.infoSlides && Array.isArray(parsedData.infoSlides)) {
          parsedData.infoSlides.forEach(slide => {
            slide.background = slide.background || { type: 'solid', color1: THEME_BG, color2: THEME_BG }
            slide.background.type = 'solid'
            slide.background.color1 = THEME_BG
            slide.background.color2 = THEME_BG
            slide.titleStyle = {
              fontSize: (slide.titleStyle?.fontSize) || 80,
              fontFamily: slide.titleStyle?.fontFamily || 'Inter',
              color: THEME_TEXT,
              fontWeight: slide.titleStyle?.fontWeight || 'bold'
            }
            slide.bulletStyle = {
              fontSize: (slide.bulletStyle?.fontSize) || 30,
              fontFamily: slide.bulletStyle?.fontFamily || 'Inter',
              color: THEME_TEXT,
              fontWeight: slide.bulletStyle?.fontWeight || 'normal'
            }
            slide.paragraphStyle = {
              fontSize: (slide.paragraphStyle?.fontSize) || 24,
              fontFamily: slide.paragraphStyle?.fontFamily || 'Inter',
              color: THEME_TEXT,
              fontWeight: slide.paragraphStyle?.fontWeight || 'normal'
            }
            slide.subheadingStyle = {
              fontSize: (slide.subheadingStyle?.fontSize) || 32,
              fontFamily: slide.subheadingStyle?.fontFamily || 'Inter',
              color: THEME_TEXT,
              fontWeight: slide.subheadingStyle?.fontWeight || 'bold'
            }
            slide.textStyle = {
              fontSize: (slide.textStyle?.fontSize) || 20,
              fontFamily: slide.textStyle?.fontFamily || 'Inter',
              color: THEME_TEXT,
              fontWeight: slide.textStyle?.fontWeight || 'normal'
            }
            slide.accentColor = THEME_ACCENT
            slide.layout = slide.layout || 'left-aligned'
          })
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
    console.error('Error generating carousel slides:', error)
    return res.status(500).json({ 
      error: 'Failed to generate carousel slides',
      message: error.message 
    })
  }
}

