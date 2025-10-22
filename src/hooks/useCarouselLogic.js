import { useCallback } from 'react'
import { generateCarouselSlides } from '../services/geminiService'

/**
 * Custom hook for carousel business logic
 * Separates business logic from UI components
 */
export const useCarouselLogic = (state, actions) => {
  const {
    textInput,
    carouselData,
    currentSlideIndex,
    customSlides,
    blankSlide
  } = state

  const {
    setCarouselData,
    setCurrentSlideIndex,
    setIsGenerating,
    addCustomSlide,
    setCustomSlides,
    setSelectedSlides
  } = actions

  // Generate carousel from text input
  const handleGenerate = useCallback(async () => {
    if (!textInput.trim()) return
    
    setIsGenerating(true)
    try {
      const generatedCarousel = await generateCarouselSlides(textInput)
      setCarouselData(generatedCarousel)
      setCurrentSlideIndex(0) // Start with header slide
    } catch (error) {
      console.error('Error generating carousel:', error)
      // Create a default error slide when Gemini fails
      const errorCarousel = {
        headerSlide: {
          title: "Oops! Something went wrong",
          subtitle: "We encountered an issue generating your carousel. Please try again or contact support.",
          background: {
            type: "gradient",
            color1: "#ff6b6b",
            color2: "#ee5a52"
          },
          titleStyle: {
            fontSize: 60,
            fontFamily: "Arial",
            color: "#ffffff",
            fontWeight: "bold"
          },
          subtitleStyle: {
            fontSize: 32,
            fontFamily: "Arial", 
            color: "#ffffff",
            fontWeight: "normal"
          },
          accentColor: "#ffffff"
        },
        infoSlides: [],
        endSlide: {
          title: "Try Again",
          subtitle: "Please check your content and try generating again.",
          ctaText: "Contact Support",
          background: {
            type: "gradient",
            color1: "#ff6b6b",
            color2: "#ee5a52"
          },
          titleStyle: {
            fontSize: 60,
            fontFamily: "Arial",
            color: "#ffffff",
            fontWeight: "bold"
          },
          subtitleStyle: {
            fontSize: 32,
            fontFamily: "Arial",
            color: "#ffffff", 
            fontWeight: "normal"
          },
          ctaStyle: {
            fontSize: 40,
            fontFamily: "Arial",
            color: "#ffffff",
            fontWeight: "bold"
          },
          accentColor: "#ffffff"
        }
      }
      setCarouselData(errorCarousel)
      setCurrentSlideIndex(0)
    } finally {
      setIsGenerating(false)
    }
  }, [textInput, setCarouselData, setCurrentSlideIndex, setIsGenerating])

  // Generate mock carousel for testing
  const handleGenerateMock = useCallback(() => {
    const mockCarousel = {
      headerSlide: {
        title: "This is a Mock Carousel",
        subtitle: "Generated for testing purposes",
        background: {
          type: "solid",
          color1: "#FDFBF4",
          color2: "#FDFBF4"
        },
        titleStyle: {
          fontSize: 120,
          fontFamily: "Poppins",
          color: "#000000",
          fontWeight: "bold"
        },
        subtitleStyle: {
          fontSize: 40,
          fontFamily: "Poppins",
          color: "#000000",
          fontWeight: "normal"
        },
        accentColor: "#000000"
      },
      imageSlides: [
        {
          slideNumber: 1,
          generatedImage: "https://picsum.photos/1280/960",
          title: "A Themed Image Slide",
          subtitle: "Visual break that still matches the story",
          background: {
            type: "solid",
            color1: "#0F0F10",
            color2: "#0F0F10"
          },
          titleStyle: { fontSize: 60, fontFamily: "Inter", color: "#fff4e2", fontWeight: "bold" },
          subtitleStyle: { fontSize: 28, fontFamily: "Inter", color: "#fff4e2", fontWeight: "normal" },
          accentColor: "#F4B400"
        }
      ],
      infoSlides: [
        {
          slideNumber: 1,
          title: "Mock Info Slide",
          slidePattern: "bulletPoints",
          bulletPoints: [
            "Define your core strengths",
            "Clarify your values",
            "Pick a clear audience"
          ],
          titleStyle: { fontSize: 80, fontFamily: "Inter", color: "#fff4e2", fontWeight: "bold" },
          bulletStyle: { fontSize: 30, fontFamily: "Inter", color: "#fff4e2", fontWeight: "normal" },
          paragraphStyle: { fontSize: 30, fontFamily: "Inter", color: "#fff4e2", fontWeight: "normal" },
          subheadingStyle: { fontSize: 32, fontFamily: "Inter", color: "#fff4e2", fontWeight: "bold" },
          textStyle: { fontSize: 20, fontFamily: "Inter", color: "#fff4e2", fontWeight: "normal" },
          accentColor: "#F4B400"
        }
      ],
      endSlide: {
        title: "Want more tips?",
        subtitle: "Follow us and share this post with others who might find it helpful!",
        ctaText: "@reallygreatsite.com",
        background: {
          type: "solid",
          color1: "#FDFBF4",
          color2: "#FDFBF4"
        },
        titleStyle: {
          fontSize: 80,
          fontFamily: "Poppins",
          color: "#000000",
          fontWeight: "bold"
        },
        subtitleStyle: {
          fontSize: 60,
          fontFamily: "Poppins",
          color: "#000000",
          fontWeight: "normal"
        },
        ctaStyle: {
          fontSize: 24,
          fontFamily: "Poppins",
          color: "#000000",
          fontWeight: "normal"
        },
        accentColor: "#000000"
      }
    }
    setCarouselData(mockCarousel)
    setCurrentSlideIndex(0)
  }, [setCarouselData, setCurrentSlideIndex])

  // Get current slide data
  const getCurrentSlide = useCallback(() => {
    if (!carouselData) {
      // If no carousel data, check if we have custom slides
      if (customSlides.length > 0 && currentSlideIndex < customSlides.length) {
        return customSlides[currentSlideIndex]
      }
      return blankSlide
    }
    
    // Header slide
    if (currentSlideIndex === 0) return carouselData.headerSlide
    
    // Calculate total slides and image slide positions
    const imageSlides = carouselData.imageSlides || []
    const infoSlidesCount = carouselData.infoSlides.length
    const imageSlidesCount = imageSlides.length
    const totalCarouselSlides = 2 + infoSlidesCount + imageSlidesCount
    
    // Check if current slide is a custom slide (after all carousel slides)
    if (currentSlideIndex >= totalCarouselSlides) {
      const customIndex = currentSlideIndex - totalCarouselSlides
      if (customIndex < customSlides.length) {
        return customSlides[customIndex]
      }
    }
    
    // Create a properly interleaved array of slides
    const allSlides = []
    
    // Create arrays of slide data with their types
    const infoSlideData = carouselData.infoSlides.map(slide => ({ type: 'info', data: slide }))
    const imageSlideData = imageSlides.map(slide => ({ type: 'image', data: slide }))
    
    // Interleave slides: alternate between info and image slides
    let infoIndex = 0
    let imageIndex = 0
    const maxSlides = Math.max(infoSlidesCount, imageSlidesCount)
    
    for (let i = 0; i < maxSlides; i++) {
      // Add info slide if available
      if (infoIndex < infoSlidesCount) {
        allSlides.push(infoSlideData[infoIndex])
        infoIndex++
      }
      
      // Add image slide if available
      if (imageIndex < imageSlidesCount) {
        allSlides.push(imageSlideData[imageIndex])
        imageIndex++
      }
    }
    
    // Find the current slide
    if (currentSlideIndex <= allSlides.length) {
      const slide = allSlides[currentSlideIndex - 1]
      if (slide) {
        return slide.data
      }
    }
    
    // End slide
    return carouselData.endSlide
  }, [carouselData, currentSlideIndex, customSlides, blankSlide])

  // Get total number of slides
  const getTotalSlides = useCallback(() => {
    if (!carouselData) return 1 + customSlides.length
    const imageSlides = carouselData.imageSlides || []
    const imageSlidesCount = imageSlides.length
    // Header + info slides + image slides + end slide + custom slides
    return 2 + carouselData.infoSlides.length + imageSlidesCount + customSlides.length
  }, [carouselData, customSlides])

  // Get slide type
  const getSlideType = useCallback(() => {
    if (!carouselData) return 'header'
    if (currentSlideIndex === 0) return 'header'
    if (currentSlideIndex === getTotalSlides() - 1) return 'end'
    
    // Use the same interleaving logic as getCurrentSlide
    const imageSlides = carouselData.imageSlides || []
    const infoSlidesCount = carouselData.infoSlides.length
    const imageSlidesCount = imageSlides.length
    
    // Create the same interleaved array
    const allSlides = []
    const infoSlideData = carouselData.infoSlides.map(slide => ({ type: 'info', data: slide }))
    const imageSlideData = imageSlides.map(slide => ({ type: 'image', data: slide }))
    
    let infoIndex = 0
    let imageIndex = 0
    const maxSlides = Math.max(infoSlidesCount, imageSlidesCount)
    
    for (let i = 0; i < maxSlides; i++) {
      if (infoIndex < infoSlidesCount) {
        allSlides.push(infoSlideData[infoIndex])
        infoIndex++
      }
      if (imageIndex < imageSlidesCount) {
        allSlides.push(imageSlideData[imageIndex])
        imageIndex++
      }
    }
    
    // Find the current slide type
    if (currentSlideIndex <= allSlides.length) {
      const slide = allSlides[currentSlideIndex - 1]
      if (slide) {
        return slide.type
      }
    }
    
    return 'info'
  }, [carouselData, currentSlideIndex, getTotalSlides])

  // Add blank slide
  const addBlankSlide = useCallback(() => {
    const newSlide = {
      ...blankSlide,
      title: `Blank Slide ${customSlides.length + 1}`,
      id: `custom-${Date.now()}`,
      bulletPoints: [
        "Add your content here",
        "Use bullet points for better engagement",
        "Customize as needed"
      ],
      bulletStyle: {
        fontSize: 35,
        fontFamily: "Arial",
        color: "#333333",
        fontWeight: "normal"
      }
    }
    
    // Add slide at current position + 1 (next slide)
    const newCustomSlides = [...customSlides]
    
    if (!carouselData) {
      // No carousel data, insert at current position + 1
      newCustomSlides.splice(currentSlideIndex + 1, 0, newSlide)
      setCustomSlides(newCustomSlides)
      setCurrentSlideIndex(currentSlideIndex + 1)
    } else {
      // Has carousel data, calculate where to insert
      const totalCarouselSlides = 2 + (carouselData.infoSlides?.length || 0) + (carouselData.imageSlides?.length || 0)
      
      if (currentSlideIndex < totalCarouselSlides) {
        // Insert after current carousel slide
        const insertIndex = currentSlideIndex - totalCarouselSlides + 1
        newCustomSlides.splice(insertIndex, 0, newSlide)
        setCustomSlides(newCustomSlides)
        setCurrentSlideIndex(currentSlideIndex + 1)
      } else {
        // Insert at current position + 1
        const insertIndex = currentSlideIndex - totalCarouselSlides + 1
        newCustomSlides.splice(insertIndex, 0, newSlide)
        setCustomSlides(newCustomSlides)
        setCurrentSlideIndex(currentSlideIndex + 1)
      }
    }
  }, [blankSlide, customSlides, carouselData, currentSlideIndex, setCustomSlides, setCurrentSlideIndex])

  return {
    handleGenerate,
    handleGenerateMock,
    getCurrentSlide,
    getTotalSlides,
    getSlideType,
    addBlankSlide
  }
}
