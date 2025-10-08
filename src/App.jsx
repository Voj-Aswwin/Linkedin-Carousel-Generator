import React, { useState, useRef } from 'react'
import { Sparkles, FileText, Wand2, Download, Copy, GripVertical } from 'lucide-react'
import TextInput from './components/TextInput'
import GenerateButton from './components/GenerateButton'
import CanvasEditor from './components/CanvasEditor'
import ToolPanel from './components/ToolPanel'
import PropertiesPanel from './components/PropertiesPanel'
import { generateCarouselSlides } from './services/geminiService'
import { pdfExportService } from './services/pdfExportService'

function App() {
  // Default blank slide for initial state
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
    accentColor: "#007bff"
  }

  const [textInput, setTextInput] = useState('')
  const [headerPicture, setHeaderPicture] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [carouselData, setCarouselData] = useState(null)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [isExportingPDF, setIsExportingPDF] = useState(false)
  const [selectedObject, setSelectedObject] = useState(null)
  const [undoHistory, setUndoHistory] = useState([])
  const [redoHistory, setRedoHistory] = useState([])
  const [phoneFramePhotos, setPhoneFramePhotos] = useState([])
  const [selectedPhonePhoto, setSelectedPhonePhoto] = useState(0)
  const [customSlides, setCustomSlides] = useState([])
  const [selectedSlides, setSelectedSlides] = useState(new Set())
  const [draggedSlide, setDraggedSlide] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  const canvasEditorRef = useRef(null)

  const handleGenerate = async () => {
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
  }

  const getCurrentSlide = () => {
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
  }

  const getTotalSlides = () => {
    if (!carouselData) return 1 + customSlides.length
    const imageSlides = carouselData.imageSlides || []
    const imageSlidesCount = imageSlides.length
    // Header + info slides + image slides + end slide + custom slides
    return 2 + carouselData.infoSlides.length + imageSlidesCount + customSlides.length
  }
  
  const getSlideType = () => {
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
  }

  const addBlankSlide = () => {
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
  }

  const deleteSelectedSlides = () => {
    if (selectedSlides.size === 0) return
    
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedSlides.size} slide(s)? This action cannot be undone.`
    )
    
    if (!confirmed) return
    
    const slidesToDelete = Array.from(selectedSlides)
    
    // Only allow deletion of custom slides (not generated carousel slides)
    const customSlideIndices = slidesToDelete.filter(index => {
      if (!carouselData) return true // If no carousel data, all slides are custom
      
      const imageSlides = carouselData.imageSlides || []
      const imageSlidesCount = imageSlides.length
      const totalCarouselSlides = 2 + carouselData.infoSlides.length + imageSlidesCount
      
      return index >= totalCarouselSlides
    })
    
    if (customSlideIndices.length === 0) {
      alert('You can only delete custom slides. Generated carousel slides cannot be deleted.')
      return
    }
    
    // Convert to custom slide indices
    const customIndices = customSlideIndices.map(index => {
      if (!carouselData) return index
      
      const imageSlides = carouselData.imageSlides || []
      const imageSlidesCount = imageSlides.length
      const totalCarouselSlides = 2 + carouselData.infoSlides.length + imageSlidesCount
      
      return index - totalCarouselSlides
    })
    
    const newCustomSlides = customSlides.filter((_, index) => !customIndices.includes(index))
    setCustomSlides(newCustomSlides)
    setSelectedSlides(new Set())
    
    // Adjust current slide index if needed
    if (currentSlideIndex >= getTotalSlides() - customSlideIndices.length) {
      setCurrentSlideIndex(Math.max(0, getTotalSlides() - customSlideIndices.length - 1))
    }
  }

  const toggleSlideSelection = (index) => {
    const newSelectedSlides = new Set(selectedSlides)
    if (newSelectedSlides.has(index)) {
      newSelectedSlides.delete(index)
    } else {
      newSelectedSlides.add(index)
    }
    setSelectedSlides(newSelectedSlides)
  }

  const selectAllSlides = () => {
    const allSlideIndices = Array.from({ length: getTotalSlides() }, (_, index) => index)
    setSelectedSlides(new Set(allSlideIndices))
  }

  const clearSelection = () => {
    setSelectedSlides(new Set())
  }

  const duplicateSlide = (index) => {
    const currentSlide = getCurrentSlide()
    if (!currentSlide) return
    
    const duplicatedSlide = {
      ...currentSlide,
      title: `${currentSlide.title} (Copy)`,
      id: `custom-${Date.now()}`,
    }
    
    // Add duplicated slide at current position + 1
    const newCustomSlides = [...customSlides]
    const insertIndex = Math.max(0, currentSlideIndex - (carouselData ? (2 + (carouselData.infoSlides?.length || 0) + (carouselData.imageSlides?.length || 0)) : 0))
    newCustomSlides.splice(insertIndex, 0, duplicatedSlide)
    setCustomSlides(newCustomSlides)
    
    // Navigate to the duplicated slide
    setCurrentSlideIndex(currentSlideIndex + 1)
  }

  const deleteSlide = (index) => {
    // Only allow deletion of custom slides
    if (!carouselData) {
      // No carousel data, all slides are custom
      const confirmed = window.confirm('Are you sure you want to delete this slide? This action cannot be undone.')
      if (!confirmed) return
      
      const newCustomSlides = customSlides.filter((_, i) => i !== index)
      setCustomSlides(newCustomSlides)
      
      // Adjust current slide index
      if (currentSlideIndex >= index) {
        setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))
      }
    } else {
      // Has carousel data, check if it's a custom slide
      const totalCarouselSlides = 2 + (carouselData.infoSlides?.length || 0) + (carouselData.imageSlides?.length || 0)
      
      if (index >= totalCarouselSlides) {
        const confirmed = window.confirm('Are you sure you want to delete this slide? This action cannot be undone.')
        if (!confirmed) return
        
        const customIndex = index - totalCarouselSlides
        const newCustomSlides = customSlides.filter((_, i) => i !== customIndex)
        setCustomSlides(newCustomSlides)
        
        // Adjust current slide index
        if (currentSlideIndex >= index) {
          setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))
        }
      } else {
        alert('You can only delete custom slides. Generated carousel slides cannot be deleted.')
      }
    }
  }

  const copySlide = (index) => {
    // Get the slide data for the specific index
    let slideToCopy = null
    
    if (!carouselData) {
      // No carousel data, get from custom slides
      if (index < customSlides.length) {
        slideToCopy = customSlides[index]
      }
    } else {
      // Has carousel data, determine which slide to copy
      const totalCarouselSlides = 2 + (carouselData.infoSlides?.length || 0) + (carouselData.imageSlides?.length || 0)
      
      if (index === 0) {
        slideToCopy = carouselData.headerSlide
      } else if (index === totalCarouselSlides - 1) {
        slideToCopy = carouselData.endSlide
      } else if (index >= totalCarouselSlides) {
        // Custom slide
        const customIndex = index - totalCarouselSlides
        slideToCopy = customSlides[customIndex]
      } else {
        // Carousel slide - determine if it's image or info
        const imageSlides = carouselData.imageSlides || []
        const infoSlidesCount = carouselData.infoSlides.length
        const imageSlidesCount = imageSlides.length
        const totalContentSlides = infoSlidesCount + imageSlidesCount
        const imageSlideInterval = Math.max(1, Math.floor(totalContentSlides / (imageSlidesCount + 1)))
        
        let currentInfoIndex = 0
        let currentImageIndex = 0
        
        for (let i = 0; i < index - 1; i++) {
          if (imageSlidesCount > 0 && currentImageIndex < imageSlidesCount && 
              (i % imageSlideInterval === 0 || currentInfoIndex >= infoSlidesCount)) {
            currentImageIndex++
          } else if (currentInfoIndex < infoSlidesCount) {
            currentInfoIndex++
          }
        }
        
        if (imageSlidesCount > 0 && currentImageIndex < imageSlidesCount && 
            ((index - 1) % imageSlideInterval === 0 || currentInfoIndex >= infoSlidesCount)) {
          slideToCopy = imageSlides[currentImageIndex]
        } else if (currentInfoIndex < infoSlidesCount) {
          slideToCopy = carouselData.infoSlides[currentInfoIndex]
        }
      }
    }
    
    if (!slideToCopy) return
    
    const copiedSlide = {
      ...slideToCopy,
      title: `${slideToCopy.title} (Copy)`,
      id: `custom-${Date.now()}`,
    }
    
    // Add copied slide at current position + 1
    const newCustomSlides = [...customSlides]
    const insertIndex = Math.max(0, currentSlideIndex - (carouselData ? (2 + (carouselData.infoSlides?.length || 0) + (carouselData.imageSlides?.length || 0)) : 0))
    newCustomSlides.splice(insertIndex, 0, copiedSlide)
    setCustomSlides(newCustomSlides)
    
    // Navigate to the copied slide
    setCurrentSlideIndex(currentSlideIndex + 1)
  }

  const handleDragStart = (e, index) => {
    setDraggedSlide(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', index.toString())
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e, dropIndex) => {
    e.preventDefault()
    
    const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'))
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedSlide(null)
      setDragOverIndex(null)
      return
    }

    // Only allow reordering of custom slides
    if (!carouselData) {
      // Reorder custom slides
      const newCustomSlides = [...customSlides]
      const draggedSlideData = newCustomSlides[draggedIndex]
      newCustomSlides.splice(draggedIndex, 1)
      newCustomSlides.splice(dropIndex, 0, draggedSlideData)
      setCustomSlides(newCustomSlides)
      
      // Update current slide index if needed
      if (currentSlideIndex === draggedIndex) {
        setCurrentSlideIndex(dropIndex)
      } else if (currentSlideIndex > draggedIndex && currentSlideIndex <= dropIndex) {
        setCurrentSlideIndex(currentSlideIndex - 1)
      } else if (currentSlideIndex < draggedIndex && currentSlideIndex >= dropIndex) {
        setCurrentSlideIndex(currentSlideIndex + 1)
      }
    } else {
      // For carousel data, only allow reordering custom slides
      const totalCarouselSlides = 2 + (carouselData.infoSlides?.length || 0) + (carouselData.imageSlides?.length || 0)
      
      if (draggedIndex >= totalCarouselSlides && dropIndex >= totalCarouselSlides) {
        const newCustomSlides = [...customSlides]
        const customDraggedIndex = draggedIndex - totalCarouselSlides
        const customDropIndex = dropIndex - totalCarouselSlides
        
        const draggedSlideData = newCustomSlides[customDraggedIndex]
        newCustomSlides.splice(customDraggedIndex, 1)
        newCustomSlides.splice(customDropIndex, 0, draggedSlideData)
        setCustomSlides(newCustomSlides)
        
        // Update current slide index if needed
        if (currentSlideIndex === draggedIndex) {
          setCurrentSlideIndex(dropIndex)
        } else if (currentSlideIndex > draggedIndex && currentSlideIndex <= dropIndex) {
          setCurrentSlideIndex(currentSlideIndex - 1)
        } else if (currentSlideIndex < draggedIndex && currentSlideIndex >= dropIndex) {
          setCurrentSlideIndex(currentSlideIndex + 1)
        }
      }
    }

    setDraggedSlide(null)
    setDragOverIndex(null)
  }

  const handleExportPDF = async () => {
    if (!carouselData) return
    
    setIsExportingPDF(true)
    try {
      // Reset the PDF service
      pdfExportService.reset()
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
      const filename = `linkedin-carousel-${timestamp}.pdf`
      
      console.log('Starting PDF generation...')
      
      // Get current canvas state from CanvasEditor
      const currentCanvasState = canvasEditorRef.current?.getCurrentCanvasState?.()
      
      if (currentCanvasState) {
        // Use current canvas state for PDF generation
        await pdfExportService.generatePDFFromCanvasState(currentCanvasState, filename)
      } else {
        // Fallback to original method
        await pdfExportService.generateCarouselPDF(carouselData, headerPicture)
        pdfExportService.downloadPDF(filename)
      }
      
      console.log('PDF exported successfully!')
    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('Failed to export PDF. Please try again.')
    } finally {
      setIsExportingPDF(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-600 p-2 rounded-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">LinkedIn Carousel Generator</h1>
              <p className="text-gray-600">Transform your text posts into engaging carousel slides</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-2 sm:px-4 lg:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-20 gap-4">
          {/* Left Column - User Input Panel */}
          <div className="lg:col-span-3 space-y-3">
            <div className="card">
              <div className="flex items-center space-x-2 mb-3">
                <FileText className="h-5 w-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-gray-900">Your LinkedIn Carousel</h2>
              </div>
              
              {/* Tabs */}
              <div className="flex space-x-1 mb-3">
                <button className="px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg">
                  Configuration
                </button>
                <button className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">
                  Current Slide
                </button>
              </div>
              
              <TextInput 
                value={textInput}
                onChange={setTextInput}
                placeholder="Paste your LinkedIn post, blog content, or any text you want to convert into a carousel..."
              />
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Header Slide Picture (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onload = (e) => setHeaderPicture(e.target.result)
                      reader.readAsDataURL(file)
                    }
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
              </div>

              
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {textInput.length} characters
                </span>
                <GenerateButton 
                  onClick={handleGenerate}
                  isLoading={isGenerating}
                  disabled={!textInput.trim()}
                />
              </div>

              {/* Color Palette */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Color Palette</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex space-x-1">
                    <div className="w-6 h-6 bg-blue-500 rounded"></div>
                    <div className="w-6 h-6 bg-purple-500 rounded"></div>
                  </div>
                  <div className="flex space-x-1">
                    <div className="w-6 h-6 bg-pink-500 rounded"></div>
                    <div className="w-6 h-6 bg-purple-800 rounded"></div>
                  </div>
                  <div className="flex space-x-1">
                    <div className="w-6 h-6 bg-green-600 rounded"></div>
                    <div className="w-6 h-6 bg-green-300 rounded"></div>
                  </div>
                  <div className="flex space-x-1">
                    <div className="w-6 h-6 bg-orange-500 rounded"></div>
                    <div className="w-6 h-6 bg-red-500 rounded"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Features Preview - Show when no carouselData */}
            {!carouselData && (
              <div className="space-y-6">
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">What You'll Get</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                      <span className="text-gray-700">AI-generated header slide based on your content</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                      <span className="text-gray-700">Professional LinkedIn-optimized designs</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                      <span className="text-gray-700">Editable canvas with drag-and-drop interface</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                      <span className="text-gray-700">Export as high-quality images</span>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Tips</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>• Keep your text concise for better carousel generation</p>
                    <p>• Include key points or statistics for data slides</p>
                    <p>• Use clear headings to create better slide breaks</p>
                    <p>• The AI will automatically format your content</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Middle Column - Canvas */}
          <div className="lg:col-span-10 space-y-3">
            <div className="space-y-4">
              {/* Navigation Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Wand2 className="h-5 w-5 text-primary-600" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    {!carouselData ? 'Blank Canvas' : (currentSlideIndex === 0 ? 'Header Slide' : `Slide ${currentSlideIndex}`)}
                  </h2>
                </div>
                
                {/* Navigation Controls */}
                {carouselData && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                      disabled={currentSlideIndex === 0}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ← Previous
                    </button>
                    <button 
                      onClick={addBlankSlide}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      + Add
                    </button>
                    <button
                      onClick={handleExportPDF}
                      disabled={isExportingPDF}
                      className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </button>
                    <button
                      onClick={() => setCurrentSlideIndex(Math.min(getTotalSlides() - 1, currentSlideIndex + 1))}
                      disabled={currentSlideIndex === getTotalSlides() - 1}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>

              <CanvasEditor 
                ref={canvasEditorRef}
                slideData={getCurrentSlide()} 
                slideType={getSlideType()}
                currentSlideIndex={currentSlideIndex}
                totalSlides={getTotalSlides()}
                headerPicture={headerPicture}
                onSlideUpdate={(data) => console.log('Slide updated:', data)}
                onSelectedObjectChange={setSelectedObject}
                onUndoHistoryChange={setUndoHistory}
                onRedoHistoryChange={setRedoHistory}
                onPhoneFramePhotosChange={setPhoneFramePhotos}
                onSelectedPhonePhotoChange={setSelectedPhonePhoto}
              />
            </div>

            {/* Thumbnails Section - Always show when there are slides or custom slides */}
            {(carouselData || customSlides.length > 0) && (
              <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Thumbnails</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={addBlankSlide}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    + Add Blank
                  </button>
                  <button
                    onClick={() => duplicateSlide(currentSlideIndex)}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center space-x-1"
                  >
                    <Copy className="h-3 w-3" />
                    <span>Duplicate</span>
                  </button>
                  {selectedSlides.size > 0 && (
                    <>
                      <button
                        onClick={deleteSelectedSlides}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      >
                        Delete ({selectedSlides.size})
                      </button>
                      <button
                        onClick={clearSelection}
                        className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                      >
                        Clear
                      </button>
                    </>
                  )}
                  {getTotalSlides() > 1 && (
                    <button
                      onClick={selectAllSlides}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Select All
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex space-x-2 overflow-x-auto pb-2" onDragOver={(e) => e.preventDefault()}>
                {Array.from({ length: getTotalSlides() }, (_, index) => {
                  let slideData = null;
                  let isCustomSlide = false;
                  
                  if (!carouselData) {
                    // No carousel data, check if it's a custom slide
                    if (index < customSlides.length) {
                      slideData = customSlides[index];
                      isCustomSlide = true;
                    } else {
                      slideData = { title: `Slide ${index + 1}` };
                    }
                  } else {
                    // Determine which slide data to use based on index
                    const imageSlides = carouselData.imageSlides || [];
                    const infoSlidesCount = carouselData.infoSlides.length;
                    const imageSlidesCount = imageSlides.length;
                    const totalCarouselSlides = 2 + infoSlidesCount + imageSlidesCount;
                    
                    if (index === 0) {
                      slideData = carouselData.headerSlide;
                    } else if (index === totalCarouselSlides - 1) {
                      slideData = carouselData.endSlide;
                    } else if (index >= totalCarouselSlides) {
                      // Custom slide
                      const customIndex = index - totalCarouselSlides;
                      slideData = customSlides[customIndex];
                      isCustomSlide = true;
                    } else {
                      // Use the same interleaving logic for thumbnails
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
                      
                      // Get the slide data for this index
                      if (index - 1 < allSlides.length) {
                        const slide = allSlides[index - 1]
                        if (slide) {
                          slideData = slide.data
                        }
                      } else {
                        slideData = carouselData.endSlide
                      }
                    }
                  }
                  
                  // Ensure we have valid slide data
                  if (!slideData) {
                    slideData = { title: `Slide ${index + 1}` };
                  }
                  
                  const isSelected = selectedSlides.has(index);
                  const isCurrent = index === currentSlideIndex;
                  
                  const isCustomSlideForDrag = !carouselData || index >= (2 + (carouselData.infoSlides?.length || 0) + (carouselData.imageSlides?.length || 0))
                  
                  return (
                    <div 
                      key={index} 
                      className="flex-shrink-0 relative"
                      draggable={isCustomSlideForDrag}
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, index)}
                    >
                      <button
                        onClick={() => setCurrentSlideIndex(index)}
                        className={`w-24 h-16 rounded-lg border-2 overflow-hidden transition-all ${
                          isCurrent 
                            ? 'border-blue-500 shadow-lg' 
                            : isSelected
                            ? 'border-red-500 shadow-md'
                            : dragOverIndex === index
                            ? 'border-yellow-500 shadow-lg'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className={`w-full h-full flex items-center justify-center ${
                          isCustomSlide 
                            ? 'bg-gradient-to-br from-green-100 to-emerald-100' 
                            : 'bg-gradient-to-br from-blue-100 to-indigo-100'
                        }`}>
                          <div className="text-center p-1">
                            <div className="text-xs font-semibold text-gray-800 truncate">
                              {slideData.title?.substring(0, 20) || `Slide ${index + 1}`}
                            </div>
                            {isCustomSlide && (
                              <div className="text-xs text-green-600 font-bold">Custom</div>
                            )}
                          </div>
                        </div>
                      </button>
                      
                      {/* Drag handle for custom slides */}
                      {isCustomSlideForDrag && (
                        <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-3 h-6 bg-gray-400 rounded cursor-move flex items-center justify-center">
                          <GripVertical className="h-2 w-2 text-white" />
                        </div>
                      )}
                      
                      {/* Action buttons for custom slides */}
                      {isCustomSlideForDrag && (
                        <div className="absolute -top-1 -right-1 flex space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copySlide(index);
                            }}
                            className="w-5 h-5 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-xs text-white transition-all"
                            title="Copy slide"
                          >
                            <Copy className="h-2 w-2" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSlide(index);
                            }}
                            className="w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-xs text-white transition-all"
                            title="Delete slide"
                          >
                            ×
                          </button>
                        </div>
                      )}
                      
                      {/* Selection checkbox */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSlideSelection(index);
                        }}
                        className={`absolute -top-1 -left-1 w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-red-500 border-red-500 text-white'
                            : 'bg-white border-gray-300 text-gray-400 hover:border-red-300'
                        }`}
                      >
                        {isSelected && '×'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
            )}
          </div>

          {/* Right Column - Tool Panel */}
          <div className="lg:col-span-3">
            <div className="card h-[calc(100vh-160px)] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 sticky top-0 bg-white z-10 pb-2">TOOLS & ELEMENTS</h3>
              <ToolPanel 
              onAddText={() => {
                canvasEditorRef.current?.addText()
              }}
              onAddShape={(type) => {
                canvasEditorRef.current?.addShape(type)
              }}
              onImageUpload={(event) => {
                canvasEditorRef.current?.handleImageUpload(event)
              }}
              onAddPhoneFrame={() => {
                canvasEditorRef.current?.addPhoneFrame()
              }}
              onPhoneFramePhotoUpload={(event) => {
                canvasEditorRef.current?.handlePhoneFramePhotoUpload(event)
              }}
              phoneFramePhotos={phoneFramePhotos}
              selectedPhonePhoto={selectedPhonePhoto}
              onSetSelectedPhonePhoto={setSelectedPhonePhoto}
              onClearPhonePhotos={() => setPhoneFramePhotos([])}
              onUndo={() => {
                canvasEditorRef.current?.handleUndo()
              }}
              onRedo={() => {
                canvasEditorRef.current?.handleRedo()
              }}
              onResetCanvas={() => {
                canvasEditorRef.current?.resetCanvas()
              }}
              undoHistory={undoHistory}
              redoHistory={redoHistory}
            />
            </div>
          </div>

          {/* Properties Column - Dedicated Properties Panel */}
          <div className="lg:col-span-4">
            <PropertiesPanel 
              selectedObject={selectedObject}
              onUpdateSelectedObject={(property, value) => {
                canvasEditorRef.current?.updateSelectedObject(property, value)
              }}
              onDeleteSelected={() => {
                canvasEditorRef.current?.handleDeleteSelected()
              }}
              onApplyCharacterStyle={(styleType, value) => {
                canvasEditorRef.current?.applyCharacterStyle(styleType, value)
              }}
              onToggleTextHighlight={(obj, color) => {
                canvasEditorRef.current?.toggleTextHighlight(obj, color)
              }}
              onEnableTextEditing={(obj) => {
                canvasEditorRef.current?.enableTextEditing(obj)
              }}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
