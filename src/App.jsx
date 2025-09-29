import React, { useState } from 'react'
import { Sparkles, FileText, Download, Wand2 } from 'lucide-react'
import TextInput from './components/TextInput'
import GenerateButton from './components/GenerateButton'
import CanvasEditor from './components/CanvasEditor'
import { generateCarouselSlides } from './services/geminiService'

function App() {
  const [textInput, setTextInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [carouselData, setCarouselData] = useState(null)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)

  const handleGenerate = async () => {
    if (!textInput.trim()) return
    
    setIsGenerating(true)
    try {
      const generatedCarousel = await generateCarouselSlides(textInput)
      setCarouselData(generatedCarousel)
      setCurrentSlideIndex(0) // Start with header slide
      
      // Make carousel data available globally for PDF export
      window.carouselData = generatedCarousel
    } catch (error) {
      console.error('Error generating carousel:', error)
      alert('Error generating carousel. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const getCurrentSlide = () => {
    if (!carouselData) return null
    if (currentSlideIndex === 0) return carouselData.headerSlide
    return carouselData.infoSlides[currentSlideIndex - 1]
  }

  const getTotalSlides = () => {
    if (!carouselData) return 0
    return 1 + carouselData.infoSlides.length // Header + info slides
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
                  </div>
                </div>

                <CanvasEditor 
                  slideData={getCurrentSlide()} 
                  slideType={currentSlideIndex === 0 ? 'header' : 'info'}
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
