import React, { useEffect, useRef, useState } from 'react'
import { fabric } from 'fabric'
import { Palette, Type, Square, RotateCcw, Image, Upload, Trash2, Undo, Smartphone } from 'lucide-react'
import { generateIconForSlide } from '../services/geminiService'
import PhoneFrame from './PhoneFrame'

const CanvasEditor = ({ slideData, slideType = 'header', currentSlideIndex = 0, totalSlides = 1, headerPicture = null, usePhoneFrame = false, phoneFramePhotos = [], onSlideUpdate }) => {
  const canvasRef = useRef(null)
  const fabricCanvasRef = useRef(null)
  const [selectedObject, setSelectedObject] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [undoHistory, setUndoHistory] = useState([])
  const [redoHistory, setRedoHistory] = useState([])
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [isManualDelete, setIsManualDelete] = useState(false)
  const [selectedPhonePhoto, setSelectedPhonePhoto] = useState(0)

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedObject && fabricCanvasRef.current) {
          handleDeleteSelected()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedObject])

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current) return

    // Calculate scaled dimensions to fit container
    const containerWidth = canvasRef.current.parentElement.clientWidth - 32 // Account for padding
    const aspectRatio = 1440 / 1700 // Increased aspect ratio for 1440x1700
    let canvasWidth = containerWidth
    let canvasHeight = containerWidth / aspectRatio
    
    // If height is too large, scale by height instead
    const maxHeight = window.innerHeight * 0.75 // 75% of viewport height
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
    })

    canvas.on('selection:updated', (e) => {
      setSelectedObject(e.selected[0])
    })

    canvas.on('selection:cleared', () => {
      setSelectedObject(null)
    })

    // Track all actions for undo functionality
    canvas.on('object:added', () => {
      saveToHistory()
    })

    canvas.on('object:removed', () => {
      saveToHistory()
    })

    canvas.on('object:modified', () => {
      saveToHistory()
    })

    canvas.on('object:moving', (e) => {
      const obj = e.target
      
      // Save state before moving starts (if not already saved)
      if (!obj._movingStarted) {
        const state = JSON.stringify(canvas.toJSON())
        setUndoHistory(prev => {
          const newHistory = [...prev, state]
          return newHistory.slice(-10)
        })
        obj._movingStarted = true
      }
      
      // Handle text movement to update highlights
      if (obj.type === 'text' || obj.type === 'textbox') {
        updateTextHighlight(obj)
      }
    })

    canvas.on('object:moved', () => {
      // Save state after moving is complete
      saveToHistory()
    })

    canvas.on('object:scaling', (e) => {
      const obj = e.target
      
      // Save state before scaling starts (if not already saved)
      if (!obj._scalingStarted) {
        const state = JSON.stringify(canvas.toJSON())
        setUndoHistory(prev => {
          const newHistory = [...prev, state]
          return newHistory.slice(-10)
        })
        obj._scalingStarted = true
      }
      
      // Handle text scaling to update highlights
      if (obj.type === 'text' || obj.type === 'textbox') {
        updateTextHighlight(obj)
      }
    })

    canvas.on('object:scaled', () => {
      // Save state after scaling is complete
      saveToHistory()
    })

    canvas.on('object:rotating', (e) => {
      const obj = e.target
      
      // Save state before rotating starts (if not already saved)
      if (!obj._rotatingStarted) {
        const state = JSON.stringify(canvas.toJSON())
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
    })

    canvas.on('text:changed', () => {
      // Save state when text content changes
      saveToHistory()
    })

    canvas.on('text:editing:exited', () => {
      // Save state when text editing is finished
      saveToHistory()
    })



    // Enable text editing on double-click for text objects (Fabric.js v5 compatible)
    canvas.on('mouse:dblclick', (e) => {
      const obj = e.target
      if (obj && (obj.type === 'text' || obj.type === 'textbox')) {
        console.log('Double-click detected on text object')
        enableTextEditing(obj)
      }
    })

    // Also handle single click for text selection
    canvas.on('mouse:down', (e) => {
      const obj = e.target
      if (obj && (obj.type === 'text' || obj.type === 'textbox')) {
        // Ensure the text object is properly configured
        obj.set({
          selectable: true,
          editable: true,
          evented: true
        })
        
        // Set as active object
        canvas.setActiveObject(obj)
            canvas.renderAll()
      }
    })

    // Handle text editing completion
    canvas.on('text:editing:exited', (e) => {
      const obj = e.target
      if (obj && obj.type === 'text') {
        updateTextHighlight(obj)
        handleObjectUpdate()
      }
    })

    // Alternative text editing events for Fabric.js v5
    canvas.on('text:changed', (e) => {
      const obj = e.target
      if (obj && obj.type === 'text') {
        updateTextHighlight(obj)
        handleObjectUpdate()
      }
    })

    // Handle when text editing is completed
    canvas.on('selection:created', (e) => {
      const obj = e.target
      if (obj && obj.type === 'text' && obj.editing === false) {
        updateTextHighlight(obj)
        handleObjectUpdate()
      }
    })

    // Handle text editing events more comprehensively
    canvas.on('text:editing:entered', (e) => {
      console.log('Text editing entered')
    })

    canvas.on('text:editing:exited', (e) => {
      console.log('Text editing exited')
      const obj = e.target
      if (obj && obj.type === 'text') {
        updateTextHighlight(obj)
        handleObjectUpdate()
      }
    })

    // Add a custom text editing handler for Fabric.js v5
    const enableTextEditing = (textObj) => {
      if (!textObj || (textObj.type !== 'text' && textObj.type !== 'textbox')) return
      
      console.log('Enabling text editing for:', textObj)
      
      // Ensure the object is properly configured
      textObj.set({
        selectable: true,
        editable: true,
        evented: true
      })
      
      // Set as active object
      canvas.setActiveObject(textObj)
      
      // For Fabric.js v5, we need to use a different approach
      try {
        // Method 1: For Textbox objects, try direct editing
        if (textObj.type === 'textbox') {
          console.log('Textbox detected, enabling direct editing')
          textObj.set('editing', true)
          canvas.renderAll()
          return
        }
        
        // Method 2: Try the modern Fabric.js v5 approach
        if (textObj.enterEditing && typeof textObj.enterEditing === 'function') {
          console.log('Using enterEditing method')
          textObj.enterEditing()
          return
        }
        
        // Method 3: Use the editing property
        console.log('Setting editing property to true')
        textObj.set('editing', true)
        canvas.renderAll()
        
        // Method 4: Try to create a textbox instead for better editing
        if (!textObj.editing && textObj.type === 'text') {
          console.log('Creating textbox for better editing experience')
          const textbox = new fabric.Textbox(textObj.text, {
            left: textObj.left,
            top: textObj.top,
            width: textObj.width,
            fontSize: textObj.fontSize,
            fontFamily: textObj.fontFamily,
            fill: textObj.fill,
            textAlign: textObj.textAlign,
            originX: textObj.originX,
            originY: textObj.originY,
            selectable: true,
            editable: true,
            evented: true,
            lockMovementX: false,
            lockMovementY: false,
            lockRotation: false,
            lockScalingX: false,
            lockScalingY: false
          })
          
          // Replace the text object with textbox
          canvas.remove(textObj)
          canvas.add(textbox)
          canvas.setActiveObject(textbox)
          canvas.renderAll()
        }
        
      } catch (error) {
        console.error('Failed to enable text editing:', error)
        // Fallback: just select the object
        canvas.setActiveObject(textObj)
        canvas.renderAll()
      }
    }

    // Make the function available globally for debugging
    window.enableTextEditing = enableTextEditing

    // Handle text selection changes
    canvas.on('selection:changed', (e) => {
      const activeObject = e.selected ? e.selected[0] : null
      if (activeObject && (activeObject.type === 'text' || activeObject.type === 'textbox')) {
        setSelectedObject(activeObject)
      } else {
        setSelectedObject(null)
      }
    })

    // Handle object property changes
    canvas.on('object:modified', (e) => {
      const obj = e.target
      if (obj === selectedObject) {
        setSelectedObject({ ...obj })
        if (obj.type === 'text') {
          updateTextHighlight(obj)
        }
      }
    })

    // Handle object scaling and rotation
    canvas.on('object:scaling', (e) => {
      const obj = e.target
      if (obj === selectedObject) {
        setSelectedObject({ ...obj })
      }
    })

    canvas.on('object:rotating', (e) => {
      const obj = e.target
      if (obj === selectedObject) {
        setSelectedObject({ ...obj })
      }
    })

    // Handle window resize
    const handleResize = () => {
      if (!canvas || !canvasRef.current) return
      
      const containerWidth = canvasRef.current.parentElement.clientWidth - 32
      const aspectRatio = 1440 / 1700 // Increased aspect ratio for 1440x1700
      let canvasWidth = containerWidth
      let canvasHeight = containerWidth / aspectRatio
      
      const maxHeight = window.innerHeight * 0.75
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
      canvas.dispose()
    }
  }, [])

  // Create slide content from AI data
  useEffect(() => {
    const renderSlide = async () => {
    if (!slideData || !fabricCanvasRef.current) return

      // Reset initial load flag when slide changes
      setIsInitialLoad(true)
    setIsLoading(true)
    const canvas = fabricCanvasRef.current
    canvas.clear()

    // Set background
    if (slideData.background.type === 'gradient') {
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
    
    // Calculate maximum width for text (95% of canvas width for better text wrapping)
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

    if (slideType === 'header') {
      // Create header slide content
      const wrappedTitle = wrapText(slideData.title, maxTextWidth, slideData.titleStyle.fontSize * scaleFactor)
      const title = createFormattedText(wrappedTitle, {
        left: canvas.width / 2,
        top: headerPicture ? canvas.height * 0.5 : canvas.height * 0.3, // Lower if header picture is present
        fontFamily: slideData.titleStyle.fontFamily,
        fontSize: slideData.titleStyle.fontSize * scaleFactor,
        fill: slideData.titleStyle.color,
        fontWeight: slideData.titleStyle.fontWeight,
        textAlign: 'center',
        originX: 'center',
        originY: 'center',
        width: maxTextWidth,
        splitByGrapheme: true,
        selectable: true,
        editable: true,
        evented: true,
        lineHeight: 1.6, // Increased line height for better spacing
        lockMovementX: false,
        lockMovementY: false,
        lockRotation: false,
        lockScalingX: false,
        lockScalingY: false
      })

      // Add highlight background for title
      const titleHighlight = createTextHighlight(title, slideData.accentColor, 0.3)
      titleHighlight.highlightFor = title // Store reference to the text object

      // Add subtitle with text wrapping
      const wrappedSubtitle = wrapText(slideData.subtitle, maxTextWidth, slideData.subtitleStyle.fontSize * scaleFactor)
      const subtitle = createFormattedText(wrappedSubtitle, {
        left: canvas.width / 2,
        top: headerPicture ? canvas.height * 0.75 : canvas.height * 0.6, // Lower if header picture is present
        fontFamily: slideData.subtitleStyle.fontFamily,
        fontSize: slideData.subtitleStyle.fontSize * scaleFactor,
        fill: slideData.subtitleStyle.color,
        fontWeight: slideData.subtitleStyle.fontWeight,
        textAlign: 'center',
        originX: 'center',
        originY: 'center',
        width: maxTextWidth,
        splitByGrapheme: true,
        selectable: true,
        editable: true,
        evented: true,
        lineHeight: 1.6, // Add explicit line height
        lockMovementX: false,
        lockMovementY: false,
        lockRotation: false,
        lockScalingX: false,
        lockScalingY: false
      })

      // Add decorative elements - position between title and subtitle
      const accentRect = new fabric.Rect({
        left: canvas.width / 2,
        top: headerPicture ? canvas.height * 0.7 : canvas.height * 0.5, // Lower if header picture is present
        width: 200 * scaleFactor,
        height: 4 * scaleFactor,
        fill: slideData.accentColor,
        originX: 'center',
        originY: 'center'
      })

      // Ensure all text objects are editable
      const makeTextEditable = (textObj) => {
        console.log('Making text object editable:', textObj)
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
        console.log('Text object after making editable:', textObj)
      }
      
      makeTextEditable(title)
      makeTextEditable(subtitle)
      
      // Add progress bar to header slide as well
      const footerSpace = 120 * scaleFactor
      const progressBarWidth = canvas.width * 0.5
      const progressBarHeight = 15 * scaleFactor
      const progressBarY = canvas.height - (footerSpace / 2)
      const progress = ((currentSlideIndex + 1) / totalSlides) * 100
      
      // Progress bar background
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
      
      // Progress bar fill
      const progressBarFill = new fabric.Rect({
        left: canvas.width / 2 - progressBarWidth / 2,
        top: progressBarY,
        width: (progressBarWidth * progress) / 100,
        height: progressBarHeight,
        fill: slideData.accentColor,
        originX: 'left',
        originY: 'center',
        selectable: false,
        evented: false,
        rx: progressBarHeight / 2,
        ry: progressBarHeight / 2
      })
      
      // Progress text
      const progressText = new fabric.Text(`${currentSlideIndex + 1}/${totalSlides}`, {
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
      
      // Add header picture if provided
      if (headerPicture && slideType === 'header') {
        fabric.Image.fromURL(headerPicture, (img) => {
          // Scale image to fit nicely in the center of the header
          const maxWidth = canvas.width * 0.4
          const maxHeight = canvas.height * 0.3
          const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1)
          
          img.set({
            left: canvas.width / 2,
            top: canvas.height * 0.15, // Position above the title
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
          canvas.renderAll()
        })
      }
      
      canvas.add(titleHighlight, title, subtitle, accentRect, progressBarBg, progressBarFill, progressText)
    } else if (slideType === 'info') {
      // Create info slide content
      const wrappedTitle = wrapText(slideData.title, maxTextWidth, slideData.titleStyle.fontSize * scaleFactor)
      const title = createFormattedText(wrappedTitle, {
        left: canvas.width / 2,
        top: canvas.height * 0.15,
        fontFamily: slideData.titleStyle.fontFamily,
        fontSize: slideData.titleStyle.fontSize * scaleFactor,
        fill: slideData.titleStyle.color,
        fontWeight: slideData.titleStyle.fontWeight,
        textAlign: 'center',
        originX: 'center',
        originY: 'center',
        width: maxTextWidth,
        splitByGrapheme: true,
        selectable: true,
        editable: true,
        evented: true,
        lineHeight: 1.4, // Add explicit line height for title
        lockMovementX: false,
        lockMovementY: false,
        lockRotation: false,
        lockScalingX: false,
        lockScalingY: false
      })

      // Create subheadings and key points
      // Account for footer space (120px) when positioning text
      const footerSpace = 120 * scaleFactor
      const availableHeight = canvas.height - footerSpace
      let currentY = availableHeight * 0.3 + (canvas.height - availableHeight) / 2
      const lineHeight = 1.2 // Reduced line height for tighter spacing
      const objects = [title]

      // Process all subheadings (no artificial limit for display)
      slideData.subheadings.forEach((subheading, index) => {
        // Check if we have enough space for the subheading
        const subheadingHeight = slideData.subheadingStyle.fontSize * scaleFactor * lineHeight + 20
        if (currentY + subheadingHeight > canvas.height - footerSpace) {
          return // Skip if not enough space
        }

        // Subheading
        const subheadingText = createFormattedText(subheading.heading, {
          left: canvas.width / 2,
          top: currentY,
          fontSize: slideData.subheadingStyle.fontSize * scaleFactor,
          fontFamily: slideData.subheadingStyle.fontFamily,
          fill: slideData.subheadingStyle.color,
          fontWeight: slideData.subheadingStyle.fontWeight,
          textAlign: 'center',
          originX: 'center',
          originY: 'center',
          width: maxTextWidth,
          splitByGrapheme: true,
          selectable: true,
          editable: true,
          evented: true,
          lineHeight: 1.2, // Reduced line height for tighter spacing
          lockMovementX: false,
          lockMovementY: false,
          lockRotation: false,
          lockScalingX: false,
          lockScalingY: false
        })

        objects.push(subheadingText)
        currentY += slideData.subheadingStyle.fontSize * scaleFactor * lineHeight + 20

        // Key points with better spacing calculation
        subheading.keyPoints.forEach((keyPoint, pointIndex) => {
          // Calculate actual text height more accurately
          const keyPointText = wrapText(highlightImportantWords(keyPoint), maxTextWidth, slideData.textStyle.fontSize * scaleFactor)
          const lines = keyPointText.split('\n')
          const estimatedTextHeight = lines.length * slideData.textStyle.fontSize * scaleFactor * 1.1 + 35
          
          // Check if we have enough space for this key point
          if (currentY + estimatedTextHeight > canvas.height - footerSpace) {
            console.log('Skipping text to avoid footer overlap')
            return // Skip this key point to avoid footer overlap
          }
          
          const keyPointTextObj = createFormattedText(keyPointText, {
            left: canvas.width / 2,
            top: currentY,
            fontSize: slideData.textStyle.fontSize * scaleFactor,
            fontFamily: slideData.textStyle.fontFamily,
            fill: slideData.textStyle.color,
            fontWeight: slideData.textStyle.fontWeight,
            textAlign: 'center',
            originX: 'center',
            originY: 'center',
            width: maxTextWidth,
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

          objects.push(keyPointTextObj)
          currentY += estimatedTextHeight
        })

        currentY += 25 // Space between subheadings
      })

      // Add decorative elements - position after title
      const accentRect = new fabric.Rect({
        left: canvas.width / 2,
        top: canvas.height * 0.25, // Position below the title
        width: 200 * scaleFactor,
        height: 4 * scaleFactor,
        fill: slideData.accentColor,
        originX: 'center',
        originY: 'center'
      })

      // Add progress bar
      const progressBarWidth = canvas.width * 0.5
      const progressBarHeight = 15 * scaleFactor
      const progressBarY = canvas.height - (footerSpace / 2)
      
      // Calculate progress based on current slide
      const progress = ((currentSlideIndex + 1) / totalSlides) * 100
      
      // Progress bar background
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
      
      // Progress bar fill
      const progressBarFill = new fabric.Rect({
        left: canvas.width / 2 - progressBarWidth / 2,
        top: progressBarY,
        width: (progressBarWidth * progress) / 100,
        height: progressBarHeight,
        fill: slideData.accentColor,
        originX: 'left',
        originY: 'center',
        selectable: false,
        evented: false,
        rx: progressBarHeight / 2,
        ry: progressBarHeight / 2
      })
      
      // Progress text
      const progressText = new fabric.Text(`${currentSlideIndex + 1}/${totalSlides}`, {
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
      
      // Arrow removed as requested

      // Ensure all text objects are editable
      const makeTextEditable = (textObj) => {
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
      }
      
      objects.forEach(obj => {
        if (obj.type === 'text' || obj.type === 'textbox') {
          makeTextEditable(obj)
        }
      })

      // Generate and add icon for info slides
      if (slideType === 'info') {
        try {
          const iconData = await generateIconForSlide(slideData.title, slideData.subheadings.map(sh => sh.title).join(', '))
          if (iconData) {
            // Create a simple icon placeholder for now
            const icon = new fabric.Circle({
              left: canvas.width - 60 * scaleFactor,
              top: 60 * scaleFactor,
              radius: 25 * scaleFactor,
              fill: slideData.accentColor,
              originX: 'center',
              originY: 'center',
              selectable: false,
              evented: false
            })
            objects.push(icon)
          }
        } catch (error) {
          console.log('Icon generation failed, continuing without icon')
        }
      }

      // Add objects to canvas in correct order
      canvas.add(accentRect) // Add accent line first
      objects.forEach(obj => canvas.add(obj)) // Add all text objects
      canvas.add(progressBarBg, progressBarFill, progressText) // Add progress bar elements
    } else if (slideType === 'end') {
      // Create end slide with CTA
      const wrappedTitle = wrapText(slideData.title, maxTextWidth, slideData.titleStyle.fontSize * scaleFactor)
      const title = createFormattedText(wrappedTitle, {
        left: canvas.width / 2,
        top: canvas.height * 0.3,
        fontFamily: slideData.titleStyle.fontFamily,
        fontSize: slideData.titleStyle.fontSize * scaleFactor,
        fill: slideData.titleStyle.color,
        fontWeight: slideData.titleStyle.fontWeight,
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

      const wrappedSubtitle = wrapText(slideData.subtitle, maxTextWidth, slideData.subtitleStyle.fontSize * scaleFactor)
      const subtitle = createFormattedText(wrappedSubtitle, {
        left: canvas.width / 2,
        top: canvas.height * 0.5,
        fontFamily: slideData.subtitleStyle.fontFamily,
        fontSize: slideData.subtitleStyle.fontSize * scaleFactor,
        fill: slideData.subtitleStyle.color,
        fontWeight: slideData.subtitleStyle.fontWeight,
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

      const wrappedCTA = wrapText(slideData.ctaText, maxTextWidth, slideData.ctaStyle.fontSize * scaleFactor)
      const ctaText = createFormattedText(wrappedCTA, {
        left: canvas.width / 2,
        top: canvas.height * 0.7,
        fontFamily: slideData.ctaStyle.fontFamily,
        fontSize: slideData.ctaStyle.fontSize * scaleFactor,
        fill: slideData.ctaStyle.color,
        fontWeight: slideData.ctaStyle.fontWeight,
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
        fill: slideData.accentColor,
        originX: 'center',
        originY: 'center'
      })

      // Add progress bar to end slide as well
      const footerSpace = 120 * scaleFactor
      const progressBarWidth = canvas.width * 0.5
      const progressBarHeight = 15 * scaleFactor
      const progressBarY = canvas.height - (footerSpace / 2)
      const progress = ((currentSlideIndex + 1) / totalSlides) * 100
      
      // Progress bar background
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
      
      // Progress bar fill
      const progressBarFill = new fabric.Rect({
        left: canvas.width / 2 - progressBarWidth / 2,
        top: progressBarY,
        width: (progressBarWidth * progress) / 100,
        height: progressBarHeight,
        fill: slideData.accentColor,
        originX: 'left',
        originY: 'center',
        selectable: false,
        evented: false,
        rx: progressBarHeight / 2,
        ry: progressBarHeight / 2
      })
      
      // Progress text
      const progressText = new fabric.Text(`${currentSlideIndex + 1}/${totalSlides}`, {
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

      // Make all text objects editable
      const makeTextEditable = (textObj) => {
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
      }
      
      makeTextEditable(title)
      makeTextEditable(subtitle)
      makeTextEditable(ctaText)
      
      canvas.add(accentRect, title, subtitle, ctaText, progressBarBg, progressBarFill, progressText)
    }
    
    canvas.renderAll()
    setIsLoading(false)
    
    // Mark that initial AI content has been loaded, now start tracking user changes
    setIsInitialLoad(false)
    }

    renderSlide()
  }, [slideData, slideType])

  const handleObjectUpdate = () => {
    if (onSlideUpdate && fabricCanvasRef.current) {
      const canvas = fabricCanvasRef.current
      const objects = canvas.getObjects()
      onSlideUpdate({ objects, canvas })
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
    const state = JSON.stringify(canvas.toJSON())
    
    setUndoHistory(prev => {
      const newHistory = [...prev, state]
      // Keep only last 10 states as requested
      return newHistory.slice(-10)
    })
    
    // Clear redo history when new action is performed
    setRedoHistory([])
  }

  const handleUndo = () => {
    if (undoHistory.length === 0) return
    
    const canvas = fabricCanvasRef.current
    if (!canvas) return
    
    // Save current state to redo history
    const currentState = JSON.stringify(canvas.toJSON())
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
    const currentState = JSON.stringify(canvas.toJSON())
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
    const state = JSON.stringify(canvas.toJSON())
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
    setSelectedObject({ ...selectedObject })
  }

  // Helper function to parse markdown-style formatting in text
  const parseMarkdownText = (text) => {
    if (!text) return { text: '', styles: [] }
    
    const styles = []
    let cleanText = text
    let currentIndex = 0
    
    // Find all **bold** patterns
    const boldRegex = /\*\*(.*?)\*\*/g
    let match
    
    while ((match = boldRegex.exec(text)) !== null) {
      const startIndex = match.index - (currentIndex * 4) // Account for removed **
      const endIndex = startIndex + match[1].length
      
      styles.push({
        start: startIndex,
        end: endIndex,
        style: 'bold'
      })
      
      // Remove ** from text
      cleanText = cleanText.replace(match[0], match[1])
      currentIndex++
    }
    
    return { text: cleanText, styles }
  }

  // Helper function to create formatted text with markdown support
  const createFormattedText = (text, options = {}) => {
    const { text: cleanText, styles } = parseMarkdownText(text)
    
    // Create the base text object
    const textObj = new fabric.Textbox(cleanText, {
      ...options,
      splitByGrapheme: true
    })
    
    // Apply formatting styles
    if (styles.length > 0) {
      const textStyles = {}
      styles.forEach(style => {
        for (let i = style.start; i < style.end; i++) {
          if (style.style === 'bold') {
            textStyles[i] = { fontWeight: 'bold' }
          }
        }
      })
      
      if (Object.keys(textStyles).length > 0) {
        textObj.set('styles', textStyles)
      }
    }
    
    return textObj
  }

  // Helper function to create text highlight with rounded, fluid appearance
  const createTextHighlight = (textObj, color = '#ffff00', opacity = 0.3) => {
    const fontSize = textObj.fontSize
    const boundingRect = textObj.getBoundingRect()
    const padding = fontSize * 0.2 // Reduced padding for better space utilization
    const cornerRadius = fontSize * 0.3 // Rounded corners based on font size
    
    return new fabric.Rect({
      left: textObj.left,
      top: textObj.top,
      width: boundingRect.width + padding,
      height: boundingRect.height + (padding * 0.6),
      fill: color,
      opacity: opacity,
      originX: textObj.originX,
      originY: textObj.originY,
      selectable: false,
      evented: false,
      rx: cornerRadius, // Horizontal corner radius
      ry: cornerRadius, // Vertical corner radius
      stroke: 'none', // No border for cleaner look
      shadow: new fabric.Shadow({
        color: 'rgba(0,0,0,0.1)',
        blur: fontSize * 0.2,
        offsetX: 0,
        offsetY: fontSize * 0.1
      })
    })
  }

  // Function to toggle text highlight
  const toggleTextHighlight = (textObj, color = '#ffff00') => {
    if (!textObj || textObj.type !== 'text') return
    
    const canvas = fabricCanvasRef.current
    const objects = canvas.getObjects()
    
    // Check if highlight already exists for this text
    const existingHighlight = objects.find(obj => 
      obj.highlightFor === textObj && obj.type === 'rect'
    )
    
    if (existingHighlight) {
      // Remove existing highlight
      canvas.remove(existingHighlight)
    } else {
      // Create new highlight
      const highlight = createTextHighlight(textObj, color, 0.3)
      highlight.highlightFor = textObj // Store reference to the text object
      canvas.add(highlight)
      canvas.sendToBack(highlight) // Send highlight behind text
    }
    
    canvas.renderAll()
  }

  // Function to update text highlight when text is moved or resized
  const updateTextHighlight = (textObj) => {
    if (!textObj || textObj.type !== 'text') return
    
    const canvas = fabricCanvasRef.current
    const objects = canvas.getObjects()
    
    // Find existing highlight for this text
    const existingHighlight = objects.find(obj => 
      obj.highlightFor === textObj && obj.type === 'rect'
    )
    
    if (existingHighlight) {
      // Update highlight position and size with rounded styling
      const fontSize = textObj.fontSize
      const boundingRect = textObj.getBoundingRect()
      const padding = fontSize * 0.4
      const cornerRadius = fontSize * 0.3
      
      existingHighlight.set({
        left: textObj.left,
        top: textObj.top,
        width: boundingRect.width + padding,
        height: boundingRect.height + (padding * 0.6),
        rx: cornerRadius,
        ry: cornerRadius,
        shadow: new fabric.Shadow({
          color: 'rgba(0,0,0,0.1)',
          blur: fontSize * 0.2,
          offsetX: 0,
          offsetY: fontSize * 0.1
        })
      })
      
      canvas.renderAll()
    }
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
      lockScalingY: false
    })
    
    // Create highlight for the text
    const textHighlight = createTextHighlight(text, '#ffff00', 0.3)
    
    canvas.add(textHighlight, text)
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
    if (!usePhoneFrame || !phoneFramePhotos || phoneFramePhotos.length === 0) return
    
    const canvas = fabricCanvasRef.current
    const scaleFactor = canvas.width / 1080
    
    // Create phone frame background (black bezel)
    const phoneFrame = new fabric.Rect({
      left: canvas.width - 200 * scaleFactor,
      top: 50 * scaleFactor,
      width: 120 * scaleFactor,
      height: 240 * scaleFactor,
      fill: '#000000',
      rx: 20 * scaleFactor,
      ry: 20 * scaleFactor,
      selectable: true,
      editable: true,
      evented: true,
      lockMovementX: false,
      lockMovementY: false,
      lockRotation: false,
      lockScalingX: false,
      lockScalingY: false
    })
    
    // Create screen area (white background)
    const screen = new fabric.Rect({
      left: canvas.width - 190 * scaleFactor,
      top: 60 * scaleFactor,
      width: 100 * scaleFactor,
      height: 220 * scaleFactor,
      fill: '#ffffff',
      rx: 15 * scaleFactor,
      ry: 15 * scaleFactor,
      selectable: false,
      evented: false
    })
    
    // Add the selected photo to the screen
    if (phoneFramePhotos[selectedPhonePhoto]) {
      fabric.Image.fromURL(phoneFramePhotos[selectedPhonePhoto], (img) => {
        const maxWidth = 100 * scaleFactor
        const maxHeight = 220 * scaleFactor
        const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1)
        
        img.set({
          left: canvas.width - 190 * scaleFactor,
          top: 60 * scaleFactor,
          scaleX: scale,
          scaleY: scale,
          originX: 'left',
          originY: 'top',
          selectable: false,
          evented: false
        })
        
        canvas.add(phoneFrame, screen, img)
        canvas.renderAll()
      })
    } else {
      canvas.add(phoneFrame, screen)
      canvas.renderAll()
    }
  }



  const resetCanvas = () => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.clear()
      fabricCanvasRef.current.setBackgroundColor('#ffffff', fabricCanvasRef.current.renderAll.bind(fabricCanvasRef.current))
    }
  }

  return (
    <div className="space-y-4">
      {/* Canvas */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Canvas Editor</h3>
          <div className="flex space-x-2">
              <button
                onClick={handleUndo}
                disabled={undoHistory.length === 0}
                className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Undo className="h-4 w-4" />
                <span>Undo</span>
              </button>
              <button
                onClick={handleRedo}
                disabled={redoHistory.length === 0}
                className="flex items-center space-x-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Undo className="h-4 w-4 rotate-180" />
                <span>Redo</span>
            </button>
            <button
              onClick={resetCanvas}
              className="flex items-center space-x-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset</span>
            </button>
          </div>
        </div>
        
        <div className="border-2 border-gray-200 rounded-lg overflow-hidden flex justify-center bg-gray-50 p-4">
          <div className="w-full flex justify-center">
            <canvas 
              ref={canvasRef} 
                className="max-w-full max-h-[75vh] object-contain"
            />
          </div>
        </div>
      </div>

      {/* Phone Frame Preview */}
      {usePhoneFrame && phoneFramePhotos.length > 0 && (
        <div className="card">
          <h4 className="font-semibold mb-3 flex items-center">
            <Smartphone className="h-4 w-4 mr-2" />
            Phone Frame Preview
          </h4>
          <PhoneFrame 
            photos={phoneFramePhotos}
            onPhotoSelect={setSelectedPhonePhoto}
            selectedPhotoIndex={selectedPhonePhoto}
          />
        </div>
      )}

      {/* Editing Controls - Back to bottom layout */}
      <div className="grid grid-cols-1 gap-4">
        {/* Add Elements */}
        <div className="card">
          <h4 className="font-semibold mb-3 flex items-center">
            <Square className="h-4 w-4 mr-2" />
            Add Elements
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={addText}
              className="flex flex-col items-center space-y-1 px-2 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <Type className="h-4 w-4" />
              <span className="text-xs">Text</span>
            </button>
            <button
              onClick={() => addShape('rectangle')}
              className="flex flex-col items-center space-y-1 px-2 py-3 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
            >
              <Square className="h-4 w-4" />
              <span className="text-xs">Rect</span>
            </button>
            <button
              onClick={() => addShape('circle')}
              className="flex flex-col items-center space-y-1 px-2 py-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
            >
              <div className="h-4 w-4 rounded-full bg-green-600"></div>
              <span className="text-xs">Circle</span>
            </button>
            <label className="flex flex-col items-center space-y-1 px-2 py-3 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors cursor-pointer">
              <Upload className="h-4 w-4" />
              <span className="text-xs">Image</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
            {usePhoneFrame && phoneFramePhotos.length > 0 && (
              <button
                onClick={addPhoneFrame}
                className="flex flex-col items-center space-y-1 px-2 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <Smartphone className="h-4 w-4" />
                <span className="text-xs">Phone</span>
              </button>
            )}
          </div>
        </div>

        {/* Object Properties */}
        {selectedObject && (
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold flex items-center">
              <Palette className="h-4 w-4 mr-2" />
              Properties
                {(selectedObject.type === 'text' || selectedObject.type === 'textbox') && (
                  <div className="ml-2 flex items-center space-x-2">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  Double-click to edit
                </span>
                    <button
                      onClick={() => enableTextEditing(selectedObject)}
                      className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                    >
                      Edit Now
                    </button>
                  </div>
              )}
            </h4>
              <button
                onClick={handleDeleteSelected}
                className="flex items-center space-x-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            </div>
            <div className="space-y-3">
              {(selectedObject.type === 'text' || selectedObject.type === 'textbox') && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Font Size: {selectedObject.fontSize || 24}px
                    </label>
                    <input
                      key={`fontSize-${selectedObject.fontSize || 24}`}
                      type="range"
                      min="12"
                      max="72"
                      value={selectedObject.fontSize || 24}
                      onChange={(e) => updateSelectedObject('fontSize', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Font Family
                    </label>
                    <select
                      key={`fontFamily-${selectedObject.fontFamily || 'Arial'}`}
                      value={selectedObject.fontFamily || 'Arial'}
                      onChange={(e) => updateSelectedObject('fontFamily', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="Arial">Arial</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Times New Roman">Times New Roman</option>
                    </select>
                  </div>
                </>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <input
                    key={`color-${selectedObject.fill || '#000000'}`}
                    type="color"
                    value={selectedObject.fill || '#000000'}
                    onChange={(e) => updateSelectedObject('fill', e.target.value)}
                    className="w-full h-8 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Opacity: {Math.round((selectedObject.opacity || 1) * 100)}%
                  </label>
                  <input
                    key={`opacity-${selectedObject.opacity || 1}`}
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={selectedObject.opacity || 1}
                    onChange={(e) => updateSelectedObject('opacity', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
              
              {/* Highlight Controls */}
              <div className="border-t pt-3 mt-3">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Text Highlight</h5>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Highlight Color
                      </label>
                      <input
                        type="color"
                        value="#ffff00"
                        onChange={(e) => toggleTextHighlight(selectedObject, e.target.value)}
                        className="w-full h-8 border border-gray-300 rounded"
                      />
                    </div>
                    <div>
                      <button
                        onClick={() => toggleTextHighlight(selectedObject)}
                        className="w-full px-3 py-2 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
                      >
                        Toggle Highlight
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Highlight Style
                    </label>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => toggleTextHighlight(selectedObject, '#ffff00')}
                        className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
                      >
                        Yellow
                      </button>
                      <button
                        onClick={() => toggleTextHighlight(selectedObject, '#ff6b6b')}
                        className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                      >
                        Red
                      </button>
                      <button
                        onClick={() => toggleTextHighlight(selectedObject, '#4ecdc4')}
                        className="px-2 py-1 text-xs bg-teal-100 text-teal-700 rounded hover:bg-teal-200 transition-colors"
                      >
                        Teal
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CanvasEditor
