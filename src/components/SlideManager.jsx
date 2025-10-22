import React from 'react'
import { Copy, GripVertical } from 'lucide-react'

/**
 * SlideManager Component
 * Handles slide thumbnails and management
 */
const SlideManager = ({
  totalSlides,
  currentSlideIndex,
  carouselData,
  customSlides,
  selectedSlides,
  draggedSlide,
  dragOverIndex,
  onSlideClick,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onAddBlankSlide,
  onDuplicateSlide,
  onDeleteSlide,
  onToggleSelection,
  onSelectAll,
  onClearSelection,
  onDeleteSelected
}) => {
  if (!carouselData && customSlides.length === 0) {
    return null
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Thumbnails</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={onAddBlankSlide}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            + Add Blank
          </button>
          <button
            onClick={() => onDuplicateSlide(currentSlideIndex)}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center space-x-1"
          >
            <Copy className="h-3 w-3" />
            <span>Duplicate</span>
          </button>
          {selectedSlides.size > 0 && (
            <>
              <button
                onClick={onDeleteSelected}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Delete ({selectedSlides.size})
              </button>
              <button
                onClick={onClearSelection}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Clear
              </button>
            </>
          )}
          {totalSlides > 1 && (
            <button
              onClick={onSelectAll}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Select All
            </button>
          )}
        </div>
      </div>
      
      <div className="flex space-x-2 overflow-x-auto pb-2" onDragOver={(e) => e.preventDefault()}>
        {Array.from({ length: totalSlides }, (_, index) => {
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
              onDragStart={(e) => onDragStart(e, index)}
              onDragOver={(e) => onDragOver(e, index)}
              onDragLeave={onDragLeave}
              onDrop={(e) => onDrop(e, index)}
            >
              <button
                onClick={() => onSlideClick(index)}
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
                      onDuplicateSlide(index);
                    }}
                    className="w-5 h-5 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-xs text-white transition-all"
                    title="Copy slide"
                  >
                    <Copy className="h-2 w-2" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSlide(index);
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
                  onToggleSelection(index);
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
  )
}

export default SlideManager
