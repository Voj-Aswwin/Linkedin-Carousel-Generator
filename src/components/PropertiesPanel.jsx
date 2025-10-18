import React from 'react'
import { Palette, Trash2 } from 'lucide-react'

const PropertiesPanel = ({ 
  selectedObject, 
  onUpdateSelectedObject, 
  onDeleteSelected, 
  onApplyCharacterStyle,
  onToggleTextHighlight,
  onEnableTextEditing
}) => {
  if (!selectedObject) {
    return (
      <div className="card h-[calc(100vh-160px)] flex items-center justify-center">
        <div className="text-center text-gray-500">
          <Palette className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Properties</h3>
          <p className="text-sm">Select an object to edit its properties</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card h-[calc(100vh-160px)] overflow-y-auto">
      <div className="flex items-center justify-between mb-4 sticky top-0 bg-white z-10 pb-2">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Palette className="h-5 w-5 mr-2" />
          Properties
          {(selectedObject.type === 'text' || selectedObject.type === 'textbox') && (
            <div className="ml-2 flex items-center space-x-2">
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                Double-click to edit
              </span>
              <button
                onClick={() => onEnableTextEditing(selectedObject)}
                className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 transition-colors font-medium"
              >
                Edit Now
              </button>
            </div>
          )}
        </h3>
        <button
          onClick={onDeleteSelected}
          className="flex items-center space-x-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          <span>Delete</span>
        </button>
      </div>
      
      <div className="space-y-4">
        {(selectedObject.type === 'text' || selectedObject.type === 'textbox') && (
          <>

            {/* Unified Formatting Controls */}
            <div className="border-b pb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Text Formatting
              </label>
              <p className="text-sm text-gray-500 mb-3">
                {selectedObject.isEditing && selectedObject.selectionStart !== selectedObject.selectionEnd ? (
                  <span className="text-blue-600">✓ Will apply to selected text only</span>
                ) : (
                  <span className="text-gray-600">Will apply to entire text</span>
                )}
              </p>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => {
                    if (selectedObject.isEditing && selectedObject.selectionStart !== selectedObject.selectionEnd) {
                      onApplyCharacterStyle('bold')
                    } else {
                      // Apply to entire text - toggle bold for whole text
                      const currentWeight = selectedObject.fontWeight || 'normal'
                      onUpdateSelectedObject('fontWeight', currentWeight === 'bold' ? 'normal' : 'bold')
                    }
                  }}
                  className="px-4 py-2 text-sm font-bold bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  title="Bold (Toggle)"
                >
                  B
                </button>
                <button
                  onClick={() => {
                    if (selectedObject.isEditing && selectedObject.selectionStart !== selectedObject.selectionEnd) {
                      onApplyCharacterStyle('italic')
                    } else {
                      // Apply to entire text - toggle italic for whole text
                      const currentStyle = selectedObject.fontStyle || 'normal'
                      onUpdateSelectedObject('fontStyle', currentStyle === 'italic' ? 'normal' : 'italic')
                    }
                  }}
                  className="px-4 py-2 text-sm italic bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  title="Italic (Toggle)"
                >
                  I
                </button>
                <button
                  onClick={() => {
                    if (selectedObject.isEditing && selectedObject.selectionStart !== selectedObject.selectionEnd) {
                      onApplyCharacterStyle('underline')
                    } else {
                      // Apply to entire text - toggle underline for whole text
                      const currentUnderline = selectedObject.underline || false
                      onUpdateSelectedObject('underline', !currentUnderline)
                    }
                  }}
                  className="px-4 py-2 text-sm underline bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  title="Underline (Toggle)"
                >
                  U
                </button>
                <button
                  onClick={() => {
                    if (selectedObject.isEditing && selectedObject.selectionStart !== selectedObject.selectionEnd) {
                      onApplyCharacterStyle('linethrough')
                    } else {
                      // Apply to entire text - toggle strikethrough for whole text
                      const currentLinethrough = selectedObject.linethrough || false
                      onUpdateSelectedObject('linethrough', !currentLinethrough)
                    }
                  }}
                  className="px-4 py-2 text-sm line-through bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  title="Strikethrough (Toggle)"
                >
                  S
                </button>
              </div>
            </div>

            {/* Unified Font Size Control */}
            <div className="border-b pb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Font Size
              </label>
              <p className="text-sm text-gray-500 mb-3">
                {selectedObject.isEditing && selectedObject.selectionStart !== selectedObject.selectionEnd ? (
                  <span className="text-blue-600">✓ Will apply to selected text only</span>
                ) : (
                  <span className="text-gray-600">Will apply to entire text</span>
                )}
              </p>
              <select
                key={`fontSize-${selectedObject.fontSize || 24}`}
                value={selectedObject.fontSize || 24}
                onChange={(e) => {
                  const newSize = parseInt(e.target.value)
                  if (selectedObject.isEditing && selectedObject.selectionStart !== selectedObject.selectionEnd) {
                    // Apply to selected characters only
                    onApplyCharacterStyle('fontSize', newSize)
                  } else {
                    // Apply to entire text
                    onUpdateSelectedObject('fontSize', newSize)
                  }
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
              >
                <option value="12">12px</option>
                <option value="14">14px</option>
                <option value="16">16px</option>
                <option value="18">18px</option>
                <option value="20">20px</option>
                <option value="24">24px</option>
                <option value="28">28px</option>
                <option value="32">32px</option>
                <option value="36">36px</option>
                <option value="40">40px</option>
                <option value="48">48px</option>
                <option value="56">56px</option>
                <option value="64">64px</option>
                <option value="72">72px</option>
              </select>
            </div>

            {/* Global Text Properties */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font Family
                </label>
                <select
                  key={`fontFamily-${selectedObject.fontFamily || 'Arial'}`}
                  value={selectedObject.fontFamily || 'Arial'}
                  onChange={(e) => onUpdateSelectedObject('fontFamily', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                >
                  <option value="Arial">Arial</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Andon">Andon</option>
                </select>
              </div>
            </div>
          </>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Text Color
            </label>
            <p className="text-sm text-gray-500 mb-2">
              {selectedObject.isEditing && selectedObject.selectionStart !== selectedObject.selectionEnd ? (
                <span className="text-blue-600">✓ Will apply to selected text only</span>
              ) : (
                <span className="text-gray-600">Will apply to entire text</span>
              )}
            </p>
            <input
              key={`color-${selectedObject.fill || '#000000'}`}
              type="color"
              value={selectedObject.fill || '#000000'}
              onChange={(e) => {
                if (selectedObject.isEditing && selectedObject.selectionStart !== selectedObject.selectionEnd) {
                  // Apply to selected characters only
                  onApplyCharacterStyle('fill', e.target.value)
                } else {
                  // Apply to entire text
                  onUpdateSelectedObject('fill', e.target.value)
                }
              }}
              className="w-full h-10 border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Opacity: {Math.round((selectedObject.opacity || 1) * 100)}%
            </label>
            <input
              key={`opacity-${selectedObject.opacity || 1}`}
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={selectedObject.opacity || 1}
              onChange={(e) => onUpdateSelectedObject('opacity', parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
        
        {/* Highlight Controls */}
        <div className="border-t pt-4">
          <h5 className="text-lg font-medium text-gray-700 mb-3">Text Highlight</h5>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Highlight Color
                </label>
                <input
                  type="color"
                  value="#ffff00"
                  onChange={(e) => onToggleTextHighlight(selectedObject, e.target.value)}
                  className="w-full h-10 border border-gray-300 rounded"
                />
              </div>
              <div>
                <button
                  onClick={() => onToggleTextHighlight(selectedObject)}
                  className="w-full px-4 py-2 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
                >
                  Toggle Highlight
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Highlight Style
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={() => onToggleTextHighlight(selectedObject, '#ffff00')}
                  className="px-3 py-2 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
                >
                  Yellow
                </button>
                <button
                  onClick={() => onToggleTextHighlight(selectedObject, '#ff6b6b')}
                  className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                >
                  Red
                </button>
                <button
                  onClick={() => onToggleTextHighlight(selectedObject, '#4ecdc4')}
                  className="px-3 py-2 text-sm bg-teal-100 text-teal-700 rounded hover:bg-teal-200 transition-colors"
                >
                  Teal
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PropertiesPanel
