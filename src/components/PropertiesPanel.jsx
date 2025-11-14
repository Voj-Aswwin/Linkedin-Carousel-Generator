import React from 'react'
import { Palette, Trash2, Edit3, Bold, Italic, Underline, Strikethrough } from 'lucide-react'

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
      <div className="sidebar-panel h-[calc(100vh-140px)] flex items-center justify-center">
        <div className="text-center text-gray-500 px-6">
          <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <Palette className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-700 mb-2">Properties</h3>
          <p className="text-sm text-gray-500">Select an object on the canvas to edit its properties</p>
        </div>
      </div>
    )
  }

  const isTextObject = selectedObject.type === 'text' || selectedObject.type === 'textbox'
  const hasSelection = selectedObject.isEditing && selectedObject.selectionStart !== selectedObject.selectionEnd

  return (
    <div className="sidebar-panel h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Palette className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Properties</h3>
              <p className="text-xs text-gray-500 mt-0.5 capitalize">{selectedObject.type || 'object'}</p>
            </div>
          </div>
          <button
            onClick={onDeleteSelected}
            className="flex items-center space-x-1.5 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors active:scale-95"
            title="Delete object (Delete key)"
          >
            <Trash2 className="h-4 w-4" />
            <span className="text-sm font-medium">Delete</span>
          </button>
        </div>
        
        <div className="space-y-6">
          {isTextObject && (
            <>
              {/* Text Editing Hint */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Edit3 className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-medium text-blue-900">
                      {hasSelection ? 'Selected text mode' : 'Double-click to edit text'}
                    </span>
                  </div>
                  <button
                    onClick={() => onEnableTextEditing(selectedObject)}
                    className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors font-medium"
                  >
                    Edit Now
                  </button>
                </div>
              </div>

              {/* Text Formatting Controls */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wider">
                  Text Formatting
                </label>
                {hasSelection && (
                  <p className="text-xs text-blue-600 mb-3 font-medium">
                    ✓ Applying to selected text only
                  </p>
                )}
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => {
                      if (hasSelection) {
                        onApplyCharacterStyle('bold')
                      } else {
                        const currentWeight = selectedObject.fontWeight || 'normal'
                        onUpdateSelectedObject('fontWeight', currentWeight === 'bold' ? 'normal' : 'bold')
                      }
                    }}
                    className={`flex flex-col items-center justify-center space-y-1 px-3 py-3 rounded-lg transition-all duration-200 active:scale-95 ${
                      (selectedObject.fontWeight === 'bold') 
                        ? 'bg-primary-100 text-primary-700 border-2 border-primary-300' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                    }`}
                    title="Bold (Ctrl+B)"
                  >
                    <Bold className="h-4 w-4" />
                    <span className="text-xs font-bold">B</span>
                  </button>
                  <button
                    onClick={() => {
                      if (hasSelection) {
                        onApplyCharacterStyle('italic')
                      } else {
                        const currentStyle = selectedObject.fontStyle || 'normal'
                        onUpdateSelectedObject('fontStyle', currentStyle === 'italic' ? 'normal' : 'italic')
                      }
                    }}
                    className={`flex flex-col items-center justify-center space-y-1 px-3 py-3 rounded-lg transition-all duration-200 active:scale-95 ${
                      (selectedObject.fontStyle === 'italic') 
                        ? 'bg-primary-100 text-primary-700 border-2 border-primary-300' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                    }`}
                    title="Italic (Ctrl+I)"
                  >
                    <Italic className="h-4 w-4" />
                    <span className="text-xs italic">I</span>
                  </button>
                  <button
                    onClick={() => {
                      if (hasSelection) {
                        onApplyCharacterStyle('underline')
                      } else {
                        const currentUnderline = selectedObject.underline || false
                        onUpdateSelectedObject('underline', !currentUnderline)
                      }
                    }}
                    className={`flex flex-col items-center justify-center space-y-1 px-3 py-3 rounded-lg transition-all duration-200 active:scale-95 ${
                      selectedObject.underline 
                        ? 'bg-primary-100 text-primary-700 border-2 border-primary-300' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                    }`}
                    title="Underline (Ctrl+U)"
                  >
                    <Underline className="h-4 w-4" />
                    <span className="text-xs underline">U</span>
                  </button>
                  <button
                    onClick={() => {
                      if (hasSelection) {
                        onApplyCharacterStyle('linethrough')
                      } else {
                        const currentLinethrough = selectedObject.linethrough || false
                        onUpdateSelectedObject('linethrough', !currentLinethrough)
                      }
                    }}
                    className={`flex flex-col items-center justify-center space-y-1 px-3 py-3 rounded-lg transition-all duration-200 active:scale-95 ${
                      selectedObject.linethrough 
                        ? 'bg-primary-100 text-primary-700 border-2 border-primary-300' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                    }`}
                    title="Strikethrough"
                  >
                    <Strikethrough className="h-4 w-4" />
                    <span className="text-xs line-through">S</span>
                  </button>
                </div>
              </div>

              {/* Font Size Control */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                  Font Size
                </label>
                {hasSelection && (
                  <p className="text-xs text-blue-600 mb-2 font-medium">
                    ✓ Applying to selected text only
                  </p>
                )}
                <select
                  key={`fontSize-${selectedObject.fontSize || 24}`}
                  value={selectedObject.fontSize || 24}
                  onChange={(e) => {
                    const newSize = parseInt(e.target.value)
                    if (hasSelection) {
                      onApplyCharacterStyle('fontSize', newSize)
                    } else {
                      onUpdateSelectedObject('fontSize', newSize)
                    }
                  }}
                  className="input-field"
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

              {/* Font Family */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                  Font Family
                </label>
                <select
                  key={`fontFamily-${selectedObject.fontFamily || 'Arial'}`}
                  value={selectedObject.fontFamily || 'Arial'}
                  onChange={(e) => onUpdateSelectedObject('fontFamily', e.target.value)}
                  className="input-field"
                >
                  <option value="Arial">Arial</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Andon">Andon</option>
                </select>
              </div>
            </>
          )}
          
          {/* Color and Opacity */}
          <div className="pt-4 border-t border-gray-200">
            <label className="block text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wider">
              Appearance
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  {isTextObject ? 'Text Color' : 'Fill Color'}
                </label>
                {hasSelection && (
                  <p className="text-xs text-blue-600 mb-1 font-medium">✓ Selected text</p>
                )}
                <div className="relative">
                  <input
                    key={`color-${selectedObject.fill || '#000000'}`}
                    type="color"
                    value={selectedObject.fill || '#000000'}
                    onChange={(e) => {
                      if (hasSelection) {
                        onApplyCharacterStyle('fill', e.target.value)
                      } else {
                        onUpdateSelectedObject('fill', e.target.value)
                      }
                    }}
                    className="w-full h-12 border-2 border-gray-300 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Opacity
                </label>
                <div className="space-y-2">
                  <input
                    key={`opacity-${selectedObject.opacity || 1}`}
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={selectedObject.opacity || 1}
                    onChange={(e) => onUpdateSelectedObject('opacity', parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="text-xs text-gray-600 text-center font-medium">
                    {Math.round((selectedObject.opacity || 1) * 100)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Highlight Controls - Only for text */}
          {isTextObject && (
            <div className="pt-4 border-t border-gray-200">
              <label className="block text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wider">
                Text Highlight
              </label>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Highlight Color
                    </label>
                    <input
                      type="color"
                      value="#ffff00"
                      onChange={(e) => onToggleTextHighlight(selectedObject, e.target.value)}
                      className="w-full h-12 border-2 border-gray-300 rounded-lg cursor-pointer"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => onToggleTextHighlight(selectedObject)}
                      className="w-full btn-secondary text-sm"
                    >
                      Toggle
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    Quick Colors
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => onToggleTextHighlight(selectedObject, '#ffff00')}
                      className="px-3 py-2 text-xs bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors font-medium border border-yellow-300"
                    >
                      Yellow
                    </button>
                    <button
                      onClick={() => onToggleTextHighlight(selectedObject, '#ff6b6b')}
                      className="px-3 py-2 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium border border-red-300"
                    >
                      Red
                    </button>
                    <button
                      onClick={() => onToggleTextHighlight(selectedObject, '#4ecdc4')}
                      className="px-3 py-2 text-xs bg-teal-100 text-teal-700 rounded-lg hover:bg-teal-200 transition-colors font-medium border border-teal-300"
                    >
                      Teal
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PropertiesPanel
