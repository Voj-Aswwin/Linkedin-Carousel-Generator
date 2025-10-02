import React, { useState } from 'react'
import { Sparkles, FileText, Wand2, Download } from 'lucide-react'
import TextInput from './components/TextInput'
import GenerateButton from './components/GenerateButton'
import CanvasEditor from './components/CanvasEditor'
import { generateCarouselSlides } from './services/geminiService'
import { pdfExportService } from './services/pdfExportService'

function App() {
  const [textInput, setTextInput] = useState('')
  const [headerPicture, setHeaderPicture] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [carouselData, setCarouselData] = useState(null)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [isExportingPDF, setIsExportingPDF] = useState(false)
  const [usePhoneFrame, setUsePhoneFrame] = useState(false)
  const [phoneFramePhotos, setPhoneFramePhotos] = useState([])

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
    if (!carouselData) return null
    if (currentSlideIndex === 0) return carouselData.headerSlide
    if (currentSlideIndex === carouselData.infoSlides.length + 1) return carouselData.endSlide
    return carouselData.infoSlides[currentSlideIndex - 1]
  }

  const getTotalSlides = () => {
    if (!carouselData) return 0
    return 2 + carouselData.infoSlides.length // Header + info slides + end slide
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
      
      // Generate the PDF with all slides
      await pdfExportService.generateCarouselPDF(carouselData, headerPicture, usePhoneFrame, phoneFramePhotos)
      
      // Download the PDF
      pdfExportService.downloadPDF(filename)
      
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Left Column - Input Section */}
          <div className="space-y-6">
            <div className="card">
              <div className="flex items-center space-x-2 mb-4">
                <FileText className="h-5 w-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-gray-900">Input Your Content</h2>
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

              {/* Phone Frame Option */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="phone-frame"
                    checked={usePhoneFrame}
                    onChange={(e) => setUsePhoneFrame(e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="phone-frame" className="text-sm font-medium text-gray-700">
                    Include iPhone Frame
                  </label>
                </div>
                
                {usePhoneFrame && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Upload Photos for Phone Frame
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files)
                        const readers = files.map(file => {
                          return new Promise((resolve) => {
                            const reader = new FileReader()
                            reader.onload = (e) => resolve(e.target.result)
                            reader.readAsDataURL(file)
                          })
                        })
                        Promise.all(readers).then(results => {
                          setPhoneFramePhotos(prev => [...prev, ...results])
                        })
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    />
                    {phoneFramePhotos.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 mb-2">
                          {phoneFramePhotos.length} photo(s) uploaded
                        </p>
                        <button
                          onClick={() => setPhoneFramePhotos([])}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Clear all photos
                        </button>
                      </div>
                    )}
                  </div>
                )}
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

          {/* Right Column - Canvas Editor */}
          <div className="space-y-6">
            {carouselData ? (
              <div className="space-y-6">
                {/* Navigation Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Wand2 className="h-5 w-5 text-primary-600" />
                    <h2 className="text-xl font-semibold text-gray-900">
                      {currentSlideIndex === 0 ? 'Header Slide' : `Slide ${currentSlideIndex}`}
                    </h2>
                  </div>
                  
                  {/* Navigation Controls */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                      disabled={currentSlideIndex === 0}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ← Previous
                    </button>
                    <span className="text-sm text-gray-500">
                      {currentSlideIndex + 1} of {getTotalSlides()}
                    </span>
                    <button
                      onClick={() => setCurrentSlideIndex(Math.min(getTotalSlides() - 1, currentSlideIndex + 1))}
                      disabled={currentSlideIndex === getTotalSlides() - 1}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next →
                    </button>
                    
                    {/* PDF Export Button */}
                    <button
                      onClick={handleExportPDF}
                      disabled={isExportingPDF}
                      className="flex items-center space-x-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      <span>{isExportingPDF ? 'Exporting...' : 'Export PDF'}</span>
                    </button>
                  </div>
                </div>

                <CanvasEditor 
                  slideData={getCurrentSlide()} 
                  slideType={currentSlideIndex === 0 ? 'header' : (currentSlideIndex === carouselData.infoSlides.length + 1 ? 'end' : 'info')}
                  currentSlideIndex={currentSlideIndex}
                  totalSlides={getTotalSlides()}
                  headerPicture={headerPicture}
                  usePhoneFrame={usePhoneFrame}
                  phoneFramePhotos={phoneFramePhotos}
                  onSlideUpdate={(data) => console.log('Slide updated:', data)}
                />
              </div>
            ) : (
              <div className="card">
                <div className="flex items-center space-x-2 mb-4">
                  <Wand2 className="h-5 w-5 text-primary-600" />
                  <h2 className="text-lg font-semibold text-gray-900">AI Generation</h2>
                </div>
                
                <div className="bg-gray-100 rounded-lg p-8 text-center">
                  <div className="text-gray-400 mb-4">
                    <Wand2 className="h-12 w-12 mx-auto" />
                  </div>
                  <p className="text-gray-500">
                    AI will analyze your content and create a stunning header slide
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Enter text and click "Generate Carousel" to get started
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
