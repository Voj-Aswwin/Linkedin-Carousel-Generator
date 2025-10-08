import React, { useState } from 'react'
import { Sparkles, FileText, Wand2, Download } from 'lucide-react'

function AppSimple() {
  const [textInput, setTextInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = () => {
    console.log('Generate clicked with text:', textInput)
    setIsGenerating(true)
    setTimeout(() => setIsGenerating(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Your LinkedIn Carousel</h2>
              </div>
              
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Paste your LinkedIn post, blog content, or any text you want to convert into a carousel..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                rows={6}
              />
              
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {textInput.length} characters
                </span>
                <button
                  onClick={handleGenerate}
                  disabled={!textInput.trim() || isGenerating}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? 'Generating...' : 'Generate Carousel'}
                </button>
              </div>
            </div>
          </div>

          {/* Middle Column - Canvas */}
          <div className="lg:col-span-10 space-y-3">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Wand2 className="h-5 w-5 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Canvas Preview</h2>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <div className="text-6xl text-gray-400 mb-4">📱</div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Canvas Area</h3>
                    <p className="text-gray-500">Your carousel slides will appear here</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Tools */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Tools & Elements</h3>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded">
                  Add Text
                </button>
                <button className="w-full text-left px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded">
                  Add Shape
                </button>
                <button className="w-full text-left px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded">
                  Upload Image
                </button>
              </div>
            </div>
          </div>

          {/* Properties Column */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Properties</h3>
              <p className="text-gray-500 text-sm">Select an object to edit its properties</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default AppSimple
