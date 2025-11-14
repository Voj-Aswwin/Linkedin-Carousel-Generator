import React from 'react'
import { FileText, User, Image as ImageIcon, FileUp } from 'lucide-react'
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
    <div className="space-y-4">
      <div className="card card-hover">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-primary-100 rounded-lg">
            <FileText className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Content Input</h2>
            <p className="text-xs text-gray-500 mt-0.5">Enter your content to generate carousel</p>
          </div>
        </div>
        
        <div className="space-y-5">
          <div>
            <TextInput 
              value={textInput}
              onChange={onTextInputChange}
              placeholder="Paste your LinkedIn post, blog content, or any text you want to convert into a carousel..."
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {textInput.length.toLocaleString()} {textInput.length === 1 ? 'character' : 'characters'}
              </span>
              {textInput.length > 0 && (
                <button
                  onClick={() => onTextInputChange('')}
                  className="text-xs text-red-600 hover:text-red-700 font-medium"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div>
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                <User className="h-4 w-4 text-gray-500" />
                <span>LinkedIn Handle</span>
              </label>
              <input
                type="text"
                value={linkedinHandle}
                onChange={(e) => onLinkedinHandleChange(e.target.value)}
                placeholder="@yourhandle"
                className="input-field"
              />
              <p className="mt-1.5 text-xs text-gray-500">This will appear on your carousel slides</p>
            </div>

            <div>
              <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                <ImageIcon className="h-4 w-4 text-gray-500" />
                <span>Header Picture</span>
                <span className="text-xs font-normal text-gray-400">(Optional)</span>
              </label>
              <div className="relative">
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
                  className="hidden"
                  id="header-picture-input"
                />
                <label
                  htmlFor="header-picture-input"
                  className="flex items-center justify-center space-x-2 w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 transition-all duration-200"
                >
                  <FileUp className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600 font-medium">
                    {headerPicture ? 'Change Picture' : 'Upload Picture'}
                  </span>
                </label>
                {headerPicture && (
                  <div className="mt-2 relative">
                    <img
                      src={headerPicture}
                      alt="Header preview"
                      className="w-full h-20 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={() => onHeaderPictureChange(null)}
                      className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                      title="Remove picture"
                    >
                      <span className="text-xs">×</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 space-y-3">
            <div className="flex flex-col space-y-2">
              <GenerateMockButton onClick={onGenerateMock} />
              <GenerateButton 
                onClick={onGenerate}
                isLoading={isGenerating}
                disabled={!textInput.trim()}
              />
            </div>
            <p className="text-xs text-center text-gray-500">
              {isGenerating ? 'Generating your carousel...' : 'Click to generate your carousel slides'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CarouselGenerator
