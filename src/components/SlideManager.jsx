import React from 'react'
import { Copy, GripVertical, Plus, Layers, Trash2, X } from 'lucide-react'

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
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Layers className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Slide Manager</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {totalSlides} {totalSlides === 1 ? 'slide' : 'slides'} total
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onAddBlankSlide}
              className="tool-button btn-success text-sm"
              title="Add blank slide"
            >
              <Plus className="h-4 w-4" />
              <span>Add Blank</span>
            </button>
            <button
              onClick={() => onDuplicateSlide(currentSlideIndex)}
              className="tool-button btn-secondary text-sm"
              title="Duplicate current slide"
            >
              <Copy className="h-4 w-4" />
              <span className="hidden sm:inline">Duplicate</span>
            </button>
            {selectedSlides.size > 0 && (
              <>
                <button
                  onClick={onDeleteSelected}
                  className="tool-button btn-danger text-sm"
                  title={`Delete ${selectedSlides.size} selected slide(s)`}
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete ({selectedSlides.size})</span>
                </button>
                <button
                  onClick={onClearSelection}
                  className="tool-button btn-secondary text-sm"
                  title="Clear selection"
                >
                  <X className="h-4 w-4" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              </>
            )}
            {totalSlides > 1 && selectedSlides.size === 0 && (
              <button
                onClick={onSelectAll}
                className="tool-button btn-secondary text-sm"
                title="Select all slides"
              >
                <span>Select All</span>
              </button>
            )}
          </div>
        </div>
        
        <div className="flex space-x-3 overflow-x-auto pb-3 custom-scrollbar" onDragOver={(e) => e.preventDefault()}>
          {Array.from({ length: totalSlides }, (_, index) => {
            let slideData = null;
            let isCustomSlide = false;
            
            if (!carouselData) {
              if (index < customSlides.length) {
                slideData = customSlides[index];
                isCustomSlide = true;
              } else {
                slideData = { title: `Slide ${index + 1}` };
              }
            } else {
              const imageSlides = carouselData.imageSlides || [];
              const infoSlidesCount = carouselData.infoSlides.length;
              const imageSlidesCount = imageSlides.length;
              const totalCarouselSlides = 2 + infoSlidesCount + imageSlidesCount;
              
              if (index === 0) {
                slideData = carouselData.headerSlide;
              } else if (index === totalCarouselSlides - 1) {
                slideData = carouselData.endSlide;
              } else if (index >= totalCarouselSlides) {
                const customIndex = index - totalCarouselSlides;
                slideData = customSlides[customIndex];
                isCustomSlide = true;
              } else {
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
            
            if (!slideData) {
              slideData = { title: `Slide ${index + 1}` };
            }
            
            const isSelected = selectedSlides.has(index);
            const isCurrent = index === currentSlideIndex;
            const isCustomSlideForDrag = !carouselData || index >= (2 + (carouselData.infoSlides?.length || 0) + (carouselData.imageSlides?.length || 0))
            
            return (
              <div 
                key={index} 
                className="flex-shrink-0 relative group"
                draggable={isCustomSlideForDrag}
                onDragStart={(e) => onDragStart(e, index)}
                onDragOver={(e) => onDragOver(e, index)}
                onDragLeave={onDragLeave}
                onDrop={(e) => onDrop(e, index)}
              >
                <button
                  onClick={() => onSlideClick(index)}
                  className={`relative w-28 h-20 rounded-xl border-2 overflow-hidden transition-all duration-200 ${
                    isCurrent 
                      ? 'border-primary-500 shadow-lg ring-2 ring-primary-200 scale-105' 
                      : isSelected
                      ? 'border-red-500 shadow-md ring-2 ring-red-200'
                      : dragOverIndex === index
                      ? 'border-yellow-500 shadow-lg ring-2 ring-yellow-200'
                      : 'border-gray-300 hover:border-gray-400 hover:shadow-md'
                  }`}
                  title={`${slideData.title || `Slide ${index + 1}`} - Click to view`}
                >
                  <div className={`w-full h-full flex flex-col items-center justify-center ${
                    isCustomSlide 
                      ? 'bg-gradient-to-br from-emerald-50 to-green-100' 
                      : 'bg-gradient-to-br from-blue-50 to-indigo-100'
                  }`}>
                    <div className="text-center p-2">
                      <div className="text-xs font-bold text-gray-800 truncate w-full mb-1">
                        {slideData.title?.substring(0, 15) || `Slide ${index + 1}`}
                      </div>
                      <div className="text-[10px] text-gray-600 font-medium">
                        #{index + 1}
                      </div>
                      {isCustomSlide && (
                        <div className="text-[10px] text-emerald-700 font-bold mt-0.5 bg-emerald-200 px-1.5 py-0.5 rounded">
                          Custom
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Current slide indicator */}
                  {isCurrent && (
                    <div className="absolute top-1 right-1 w-2 h-2 bg-primary-600 rounded-full ring-2 ring-white"></div>
                  )}
                </button>
                
                {/* Drag handle for custom slides */}
                {isCustomSlideForDrag && (
                  <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-4 h-8 bg-gray-400 hover:bg-gray-500 rounded cursor-move flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="h-3 w-3 text-white" />
                  </div>
                )}
                
                {/* Action buttons for custom slides */}
                {isCustomSlideForDrag && (
                  <div className="absolute -top-2 -right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateSlide(index);
                      }}
                      className="w-6 h-6 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white transition-all shadow-md"
                      title="Duplicate slide"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSlide(index);
                      }}
                      className="w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-all shadow-md"
                      title="Delete slide"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                
                {/* Selection checkbox */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelection(index);
                  }}
                  className={`absolute -top-2 -left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all shadow-md ${
                    isSelected
                      ? 'bg-red-500 border-red-500 text-white'
                      : 'bg-white border-gray-300 text-gray-400 hover:border-red-400 hover:bg-red-50'
                  }`}
                  title={isSelected ? 'Deselect' : 'Select'}
                >
                  {isSelected && <X className="h-3 w-3" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  )
}

export default SlideManager
