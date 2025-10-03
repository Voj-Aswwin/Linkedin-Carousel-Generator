import React, { useState, useRef } from 'react'
import { Sparkles, FileText, Wand2, Download } from 'lucide-react'
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
    if (!carouselData) return blankSlide
    
    // Header slide
    if (currentSlideIndex === 0) return carouselData.headerSlide
    
    // Calculate middle position for image slide
    const hasImageSlide = carouselData.imageSlide && carouselData.imageSlide.generatedImage
    const infoSlidesCount = carouselData.infoSlides.length
    const imageSlidePosition = hasImageSlide ? Math.ceil(infoSlidesCount / 2) + 1 : -1
    
    // Image slide (in the middle)
    if (hasImageSlide && currentSlideIndex === imageSlidePosition) {
      return carouselData.imageSlide
    }
    
    // Info slides (split around image slide)
    if (currentSlideIndex < imageSlidePosition || !hasImageSlide) {
      // Before image slide or no image slide
      const infoIndex = currentSlideIndex - 1
      if (infoIndex < infoSlidesCount) {
        return carouselData.infoSlides[infoIndex]
      }
    } else if (hasImageSlide && currentSlideIndex > imageSlidePosition) {
      // After image slide
      const infoIndex = currentSlideIndex - 2 // Account for header and image slide
      if (infoIndex < infoSlidesCount) {
        return carouselData.infoSlides[infoIndex]
      }
    }
    
    // End slide
    return carouselData.endSlide
  }

  const getTotalSlides = () => {
    if (!carouselData) return 1
    const hasImageSlide = carouselData.imageSlide && carouselData.imageSlide.generatedImage
    // Header + info slides + image slide (if exists) + end slide
    return 2 + carouselData.infoSlides.length + (hasImageSlide ? 1 : 0)
  }
  
  const getSlideType = () => {
    if (!carouselData) return 'header'
    if (currentSlideIndex === 0) return 'header'
    
    const hasImageSlide = carouselData.imageSlide && carouselData.imageSlide.generatedImage
    const infoSlidesCount = carouselData.infoSlides.length
    const imageSlidePosition = hasImageSlide ? Math.ceil(infoSlidesCount / 2) + 1 : -1
    
    if (hasImageSlide && currentSlideIndex === imageSlidePosition) return 'image'
    if (currentSlideIndex === getTotalSlides() - 1) return 'end'
    return 'info'
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
                    <button className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                      +
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

            {/* Thumbnails Section */}
            {carouselData && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Thumbnails</h3>
                <div className="flex space-x-2 overflow-x-auto pb-2">
                  {Array.from({ length: getTotalSlides() }, (_, index) => {
                    let slideData = null;
                    
                    // Determine which slide data to use based on index
                    if (index === 0) {
                      slideData = carouselData.headerSlide;
                    } else if (index === getTotalSlides() - 1) {
                      slideData = carouselData.endSlide;
                    } else {
                      // For middle slides, check if it's an image slide
                      const hasImageSlide = carouselData.imageSlide && carouselData.imageSlide.generatedImage;
                      const infoSlidesCount = carouselData.infoSlides.length;
                      const imageSlidePosition = hasImageSlide ? Math.ceil(infoSlidesCount / 2) + 1 : -1;
                      
                      if (hasImageSlide && index === imageSlidePosition) {
                        slideData = carouselData.imageSlide;
                      } else if (index < imageSlidePosition || !hasImageSlide) {
                        // Before image slide or no image slide
                        const infoIndex = index - 1;
                        slideData = carouselData.infoSlides[infoIndex] || carouselData.endSlide;
                      } else {
                        // After image slide
                        const infoIndex = index - 2; // Account for header and image slide
                        slideData = carouselData.infoSlides[infoIndex] || carouselData.endSlide;
                      }
                    }
                    
                    // Ensure we have valid slide data
                    if (!slideData) {
                      slideData = { title: `Slide ${index + 1}` };
                    }
                    
                    return (
                      <button
                        key={index}
                        onClick={() => setCurrentSlideIndex(index)}
                        className={`flex-shrink-0 w-24 h-16 rounded-lg border-2 overflow-hidden transition-all ${
                          index === currentSlideIndex 
                            ? 'border-blue-500 shadow-lg' 
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                          <div className="text-center p-1">
                            <div className="text-xs font-semibold text-gray-800 truncate">
                              {slideData.title?.substring(0, 20) || `Slide ${index + 1}`}
                            </div>
                          </div>
                        </div>
                      </button>
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
