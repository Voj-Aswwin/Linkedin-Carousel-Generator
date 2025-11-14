import React from 'react'
import { Type, Square, Circle, Image as ImageIcon, Upload, RotateCcw, Undo, Redo, Smartphone, X } from 'lucide-react'

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
    <div className="space-y-5">
      {/* History Controls */}
      <div>
        <h4 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wider">History</h4>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={onUndo}
            disabled={undoHistory.length === 0}
            className="flex flex-col items-center justify-center space-y-1 px-3 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="h-4 w-4" />
            <span className="text-xs font-medium">Undo</span>
          </button>
          <button
            onClick={onRedo}
            disabled={redoHistory.length === 0}
            className="flex flex-col items-center justify-center space-y-1 px-3 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="h-4 w-4" />
            <span className="text-xs font-medium">Redo</span>
          </button>
          <button
            onClick={onResetCanvas}
            className="flex flex-col items-center justify-center space-y-1 px-3 py-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-all duration-200 active:scale-95"
            title="Reset canvas"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="text-xs font-medium">Reset</span>
          </button>
        </div>
      </div>

      {/* Add Elements */}
      <div>
        <h4 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wider">Add Elements</h4>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onAddText}
            className="flex flex-col items-center justify-center space-y-2 px-4 py-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-all duration-200 active:scale-95 border border-blue-200"
            title="Add text element"
          >
            <Type className="h-5 w-5" />
            <span className="text-xs font-semibold">Text</span>
          </button>
          <button
            onClick={() => onAddShape('rectangle')}
            className="flex flex-col items-center justify-center space-y-2 px-4 py-4 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-all duration-200 active:scale-95 border border-purple-200"
            title="Add rectangle"
          >
            <Square className="h-5 w-5" />
            <span className="text-xs font-semibold">Rectangle</span>
          </button>
          <button
            onClick={() => onAddShape('circle')}
            className="flex flex-col items-center justify-center space-y-2 px-4 py-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-all duration-200 active:scale-95 border border-emerald-200"
            title="Add circle"
          >
            <Circle className="h-5 w-5" />
            <span className="text-xs font-semibold">Circle</span>
          </button>
          <label className="flex flex-col items-center justify-center space-y-2 px-4 py-4 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg transition-all duration-200 active:scale-95 border border-orange-200 cursor-pointer">
            <ImageIcon className="h-5 w-5" />
            <span className="text-xs font-semibold">Image</span>
            <input
              type="file"
              accept="image/*"
              onChange={onImageUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Phone Frame Photos */}
      <div>
        <h4 className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wider">Phone Frame</h4>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col items-center justify-center space-y-2 px-3 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-all duration-200 active:scale-95 border border-gray-200 cursor-pointer">
              <Upload className="h-4 w-4" />
              <span className="text-xs font-medium">Upload</span>
              <input
                type="file"
                accept="image/*"
                onChange={onPhoneFramePhotoUpload}
                className="hidden"
              />
            </label>
            <button
              onClick={onAddPhoneFrame}
              className="flex flex-col items-center justify-center space-y-2 px-3 py-3 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-lg transition-all duration-200 active:scale-95 border border-primary-200"
              title="Add phone frame"
            >
              <Smartphone className="h-4 w-4" />
              <span className="text-xs font-medium">Add Frame</span>
            </button>
          </div>
          
          {phoneFramePhotos.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-600 font-medium">
                  {phoneFramePhotos.length} {phoneFramePhotos.length === 1 ? 'photo' : 'photos'}
                </p>
                <button
                  onClick={onClearPhonePhotos}
                  className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center space-x-1"
                >
                  <X className="h-3 w-3" />
                  <span>Clear</span>
                </button>
              </div>
              <div className="flex space-x-2 overflow-x-auto pb-2 custom-scrollbar">
                {phoneFramePhotos.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => onSetSelectedPhonePhoto(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                      index === selectedPhonePhoto 
                        ? 'border-primary-500 ring-2 ring-primary-200 shadow-md' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    title={`Select photo ${index + 1}`}
                  >
                    <img
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ToolPanel

