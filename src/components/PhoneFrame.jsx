import React from 'react'
import { Smartphone } from 'lucide-react'

const PhoneFrame = ({ photos = [], onPhotoSelect, selectedPhotoIndex = 0 }) => {
  if (!photos || photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-4 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
        <Smartphone className="h-8 w-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-500 text-center">
          No photos uploaded for phone frame
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Phone Frame Display */}
      <div className="relative bg-black rounded-[2.5rem] p-2 shadow-2xl">
        {/* iPhone-like bezel */}
        <div className="bg-gray-900 rounded-[2rem] p-1">
          {/* Screen area */}
          <div className="bg-white rounded-[1.5rem] overflow-hidden aspect-[9/19.5] relative">
            {photos[selectedPhotoIndex] && (
              <img
                src={photos[selectedPhotoIndex]}
                alt="Phone frame content"
                className="w-full h-full object-cover"
              />
            )}
          </div>
        </div>
        
        {/* Home indicator */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-white rounded-full opacity-60"></div>
      </div>

      {/* Photo selector */}
      {photos.length > 1 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-600">Select photo for this slide:</p>
          <div className="flex space-x-2 overflow-x-auto">
            {photos.map((photo, index) => (
              <button
                key={index}
                onClick={() => onPhotoSelect(index)}
                className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 ${
                  index === selectedPhotoIndex 
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
        </div>
      )}
    </div>
  )
}

export default PhoneFrame
