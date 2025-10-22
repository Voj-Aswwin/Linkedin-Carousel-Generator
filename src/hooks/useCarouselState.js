import { useState, useRef } from 'react'

/**
 * Custom hook for managing carousel state
 * Centralizes all carousel-related state and actions
 */
export const useCarouselState = () => {
  // Core carousel data
  const [textInput, setTextInput] = useState('')
  const [carouselData, setCarouselData] = useState(null)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [customSlides, setCustomSlides] = useState([])
  const [selectedSlides, setSelectedSlides] = useState(new Set())
  
  // UI state
  const [isGenerating, setIsGenerating] = useState(false)
  const [isExportingPDF, setIsExportingPDF] = useState(false)
  const [selectedObject, setSelectedObject] = useState(null)
  
  // History state
  const [undoHistory, setUndoHistory] = useState([])
  const [redoHistory, setRedoHistory] = useState([])
  
  // Phone frame state
  const [phoneFramePhotos, setPhoneFramePhotos] = useState([])
  const [selectedPhonePhoto, setSelectedPhonePhoto] = useState(0)
  
  // Drag and drop state
  const [draggedSlide, setDraggedSlide] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  
  // Slide persistence
  const [slideStates, setSlideStates] = useState({})
  const [headerPicture, setHeaderPicture] = useState(null)
  const [linkedinHandle, setLinkedinHandle] = useState('')
  
  // Refs
  const canvasEditorRef = useRef(null)

  // Default blank slide configuration
  const blankSlide = {
    title: "",
    subtitle: "",
    background: {
      type: "solid",
      color1: "#ffffff",
      color2: "#ffffff"
    },
    titleStyle: {
      fontSize: 48,
      fontFamily: "Arial",
      color: "#000000",
      fontWeight: "bold"
    },
    subtitleStyle: {
      fontSize: 24,
      fontFamily: "Arial",
      color: "#333333",
      fontWeight: "normal"
    },
    accentColor: "#F4B400"
  }

  // Actions
  const actions = {
    // Text input actions
    setTextInput,
    
    // Carousel data actions
    setCarouselData,
    setCurrentSlideIndex,
    
    // Custom slides actions
    setCustomSlides,
    addCustomSlide: (slide) => {
      setCustomSlides(prev => [...prev, slide])
    },
    updateCustomSlide: (index, slide) => {
      setCustomSlides(prev => prev.map((s, i) => i === index ? slide : s))
    },
    deleteCustomSlide: (index) => {
      setCustomSlides(prev => prev.filter((_, i) => i !== index))
    },
    
    // Selection actions
    setSelectedSlides,
    toggleSlideSelection: (index) => {
      setSelectedSlides(prev => {
        const newSet = new Set(prev)
        if (newSet.has(index)) {
          newSet.delete(index)
        } else {
          newSet.add(index)
        }
        return newSet
      })
    },
    clearSelection: () => setSelectedSlides(new Set()),
    selectAllSlides: (totalSlides) => {
      setSelectedSlides(new Set(Array.from({ length: totalSlides }, (_, i) => i)))
    },
    
    // UI state actions
    setIsGenerating,
    setIsExportingPDF,
    setSelectedObject,
    
    // History actions
    setUndoHistory,
    setRedoHistory,
    
    // Phone frame actions
    setPhoneFramePhotos,
    setSelectedPhonePhoto,
    
    // Drag and drop actions
    setDraggedSlide,
    setDragOverIndex,
    
    // Slide persistence actions
    setSlideStates,
    saveSlideState: (slideIndex, state) => {
      setSlideStates(prev => ({
        ...prev,
        [slideIndex]: state
      }))
    },
    
    // Other actions
    setHeaderPicture,
    setLinkedinHandle,
    
    // Utility actions
    resetCarousel: () => {
      setCarouselData(null)
      setCurrentSlideIndex(0)
      setCustomSlides([])
      setSelectedSlides(new Set())
      setSlideStates({})
    }
  }

  return {
    state: {
      textInput,
      carouselData,
      currentSlideIndex,
      customSlides,
      selectedSlides,
      isGenerating,
      isExportingPDF,
      selectedObject,
      undoHistory,
      redoHistory,
      phoneFramePhotos,
      selectedPhonePhoto,
      draggedSlide,
      dragOverIndex,
      slideStates,
      headerPicture,
      linkedinHandle,
      blankSlide
    },
    actions,
    refs: {
      canvasEditorRef
    }
  }
}
