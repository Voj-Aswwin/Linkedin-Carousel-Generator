import React from 'react'
import { Wand2, Download, ChevronLeft, ChevronRight, Plus, FileDown } from 'lucide-react'
import CanvasEditor from './CanvasEditor'

/**
 * CanvasSection Component
 * Handles the canvas display and navigation
 */
const CanvasSection = ({
  slideData,
  slideType,
  currentSlideIndex,
  totalSlides,
  headerPicture,
  linkedinHandle,
  onSlideUpdate,
  onSelectedObjectChange,
  onUndoHistoryChange,
  onRedoHistoryChange,
  onPhoneFramePhotosChange,
  onSelectedPhonePhotoChange,
  savedStates,
  onAddBlankSlide,
  onExportPDF,
  isExportingPDF,
  onPreviousSlide,
  onNextSlide,
  canvasEditorRef
}) => {
  const getSlideTitle = () => {
    if (!slideData) return 'Blank Canvas'
    if (currentSlideIndex === 0) return 'Header Slide'
    return `Slide ${currentSlideIndex + 1}`
  }

  return (
    <div className="space-y-4">
      <div className="card">
        {/* Navigation Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Wand2 className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {getSlideTitle()}
              </h2>
              {totalSlides > 0 && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {currentSlideIndex + 1} of {totalSlides}
                </p>
              )}
            </div>
          </div>
          
          {/* Navigation Controls */}
          {totalSlides > 0 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={onPreviousSlide}
                disabled={currentSlideIndex === 0}
                className="tool-button btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                title="Previous slide (←)"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Previous</span>
              </button>
              
              <button 
                onClick={onAddBlankSlide}
                className="tool-button btn-success"
                title="Add blank slide"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Slide</span>
              </button>
              
              <button
                onClick={onExportPDF}
                disabled={isExportingPDF}
                className="tool-button btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export as PDF"
              >
                {isExportingPDF ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="hidden sm:inline">Exporting...</span>
                  </>
                ) : (
                  <>
                    <FileDown className="h-4 w-4" />
                    <span className="hidden sm:inline">Export PDF</span>
                  </>
                )}
              </button>
              
              <button
                onClick={onNextSlide}
                disabled={currentSlideIndex === totalSlides - 1}
                className="tool-button btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                title="Next slide (→)"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Canvas Editor */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <CanvasEditor 
            ref={canvasEditorRef}
            slideData={slideData} 
            slideType={slideType}
            currentSlideIndex={currentSlideIndex}
            totalSlides={totalSlides}
            headerPicture={headerPicture}
            linkedinHandle={linkedinHandle}
            onSlideUpdate={onSlideUpdate}
            onSelectedObjectChange={onSelectedObjectChange}
            onUndoHistoryChange={onUndoHistoryChange}
            onRedoHistoryChange={onRedoHistoryChange}
            onPhoneFramePhotosChange={onPhoneFramePhotosChange}
            onSelectedPhonePhotoChange={onSelectedPhonePhotoChange}
            savedStates={savedStates}
          />
        </div>
      </div>
    </div>
  )
}

export default CanvasSection
