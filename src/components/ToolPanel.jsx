import React from 'react'
import { Palette, Type, Square, RotateCcw, Image, Upload, Trash2, Undo, Smartphone } from 'lucide-react'

const ToolPanel = ({ 
  onAddText, 
  onAddShape, 
  onImageUpload, 
  onAddPhoneFrame,
  onPhoneFramePhotoUpload,
  phoneFramePhotos,
  selectedPhonePhoto,
  onSetSelectedPhonePhoto,
  onClearPhonePhotos,
  onUndo,
  onRedo,
  onResetCanvas,
  undoHistory,
  redoHistory
}) => {
  return (
    <div className="space-y-2">
      {/* Undo/Redo Controls */}
      <div className="card">
        <h4 className="font-semibold mb-1 flex items-center text-sm">
          <Undo className="h-3 w-3 mr-1" />
          History
        </h4>
        <div className="flex space-x-1">
          <button
            onClick={onUndo}
            disabled={undoHistory.length === 0}
            className="flex items-center space-x-1 px-2 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Undo className="h-3 w-3" />
            <span>Undo</span>
          </button>
          <button
            onClick={onRedo}
            disabled={redoHistory.length === 0}
            className="flex items-center space-x-1 px-2 py-1.5 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Undo className="h-3 w-3 rotate-180" />
            <span>Redo</span>
          </button>
          <button
            onClick={onResetCanvas}
            className="flex items-center space-x-1 px-2 py-1.5 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Add Elements */}
      <div className="card">
        <h4 className="font-semibold mb-1 flex items-center text-sm">
          <Square className="h-3 w-3 mr-1" />
          Add Elements
        </h4>
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={onAddText}
            className="flex flex-col items-center space-y-1 px-1 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          >
            <Type className="h-3 w-3" />
            <span className="text-xs">Text</span>
          </button>
          <button
            onClick={() => onAddShape('rectangle')}
            className="flex flex-col items-center space-y-1 px-1 py-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
          >
            <Square className="h-3 w-3" />
            <span className="text-xs">Rect</span>
          </button>
          <button
            onClick={() => onAddShape('circle')}
            className="flex flex-col items-center space-y-1 px-1 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
          >
            <div className="h-3 w-3 rounded-full bg-green-600"></div>
            <span className="text-xs">Circle</span>
          </button>
          <label className="flex flex-col items-center space-y-1 px-1 py-2 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors cursor-pointer">
            <Upload className="h-3 w-3" />
            <span className="text-xs">Image</span>
            <input
              type="file"
              accept="image/*"
              onChange={onImageUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Phone Frame Photo Upload */}
      <div className="card">
        <h4 className="font-semibold mb-1 flex items-center text-sm">
          <Smartphone className="h-3 w-3 mr-1" />
          Phone Frame Photos
        </h4>
        <div className="space-y-1">
          <div className="grid grid-cols-2 gap-1">
            <label className="flex flex-col items-center space-y-1 px-1 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors cursor-pointer">
              <Upload className="h-3 w-3" />
              <span className="text-xs">Upload Photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={onPhoneFramePhotoUpload}
                className="hidden"
              />
            </label>
            <button
              onClick={onAddPhoneFrame}
              className="flex flex-col items-center space-y-1 px-1 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            >
              <Smartphone className="h-3 w-3" />
              <span className="text-xs">Add Phone</span>
            </button>
          </div>
          {phoneFramePhotos.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-gray-600">
                {phoneFramePhotos.length} photo(s) uploaded
              </p>
              <div className="flex space-x-2 overflow-x-auto">
                {phoneFramePhotos.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => onSetSelectedPhonePhoto(index)}
                    className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 ${
                      index === selectedPhonePhoto 
                        ? 'border-blue-500' 
                        : 'border-gray-300'
                    }`}
                  >
                    <img
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
              <button
                onClick={onClearPhonePhotos}
                className="text-xs text-red-600 hover:text-red-800"
              >
                Clear all photos
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}

export default ToolPanel

