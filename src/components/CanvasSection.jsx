import React from 'react'
import { Wand2, Download } from 'lucide-react'
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
  return (
    <div className="lg:col-span-10 space-y-3">
      <div className="space-y-4">
        {/* Navigation Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Wand2 className="h-5 w-5 text-primary-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {!slideData ? 'Blank Canvas' : (currentSlideIndex === 0 ? 'Header Slide' : `Slide ${currentSlideIndex}`)}
            </h2>
          </div>
          
          {/* Navigation Controls */}
          {slideData && (
            <div className="flex items-center space-x-2">
              <button
                onClick={onPreviousSlide}
                disabled={currentSlideIndex === 0}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <button 
                onClick={onAddBlankSlide}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                + Add
              </button>
              <button
                onClick={onExportPDF}
                disabled={isExportingPDF}
                className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Download</span>
              </button>
              <button
                onClick={onNextSlide}
                disabled={currentSlideIndex === totalSlides - 1}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          )}
        </div>

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
  )
}

export default CanvasSection
