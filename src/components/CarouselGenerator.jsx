import React from 'react'
import { Sparkles, FileText } from 'lucide-react'
import TextInput from './TextInput'
import GenerateButton from './GenerateButton'
import GenerateMockButton from './GenerateMockButton'

/**
 * CarouselGenerator Component
 * Handles the input and generation of carousels
 */
const CarouselGenerator = ({
  textInput,
  onTextInputChange,
  onGenerate,
  onGenerateMock,
  isGenerating,
  linkedinHandle,
  onLinkedinHandleChange,
  headerPicture,
  onHeaderPictureChange
}) => {
  return (
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
          onChange={onTextInputChange}
          placeholder="Paste your LinkedIn post, blog content, or any text you want to convert into a carousel..."
        />
        
        <div className="space-y-2 mt-3">
          <label className="block text-sm font-medium text-gray-700">
            LinkedIn Handle
          </label>
          <input
            type="text"
            value={linkedinHandle}
            onChange={(e) => onLinkedinHandleChange(e.target.value)}
            placeholder="@yourhandle"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm p-2"
          />
        </div>

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
                reader.onload = (e) => onHeaderPictureChange(e.target.result)
                reader.readAsDataURL(file)
              }
            }}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
          />
        </div>

        <div className="mt-4 flex flex-col items-stretch space-y-2">
          <span className="text-sm text-gray-500">
            {textInput.length} characters
          </span>
          <div className="flex flex-col space-y-2 w-full">
            <GenerateMockButton onClick={onGenerateMock} />
            <GenerateButton 
              onClick={onGenerate}
              isLoading={isGenerating}
              disabled={!textInput.trim()}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default CarouselGenerator
