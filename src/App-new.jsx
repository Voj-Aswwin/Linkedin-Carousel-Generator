import React from 'react'
import { Sparkles } from 'lucide-react'
import ErrorBoundary from './components/ErrorBoundary'
import CarouselGenerator from './components/CarouselGenerator'
import CanvasSection from './components/CanvasSection'
import SlideManager from './components/SlideManager'
import ToolPanel from './components/ToolPanel'
import PropertiesPanel from './components/PropertiesPanel'
import { useCarouselState } from './hooks/useCarouselState'
import { useCarouselLogic } from './hooks/useCarouselLogic'
import { pdfExportService } from './services/pdfExportService'

function App() {
  // Use custom hooks for state management
  const { state, actions, refs } = useCarouselState()
  const {
    handleGenerate,
    handleGenerateMock,
    getCurrentSlide,
    getTotalSlides,
    getSlideType,
    addBlankSlide
  } = useCarouselLogic(state, actions)

  // Destructure state for easier access
  const {
    textInput,
    carouselData,
    currentSlideIndex,
    customSlides,
    selectedSlides,
    isGenerating,
    isExportingPDF,
    selectedObject,
    undoHistory,
    redoHistory,
    phoneFramePhotos,
    selectedPhonePhoto,
    draggedSlide,
    dragOverIndex,
    slideStates,
    headerPicture,
    linkedinHandle
  } = state

  const {
    setTextInput,
    setCurrentSlideIndex,
    setSelectedSlides,
    setIsExportingPDF,
    setSelectedObject,
    setUndoHistory,
    setRedoHistory,
    setPhoneFramePhotos,
    setSelectedPhonePhoto,
    setDraggedSlide,
    setDragOverIndex,
    setHeaderPicture,
    setLinkedinHandle,
    saveSlideState,
    toggleSlideSelection,
    clearSelection,
    selectAllSlides
  } = actions

  const { canvasEditorRef } = refs

  // Save the current slide state immediately (used before navigation/export)
  const saveCurrentSlideStateNow = () => {
    const slideState = canvasEditorRef.current?.getCurrentSlideState?.()
    if (slideState) {
      saveSlideState(currentSlideIndex, slideState)
    }
  }

  // Navigation handlers
  const handlePreviousSlide = () => {
    saveCurrentSlideStateNow()
    setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))
  }

  const handleNextSlide = () => {
    saveCurrentSlideStateNow()
    setCurrentSlideIndex(Math.min(getTotalSlides() - 1, currentSlideIndex + 1))
  }

  const handleSlideClick = (index) => {
    saveCurrentSlideStateNow()
    setCurrentSlideIndex(index)
  }

  // Drag and drop handlers
  const handleDragStart = (e, index) => {
    setDraggedSlide(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', index.toString())
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e, dropIndex) => {
    e.preventDefault()
    
    const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'))
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedSlide(null)
      setDragOverIndex(null)
      return
    }

    // Only allow reordering of custom slides
    if (!carouselData) {
      // Reorder custom slides
      const newCustomSlides = [...customSlides]
      const draggedSlideData = newCustomSlides[draggedIndex]
      newCustomSlides.splice(draggedIndex, 1)
      newCustomSlides.splice(dropIndex, 0, draggedSlideData)
      // Note: This would need to be implemented in the actions
    } else {
      // For carousel data, only allow reordering custom slides
      const totalCarouselSlides = 2 + (carouselData.infoSlides?.length || 0) + (carouselData.imageSlides?.length || 0)
      
      if (draggedIndex >= totalCarouselSlides && dropIndex >= totalCarouselSlides) {
        const newCustomSlides = [...customSlides]
        const customDraggedIndex = draggedIndex - totalCarouselSlides
        const customDropIndex = dropIndex - totalCarouselSlides
        
        const draggedSlideData = newCustomSlides[customDraggedIndex]
        newCustomSlides.splice(customDraggedIndex, 1)
        newCustomSlides.splice(customDropIndex, 0, draggedSlideData)
        // Note: This would need to be implemented in the actions
      }
    }

    setDraggedSlide(null)
    setDragOverIndex(null)
  }

  // Slide management handlers
  const handleDuplicateSlide = (index) => {
    const currentSlide = getCurrentSlide()
    if (!currentSlide) return
    
    const duplicatedSlide = {
      ...currentSlide,
      title: `${currentSlide.title} (Copy)`,
      id: `custom-${Date.now()}`,
    }
    
    // Add duplicated slide at current position + 1
    const newCustomSlides = [...customSlides]
    const insertIndex = Math.max(0, currentSlideIndex - (carouselData ? (2 + (carouselData.infoSlides?.length || 0) + (carouselData.imageSlides?.length || 0)) : 0))
    newCustomSlides.splice(insertIndex, 0, duplicatedSlide)
    // Note: This would need to be implemented in the actions
    
    // Navigate to the duplicated slide
    setCurrentSlideIndex(currentSlideIndex + 1)
  }

  const handleDeleteSlide = (index) => {
    // Only allow deletion of custom slides
    if (!carouselData) {
      // No carousel data, all slides are custom
      const confirmed = window.confirm('Are you sure you want to delete this slide? This action cannot be undone.')
      if (!confirmed) return
      
      const newCustomSlides = customSlides.filter((_, i) => i !== index)
      // Note: This would need to be implemented in the actions
      
      // Adjust current slide index
      if (currentSlideIndex >= index) {
        setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))
      }
    } else {
      // Has carousel data, check if it's a custom slide
      const totalCarouselSlides = 2 + (carouselData.infoSlides?.length || 0) + (carouselData.imageSlides?.length || 0)
      
      if (index >= totalCarouselSlides) {
        const confirmed = window.confirm('Are you sure you want to delete this slide? This action cannot be undone.')
        if (!confirmed) return
        
        const customIndex = index - totalCarouselSlides
        const newCustomSlides = customSlides.filter((_, i) => i !== customIndex)
        // Note: This would need to be implemented in the actions
        
        // Adjust current slide index
        if (currentSlideIndex >= index) {
          setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))
        }
      } else {
        alert('You can only delete custom slides. Generated carousel slides cannot be deleted.')
      }
    }
  }

  const handleDeleteSelectedSlides = () => {
    if (selectedSlides.size === 0) return
    
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedSlides.size} slide(s)? This action cannot be undone.`
    )
    
    if (!confirmed) return
    
    const slidesToDelete = Array.from(selectedSlides)
    
    // Only allow deletion of custom slides (not generated carousel slides)
    const customSlideIndices = slidesToDelete.filter(index => {
      if (!carouselData) return true // If no carousel data, all slides are custom
      
      const imageSlides = carouselData.imageSlides || []
      const imageSlidesCount = imageSlides.length
      const totalCarouselSlides = 2 + carouselData.infoSlides.length + imageSlidesCount
      
      return index >= totalCarouselSlides
    })
    
    if (customSlideIndices.length === 0) {
      alert('You can only delete custom slides. Generated carousel slides cannot be deleted.')
      return
    }
    
    // Convert to custom slide indices
    const customIndices = customSlideIndices.map(index => {
      if (!carouselData) return index
      
      const imageSlides = carouselData.imageSlides || []
      const imageSlidesCount = imageSlides.length
      const totalCarouselSlides = 2 + carouselData.infoSlides.length + imageSlidesCount
      
      return index - totalCarouselSlides
    })
    
    const newCustomSlides = customSlides.filter((_, index) => !customIndices.includes(index))
    // Note: This would need to be implemented in the actions
    setSelectedSlides(new Set())
    
    // Adjust current slide index if needed
    if (currentSlideIndex >= getTotalSlides() - customSlideIndices.length) {
      setCurrentSlideIndex(Math.max(0, getTotalSlides() - customSlideIndices.length - 1))
    }
  }

  // Handle slide updates and save state
  const handleSlideUpdate = (data) => {
    if (data.slideState) {
      const indexToSave = Number.isInteger(data.slideIndex) ? data.slideIndex : currentSlideIndex
      saveSlideState(indexToSave, data.slideState)
    }
  }

  const handleExportPDF = async () => {
    if (!carouselData) return
    
    setIsExportingPDF(true)
    try {
      // Ensure current slide changes are saved
      saveCurrentSlideStateNow()

      // Reset the PDF service
      pdfExportService.reset()
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
      const filename = `linkedin-carousel-${timestamp}.pdf`
      
      console.log('Starting PDF generation...')
      
      // Export entire carousel as PDF using saved states
      await pdfExportService.generateCarouselPDF(carouselData, headerPicture, { savedStates: slideStates, brandText: linkedinHandle })
      pdfExportService.downloadPDF(filename)
      
      console.log('PDF exported successfully!')
    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('Failed to export PDF. Please try again.')
    } finally {
      setIsExportingPDF(false)
    }
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center space-x-3">
              <div className="bg-primary-600 p-2 rounded-lg">
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
            {/* Left Column - Carousel Generator */}
            <CarouselGenerator
              textInput={textInput}
              onTextInputChange={setTextInput}
              onGenerate={handleGenerate}
              onGenerateMock={handleGenerateMock}
              isGenerating={isGenerating}
              linkedinHandle={linkedinHandle}
              onLinkedinHandleChange={setLinkedinHandle}
              headerPicture={headerPicture}
              onHeaderPictureChange={setHeaderPicture}
            />

            {/* Middle Column - Canvas */}
            <CanvasSection
              slideData={getCurrentSlide()}
              slideType={getSlideType()}
              currentSlideIndex={currentSlideIndex}
              totalSlides={getTotalSlides()}
              headerPicture={headerPicture}
              linkedinHandle={linkedinHandle}
              onSlideUpdate={handleSlideUpdate}
              onSelectedObjectChange={setSelectedObject}
              onUndoHistoryChange={setUndoHistory}
              onRedoHistoryChange={setRedoHistory}
              onPhoneFramePhotosChange={setPhoneFramePhotos}
              onSelectedPhonePhotoChange={setSelectedPhonePhoto}
              savedStates={slideStates}
              onAddBlankSlide={addBlankSlide}
              onExportPDF={handleExportPDF}
              isExportingPDF={isExportingPDF}
              onPreviousSlide={handlePreviousSlide}
              onNextSlide={handleNextSlide}
              canvasEditorRef={canvasEditorRef}
            />

            {/* Right Column - Tool Panel */}
            <div className="lg:col-span-3">
              <div className="card h-[calc(100vh-160px)] overflow-y-auto">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 sticky top-0 bg-white z-10 pb-2">TOOLS & ELEMENTS</h3>
                <ToolPanel 
                  onAddText={() => {
                    canvasEditorRef.current?.addText()
                  }}
                  onAddShape={(type) => {
                    canvasEditorRef.current?.addShape(type)
                  }}
                  onImageUpload={(event) => {
                    canvasEditorRef.current?.handleImageUpload(event)
                  }}
                  onAddPhoneFrame={() => {
                    canvasEditorRef.current?.addPhoneFrame()
                  }}
                  onPhoneFramePhotoUpload={(event) => {
                    canvasEditorRef.current?.handlePhoneFramePhotoUpload(event)
                  }}
                  phoneFramePhotos={phoneFramePhotos}
                  selectedPhonePhoto={selectedPhonePhoto}
                  onSetSelectedPhonePhoto={setSelectedPhonePhoto}
                  onClearPhonePhotos={() => setPhoneFramePhotos([])}
                  onUndo={() => {
                    canvasEditorRef.current?.handleUndo()
                  }}
                  onRedo={() => {
                    canvasEditorRef.current?.handleRedo()
                  }}
                  onResetCanvas={() => {
                    canvasEditorRef.current?.resetCanvas()
                  }}
                  undoHistory={undoHistory}
                  redoHistory={redoHistory}
                />
              </div>
            </div>

            {/* Properties Column - Dedicated Properties Panel */}
            <div className="lg:col-span-4">
              <PropertiesPanel 
                selectedObject={selectedObject}
                onUpdateSelectedObject={(property, value) => {
                  canvasEditorRef.current?.updateSelectedObject(property, value)
                }}
                onDeleteSelected={() => {
                  canvasEditorRef.current?.handleDeleteSelected()
                }}
                onApplyCharacterStyle={(styleType, value) => {
                  canvasEditorRef.current?.applyCharacterStyle(styleType, value)
                }}
                onToggleTextHighlight={(obj, color) => {
                  canvasEditorRef.current?.toggleTextHighlight(obj, color)
                }}
                onEnableTextEditing={(obj) => {
                  canvasEditorRef.current?.enableTextEditing(obj)
                }}
              />
            </div>
          </div>

          {/* Slide Manager - Always show when there are slides or custom slides */}
          {(carouselData || customSlides.length > 0) && (
            <SlideManager
              totalSlides={getTotalSlides()}
              currentSlideIndex={currentSlideIndex}
              carouselData={carouselData}
              customSlides={customSlides}
              selectedSlides={selectedSlides}
              draggedSlide={draggedSlide}
              dragOverIndex={dragOverIndex}
              onSlideClick={handleSlideClick}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onAddBlankSlide={addBlankSlide}
              onDuplicateSlide={handleDuplicateSlide}
              onDeleteSlide={handleDeleteSlide}
              onToggleSelection={toggleSlideSelection}
              onSelectAll={() => selectAllSlides(getTotalSlides())}
              onClearSelection={clearSelection}
              onDeleteSelected={handleDeleteSelectedSlides}
            />
          )}
        </main>
      </div>
    </ErrorBoundary>
  )
}

export default App
