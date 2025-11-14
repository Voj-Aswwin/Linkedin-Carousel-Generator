// API base URL - use relative path for Vercel deployment
// In local development with Vite, use Vercel CLI: `vercel dev`
// This will make serverless functions available at /api/*
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// Check if we're in development mode
const isDevelopment = import.meta.env.DEV

export const generateHeaderSlide = async (userContent) => {
  try {
    const response = await fetch(`${API_BASE_URL}/generate-header-slide`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userContent }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      
      // Provide helpful error message for 404 in development
      if (response.status === 404 && isDevelopment) {
        throw new Error(
          'API route not found. For local development, please use Vercel CLI:\n' +
          '1. Install: npm i -g vercel\n' +
          '2. Run: vercel dev\n' +
          'This will start the serverless functions locally.\n' +
          `Original error: ${errorData.error || 'Route not found'}`
        )
      }
      
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
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
    const response = await fetch(`${API_BASE_URL}/generate-header-slide`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userContent, options }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      
      // Provide helpful error message for 404 in development
      if (response.status === 404 && isDevelopment) {
        throw new Error(
          'API route not found. For local development, please use Vercel CLI:\n' +
          '1. Install: npm i -g vercel\n' +
          '2. Run: vercel dev\n' +
          'This will start the serverless functions locally.\n' +
          `Original error: ${errorData.error || 'Route not found'}`
        )
      }
      
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
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
    const response = await fetch(`${API_BASE_URL}/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      
      // Provide helpful error message for 404 in development
      if (response.status === 404 && isDevelopment) {
        throw new Error(
          'API route not found. For local development, please use Vercel CLI:\n' +
          '1. Install: npm i -g vercel\n' +
          '2. Run: vercel dev\n' +
          'This will start the serverless functions locally.\n' +
          `Original error: ${errorData.error || 'Route not found'}`
        )
      }
      
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data.imageDataUrl || null
  } catch (error) {
    console.error('Error generating image:', error)
    return null
  }
}

export const generateCarouselSlides = async (userContent) => {
  try {
    // Call the API route to generate carousel slides
    const response = await fetch(`${API_BASE_URL}/generate-carousel-slides`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userContent }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      
      // Provide helpful error message for 404 in development
      if (response.status === 404 && isDevelopment) {
        throw new Error(
          'API route not found. For local development, please use Vercel CLI:\n' +
          '1. Install: npm i -g vercel\n' +
          '2. Run: vercel dev\n' +
          'This will start the serverless functions locally.\n' +
          `Original error: ${errorData.error || 'Route not found'}`
        )
      }
      
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    const parsedData = await response.json()
    
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

        // Generate image for end slide if prompt exists
        if (parsedData.endSlide && parsedData.endSlide.imagePrompt) {
          console.log('Generating image for end slide...')
          const generatedImage = await generateImageFromPrompt(parsedData.endSlide.imagePrompt)
          if (generatedImage) {
            parsedData.endSlide.generatedImage = generatedImage
            console.log('End slide image generated successfully!')
          } else {
            console.warn('Failed to generate image for end slide')
          }
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
