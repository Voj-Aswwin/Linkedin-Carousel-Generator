import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import { fabric } from 'fabric'
import { Palette, Type, Square, RotateCcw, Image, Upload, Trash2, Undo, Smartphone } from 'lucide-react'
import PhoneFrame from './PhoneFrame'

const CanvasEditor = forwardRef(({
  slideData,
  slideType = 'header',
  currentSlideIndex = 0,
  totalSlides = 1,
  headerPicture = null,
  linkedinHandle = '',
  onSlideUpdate,
  onSelectedObjectChange,
  onUndoHistoryChange,
  onRedoHistoryChange,
  onPhoneFramePhotosChange,
  onSelectedPhonePhotoChange,
  savedStates = {}
}, ref) => {
  const canvasRef = useRef(null)
  const fabricCanvasRef = useRef(null)
  const [selectedObject, setSelectedObject] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [undoHistory, setUndoHistory] = useState([])
  const [redoHistory, setRedoHistory] = useState([])
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [isManualDelete, setIsManualDelete] = useState(false)
  const [phoneFramePhotos, setPhoneFramePhotos] = useState([])
  const [selectedPhonePhoto, setSelectedPhonePhoto] = useState(0)
  const [isTextEditing, setIsTextEditing] = useState(false)
  const [forceUpdate, setForceUpdate] = useState(0) // Counter to force re-renders
  const updateTimeoutRef = useRef(null)
  const previousSlideIndexRef = useRef(currentSlideIndex)
  const brandText = (linkedinHandle && linkedinHandle.trim()) ? linkedinHandle.trim() : 'Liceria.Co'


  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Check if we're in a text input or textarea (additional safety check)
      const isInInput = event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA'

      // Only handle delete/backspace for non-editing objects
      if ((event.key === 'Delete' || event.key === 'Backspace') && !isTextEditing && !isInInput) {
        if (selectedObject && fabricCanvasRef.current) {
          handleDeleteSelected()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedObject, isTextEditing])

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current) return

    // Calculate scaled dimensions to fit container
    const containerWidth = canvasRef.current.parentElement.clientWidth - 16 // Reduced padding
    const aspectRatio = 1440 / 1700 // Increased aspect ratio for 1440x1700
    let canvasWidth = containerWidth
    let canvasHeight = containerWidth / aspectRatio

    // If height is too large, scale by height instead
    const maxHeight = window.innerHeight * 0.8 // Increased to 80% of viewport height
    if (canvasHeight > maxHeight) {
      canvasHeight = maxHeight
      canvasWidth = canvasHeight * aspectRatio
    }

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true
    })

    fabricCanvasRef.current = canvas

    // Handle object selection
    canvas.on('selection:created', (e) => {
      setSelectedObject(e.selected[0])
      setTimeout(() => onSelectedObjectChange?.(e.selected[0]), 0)
    })

    canvas.on('selection:updated', (e) => {
      setSelectedObject(e.selected[0])
      setTimeout(() => onSelectedObjectChange?.(e.selected[0]), 0)
    })

    canvas.on('selection:cleared', () => {
      setSelectedObject(null)
      setTimeout(() => onSelectedObjectChange?.(null), 0)
    })

    // Track all actions for undo functionality
    canvas.on('object:added', () => {
      saveToHistory()
      handleObjectUpdate()
    })

    canvas.on('object:removed', () => {
      saveToHistory()
      handleObjectUpdate()
    })

    canvas.on('object:modified', () => {
      saveToHistory()
      handleObjectUpdate()
    })

    canvas.on('object:moving', (e) => {
      const obj = e.target

      // Save state before moving starts (if not already saved)
      if (!obj._movingStarted) {
        const state = JSON.stringify(canvas.toJSON(['highlightColor']))
        setUndoHistory(prev => {
          const newHistory = [...prev, state]
          return newHistory.slice(-10)
        })
        obj._movingStarted = true
      }

      // Handle text movement to update highlights
      if (obj.type === 'text' || obj.type === 'textbox') {
        updateTextHighlight(obj)
      } else if (obj.type === 'group') {
        // If it's a group, check if it contains text objects
        const groupObjects = obj.getObjects()
        const textObjects = groupObjects.filter(o => o.type === 'text' || o.type === 'textbox')
        textObjects.forEach(textObj => updateTextHighlight(textObj))
      }
    })

    canvas.on('object:moved', () => {
      // Save state after moving is complete
      saveToHistory()
      handleObjectUpdate()
    })

    canvas.on('object:scaling', (e) => {
      const obj = e.target

      // Save state before scaling starts (if not already saved)
      if (!obj._scalingStarted) {
        const state = JSON.stringify(canvas.toJSON(['highlightColor']))
        setUndoHistory(prev => {
          const newHistory = [...prev, state]
          return newHistory.slice(-10)
        })
        obj._scalingStarted = true
      }

      // Handle text scaling to update highlights
      if (obj.type === 'text' || obj.type === 'textbox') {
        updateTextHighlight(obj)
      } else if (obj.type === 'group') {
        // If it's a group, check if it contains text objects
        const groupObjects = obj.getObjects()
        const textObjects = groupObjects.filter(o => o.type === 'text' || o.type === 'textbox')
        textObjects.forEach(textObj => updateTextHighlight(textObj))
      }
    })

    canvas.on('object:scaled', () => {
      // Save state after scaling is complete
      saveToHistory()
      handleObjectUpdate()
    })

    canvas.on('object:rotating', (e) => {
      const obj = e.target

      // Save state before rotating starts (if not already saved)
      if (!obj._rotatingStarted) {
        const state = JSON.stringify(canvas.toJSON(['highlightColor']))
        setUndoHistory(prev => {
          const newHistory = [...prev, state]
          return newHistory.slice(-10)
        })
        obj._rotatingStarted = true
      }
    })

    canvas.on('object:rotated', () => {
      // Save state after rotating is complete
      saveToHistory()
      handleObjectUpdate()
    })

    canvas.on('text:changed', () => {
      // Save state when text content changes
      saveToHistory()
      handleObjectUpdate()
    })

    canvas.on('text:editing:exited', () => {
      // Save state when text editing is finished
      saveToHistory()
      handleObjectUpdate()
    })



    // Enable text editing on double-click for text objects (Fabric.js v5 compatible)
    canvas.on('mouse:dblclick', (e) => {
      const obj = e.target
      if (obj && (obj.type === 'text' || obj.type === 'textbox')) {
        console.log('Double-click detected on text object')
        enableTextEditing(obj)
      } else if (obj && obj.type === 'group') {
        // Handle double-click on group - find text object inside
        const textObj = obj.getObjects().find(o => o.type === 'text' || o.type === 'textbox')
        if (textObj) {
          console.log('Double-click detected on group with text object')
          enableTextEditing(textObj)
        }
      }
    })

    // Handle text selection and editing
    canvas.on('mouse:down', (e) => {
      const obj = e.target
      if (obj && (obj.type === 'text' || obj.type === 'textbox')) {
        // Ensure the text object is properly configured for selection and editing
        obj.set({
          selectable: true,
          editable: true,
          evented: true,
          lockMovementX: false,
          lockMovementY: false,
          lockRotation: false,
          lockScalingX: false,
          lockScalingY: false
        })

        // Set as active object for property panel
        canvas.setActiveObject(obj)
        canvas.renderAll()

        // Only enter editing mode on double-click, not single click
        // This allows for proper selection and property panel display
      }
    })


    // Handle text editing completion
    canvas.on('text:editing:exited', (e) => {
      const obj = e.target
      if (obj && (obj.type === 'text' || obj.type === 'textbox')) {
        updateTextHighlight(obj)
        handleObjectUpdate()
      }
    })

    // Alternative text editing events for Fabric.js v5
    canvas.on('text:changed', (e) => {
      const obj = e.target
      if (obj && (obj.type === 'text' || obj.type === 'textbox')) {
        updateTextHighlight(obj)
        handleObjectUpdate()
      }
    })

    // Handle when text editing is completed
    canvas.on('selection:created', (e) => {
      const obj = e.target
      if (obj && (obj.type === 'text' || obj.type === 'textbox') && obj.editing === false) {
        updateTextHighlight(obj)
        handleObjectUpdate()
      }
    })

    // Handle text editing events more comprehensively
    canvas.on('text:editing:entered', (e) => {
      console.log('Text editing entered')
      setIsTextEditing(true)
      const obj = e.target
      if (obj) {
        setForceUpdate(prev => prev + 1) // Force re-render to enable formatting buttons
      }
    })

    canvas.on('text:editing:exited', (e) => {
      console.log('Text editing exited')
      setIsTextEditing(false)
      const obj = e.target
      if (obj && (obj.type === 'text' || obj.type === 'textbox')) {
        updateTextHighlight(obj)
        handleObjectUpdate()
        setForceUpdate(prev => prev + 1) // Force re-render to disable formatting buttons
      }
    })

    // Handle text selection changes to update UI
    canvas.on('text:selection:changed', (e) => {
      const obj = e.target
      if (obj && obj.isEditing) {
        setForceUpdate(prev => prev + 1) // Update UI to reflect selection state
      }
    })


    // Handle text selection changes
    canvas.on('selection:changed', (e) => {
      const activeObject = e.selected ? e.selected[0] : null
      if (activeObject && (activeObject.type === 'text' || activeObject.type === 'textbox')) {
        setSelectedObject(activeObject)
      } else if (activeObject && activeObject.type === 'group') {
        // For groups, find the text object inside
        const textObj = activeObject.getObjects().find(o => o.type === 'text' || o.type === 'textbox')
        if (textObj) {
          setSelectedObject(textObj)
        } else {
          setSelectedObject(null)
        }
      } else {
        setSelectedObject(null)
      }
    })

    // Handle selection creation to maintain property panel
    canvas.on('selection:created', (e) => {
      const activeObject = e.selected ? e.selected[0] : null
      if (activeObject && (activeObject.type === 'text' || activeObject.type === 'textbox')) {
        setSelectedObject(activeObject)
      }
    })

    // Handle selection clearing to detect when text editing might end
    canvas.on('selection:cleared', () => {
      // Check if we were editing text and it's no longer active
      if (isTextEditing) {
        setIsTextEditing(false)
      }
      setSelectedObject(null)
    })

    // Handle object property changes
    canvas.on('object:modified', (e) => {
      const obj = e.target
      if (obj === selectedObject) {
        setForceUpdate(prev => prev + 1)
        if (obj.type === 'text') {
          updateTextHighlight(obj)
        }
      }
      handleObjectUpdate()
    })

    // Handle object scaling and rotation
    canvas.on('object:scaling', (e) => {
      const obj = e.target
      if (obj === selectedObject) {
        setForceUpdate(prev => prev + 1)
      }
      handleObjectUpdate()
    })

    canvas.on('object:rotating', (e) => {
      const obj = e.target
      if (obj === selectedObject) {
        setForceUpdate(prev => prev + 1)
      }
      handleObjectUpdate()
    })

    // Handle window resize
    const handleResize = () => {
      if (!canvas || !canvasRef.current) return

      const containerWidth = canvasRef.current.parentElement.clientWidth - 16
      const aspectRatio = 1440 / 1700 // Increased aspect ratio for 1440x1700
      let canvasWidth = containerWidth
      let canvasHeight = containerWidth / aspectRatio

      const maxHeight = window.innerHeight * 0.8
      if (canvasHeight > maxHeight) {
        canvasHeight = maxHeight
        canvasWidth = canvasHeight * aspectRatio
      }

      canvas.setDimensions({ width: canvasWidth, height: canvasHeight })

      // Update text wrapping for all text objects
      const maxTextWidth = canvasWidth * 0.95
      canvas.getObjects().forEach(obj => {
        if (obj.type === 'text') {
          obj.set('width', maxTextWidth)
        }
      })

      canvas.renderAll()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
      canvas.dispose()
    }
  }, [])

  // Helper function to safely get style properties with defaults
  const getStyleProperty = (styleObj, property, defaultValue) => {
    if (!styleObj || typeof styleObj !== 'object') return defaultValue
    return styleObj[property] !== undefined ? styleObj[property] : defaultValue
  }

  // Create slide content from AI data
  useEffect(() => {
    const renderSlide = async () => {
      if (!slideData || !fabricCanvasRef.current) return

      // Reset initial load flag when slide changes
      setIsInitialLoad(true)
      setIsLoading(true)
      const canvas = fabricCanvasRef.current
      const loadSlideData = (slideData) => {
        // This is a temporary fix to avoid a ReferenceError.
        // The actual slide rendering logic is handled below.
      };
      
      // Check if we have a saved state for this slide first, but only if we're switching slides
      const savedState = savedStates[currentSlideIndex]
      const isSlideChange = previousSlideIndexRef.current !== currentSlideIndex
      
      if (savedState && savedState.objects && isSlideChange) {
        // Restore saved state instead of clearing and re-rendering
        // Set loading to false first to prevent state updates during restoration
        setIsLoading(false)
        canvas.loadFromJSON(savedState.objects, () => {
          canvas.renderAll()
          setIsInitialLoad(false)

          // After loading, re-apply any necessary text updates
          canvas.getObjects().forEach(obj => {
            if (obj.type === 'text' || obj.type === 'textbox') {
              updateTextHighlight(obj)
            }
          })
        })
        previousSlideIndexRef.current = currentSlideIndex
        return // Exit early, don't re-render from AI data
      } else {
        // If no saved state, load from slideData
        loadSlideData(slideData)
      }
      
      // Update the previous slide index reference
      previousSlideIndexRef.current = currentSlideIndex
      
      canvas.clear()

      // Set background with safe defaults when background is missing
      if (!slideData.background) {
        canvas.setBackgroundColor('#ffffff', canvas.renderAll.bind(canvas))
      } else if (slideData.background.type === 'gradient') {
        const gradient = new fabric.Gradient({
          type: 'linear',
          coords: { x1: 0, y1: 0, x2: 0, y2: canvas.height },
          colorStops: [
            { offset: 0, color: slideData.background.color1 },
            { offset: 1, color: slideData.background.color2 }
          ]
        })
        canvas.setBackgroundColor(gradient, canvas.renderAll.bind(canvas))
      } else {
        canvas.setBackgroundColor(slideData.background.color1, canvas.renderAll.bind(canvas))
      }

      // Calculate scale factor for proper element sizing
      const scaleFactor = canvas.width / 1080 // Scale based on current canvas width vs original width

        // Calculate maximum width for text (98% of canvas width for better space utilization)
        const maxTextWidth = canvas.width * 0.98

      // Helper function to wrap text with better readability and word limit enforcement
      const wrapText = (text, maxWidth, fontSize) => {
        const words = text.split(' ')
        const lines = []
        let currentLine = ''

        // Word limit rule: 15-40 words per slide for optimal readability
        const wordCount = words.length
        const isWithinWordLimit = wordCount >= 15 && wordCount <= 40
        
        if (!isWithinWordLimit) {
          console.warn(`Word count (${wordCount}) is outside optimal range (15-40 words)`)
        }

        // More conservative character width estimation to prevent overflow
        const avgCharWidth = fontSize * 0.6
        const maxCharsPerLine = Math.floor(maxWidth / avgCharWidth)

        // Ensure reasonable line length for readability
        const minCharsPerLine = Math.max(6, maxCharsPerLine * 0.3)
        const finalMaxChars = Math.max(minCharsPerLine, maxCharsPerLine)

        for (let i = 0; i < words.length; i++) {
          const testLine = currentLine + (currentLine ? ' ' : '') + words[i]

          // Check if adding this word would exceed the line length
          if (testLine.length <= finalMaxChars) {
            currentLine = testLine
          } else {
            // If current line has content, push it and start new line
            if (currentLine) {
              lines.push(currentLine)
              currentLine = words[i]
            } else {
              // If single word is too long, force it on its own line
              lines.push(words[i])
              currentLine = ''
            }
          }
        }

        // Add the last line if it has content
        if (currentLine) {
          lines.push(currentLine)
        }

        return lines.join('\n')
      }

      const cleanTitleFormatting = (text) => {
        if (!text) return text
        // Remove italic markers and collapse double spaces to avoid kerning gaps
        return text
          .replace(/(?<!\*)\*(?!\*)([^*]+?)\*(?!\*)/g, '$1')
          .replace(/\s{2,}/g, ' ')
      }

      const highlightImportantWords = (text) => {
        if (!text) return text

        // Define patterns for important words/phrases
        const importantPatterns = [
          /\b(?:increase|improve|boost|enhance|optimize|maximize|minimize|reduce|decrease)\b/gi,
          /\b(?:key|critical|essential|important|vital|crucial|significant|major|primary)\b/gi,
          /\b(?:benefit|advantage|value|impact|result|outcome|success|growth|profit)\b/gi,
          /\b(?:strategy|solution|approach|method|technique|process|system|framework)\b/gi,
          /\b(?:ROI|revenue|cost|savings|efficiency|productivity|performance|quality)\b/gi,
          /\b(?:digital|technology|innovation|automation|AI|data|analytics|insights)\b/gi,
          /\b(?:customer|client|user|audience|market|brand|experience|engagement)\b/gi,
          /\b(?:leadership|management|team|collaboration|communication|culture)\b/gi,
          /\b(?:risk|challenge|opportunity|trend|future|transformation|change)\b/gi,
          /\b(?:best practice|proven|evidence|research|study|case study|example)\b/gi
        ]

        let highlightedText = text

        importantPatterns.forEach(pattern => {
          highlightedText = highlightedText.replace(pattern, (match) => {
            return `**${match}**`
          })
        })

        return highlightedText
      }

      // Helper function to limit words in bullet points (5-6 words)
      const limitBulletPointWords = (text, maxWords = 6) => {
        if (!text) return text
        const words = text.trim().split(/\s+/)
        if (words.length <= maxWords) return text
        // Truncate without adding ellipsis to avoid trailing ... in bullets
        return words.slice(0, maxWords).join(' ')
      }

      // Helper function to limit words in paragraphs (15-20 words)
      const limitParagraphWords = (text, maxWords = 20) => {
        if (!text) return text
        const words = text.trim().split(/\s+/)
        if (words.length <= maxWords) return text
        // Truncate without ellipsis to prevent "..." endings everywhere
        return words.slice(0, maxWords).join(' ')
      }

      // Helper function to make text editable - defined once for all slide types
      const makeTextEditable = (textObj) => {
        textObj.set({
          selectable: true,
          editable: true,
          evented: true,
          lockMovementX: false,
          lockMovementY: false,
          lockRotation: false,
          lockScalingX: false,
          lockScalingY: false,
          hasControls: true,
          hasBorders: true,
          cornerSize: 8,
          cornerStyle: 'circle',
          cornerColor: '#007bff',
          borderColor: '#007bff',
          borderScaleFactor: 2
        })
      }

      if (slideType === 'header') {
        // Set background color and add grid
        canvas.setBackgroundColor('#FBEFDB', canvas.renderAll.bind(canvas));
        const gridSpacing = 40 * scaleFactor;
        const gridLines = [];
        for (let i = 1; i < canvas.width / gridSpacing; i++) {
          gridLines.push(new fabric.Line([i * gridSpacing, 0, i * gridSpacing, canvas.height], { stroke: 'rgba(0,0,0,0.05)', strokeWidth: 1.5, selectable: false, evented: false }));
        }
        for (let i = 1; i < canvas.height / gridSpacing; i++) {
          gridLines.push(new fabric.Line([0, i * gridSpacing, canvas.width, i * gridSpacing], { stroke: 'rgba(0,0,0,0.05)', strokeWidth: 1.5, selectable: false, evented: false }));
        }
        canvas.add(new fabric.Group(gridLines, { selectable: false, evented: false }));
  
        // Add brand label
        canvas.add(new fabric.Textbox(brandText, {
          left: 80 * scaleFactor,
          top: 80 * scaleFactor,
          fontFamily: 'Inter',
          fontSize: 32 * scaleFactor,
          fill: '#000000',
          fontWeight: 'bold',
          selectable: false,
        }));
  
        // Add decorative dot pattern
        const dotPattern = [];
        const dotColor = 'rgba(244, 180, 0, 0.5)';
        for (let i = 0; i < 8; i++) {
          for (let j = 0; j < 15; j++) {
            if (j > i && j < 15 - i) {
              dotPattern.push(new fabric.Circle({
                left: canvas.width - (280 * scaleFactor) + (j * 12 * scaleFactor),
                top: 80 * scaleFactor + (i * 12 * scaleFactor),
                radius: 3 * scaleFactor,
                fill: dotColor,
                selectable: false,
                evented: false
              }));
            }
          }
        }
        canvas.add(new fabric.Group(dotPattern, { selectable: false, evented: false }));
  
        // Add quotation mark
        canvas.add(new fabric.Textbox('"', {
          left: 70 * scaleFactor,
          top: 180 * scaleFactor,
          fontFamily: 'Georgia',
          fontSize: 180 * scaleFactor,
          fill: '#000000',
          opacity: 0.8,
          selectable: false,
        }));
  
        // Add main title
        const titleLines = slideData.title.split('\\n');
        let currentTop = 300 * scaleFactor;
        const titleFontSize = 110 * scaleFactor;
        const lineSpacing = 120 * scaleFactor;
  
        titleLines.forEach(line => {
          // Strip any asterisks from header lines and render as plain text
          const cleanLine = String(line).replace(/\*/g, '').trim();
          
          const text = new fabric.Textbox(cleanLine, {
            left: 80 * scaleFactor,
            top: currentTop,
            fontFamily: 'Inter',
            fontSize: titleFontSize,
            fill: '#000000',
            fontWeight: 900,
            selectable: true,
            editable: true,
            lineHeight: 1,
          });
          
          canvas.add(text);
          currentTop += lineSpacing;
        });
  
        // Sleek progress bar with percentage (bottom center)
        {
          const progressBarWidth = canvas.width * 0.5
          const progressBarHeight = 15 * scaleFactor
          const progressBarY = canvas.height - (60 * scaleFactor)
          const progress = ((currentSlideIndex + 1) / totalSlides) * 100
          const accent = slideData.accentColor || '#F4B400'
          const titleColor = (getStyleProperty?.(slideData.titleStyle, 'color', '#000000') || '#000000').toString().toLowerCase()
          const isWhiteText = titleColor === '#ffffff' || titleColor === 'white' || titleColor === 'rgb(255,255,255)'

          const progressBarBg = new fabric.Rect({
            left: canvas.width / 2,
            top: progressBarY,
            width: progressBarWidth,
            height: progressBarHeight,
            fill: isWhiteText ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false,
            rx: progressBarHeight / 2,
            ry: progressBarHeight / 2
          })

          const progressBarFill = new fabric.Rect({
            left: canvas.width / 2 - progressBarWidth / 2,
            top: progressBarY,
            width: (progressBarWidth * progress) / 100,
            height: progressBarHeight,
            fill: accent,
            originX: 'left',
            originY: 'center',
            selectable: false,
            evented: false,
            rx: progressBarHeight / 2,
            ry: progressBarHeight / 2
          })

          const progressText = new fabric.Text(`${Math.round(progress)}%`, {
            left: canvas.width / 2,
            top: progressBarY + 20 * scaleFactor,
            fontSize: 14 * scaleFactor,
            fill: '#000000',
            fontFamily: 'Arial',
            textAlign: 'center',
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false
          })

          canvas.add(progressBarBg, progressBarFill, progressText)
        }

        // Page number indicator removed
  
        canvas.add(new fabric.Textbox('→', {
          left: canvas.width - (100 * scaleFactor),
          top: canvas.height - (100 * scaleFactor),
          fontFamily: 'Inter',
          fontSize: 48 * scaleFactor,
          fill: '#000000',
          selectable: false,
        }));
      } else if (slideType === 'info') {
        // Create info slide content with proper formatting and themed background
        console.log('Rendering info slide with data:', slideData)
        console.log('Has bulletPoints?', !!slideData.bulletPoints)
        console.log('Has subheadings?', !!slideData.subheadings)
        console.log('Has paragraphs?', !!slideData.paragraphs)
        console.log('Has impactfulLine?', !!slideData.impactfulLine)
        
        // Check if slide has any content at all
        const hasContent = (slideData.bulletPoints && slideData.bulletPoints.length > 0) ||
                          (slideData.paragraphs && slideData.paragraphs.length > 0) ||
                          (slideData.impactfulLine && slideData.impactfulLine.trim() !== '') ||
                          (slideData.subheadings && slideData.subheadings.length > 0)
        
        // Create fallback content if needed
        let fallbackContent = null
        if (!hasContent) {
          console.warn('Info slide has no content, creating fallback content')
          fallbackContent = {
            bulletPoints: ['Content is being generated...', 'Please wait while we create your slide content.'],
            slidePattern: 'bulletPoints'
          }
        }
        
        // THEME: Dark background + subtle grid
        canvas.setBackgroundColor('#0F0F10', canvas.renderAll.bind(canvas))
        
        // Brand label (top-left)
        canvas.add(new fabric.Textbox(brandText, {
          left: 80 * scaleFactor,
          top: 80 * scaleFactor,
          fontFamily: 'Inter',
          fontSize: 32 * scaleFactor,
          fill: '#F4B400',
          fontWeight: 'bold',
          selectable: false,
        }))

        // Decorative X pattern (top-right)
        const xGroup = []
        const cols = 4, rows = 4
        const xSize = 28 * scaleFactor
        const spacing = 56 * scaleFactor
        const startX = canvas.width - (spacing * cols) - (40 * scaleFactor)
        const startY = 60 * scaleFactor
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            xGroup.push(new fabric.Text('×', {
              left: startX + c * spacing,
              top: startY + r * spacing,
              fontFamily: 'Inter',
              fontSize: xSize,
              fill: '#FFFFFF',
              selectable: false,
              evented: false
            }))
          }
        }
        canvas.add(new fabric.Group(xGroup, { selectable: false, evented: false }))

        const titleLeft = canvas.width * 0.1
        const cleanedTitle = cleanTitleFormatting(slideData.title || 'Info Slide')
        const wrappedTitle = wrapText(cleanedTitle, maxTextWidth * 0.8, getStyleProperty(slideData.titleStyle, 'fontSize', 80) * scaleFactor)
        const title = createFormattedText(wrappedTitle, {
          left: titleLeft,
          top: canvas.height * 0.22,
          fontFamily: getStyleProperty(slideData.titleStyle, 'fontFamily', 'Inter'),
          fontSize: getStyleProperty(slideData.titleStyle, 'fontSize', 80) * scaleFactor,
          fill: slideData.accentColor || '#F4B400',
          fontWeight: getStyleProperty(slideData.titleStyle, 'fontWeight', 'bold'),
          textAlign: 'left',
          originX: 'left',
          originY: 'top',
          width: maxTextWidth * 0.8,
          splitByGrapheme: true,
          selectable: true,
          editable: true,
          evented: true,
          lineHeight: 1.1,
          lockMovementX: false,
          lockMovementY: false,
          lockRotation: false,
          lockScalingX: false,
          lockScalingY: false
        })

        // Create subheadings and key points
        // Account for footer space (120px) when positioning text
        const footerSpace = 140 * scaleFactor
        const availableHeight = canvas.height - footerSpace
        let currentY = canvas.height * 0.42
        const lineHeight = 1.2 // Reduced line height for tighter spacing
        const objects = [title]

        // Decorative accent stroke near bottom-left
        const accentRect = new fabric.Rect({
          left: titleLeft + (180 * scaleFactor),
          top: canvas.height * 0.78,
          width: 300 * scaleFactor,
          height: 6 * scaleFactor,
          fill: slideData.accentColor || '#F4B400',
          originX: 'center',
          originY: 'center',
          rx: 3 * scaleFactor,
          ry: 3 * scaleFactor,
          selectable: false,
          evented: false
        })

        // Handle different slide patterns based on slidePattern
        const slidePattern = fallbackContent ? fallbackContent.slidePattern : (slideData.slidePattern || 'bulletPoints')
        const bulletPoints = fallbackContent ? fallbackContent.bulletPoints : slideData.bulletPoints
        const paragraphs = fallbackContent ? fallbackContent.paragraphs : slideData.paragraphs
        const impactfulLine = fallbackContent ? fallbackContent.impactfulLine : slideData.impactfulLine

        if (slidePattern === 'bulletPoints') {
          // Traditional bullet points pattern
          if (bulletPoints && Array.isArray(bulletPoints) && bulletPoints.length > 0) {
            console.log('Processing bullet points:', bulletPoints)
            bulletPoints.forEach((bulletPoint, index) => {
              // Ensure bulletPoint is a string and not empty
              if (!bulletPoint || typeof bulletPoint !== 'string' || bulletPoint.trim() === '') {
                console.warn(`Skipping empty bullet point at index ${index}`)
                return
              }
              
              // Use full bullet point without truncation to preserve complete sentences
              const limitedBulletPoint = bulletPoint.trim()
              const bulletText = wrapText(highlightImportantWords(limitedBulletPoint), maxTextWidth, getStyleProperty(slideData.bulletStyle, 'fontSize', 30) * scaleFactor)
              const lines = bulletText.split('\n')
              const estimatedTextHeight = lines.length * getStyleProperty(slideData.bulletStyle, 'fontSize', 30) * scaleFactor * 1.1 + 40

              if (currentY + estimatedTextHeight > canvas.height - footerSpace) {
                console.log('Skipping bullet point due to space constraints')
                return
              }

              const bulletSymbol = new fabric.Text('•', {
                left: canvas.width * 0.1,
                top: currentY,
                fontSize: getStyleProperty(slideData.bulletStyle, 'fontSize', 30) * scaleFactor * 1.2,
                fontFamily: getStyleProperty(slideData.bulletStyle, 'fontFamily', 'Arial'),
                fill: slideData.accentColor,
                fontWeight: 'bold',
                textAlign: 'left',
                originX: 'left',
                originY: 'center',
                selectable: true,
                editable: true,
                evented: true,
                lockMovementX: false,
                lockMovementY: false,
                lockRotation: false,
                lockScalingX: false,
                lockScalingY: false
              })

              const bulletTextObj = createFormattedText(bulletText, {
                left: canvas.width * 0.15,
                top: currentY,
                fontSize: getStyleProperty(slideData.bulletStyle, 'fontSize', 30) * scaleFactor,
                fontFamily: getStyleProperty(slideData.bulletStyle, 'fontFamily', 'Arial'),
                fill: getStyleProperty(slideData.bulletStyle, 'color', '#fff4e2'),
                fontWeight: getStyleProperty(slideData.bulletStyle, 'fontWeight', 'normal'),
                textAlign: 'left',
                originX: 'left',
                originY: 'center',
                width: maxTextWidth * 0.8,
                splitByGrapheme: true,
                selectable: true,
                editable: true,
                evented: true,
                lineHeight: 1.1,
                lockMovementX: false,
                lockMovementY: false,
                lockRotation: false,
                lockScalingX: false,
                lockScalingY: false
              })

              if (bulletText.includes('**')) {
                const { styles } = parseMarkdownText(bulletText)
                const updatedStyles = {}
                Object.keys(styles).forEach(index => {
                  updatedStyles[index] = { ...styles[index], fill: slideData.accentColor }
                })
                if (Object.keys(updatedStyles).length > 0) {
                  bulletTextObj.set('styles', updatedStyles)
                }
              }

              objects.push(bulletSymbol, bulletTextObj)
              currentY += estimatedTextHeight
            })
          }
        } else if (slidePattern === 'singleParagraph') {
          // Single impactful paragraph pattern
          if (paragraphs && paragraphs.length > 0) {
            const paragraph = paragraphs[0] // Use only the first paragraph
            if (!paragraph || typeof paragraph !== 'string' || paragraph.trim() === '') {
              console.warn('Empty paragraph content, skipping')
              return
            }
            
            console.log('Processing paragraph:', paragraph)
            // Use full paragraph without truncation to preserve complete sentences
            const limitedParagraph = paragraph.trim()
            const paragraphText = wrapText(highlightImportantWords(limitedParagraph), maxTextWidth, getStyleProperty(slideData.paragraphStyle, 'fontSize', 30) * scaleFactor)
            const lines = paragraphText.split('\n')
            const estimatedTextHeight = lines.length * getStyleProperty(slideData.paragraphStyle, 'fontSize', 30) * scaleFactor * 1.4 + 40

            if (currentY + estimatedTextHeight > canvas.height - footerSpace) {
              console.log('Skipping paragraph due to space constraints')
              return
            }

              const paragraphTextObj = createFormattedText(paragraphText, {
              left: titleLeft,
              top: currentY,
              fontSize: getStyleProperty(slideData.paragraphStyle, 'fontSize', 30) * scaleFactor,
              fontFamily: getStyleProperty(slideData.paragraphStyle, 'fontFamily', 'Inter'),
              fill: getStyleProperty(slideData.paragraphStyle, 'color', '#fff4e2'),
              fontWeight: getStyleProperty(slideData.paragraphStyle, 'fontWeight', 'normal'),
              textAlign: 'left',
              originX: 'left',
              originY: 'top',
              width: maxTextWidth * 0.8,
              splitByGrapheme: true,
              selectable: true,
              editable: true,
              evented: true,
              lineHeight: 1.4,
              lockMovementX: false,
              lockMovementY: false,
              lockRotation: false,
              lockScalingX: false,
              lockScalingY: false
            })

            if (paragraphText.includes('**')) {
              const { styles } = parseMarkdownText(paragraphText)
              const updatedStyles = {}
              Object.keys(styles).forEach(index => {
                updatedStyles[index] = { ...styles[index], fill: slideData.accentColor }
              })
              if (Object.keys(updatedStyles).length > 0) {
                paragraphTextObj.set('styles', updatedStyles)
              }
            }

            objects.push(paragraphTextObj)
            currentY += estimatedTextHeight
          }
        } else if (slidePattern === 'impactfulLine') {
          // Single impactful line pattern
          if (impactfulLine && impactfulLine.trim() !== '') {
            console.log('Processing impactful line:', impactfulLine)
            // Use full impactful line without truncation to preserve complete sentences
            const limitedImpactfulLine = impactfulLine.trim()
            const impactfulText = wrapText(highlightImportantWords(limitedImpactfulLine), maxTextWidth, getStyleProperty(slideData.paragraphStyle, 'fontSize', 32) * scaleFactor)
            const lines = impactfulText.split('\n')
            const estimatedTextHeight = lines.length * getStyleProperty(slideData.paragraphStyle, 'fontSize', 32) * scaleFactor * 1.3 + 50

            if (currentY + estimatedTextHeight > canvas.height - footerSpace) {
              console.log('Skipping impactful line due to space constraints')
              return
            }

            const impactfulTextObj = createFormattedText(impactfulText, {
              left: titleLeft,
              top: currentY,
              fontSize: getStyleProperty(slideData.paragraphStyle, 'fontSize', 32) * scaleFactor,
              fontFamily: getStyleProperty(slideData.paragraphStyle, 'fontFamily', 'Inter'),
              fill: getStyleProperty(slideData.paragraphStyle, 'color', '#fff4e2'),
              fontWeight: 'bold',
              textAlign: 'left',
              originX: 'left',
              originY: 'top',
              width: maxTextWidth * 0.8,
              splitByGrapheme: true,
              selectable: true,
              editable: true,
              evented: true,
              lineHeight: 1.3,
              lockMovementX: false,
              lockMovementY: false,
              lockRotation: false,
              lockScalingX: false,
              lockScalingY: false
            })

            if (impactfulText.includes('**')) {
              const { styles } = parseMarkdownText(impactfulText)
              const updatedStyles = {}
              Object.keys(styles).forEach(index => {
                updatedStyles[index] = { ...styles[index], fill: slideData.accentColor }
              })
              if (Object.keys(updatedStyles).length > 0) {
                impactfulTextObj.set('styles', updatedStyles)
              }
            }

            objects.push(impactfulTextObj)
            currentY += estimatedTextHeight
          }
        } else if (slidePattern === 'mixedContent') {
          // Mixed content pattern - bullets + paragraph
          if (bulletPoints && Array.isArray(bulletPoints)) {
            bulletPoints.forEach((bulletPoint, index) => {
              // Use full bullet point without truncation
              const limitedBulletPoint = bulletPoint.trim()
              const bulletText = wrapText(highlightImportantWords(limitedBulletPoint), maxTextWidth, getStyleProperty(slideData.bulletStyle, 'fontSize', 30) * scaleFactor)
              const lines = bulletText.split('\n')
              const estimatedTextHeight = lines.length * getStyleProperty(slideData.bulletStyle, 'fontSize', 30) * scaleFactor * 1.1 + 35

              if (currentY + estimatedTextHeight > canvas.height - footerSpace) {
                return
              }

              const bulletSymbol = new fabric.Text('•', {
                left: canvas.width * 0.1,
                top: currentY,
                fontSize: getStyleProperty(slideData.bulletStyle, 'fontSize', 30) * scaleFactor * 1.2,
                fontFamily: getStyleProperty(slideData.bulletStyle, 'fontFamily', 'Arial'),
                fill: slideData.accentColor,
                fontWeight: 'bold',
                textAlign: 'left',
                originX: 'left',
                originY: 'center',
                selectable: true,
                editable: true,
                evented: true,
                lockMovementX: false,
                lockMovementY: false,
                lockRotation: false,
                lockScalingX: false,
                lockScalingY: false
              })

              const bulletTextObj = createFormattedText(bulletText, {
                left: canvas.width * 0.15,
                top: currentY,
                fontSize: getStyleProperty(slideData.bulletStyle, 'fontSize', 30) * scaleFactor,
                fontFamily: getStyleProperty(slideData.bulletStyle, 'fontFamily', 'Arial'),
              fill: getStyleProperty(slideData.bulletStyle, 'color', '#fff4e2'),
                fontWeight: getStyleProperty(slideData.bulletStyle, 'fontWeight', 'normal'),
                textAlign: 'left',
                originX: 'left',
                originY: 'center',
                width: maxTextWidth * 0.8,
                splitByGrapheme: true,
                selectable: true,
                editable: true,
                evented: true,
                lineHeight: 1.1,
                lockMovementX: false,
                lockMovementY: false,
                lockRotation: false,
                lockScalingX: false,
                lockScalingY: false
              })

              if (bulletText.includes('**')) {
                const { styles } = parseMarkdownText(bulletText)
                const updatedStyles = {}
                Object.keys(styles).forEach(index => {
                  updatedStyles[index] = { ...styles[index], fill: slideData.accentColor }
                })
                if (Object.keys(updatedStyles).length > 0) {
                  bulletTextObj.set('styles', updatedStyles)
                }
              }

              objects.push(bulletSymbol, bulletTextObj)
              currentY += estimatedTextHeight
            })
          }

          // Add paragraph after bullets in mixed content
          if (paragraphs && paragraphs.length > 0) {
            const paragraph = paragraphs[0]
            // Use full paragraph without truncation
            const limitedParagraph = paragraph.trim()
            const paragraphText = wrapText(highlightImportantWords(limitedParagraph), maxTextWidth, getStyleProperty(slideData.paragraphStyle, 'fontSize', 30) * scaleFactor)
            const lines = paragraphText.split('\n')
            const estimatedTextHeight = lines.length * getStyleProperty(slideData.paragraphStyle, 'fontSize', 30) * scaleFactor * 1.3 + 30

            if (currentY + estimatedTextHeight > canvas.height - footerSpace) {
              return
            }

            const paragraphTextObj = createFormattedText(paragraphText, {
              left: titleLeft,
              top: currentY,
              fontSize: getStyleProperty(slideData.paragraphStyle, 'fontSize', 24) * scaleFactor,
              fontFamily: getStyleProperty(slideData.paragraphStyle, 'fontFamily', 'Inter'),
              fill: getStyleProperty(slideData.paragraphStyle, 'color', '#fff4e2'),
              fontWeight: getStyleProperty(slideData.paragraphStyle, 'fontWeight', 'normal'),
              textAlign: 'left',
              originX: 'left',
              originY: 'top',
              width: maxTextWidth * 0.8,
              splitByGrapheme: true,
              selectable: true,
              editable: true,
              evented: true,
              lineHeight: 1.3,
              lockMovementX: false,
              lockMovementY: false,
              lockRotation: false,
              lockScalingX: false,
              lockScalingY: false
            })

            if (paragraphText.includes('**')) {
              const { styles } = parseMarkdownText(paragraphText)
              const updatedStyles = {}
              Object.keys(styles).forEach(index => {
                updatedStyles[index] = { ...styles[index], fill: slideData.accentColor }
              })
              if (Object.keys(updatedStyles).length > 0) {
                paragraphTextObj.set('styles', updatedStyles)
              }
            }

            objects.push(paragraphTextObj)
            currentY += estimatedTextHeight
          }
        }
        
        // If we still have no content and there are old subheadings, use them
        if (objects.length <= 1 && slideData.subheadings && Array.isArray(slideData.subheadings)) {
        // Old subheading format - convert to bullet points
        slideData.subheadings.forEach((subheading, index) => {
          // Check if we have enough space for the subheading
          const subheadingHeight = getStyleProperty(slideData.subheadingStyle, 'fontSize', 32) * scaleFactor * lineHeight + 20
          if (currentY + subheadingHeight > canvas.height - footerSpace) {
            return // Skip if not enough space
          }

          // Subheading with formatting
          const subheadingText = createFormattedText(subheading.heading, {
            left: titleLeft,
            top: currentY,
            fontSize: getStyleProperty(slideData.subheadingStyle, 'fontSize', 32) * scaleFactor,
            fontFamily: getStyleProperty(slideData.subheadingStyle, 'fontFamily', 'Inter'),
            fill: getStyleProperty(slideData.subheadingStyle, 'color', '#fff4e2'),
            fontWeight: getStyleProperty(slideData.subheadingStyle, 'fontWeight', 'bold'),
            textAlign: 'left',
            originX: 'left',
            originY: 'top',
            width: maxTextWidth * 0.8,
            splitByGrapheme: true,
            selectable: true,
            editable: true,
            evented: true,
            lineHeight: 1.2,
            lockMovementX: false,
            lockMovementY: false,
            lockRotation: false,
            lockScalingX: false,
            lockScalingY: false
          })

          objects.push(subheadingText)
          currentY += getStyleProperty(slideData.subheadingStyle, 'fontSize', 32) * scaleFactor * lineHeight + 20

          // Key points with better spacing calculation
          if (subheading.keyPoints && Array.isArray(subheading.keyPoints)) {
            subheading.keyPoints.forEach((keyPoint, pointIndex) => {
              // Calculate actual text height more accurately, without truncating key points
              const fullKeyPoint = highlightImportantWords(keyPoint).trim()
              const keyPointText = wrapText(fullKeyPoint, maxTextWidth, getStyleProperty(slideData.textStyle, 'fontSize', 20) * scaleFactor)
              const lines = keyPointText.split('\n')
              const estimatedTextHeight = lines.length * getStyleProperty(slideData.textStyle, 'fontSize', 20) * scaleFactor * 1.1 + 35

              // Check if we have enough space for this key point
              if (currentY + estimatedTextHeight > canvas.height - footerSpace) {
                console.log('Skipping text to avoid footer overlap')
                return // Skip this key point to avoid footer overlap
              }

              // Create textbox with bold formatting for important words
              const keyPointTextObj = createFormattedText(keyPointText, {
                left: titleLeft,
                top: currentY,
                fontSize: getStyleProperty(slideData.textStyle, 'fontSize', 20) * scaleFactor,
                fontFamily: getStyleProperty(slideData.textStyle, 'fontFamily', 'Inter'),
                fill: getStyleProperty(slideData.textStyle, 'color', '#fff4e2'),
                fontWeight: getStyleProperty(slideData.textStyle, 'fontWeight', 'normal'),
                textAlign: 'left',
                originX: 'left',
                originY: 'top',
                width: maxTextWidth * 0.8,
                splitByGrapheme: true,
                selectable: true,
                editable: true,
                evented: true,
                lineHeight: 1.1, // Much tighter line height for bullet points
                lockMovementX: false,
                lockMovementY: false,
                lockRotation: false,
                lockScalingX: false,
                lockScalingY: false
              })

              // Apply accent color to bold text
              if (keyPointText.includes('**')) {
                const { styles } = parseMarkdownText(keyPointText)
                const updatedStyles = {}

                // Apply accent color to bold text
                Object.keys(styles).forEach(index => {
                  updatedStyles[index] = {
                    ...styles[index],
                    fill: slideData.accentColor
                  }
                })

                if (Object.keys(updatedStyles).length > 0) {
                  keyPointTextObj.set('styles', updatedStyles)
                }
              }

              objects.push(keyPointTextObj)
              currentY += estimatedTextHeight
            })
          }

          currentY += 25 // Space between subheadings
        })

        } // Close the subheadings if block

        // Footer handle removed

        // Page number indicator removed

        // Add bottom-right arrow similar to header (use accent for visibility on dark bg)
        canvas.add(new fabric.Textbox('→', {
          left: canvas.width - (100 * scaleFactor),
          top: canvas.height - (100 * scaleFactor),
          fontFamily: 'Inter',
          fontSize: 48 * scaleFactor,
          fill: slideData.accentColor || '#F4B400',
          selectable: false,
        }))

        // Sleek progress bar with percentage (bottom center)
        {
          const progressBarWidth = canvas.width * 0.5
          const progressBarHeight = 15 * scaleFactor
          const progressBarY = canvas.height - (60 * scaleFactor)
          const progress = ((currentSlideIndex + 1) / totalSlides) * 100
          const accent = slideData.accentColor || '#F4B400'
          const titleColor = (getStyleProperty?.(slideData.titleStyle, 'color', '#fff4e2') || '#fff4e2').toString().toLowerCase()
          const isWhiteText = titleColor === '#ffffff' || titleColor === 'white' || titleColor === 'rgb(255,255,255)'

          const progressBarBg = new fabric.Rect({
            left: canvas.width / 2,
            top: progressBarY,
            width: progressBarWidth,
            height: progressBarHeight,
            fill: isWhiteText ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.15)',
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false,
            rx: progressBarHeight / 2,
            ry: progressBarHeight / 2
          })

          const progressBarFill = new fabric.Rect({
            left: canvas.width / 2 - progressBarWidth / 2,
            top: progressBarY,
            width: (progressBarWidth * progress) / 100,
            height: progressBarHeight,
            fill: accent,
            originX: 'left',
            originY: 'center',
            selectable: false,
            evented: false,
            rx: progressBarHeight / 2,
            ry: progressBarHeight / 2
          })

          const progressText = new fabric.Text(`${Math.round(progress)}%`, {
            left: canvas.width / 2,
            top: progressBarY + 20 * scaleFactor,
            fontSize: 14 * scaleFactor,
            fill: isWhiteText ? '#FFFFFF' : accent,
            fontFamily: 'Arial',
            textAlign: 'center',
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false
          })

          canvas.add(progressBarBg, progressBarFill, progressText)
        }

        // Ensure all text objects are editable
        objects.forEach(obj => {
          if (obj.type === 'text' || obj.type === 'textbox') {
            makeTextEditable(obj)
          }
        })

        // Icon generation removed - not needed

        // Add objects to canvas in correct order
        canvas.add(accentRect) // Add accent line first
        
        // Ensure we have content to display
        if (objects.length <= 1) { // Only title, no content
          console.warn('No content found for info slide, adding fallback message')
          const fallbackText = createFormattedText('Content is being generated...', {
            left: canvas.width / 2,
            top: canvas.height * 0.5,
            fontSize: 24 * scaleFactor,
            fontFamily: 'Arial',
            fill: '#666666',
            fontWeight: 'normal',
            textAlign: 'center',
            originX: 'center',
            originY: 'center',
            width: maxTextWidth,
            splitByGrapheme: true,
            selectable: true,
            editable: true,
            evented: true,
            lineHeight: 1.4,
            lockMovementX: false,
            lockMovementY: false,
            lockRotation: false,
            lockScalingX: false,
            lockScalingY: false
          })
          objects.push(fallbackText)
        }
        
        objects.forEach(obj => canvas.add(obj)) // Add all text objects
      } else if (slideType === 'image') {
        // Create image slide with generated image and text
        console.log('Image slide detected, slideData:', slideData)
        console.log('Has generatedImage?', !!slideData.generatedImage)

        if (slideData.generatedImage) {
          console.log('Loading image from URL...')
          fabric.Image.fromURL(slideData.generatedImage, (img) => {
            console.log('Image loaded successfully!', img)
            // Calculate image dimensions to fit in the upper portion of the slide
            const maxWidth = canvas.width * 0.8
            const maxHeight = canvas.height * 0.5
            const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1)

            img.set({
              left: canvas.width / 2,
              top: canvas.height * 0.30,
              scaleX: scale,
              scaleY: scale,
              originX: 'center',
              originY: 'center',
              selectable: true,
              editable: true,
              evented: true,
              shadow: new fabric.Shadow({
                color: 'rgba(0,0,0,0.3)',
                blur: 20,
                offsetX: 0,
                offsetY: 10
              })
            })

            // Add title below the image
            const wrappedTitle = wrapText(slideData.title, maxTextWidth, getStyleProperty(slideData.titleStyle, 'fontSize', 48) * scaleFactor)
            const title = createFormattedText(wrappedTitle, {
              left: canvas.width / 2,
              top: canvas.height * 0.65,
              fontFamily: getStyleProperty(slideData.titleStyle, 'fontFamily', 'Arial'),
              fontSize: getStyleProperty(slideData.titleStyle, 'fontSize', 48) * scaleFactor,
              fill: slideData.accentColor || '#F4B400',
              fontWeight: getStyleProperty(slideData.titleStyle, 'fontWeight', 'bold'),
              textAlign: 'center',
              originX: 'center',
              originY: 'center',
              width: maxTextWidth,
              splitByGrapheme: true,
              selectable: true,
              editable: true,
              evented: true,
              lineHeight: 1.4
            })

            // Add subtitle below the title
            const wrappedSubtitle = wrapText(slideData.subtitle, maxTextWidth, getStyleProperty(slideData.subtitleStyle, 'fontSize', 24) * scaleFactor)
            const subtitle = createFormattedText(wrappedSubtitle, {
              left: canvas.width / 2,
              top: canvas.height * 0.8,
              fontFamily: getStyleProperty(slideData.subtitleStyle, 'fontFamily', 'Arial'),
              fontSize: getStyleProperty(slideData.subtitleStyle, 'fontSize', 24) * scaleFactor,
              fill: getStyleProperty(slideData.subtitleStyle, 'color', '#333333'),
              fontWeight: getStyleProperty(slideData.subtitleStyle, 'fontWeight', 'normal'),
              textAlign: 'center',
              originX: 'center',
              originY: 'center',
              width: maxTextWidth,
              splitByGrapheme: true,
              selectable: true,
              editable: true,
              evented: true,
              lineHeight: 1.4
            })

            const accentRect = new fabric.Rect({
              left: canvas.width / 2,
              top: canvas.height * 0.58,
              width: 200 * scaleFactor,
              height: 4 * scaleFactor,
              fill: slideData.accentColor,
              originX: 'center',
              originY: 'center',
              selectable: false,
              evented: false
            })

            // Progress bar
            const progressBarWidth = canvas.width * 0.5
            const progressBarHeight = 15 * scaleFactor
            const progressBarY = canvas.height - (60 * scaleFactor)
            const progress = ((currentSlideIndex + 1) / totalSlides) * 100

            const progressBarBg = new fabric.Rect({
              left: canvas.width / 2,
              top: progressBarY,
              width: progressBarWidth,
              height: progressBarHeight,
              fill: 'rgba(0,0,0,0.1)',
              originX: 'center',
              originY: 'center',
              selectable: false,
              evented: false,
              rx: progressBarHeight / 2,
              ry: progressBarHeight / 2
            })

            const progressBarFill = new fabric.Rect({
              left: canvas.width / 2 - progressBarWidth / 2,
              top: progressBarY,
              width: (progressBarWidth * progress) / 100,
              height: progressBarHeight,
              fill: slideData.accentColor || '#F4B400',
              originX: 'left',
              originY: 'center',
              selectable: false,
              evented: false,
              rx: progressBarHeight / 2,
              ry: progressBarHeight / 2
            })

            const progressText = new fabric.Text(`${Math.round(progress)}%`, {
              left: canvas.width / 2,
              top: progressBarY + 20 * scaleFactor,
              fontSize: 14 * scaleFactor,
              fill: slideData.accentColor,
              fontFamily: 'Arial',
              textAlign: 'center',
              originX: 'center',
              originY: 'center',
              selectable: false,
              evented: false
            })

            // Arrow like header (bottom-right)
            const arrow = new fabric.Textbox('→', {
              left: canvas.width - (100 * scaleFactor),
              top: canvas.height - (100 * scaleFactor),
              fontFamily: 'Inter',
              fontSize: 48 * scaleFactor,
              fill: slideData.accentColor || '#F4B400',
              selectable: false,
            })

            // Make text editable
            makeTextEditable(title)
            makeTextEditable(subtitle)

            canvas.add(img, accentRect, title, subtitle, progressBarBg, progressBarFill, progressText, arrow)
            canvas.renderAll()
            setIsLoading(false)
            setIsInitialLoad(false)
          }, { crossOrigin: 'anonymous' })
          return // Exit early for async image loading
        } else {
          console.log('No generatedImage found, showing text-only fallback')
          // Fallback if image generation failed - show text only
          const wrappedTitle = wrapText(slideData.title, maxTextWidth, getStyleProperty(slideData.titleStyle, 'fontSize', 48) * scaleFactor)
          const title = createFormattedText(wrappedTitle, {
            left: canvas.width / 2,
            top: canvas.height * 0.4,
            fontFamily: getStyleProperty(slideData.titleStyle, 'fontFamily', 'Arial'),
            fontSize: getStyleProperty(slideData.titleStyle, 'fontSize', 48) * scaleFactor,
            fill: slideData.accentColor || '#F4B400',
            fontWeight: getStyleProperty(slideData.titleStyle, 'fontWeight', 'bold'),
            textAlign: 'center',
            originX: 'center',
            originY: 'center',
            width: maxTextWidth,
            splitByGrapheme: true,
            selectable: true,
            editable: true,
            evented: true,
            lineHeight: 1.4
          })

          const wrappedSubtitle = wrapText(slideData.subtitle, maxTextWidth, getStyleProperty(slideData.subtitleStyle, 'fontSize', 24) * scaleFactor)
          const subtitle = createFormattedText(wrappedSubtitle, {
            left: canvas.width / 2,
            top: canvas.height * 0.6,
            fontFamily: getStyleProperty(slideData.subtitleStyle, 'fontFamily', 'Arial'),
            fontSize: getStyleProperty(slideData.subtitleStyle, 'fontSize', 24) * scaleFactor,
            fill: getStyleProperty(slideData.subtitleStyle, 'color', '#333333'),
            fontWeight: getStyleProperty(slideData.subtitleStyle, 'fontWeight', 'normal'),
            textAlign: 'center',
            originX: 'center',
            originY: 'center',
            width: maxTextWidth,
            splitByGrapheme: true,
            selectable: true,
            editable: true,
            evented: true,
            lineHeight: 1.4
          })

          // Progress bar
          const progressBarWidth = canvas.width * 0.5
          const progressBarHeight = 15 * scaleFactor
          const progressBarY = canvas.height - (60 * scaleFactor)
          const progress = ((currentSlideIndex + 1) / totalSlides) * 100

          const progressBarBg = new fabric.Rect({
            left: canvas.width / 2,
            top: progressBarY,
            width: progressBarWidth,
            height: progressBarHeight,
            fill: 'rgba(0,0,0,0.1)',
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false,
            rx: progressBarHeight / 2,
            ry: progressBarHeight / 2
          })

          const progressBarFill = new fabric.Rect({
            left: canvas.width / 2 - progressBarWidth / 2,
            top: progressBarY,
            width: (progressBarWidth * progress) / 100,
            height: progressBarHeight,
            fill: '#000000',
            originX: 'left',
            originY: 'center',
            selectable: false,
            evented: false,
            rx: progressBarHeight / 2,
            ry: progressBarHeight / 2
          })

          const progressText = new fabric.Text(`${Math.round(progress)}%`, {
            left: canvas.width / 2,
            top: progressBarY + 20 * scaleFactor,
            fontSize: 14 * scaleFactor,
            fill: slideData.accentColor,
            fontFamily: 'Arial',
            textAlign: 'center',
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false
          })

          // Arrow like header (bottom-right)
          const arrow = new fabric.Textbox('→', {
            left: canvas.width - (100 * scaleFactor),
            top: canvas.height - (100 * scaleFactor),
            fontFamily: 'Inter',
            fontSize: 48 * scaleFactor,
            fill: slideData.accentColor || '#F4B400',
            selectable: false,
          })

          makeTextEditable(title)
          makeTextEditable(subtitle)

          canvas.add(title, subtitle, progressBarBg, progressBarFill, progressText, arrow)
          setIsLoading(false)
          setIsInitialLoad(false)
        }
      } else if (slideType === 'end') {
        // Create end slide with CTA and header-themed background/decor
        // Mirror header theme: beach color background, grid, brand text, dots, footer elements
        canvas.setBackgroundColor('#FBEFDB', canvas.renderAll.bind(canvas))
        const gridSpacingEnd = 40 * scaleFactor
        const gridLinesEnd = []
        for (let i = 1; i < canvas.width / gridSpacingEnd; i++) {
          gridLinesEnd.push(new fabric.Line([i * gridSpacingEnd, 0, i * gridSpacingEnd, canvas.height], { stroke: 'rgba(0,0,0,0.05)', strokeWidth: 1.5, selectable: false, evented: false }))
        }
        for (let i = 1; i < canvas.height / gridSpacingEnd; i++) {
          gridLinesEnd.push(new fabric.Line([0, i * gridSpacingEnd, canvas.width, i * gridSpacingEnd], { stroke: 'rgba(0,0,0,0.05)', strokeWidth: 1.5, selectable: false, evented: false }))
        }
        canvas.add(new fabric.Group(gridLinesEnd, { selectable: false, evented: false }))

        // Brand label top-left
        canvas.add(new fabric.Textbox(brandText, {
          left: 80 * scaleFactor,
          top: 80 * scaleFactor,
          fontFamily: 'Inter',
          fontSize: 32 * scaleFactor,
          fill: '#000000',
          fontWeight: 'bold',
          selectable: false,
        }))

        // Decorative dot pattern top-right (same as header)
        const dotPatternEnd = []
        const dotColorEnd = 'rgba(244, 180, 0, 0.5)'
        for (let i = 0; i < 8; i++) {
          for (let j = 0; j < 15; j++) {
            if (j > i && j < 15 - i) {
              dotPatternEnd.push(new fabric.Circle({
                left: canvas.width - (280 * scaleFactor) + (j * 12 * scaleFactor),
                top: 80 * scaleFactor + (i * 12 * scaleFactor),
                radius: 3 * scaleFactor,
                fill: dotColorEnd,
                selectable: false,
                evented: false
              }))
            }
          }
        }
        canvas.add(new fabric.Group(dotPatternEnd, { selectable: false, evented: false }))

        // Quotation mark (subtle decorative, same family as header)
        canvas.add(new fabric.Textbox('"', {
          left: 70 * scaleFactor,
          top: 180 * scaleFactor,
          fontFamily: 'Georgia',
          fontSize: 120 * scaleFactor,
          fill: '#000000',
          opacity: 0.6,
          selectable: false,
        }))

        const wrappedTitle = wrapText(slideData.title, maxTextWidth, getStyleProperty(slideData.titleStyle, 'fontSize', 48) * scaleFactor)
        const title = createFormattedText(wrappedTitle, {
          left: canvas.width / 2,
          top: canvas.height * 0.3,
          fontFamily: getStyleProperty(slideData.titleStyle, 'fontFamily', 'Arial'),
          fontSize: getStyleProperty(slideData.titleStyle, 'fontSize', 48) * scaleFactor,
          fill: '#000000',
          fontWeight: getStyleProperty(slideData.titleStyle, 'fontWeight', 'bold'),
          textAlign: 'center',
          originX: 'center',
          originY: 'center',
          width: maxTextWidth,
          splitByGrapheme: true,
          selectable: true,
          editable: true,
          evented: true,
          lineHeight: 1.4,
          lockMovementX: false,
          lockMovementY: false,
          lockRotation: false,
          lockScalingX: false,
          lockScalingY: false
        })

        const wrappedSubtitle = wrapText(slideData.subtitle, maxTextWidth, getStyleProperty(slideData.subtitleStyle, 'fontSize', 24) * scaleFactor)
        const subtitle = createFormattedText(wrappedSubtitle, {
          left: canvas.width / 2,
          top: canvas.height * 0.5,
          fontFamily: getStyleProperty(slideData.subtitleStyle, 'fontFamily', 'Arial'),
          fontSize: getStyleProperty(slideData.subtitleStyle, 'fontSize', 24) * scaleFactor,
          fill: '#000000',
          fontWeight: getStyleProperty(slideData.subtitleStyle, 'fontWeight', 'normal'),
          textAlign: 'center',
          originX: 'center',
          originY: 'center',
          width: maxTextWidth,
          splitByGrapheme: true,
          selectable: true,
          editable: true,
          evented: true,
          lineHeight: 1.4,
          lockMovementX: false,
          lockMovementY: false,
          lockRotation: false,
          lockScalingX: false,
          lockScalingY: false
        })

        const wrappedCTA = wrapText(slideData.ctaText, maxTextWidth, getStyleProperty(slideData.ctaStyle, 'fontSize', 30) * scaleFactor)
        const ctaText = createFormattedText(wrappedCTA, {
          left: canvas.width / 2,
          top: canvas.height * 0.7,
          fontFamily: getStyleProperty(slideData.ctaStyle, 'fontFamily', 'Arial'),
          fontSize: getStyleProperty(slideData.ctaStyle, 'fontSize', 30) * scaleFactor,
          fill: '#000000',
          fontWeight: getStyleProperty(slideData.ctaStyle, 'fontWeight', 'bold'),
          textAlign: 'center',
          originX: 'center',
          originY: 'center',
          width: maxTextWidth,
          splitByGrapheme: true,
          selectable: true,
          editable: true,
          evented: true,
          lineHeight: 1.4,
          lockMovementX: false,
          lockMovementY: false,
          lockRotation: false,
          lockScalingX: false,
          lockScalingY: false
        })

        // Add decorative elements
        const accentRect = new fabric.Rect({
          left: canvas.width / 2,
          top: canvas.height * 0.4,
          width: 200 * scaleFactor,
          height: 4 * scaleFactor,
          fill: '#F4B400',
          originX: 'center',
          originY: 'center'
        })

        // Make all text objects editable
        makeTextEditable(title)
        makeTextEditable(subtitle)
        makeTextEditable(ctaText)

        // Footer handle removed

        // Page number label removed

        canvas.add(new fabric.Textbox('←', {
          left: canvas.width - (100 * scaleFactor),
          top: canvas.height - (100 * scaleFactor),
          fontFamily: 'Inter',
          fontSize: 48 * scaleFactor,
          fill: '#000000',
          selectable: false,
        }))

        // Sleek progress bar with percentage (bottom center) – match header theme
        {
          const progressBarWidth = canvas.width * 0.5
          const progressBarHeight = 15 * scaleFactor
          const progressBarY = canvas.height - (60 * scaleFactor)
          const progress = ((currentSlideIndex + 1) / totalSlides) * 100
          const accent = '#F4B400'

          const progressBarBg = new fabric.Rect({
            left: canvas.width / 2,
            top: progressBarY,
            width: progressBarWidth,
            height: progressBarHeight,
            fill: 'rgba(0,0,0,0.1)',
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false,
            rx: progressBarHeight / 2,
            ry: progressBarHeight / 2
          })

          const progressBarFill = new fabric.Rect({
            left: canvas.width / 2 - progressBarWidth / 2,
            top: progressBarY,
            width: (progressBarWidth * progress) / 100,
            height: progressBarHeight,
            fill: '#000000',
            originX: 'left',
            originY: 'center',
            selectable: false,
            evented: false,
            rx: progressBarHeight / 2,
            ry: progressBarHeight / 2
          })

          const progressText = new fabric.Text(`${Math.round(progress)}%`, {
            left: canvas.width / 2,
            top: progressBarY + 20 * scaleFactor,
            fontSize: 14 * scaleFactor,
            fill: '#000000',
            fontFamily: 'Arial',
            textAlign: 'center',
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false
          })

          canvas.add(progressBarBg, progressBarFill, progressText)
        }

        canvas.add(accentRect, title, subtitle, ctaText)
      }

      canvas.renderAll()
      setIsLoading(false)

      // Mark that initial AI content has been loaded, now start tracking user changes
      setIsInitialLoad(false)
    }

    renderSlide()
  }, [slideData, slideType, currentSlideIndex])


  const handleObjectUpdate = () => {
    if (onSlideUpdate && fabricCanvasRef.current && !isInitialLoad && !isLoading) {
      // Clear existing timeout
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
      
      // Debounce the update to prevent too frequent calls
      updateTimeoutRef.current = setTimeout(() => {
        const canvas = fabricCanvasRef.current
        const objects = canvas.getObjects()
        // Save the current slide state whenever objects are modified
        const slideState = {
          objects: canvas.toJSON(),
          width: canvas.width,
          height: canvas.height,
          timestamp: Date.now()
        }
        // Include the slide index at the time of this update to avoid race conditions
        onSlideUpdate({ objects, canvas, slideState, slideIndex: previousSlideIndexRef.current })
      }, 300) // 300ms debounce
    }
  }

  const handleImageUpload = (event) => {
    const file = event.target.files[0]
    if (file && fabricCanvasRef.current) {
      const reader = new FileReader()
      reader.onload = (e) => {
        fabric.Image.fromURL(e.target.result, (img) => {
          const canvas = fabricCanvasRef.current

          // Scale image to fit nicely on canvas
          const maxWidth = canvas.width * 0.3
          const maxHeight = canvas.height * 0.3
          const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1)

          img.set({
            left: canvas.width / 2,
            top: canvas.height / 2,
            scaleX: scale,
            scaleY: scale,
            originX: 'center',
            originY: 'center',
            selectable: true,
            editable: true,
            evented: true,
            lockMovementX: false,
            lockMovementY: false,
            lockRotation: false,
            lockScalingX: false,
            lockScalingY: false
          })

          canvas.add(img)
          canvas.setActiveObject(img)
          canvas.renderAll()
          setSelectedObject(img)
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const saveToHistory = () => {
    if (!fabricCanvasRef.current) return

    // Don't save history during initial AI content loading
    if (isInitialLoad) {
      return
    }

    // Don't save history during manual deletions (we handle it manually)
    if (isManualDelete) {
      return
    }

    const canvas = fabricCanvasRef.current
    const state = JSON.stringify(canvas.toJSON(['highlightColor']))

    setUndoHistory(prev => {
      const newHistory = [...prev, state]
      // Keep only last 10 states as requested
      const updatedHistory = newHistory.slice(-10)
      setTimeout(() => onUndoHistoryChange?.(updatedHistory), 0)
      return updatedHistory
    })

    // Clear redo history when new action is performed
    setRedoHistory([])
    setTimeout(() => onRedoHistoryChange?.([]), 0)
  }

  const handleUndo = () => {
    if (undoHistory.length === 0) return

    const canvas = fabricCanvasRef.current
    if (!canvas) return

    // Save current state to redo history
    const currentState = JSON.stringify(canvas.toJSON(['highlightColor']))
    setRedoHistory(prev => [...prev, currentState])

    // Restore previous state
    const previousState = undoHistory[undoHistory.length - 1]
    canvas.loadFromJSON(JSON.parse(previousState), () => {
      canvas.renderAll()
      setSelectedObject(null)
    })

    // Remove last state from undo history
    setUndoHistory(prev => prev.slice(0, -1))
  }

  const handleRedo = () => {
    if (redoHistory.length === 0) return

    const canvas = fabricCanvasRef.current
    if (!canvas) return

    // Save current state to undo history
    const currentState = JSON.stringify(canvas.toJSON(['highlightColor']))
    setUndoHistory(prev => [...prev, currentState])

    // Restore next state
    const nextState = redoHistory[redoHistory.length - 1]
    canvas.loadFromJSON(JSON.parse(nextState), () => {
      canvas.renderAll()
      setSelectedObject(null)
    })

    // Remove last state from redo history
    setRedoHistory(prev => prev.slice(0, -1))
  }

  const handleDeleteSelected = () => {
    if (!selectedObject || !fabricCanvasRef.current) return

    const canvas = fabricCanvasRef.current

    // Set flag to prevent automatic history saving during deletion
    setIsManualDelete(true)

    // Save state BEFORE deletion so undo can restore the deleted object
    const state = JSON.stringify(canvas.toJSON(['highlightColor']))
    setUndoHistory(prev => {
      const newHistory = [...prev, state]
      return newHistory.slice(-10)
    })
    setRedoHistory([])

    canvas.remove(selectedObject)
    canvas.discardActiveObject()
    canvas.renderAll()
    setSelectedObject(null)

    // Reset flag after deletion is complete
    setIsManualDelete(false)
  }

  const updateSelectedObject = (property, value) => {
    if (!selectedObject) return

    console.log(`Updating ${property} to:`, value)

    // Special handling for fontSize to prevent text disappearing
    if (property === 'fontSize') {
      // Ensure fontSize is a valid number
      const fontSize = parseInt(value)
      if (isNaN(fontSize) || fontSize < 1) {
        console.log('Invalid fontSize, skipping update')
        return
      }

      // Store original properties to prevent loss
      const originalText = selectedObject.text
      const originalLeft = selectedObject.left
      const originalTop = selectedObject.top
      const originalWidth = selectedObject.width

      // Update fontSize with proper validation
      selectedObject.set('fontSize', fontSize)

      // Ensure text content is preserved
      if (selectedObject.text !== originalText) {
        selectedObject.set('text', originalText)
      }

      // Recalculate text dimensions to prevent disappearing
      selectedObject.setCoords()

      // Update text wrapping if needed
      if (selectedObject.type === 'text' || selectedObject.type === 'textbox') {
        const canvas = fabricCanvasRef.current
        const maxTextWidth = canvas.width * 0.95
        selectedObject.set('width', maxTextWidth)

        // Ensure position is maintained
        selectedObject.set({
          left: originalLeft,
          top: originalTop
        })
      }

      // Force a re-render to ensure the text is visible
      selectedObject.setCoords()
      fabricCanvasRef.current.renderAll()

    } else {
      // For other properties, use normal update
      selectedObject.set(property, value)
    }

    // Update highlight if it exists
    if (selectedObject.type === 'text' || selectedObject.type === 'textbox') {
      updateTextHighlight(selectedObject)
    }

    // Render the canvas
    fabricCanvasRef.current.renderAll()
    handleObjectUpdate()

    // Force re-render of the component to update the UI
    setForceUpdate(prev => prev + 1)
  }

  // Apply character-level styling to selected text or entire text
  const applyCharacterStyle = (styleType, value = true) => {
    if (!selectedObject || (selectedObject.type !== 'text' && selectedObject.type !== 'textbox')) {
      return
    }

    const canvas = fabricCanvasRef.current

    // Check if text is in editing mode
    if (selectedObject.isEditing) {
      const selectionStart = selectedObject.selectionStart
      const selectionEnd = selectedObject.selectionEnd

      // If no text is selected, apply to entire text
      if (selectionStart === selectionEnd) {
        // Apply to entire text by setting global properties
        let styleProp = {}

        switch (styleType) {
          case 'bold':
            const currentWeight = selectedObject.fontWeight || 'normal'
            styleProp = { fontWeight: currentWeight === 'bold' ? 'normal' : 'bold' }
            break
          case 'italic':
            const currentStyle = selectedObject.fontStyle || 'normal'
            styleProp = { fontStyle: currentStyle === 'italic' ? 'normal' : 'italic' }
            break
          case 'underline':
            const currentUnderline = selectedObject.underline || false
            styleProp = { underline: !currentUnderline }
            break
          case 'linethrough':
            const currentLinethrough = selectedObject.linethrough || false
            styleProp = { linethrough: !currentLinethrough }
            break
          case 'fontSize':
            styleProp = { fontSize: parseInt(value) }
            break
          case 'fill':
            styleProp = { fill: value }
            break
          default:
            return
        }

        selectedObject.set(styleProp)
        canvas.renderAll()
        handleObjectUpdate()
        return
      }

      // Get current styles for the selection
      const currentStyles = selectedObject.getSelectionStyles(selectionStart, selectionEnd)

      // Determine the style property name and toggle value
      let styleProp = {}

      switch (styleType) {
        case 'bold':
          // Check if any character is already bold
          const isBold = currentStyles.some(style => style.fontWeight === 'bold')
          styleProp = { fontWeight: isBold ? 'normal' : 'bold' }
          break
        case 'italic':
          const isItalic = currentStyles.some(style => style.fontStyle === 'italic')
          styleProp = { fontStyle: isItalic ? 'normal' : 'italic' }
          break
        case 'underline':
          const isUnderlined = currentStyles.some(style => style.underline === true)
          styleProp = { underline: !isUnderlined }
          break
        case 'linethrough':
          const isLinethrough = currentStyles.some(style => style.linethrough === true)
          styleProp = { linethrough: !isLinethrough }
          break
        case 'fontSize':
          styleProp = { fontSize: parseInt(value) }
          break
        case 'fill':
          styleProp = { fill: value }
          break
        default:
          return
      }

      // Apply the style to the selection
      selectedObject.setSelectionStyles(styleProp, selectionStart, selectionEnd)

      // Re-render canvas
      canvas.renderAll()
      handleObjectUpdate()
    } else {
      // Not in editing mode, apply to entire text
      let styleProp = {}

      switch (styleType) {
        case 'bold':
          const currentWeight = selectedObject.fontWeight || 'normal'
          styleProp = { fontWeight: currentWeight === 'bold' ? 'normal' : 'bold' }
          break
        case 'italic':
          const currentStyle = selectedObject.fontStyle || 'normal'
          styleProp = { fontStyle: currentStyle === 'italic' ? 'normal' : 'italic' }
          break
        case 'underline':
          const currentUnderline = selectedObject.underline || false
          styleProp = { underline: !currentUnderline }
          break
        case 'linethrough':
          const currentLinethrough = selectedObject.linethrough || false
          styleProp = { linethrough: !currentLinethrough }
          break
        case 'fontSize':
          styleProp = { fontSize: parseInt(value) }
          break
        case 'fill':
          styleProp = { fill: value }
          break
        default:
          return
      }

      selectedObject.set(styleProp)
      canvas.renderAll()
      handleObjectUpdate()
    }
  }

  // Get font size of selected characters
  const getSelectedCharactersFontSize = () => {
    if (!selectedObject || (selectedObject.type !== 'text' && selectedObject.type !== 'textbox')) {
      return selectedObject?.fontSize || 24
    }

    if (selectedObject.isEditing) {
      const selectionStart = selectedObject.selectionStart
      const selectionEnd = selectedObject.selectionEnd

      if (selectionStart === selectionEnd) {
        return selectedObject.fontSize || 24
      }

      const styles = selectedObject.getSelectionStyles(selectionStart, selectionEnd)
      if (styles.length > 0 && styles[0].fontSize) {
        return styles[0].fontSize
      }
    }

    return selectedObject.fontSize || 24
  }

  // Helper function to parse markdown-style formatting in text
  const parseMarkdownText = (text) => {
    if (!text) return { text: '', styles: {} }

    const styles = {}
    let cleanText = text

    // Process all formatting in one pass to avoid offset issues
    const matches = []

    // Find all **bold** patterns
    const boldRegex = /\*\*(.*?)\*\*/g
    let match
    while ((match = boldRegex.exec(text)) !== null) {
      matches.push({
        type: 'bold',
        start: match.index,
        end: match.index + match[0].length,
        content: match[1],
        contentStart: match.index + 2,
        contentEnd: match.index + 2 + match[1].length
      })
    }

    // Find all *italic* patterns (but not **bold**)
    const italicRegex = /(?<!\*)\*(?!\*)([^*]+?)\*(?!\*)/g
    while ((match = italicRegex.exec(text)) !== null) {
      matches.push({
        type: 'italic',
        start: match.index,
        end: match.index + match[0].length,
        content: match[1],
        contentStart: match.index + 1,
        contentEnd: match.index + 1 + match[1].length
      })
    }

    // Find all ~~strikethrough~~ patterns
    const strikethroughRegex = /~~(.*?)~~/g
    while ((match = strikethroughRegex.exec(text)) !== null) {
      matches.push({
        type: 'strikethrough',
        start: match.index,
        end: match.index + match[0].length,
        content: match[1],
        contentStart: match.index + 2,
        contentEnd: match.index + 2 + match[1].length
      })
    }

    // Sort matches by start position (descending) to process from end to start
    matches.sort((a, b) => b.start - a.start)

    // Process matches and build clean text and styles
    let resultText = text
    let offset = 0

    matches.forEach(match => {
      const startIndex = match.contentStart - offset
      const endIndex = match.contentEnd - offset

      // Apply styling to each character in the range
      for (let i = startIndex; i < endIndex; i++) {
        if (!styles[i]) {
          styles[i] = {}
        }

        if (match.type === 'bold') {
          styles[i].fontWeight = 'bold'
        } else if (match.type === 'italic') {
          styles[i].fontStyle = 'italic'
        } else if (match.type === 'strikethrough') {
          styles[i].linethrough = true
        }
      }

      // Remove the formatting markers from text
      resultText = resultText.substring(0, match.start) + match.content + resultText.substring(match.end)
      offset += (match.end - match.start) - match.content.length
    })

    return { text: resultText, styles }
  }

  // Helper: convert flat character-index styles to Fabric Textbox line/char styles
  const toTextboxStyles = (text, flatStyles) => {
    if (!flatStyles || Object.keys(flatStyles).length === 0) return null
    const lines = text.split('\n')
    const nested = {}
    let globalIndex = 0
    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx]
      for (let i = 0; i < line.length; i++) {
        if (flatStyles[globalIndex]) {
          if (!nested[lineIdx]) nested[lineIdx] = {}
          nested[lineIdx][i] = { ...flatStyles[globalIndex] }
        }
        globalIndex++
      }
      // account for the newline character between lines
      globalIndex++
    }
    return Object.keys(nested).length > 0 ? nested : null
  }

  // Helper function to create formatted text with markdown support
  const createFormattedText = (text, options = {}) => {
    const { text: cleanText, styles } = parseMarkdownText(text)

    // Create the base text object
    const textObj = new fabric.Textbox(cleanText, {
      ...options,
      splitByGrapheme: true
    })

    // Apply formatting styles using Fabric's expected nested structure
    const nestedStyles = toTextboxStyles(cleanText, styles)
    if (nestedStyles) {
      textObj.set('styles', nestedStyles)
    }

    return textObj
  }

  // Character-level text highlighting implementation with padding
  const toggleTextHighlight = (textObj, color = '#ffff00') => {
    if (!textObj || (textObj.type !== 'text' && textObj.type !== 'textbox')) return

    const canvas = fabricCanvasRef.current
    const text = textObj.text || ''
    
    // Check if text is currently highlighted
    const isHighlighted = textObj.highlightColor !== undefined
    
    if (isHighlighted) {
      // Remove highlight: clear all character styles and padding
      textObj.highlightColor = undefined
      
      // For single-line text objects
      if (textObj.type === 'text') {
        textObj.set('styles', {})
      } else {
        // For multi-line textbox objects, clear styles entirely to avoid
        // undefined-only style entries that break Fabric serialization
        textObj.set('styles', {})
      }
      
      // Remove stroke, shadow, and padding
      textObj.set({
        stroke: undefined,
        strokeWidth: 0,
        shadow: null,
        padding: 0
      })
    } else {
      // Add highlight: apply background color to each character
      textObj.highlightColor = color
      
      // Calculate padding based on font size for better visual spacing
      const fontSize = textObj.fontSize || 20
      const padding = Math.max(2, fontSize * 0.15)
      
      // For single-line text objects
      if (textObj.type === 'text') {
        const styles = {}
        for (let i = 0; i < text.length; i++) {
          styles[i] = {
            textBackgroundColor: color
          }
        }
        textObj.set('styles', { 0: styles })
      } else {
        // For multi-line textbox objects
        const lines = text.split('\n')
        const newStyles = {}
        
        lines.forEach((line, lineIndex) => {
          newStyles[lineIndex] = {}
          for (let i = 0; i < line.length; i++) {
            newStyles[lineIndex][i] = {
              textBackgroundColor: color
            }
          }
        })
        
        textObj.set('styles', newStyles)
      }
      
      // Add stroke, shadow, and padding for better visibility
      textObj.set({
        stroke: '#000000',
        strokeWidth: Math.max(1, fontSize * 0.05),
        padding: padding,
        shadow: new fabric.Shadow({
          color: 'rgba(0,0,0,0.2)',
          blur: fontSize * 0.15,
          offsetX: 0,
          offsetY: fontSize * 0.08
        })
      })
    }
    
    canvas.renderAll()
  }

  // Update text highlight when text content changes
  const updateTextHighlight = (textObj) => {
    if (!textObj || !textObj.highlightColor) return

    const canvas = fabricCanvasRef.current
    const text = textObj.text || ''
    const color = textObj.highlightColor
    
    // Calculate padding based on font size
    const fontSize = textObj.fontSize || 20
    const padding = Math.max(2, fontSize * 0.15)
    
    // Reapply highlight to all characters (in case text was edited)
    if (textObj.type === 'text') {
      const styles = {}
      for (let i = 0; i < text.length; i++) {
        styles[i] = {
          textBackgroundColor: color
        }
      }
      textObj.set('styles', { 0: styles })
    } else {
      // For multi-line textbox objects
      const lines = text.split('\n')
      const newStyles = {}
      
      lines.forEach((line, lineIndex) => {
        newStyles[lineIndex] = {}
        for (let i = 0; i < line.length; i++) {
          newStyles[lineIndex][i] = {
            textBackgroundColor: color
          }
        }
      })
      
      textObj.set('styles', newStyles)
    }
    
    // Ensure padding is maintained
    textObj.set('padding', padding)
    
    canvas.renderAll()
  }

  const addText = () => {
    const canvas = fabricCanvasRef.current
    const scaleFactor = canvas.width / 1080
    const maxTextWidth = canvas.width * 0.95

    // Helper function to wrap text with better readability
    const wrapText = (text, maxWidth, fontSize) => {
      const words = text.split(' ')
      const lines = []
      let currentLine = ''

      // More conservative character width estimation
      const avgCharWidth = fontSize * 0.5 // Even more conservative
      const maxCharsPerLine = Math.floor(maxWidth / avgCharWidth)

      // Ensure reasonable line length for readability
      const minCharsPerLine = Math.max(6, maxCharsPerLine * 0.3)
      const finalMaxChars = Math.max(minCharsPerLine, maxCharsPerLine)

      for (let i = 0; i < words.length; i++) {
        const testLine = currentLine + (currentLine ? ' ' : '') + words[i]

        // Check if adding this word would exceed the line length
        if (testLine.length <= finalMaxChars) {
          currentLine = testLine
        } else {
          // If current line has content, push it and start new line
          if (currentLine) {
            lines.push(currentLine)
            currentLine = words[i]
          } else {
            // If single word is too long, force it on its own line
            lines.push(words[i])
            currentLine = ''
          }
        }
      }

      // Add the last line if it has content
      if (currentLine) {
        lines.push(currentLine)
      }

      return lines.join('\n')
    }

    const wrappedText = wrapText('New Text', maxTextWidth, 24 * scaleFactor)
    const text = createFormattedText(wrappedText, {
      left: 100 * scaleFactor,
      top: 100 * scaleFactor,
      fontSize: 24 * scaleFactor,
      fill: '#000000',
      width: maxTextWidth,
      splitByGrapheme: true,
      selectable: true,
      editable: true,
      evented: true,
      lockMovementX: false,
      lockMovementY: false,
      lockRotation: false,
      lockScalingX: false,
      lockScalingY: false,
      hasControls: true,
      hasBorders: true,
      cornerSize: 8,
      cornerStyle: 'circle',
      cornerColor: '#007bff',
      borderColor: '#007bff',
      borderScaleFactor: 2
    })

    canvas.add(text)
    canvas.setActiveObject(text)
    canvas.renderAll()
  }

  const addShape = (type) => {
    const canvas = fabricCanvasRef.current
    const scaleFactor = canvas.width / 1080
    let shape

    if (type === 'rectangle') {
      shape = new fabric.Rect({
        left: 100 * scaleFactor,
        top: 100 * scaleFactor,
        width: 100 * scaleFactor,
        height: 100 * scaleFactor,
        fill: '#ff6b6b'
      })
    } else if (type === 'circle') {
      shape = new fabric.Circle({
        left: 100 * scaleFactor,
        top: 100 * scaleFactor,
        radius: 50 * scaleFactor,
        fill: '#4ecdc4'
      })
    }

    if (shape) {
      canvas.add(shape)
      canvas.setActiveObject(shape)
      canvas.renderAll()
    }
  }

  const addPhoneFrame = () => {
    const canvas = fabricCanvasRef.current
    const scaleFactor = canvas.width / 1080

    // Create phone frame background (black bezel)
    const phoneFrame = new fabric.Rect({
      left: 0, // Relative to group
      top: 0, // Relative to group
      width: 120 * scaleFactor,
      height: 240 * scaleFactor,
      fill: '#000000',
      rx: 20 * scaleFactor,
      ry: 20 * scaleFactor,
      selectable: false,
      evented: false
    })

    // Create screen area (white background)
    const screen = new fabric.Rect({
      left: 10 * scaleFactor, // Relative to group
      top: 10 * scaleFactor, // Relative to group
      width: 100 * scaleFactor,
      height: 220 * scaleFactor,
      fill: '#ffffff',
      rx: 15 * scaleFactor,
      ry: 15 * scaleFactor,
      selectable: false,
      evented: false
    })

    // Add the selected photo to the screen if available
    if (phoneFramePhotos.length > 0 && phoneFramePhotos[selectedPhonePhoto]) {
      fabric.Image.fromURL(phoneFramePhotos[selectedPhonePhoto], (img) => {
        const maxWidth = 100 * scaleFactor
        const maxHeight = 220 * scaleFactor
        const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1)

        img.set({
          left: 10 * scaleFactor, // Relative to group
          top: 10 * scaleFactor, // Relative to group
          scaleX: scale,
          scaleY: scale,
          originX: 'left',
          originY: 'top',
          selectable: false,
          evented: false
        })

        // Create a group with all phone frame elements
        const phoneFrameGroup = new fabric.Group([phoneFrame, screen, img], {
          left: canvas.width - 200 * scaleFactor,
          top: 50 * scaleFactor,
          selectable: true,
          editable: true,
          evented: true,
          lockMovementX: false,
          lockMovementY: false,
          lockRotation: false,
          lockScalingX: false,
          lockScalingY: false
        })

        canvas.add(phoneFrameGroup)
        canvas.renderAll()
      })
    } else {
      // Create a group with phone frame and screen
      const phoneFrameGroup = new fabric.Group([phoneFrame, screen], {
        left: canvas.width - 200 * scaleFactor,
        top: 50 * scaleFactor,
        selectable: true,
        editable: true,
        evented: true,
        lockMovementX: false,
        lockMovementY: false,
        lockRotation: false,
        lockScalingX: false,
        lockScalingY: false
      })

      canvas.add(phoneFrameGroup)
      canvas.renderAll()
    }
  }

  const handlePhoneFramePhotoUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const newPhotos = [...phoneFramePhotos, e.target.result]
        setPhoneFramePhotos(newPhotos)
        onPhoneFramePhotosChange?.(newPhotos)
      }
      reader.readAsDataURL(file)
    }
  }



  const resetCanvas = () => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.clear()
      fabricCanvasRef.current.setBackgroundColor('#ffffff', fabricCanvasRef.current.renderAll.bind(fabricCanvasRef.current))
    }
  }

  // Enable text editing function
  const enableTextEditing = (textObj) => {
    if (!textObj || (textObj.type !== 'text' && textObj.type !== 'textbox')) return

    console.log('Enabling character-level text editing for:', textObj)

    const canvas = fabricCanvasRef.current
    if (!canvas) return

    // Ensure the object is properly configured for character-level editing
    textObj.set({
      selectable: true,
      editable: true,
      evented: true,
      lockMovementX: false,
      lockMovementY: false,
      lockRotation: false,
      lockScalingX: false,
      lockScalingY: false
    })

    // Set as active object
    canvas.setActiveObject(textObj)

    // Enable character-level editing
    try {
      // For Fabric.js v5, use the modern approach
      if (textObj.enterEditing && typeof textObj.enterEditing === 'function') {
        console.log('Using enterEditing method for character-level editing')
        textObj.enterEditing()
        setIsTextEditing(true)
        return
      }

      // Fallback: Set editing property
      console.log('Setting editing property for character-level editing')
      textObj.set('editing', true)
      setIsTextEditing(true)
      canvas.renderAll()

    } catch (error) {
      console.error('Failed to enable character-level text editing:', error)
      // Fallback: just select the object
      canvas.setActiveObject(textObj)
      canvas.renderAll()
    }
  }

  // Make the function available globally for debugging
  window.enableTextEditing = enableTextEditing

  // Get current slide state (for saving on navigation/PDF export)
  const getCurrentSlideState = () => {
    if (!fabricCanvasRef.current) return null

    const canvas = fabricCanvasRef.current
    return {
      objects: canvas.toJSON(),
      width: canvas.width,
      height: canvas.height,
      timestamp: Date.now()
    }
  }

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    addText,
    addShape,
    handleImageUpload,
    addPhoneFrame,
    handlePhoneFramePhotoUpload,
    handleUndo,
    handleRedo,
    resetCanvas,
    updateSelectedObject,
    applyCharacterStyle,
    toggleTextHighlight,
    enableTextEditing,
    handleDeleteSelected,
    getCurrentSlideState
  }))

  // Calculate word count for current slide
  const getWordCount = () => {
    if (!slideData) return 0
    const text = slideData.title + ' ' + slideData.subtitle + ' ' + 
                (slideData.bulletPoints ? slideData.bulletPoints.join(' ') : '') +
                (slideData.paragraphs ? slideData.paragraphs.join(' ') : '') +
                (slideData.impactfulLine || '') +
                (slideData.ctaText || '')
    return text.trim().split(/\s+/).filter(word => word.length > 0).length
  }

  const wordCount = getWordCount()
  const isWithinWordLimit = wordCount >= 15 && wordCount <= 40

  return (
    <div className="space-y-4">
      {/* Word Count Display */}
      <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Word Count:</span>
          <span className={`text-sm font-bold ${isWithinWordLimit ? 'text-green-600' : 'text-orange-600'}`}>
            {wordCount}
          </span>
        </div>
        <div className="text-xs text-gray-500">
          Optimal: 15-40 words
        </div>
      </div>

      {/* Canvas */}
      <div className="card">
        <div className="border-2 border-gray-200 rounded-lg overflow-hidden flex justify-center bg-gray-50 p-2">
          <div className="w-full flex justify-center">
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-[80vh] object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  )
})

export default CanvasEditor