import React, { useEffect, useRef, useState } from 'react'
import { fabric } from 'fabric'
import { Palette, Type, Square, Download, RotateCcw } from 'lucide-react'

const CanvasEditor = ({ slideData, slideType = 'header', onSlideUpdate }) => {
  const canvasRef = useRef(null)
  const fabricCanvasRef = useRef(null)
  const [selectedObject, setSelectedObject] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current) return

    // Calculate scaled dimensions to fit container
    const containerWidth = canvasRef.current.parentElement.clientWidth - 32 // Account for padding
    const aspectRatio = 1080 / 1280 // New aspect ratio for 1080x1280
    let canvasWidth = containerWidth
    let canvasHeight = containerWidth / aspectRatio
    
    // If height is too large, scale by height instead
    const maxHeight = window.innerHeight * 0.6 // 60% of viewport height
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

    // Handle text movement to update highlights
    canvas.on('object:moving', (e) => {
      const obj = e.target
      if (obj.type === 'text') {
        updateTextHighlight(obj)
      }
    })

    canvas.on('object:scaling', (e) => {
      const obj = e.target
      if (obj.type === 'text') {
        updateTextHighlight(obj)
      }
    })

    // Enable text editing on double-click
    canvas.on('mouse:dblclick', (e) => {
      const obj = e.target
      if (obj && obj.type === 'text') {
        // Ensure the text object is properly configured for editing
        obj.set({
          selectable: true,
          editable: true,
          evented: true
        })
        
        // For Fabric.js v5, use the correct text editing approach
        canvas.setActiveObject(obj)
        
        // Try different methods to enter text editing mode
        try {
          if (obj.enterEditing && typeof obj.enterEditing === 'function') {
            obj.enterEditing()
          } else if (obj.set && typeof obj.set === 'function') {
            obj.set('editing', true)
            canvas.renderAll()
          } else {
            // Direct approach for Fabric.js v5
            obj.editing = true
            canvas.renderAll()
          }
        } catch (error) {
          console.log('Text editing method not available, using fallback')
          // Fallback: just select the object
          canvas.setActiveObject(obj)
          canvas.renderAll()
        }
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
      const aspectRatio = 1080 / 1280 // New aspect ratio for 1080x1280
      let canvasWidth = containerWidth
      let canvasHeight = containerWidth / aspectRatio
      
      const maxHeight = window.innerHeight * 0.6
      if (canvasHeight > maxHeight) {
        canvasHeight = maxHeight
        canvasWidth = canvasHeight * aspectRatio
      }
      
      canvas.setDimensions({ width: canvasWidth, height: canvasHeight })
      
      // Update text wrapping for all text objects
      const maxTextWidth = canvasWidth * 0.9
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
    if (!slideData || !fabricCanvasRef.current) return

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
    
    // Calculate maximum width for text (90% of canvas width for better text wrapping)
    const maxTextWidth = canvas.width * 0.9
    
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

    if (slideType === 'header') {
      // Create header slide content
      const wrappedTitle = wrapText(slideData.title, maxTextWidth, slideData.titleStyle.fontSize * scaleFactor)
      const title = new fabric.Text(wrappedTitle, {
        left: canvas.width / 2,
        top: canvas.height * 0.3, // Moved up to give more space
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
        lineHeight: 1.6 // Increased line height for better spacing
      })

      // Add highlight background for title
      const titleHighlight = createTextHighlight(title, slideData.accentColor, 0.3)
      titleHighlight.highlightFor = title // Store reference to the text object

      // Add subtitle with text wrapping
      const wrappedSubtitle = wrapText(slideData.subtitle, maxTextWidth, slideData.subtitleStyle.fontSize * scaleFactor)
      const subtitle = new fabric.Text(wrappedSubtitle, {
        left: canvas.width / 2,
        top: canvas.height * 0.6, // Moved down to give more space between title and subtitle
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
        lineHeight: 1.6 // Add explicit line height
      })

      // Add decorative elements - position between title and subtitle
      const accentRect = new fabric.Rect({
        left: canvas.width / 2,
        top: canvas.height * 0.5, // Position between title and subtitle
        width: 200 * scaleFactor,
        height: 4 * scaleFactor,
        fill: slideData.accentColor,
        originX: 'center',
        originY: 'center'
      })

      // Ensure all text objects are editable
      const makeTextEditable = (textObj) => {
        textObj.set({
          selectable: true,
          editable: true,
          evented: true
        })
      }
      
      makeTextEditable(title)
      makeTextEditable(subtitle)
      
      canvas.add(titleHighlight, title, subtitle, accentRect)
    } else {
      // Create info slide content
      const wrappedTitle = wrapText(slideData.title, maxTextWidth, slideData.titleStyle.fontSize * scaleFactor)
      const title = new fabric.Text(wrappedTitle, {
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
        lineHeight: 1.4 // Add explicit line height for title
      })

      // Create subheadings and key points
      let currentY = canvas.height * 0.3
      const lineHeight = 1.8 // Increased line height to prevent overlapping
      const objects = [title]

      slideData.subheadings.forEach((subheading, index) => {
        // Subheading
        const subheadingText = new fabric.Text(subheading.heading, {
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
          lineHeight: 1.6 // Add explicit line height
        })

        objects.push(subheadingText)
        currentY += slideData.subheadingStyle.fontSize * scaleFactor * lineHeight + 40

        // Key points
        subheading.keyPoints.forEach((keyPoint, pointIndex) => {
          const wrappedKeyPoint = wrapText(keyPoint, maxTextWidth, slideData.textStyle.fontSize * scaleFactor)
          const keyPointText = new fabric.Text(wrappedKeyPoint, {
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
            lineHeight: 1.6 // Add explicit line height
          })

          objects.push(keyPointText)
          currentY += slideData.textStyle.fontSize * scaleFactor * lineHeight + 30
        })

        currentY += 50 // Space between subheadings
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

      // Add next page arrow for info slides - using a simple right arrow
      const arrowSize = 50 * scaleFactor // Increased size
      const arrowWidth = arrowSize
      const arrowHeight = arrowSize * 0.7
      
      // Create a simple right-pointing arrow
      const arrowPath = `M 0 ${arrowHeight * 0.2} L ${arrowWidth * 0.7} ${arrowHeight * 0.5} L 0 ${arrowHeight * 0.8} L ${arrowWidth * 0.2} ${arrowHeight * 0.5} Z`
      
      const nextArrow = new fabric.Path(arrowPath, {
        left: canvas.width - (arrowSize + 20),
        top: canvas.height - (arrowSize + 20),
        fill: slideData.accentColor,
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false
      })

      // Ensure all text objects are editable
      const makeTextEditable = (textObj) => {
        textObj.set({
          selectable: true,
          editable: true,
          evented: true
        })
      }
      
      objects.forEach(obj => {
        if (obj.type === 'text') {
          makeTextEditable(obj)
        }
      })

      // Add objects to canvas in correct order
      canvas.add(accentRect) // Add accent line first
      objects.forEach(obj => canvas.add(obj)) // Add all text objects
      canvas.add(nextArrow) // Add arrow last
    }
    
    canvas.renderAll()
    setIsLoading(false)
  }, [slideData, slideType])

  const handleObjectUpdate = () => {
    if (onSlideUpdate && fabricCanvasRef.current) {
      const canvas = fabricCanvasRef.current
      const objects = canvas.getObjects()
      onSlideUpdate({ objects, canvas })
    }
  }

  const updateSelectedObject = (property, value) => {
    if (!selectedObject) return

    selectedObject.set(property, value)
    
    // Update highlight if it exists
    if (selectedObject.type === 'text') {
      updateTextHighlight(selectedObject)
    }
    
    fabricCanvasRef.current.renderAll()
    handleObjectUpdate()
    
    // Force re-render of the component to update the UI
    setSelectedObject({ ...selectedObject })
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
    const maxTextWidth = canvas.width * 0.9
    
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
    const text = new fabric.Text(wrappedText, {
      left: 100 * scaleFactor,
      top: 100 * scaleFactor,
      fontSize: 24 * scaleFactor,
      fill: '#000000',
      width: maxTextWidth,
      splitByGrapheme: true,
      selectable: true,
      editable: true,
      evented: true
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

  const downloadCanvas = async () => {
    if (!onSlideUpdate) {
      // Single slide download (fallback)
      const originalDimensions = fabricCanvasRef.current.getDimensions()
      fabricCanvasRef.current.setDimensions({ width: 1080, height: 1280 })
      
      const dataURL = fabricCanvasRef.current.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 1
      })
      
      fabricCanvasRef.current.setDimensions(originalDimensions)
      fabricCanvasRef.current.renderAll()
      
      const link = document.createElement('a')
      link.download = 'slide.png'
      link.href = dataURL
      link.click()
      return
    }

    // PDF export for multiple slides
    try {
      // Import jsPDF dynamically
      const { default: jsPDF } = await import('jspdf')
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [108, 128] // 1080x1280 pixels converted to mm (roughly 1:10 ratio)
      })

      // Get all slides data from parent component
      const allSlides = window.carouselData || null
      if (!allSlides) {
        alert('No carousel data available for PDF export')
        return
      }

      // Export header slide
      if (allSlides.headerSlide) {
        const headerCanvas = await createSlideCanvas(allSlides.headerSlide, 'header')
        const headerImage = headerCanvas.toDataURL('image/png')
        pdf.addImage(headerImage, 'PNG', 0, 0, 108, 128)
        
        if (allSlides.infoSlides && allSlides.infoSlides.length > 0) {
          pdf.addPage()
        }
      }

      // Export info slides
      if (allSlides.infoSlides) {
        for (let i = 0; i < allSlides.infoSlides.length; i++) {
          if (i > 0) pdf.addPage()
          
          const infoCanvas = await createSlideCanvas(allSlides.infoSlides[i], 'info')
          const infoImage = infoCanvas.toDataURL('image/png')
          pdf.addImage(infoImage, 'PNG', 0, 0, 108, 128)
        }
      }

      pdf.save('carousel-slides.pdf')
    } catch (error) {
      console.error('Error creating PDF:', error)
      alert('Error creating PDF. Please try again.')
    }
  }

  // Helper function to create a canvas for a specific slide
  const createSlideCanvas = async (slideData, slideType) => {
    const canvas = new fabric.Canvas(null, {
      width: 1080,
      height: 1280,
      backgroundColor: '#ffffff'
    })

    // Set background
    if (slideData.background.type === 'gradient') {
      const gradient = new fabric.Gradient({
        type: 'linear',
        coords: { x1: 0, y1: 0, x2: 0, y2: 1280 },
        colorStops: [
          { offset: 0, color: slideData.background.color1 },
          { offset: 1, color: slideData.background.color2 }
        ]
      })
      canvas.setBackgroundColor(gradient, canvas.renderAll.bind(canvas))
    } else {
      canvas.setBackgroundColor(slideData.background.color1, canvas.renderAll.bind(canvas))
    }

    const maxTextWidth = 1080 * 0.9
    const scaleFactor = 1

    // Helper function to wrap text
    const wrapText = (text, maxWidth, fontSize) => {
      const words = text.split(' ')
      const lines = []
      let currentLine = ''
      
      const avgCharWidth = fontSize * 0.5
      const maxCharsPerLine = Math.floor(maxWidth / avgCharWidth)
      const minCharsPerLine = Math.max(6, maxCharsPerLine * 0.3)
      const finalMaxChars = Math.max(minCharsPerLine, maxCharsPerLine)
      
      for (let i = 0; i < words.length; i++) {
        const testLine = currentLine + (currentLine ? ' ' : '') + words[i]
        
        if (testLine.length <= finalMaxChars) {
          currentLine = testLine
        } else {
          if (currentLine) {
            lines.push(currentLine)
            currentLine = words[i]
          } else {
            lines.push(words[i])
            currentLine = ''
          }
        }
      }
      
      if (currentLine) {
        lines.push(currentLine)
      }
      
      return lines.join('\n')
    }

    if (slideType === 'header') {
      // Create header slide content
      const wrappedTitle = wrapText(slideData.title, maxTextWidth, slideData.titleStyle.fontSize)
      const title = new fabric.Text(wrappedTitle, {
        left: 540,
        top: 400,
        fontFamily: slideData.titleStyle.fontFamily,
        fontSize: slideData.titleStyle.fontSize,
        fill: slideData.titleStyle.color,
        fontWeight: slideData.titleStyle.fontWeight,
        textAlign: 'center',
        originX: 'center',
        originY: 'center',
        width: maxTextWidth,
        splitByGrapheme: true,
        lineHeight: 1.6
      })

      const wrappedSubtitle = wrapText(slideData.subtitle, maxTextWidth, slideData.subtitleStyle.fontSize)
      const subtitle = new fabric.Text(wrappedSubtitle, {
        left: 540,
        top: 700,
        fontFamily: slideData.subtitleStyle.fontFamily,
        fontSize: slideData.subtitleStyle.fontSize,
        fill: slideData.subtitleStyle.color,
        fontWeight: slideData.subtitleStyle.fontWeight,
        textAlign: 'center',
        originX: 'center',
        originY: 'center',
        width: maxTextWidth,
        splitByGrapheme: true,
        lineHeight: 1.6
      })

      const accentRect = new fabric.Rect({
        left: 540,
        top: 600,
        width: 200,
        height: 4,
        fill: slideData.accentColor,
        originX: 'center',
        originY: 'center'
      })

      canvas.add(accentRect, title, subtitle)
    } else {
      // Create info slide content
      const wrappedTitle = wrapText(slideData.title, maxTextWidth, slideData.titleStyle.fontSize)
      const title = new fabric.Text(wrappedTitle, {
        left: 540,
        top: 200,
        fontFamily: slideData.titleStyle.fontFamily,
        fontSize: slideData.titleStyle.fontSize,
        fill: slideData.titleStyle.color,
        fontWeight: slideData.titleStyle.fontWeight,
        textAlign: 'center',
        originX: 'center',
        originY: 'center',
        width: maxTextWidth,
        splitByGrapheme: true,
        lineHeight: 1.4
      })

      const accentRect = new fabric.Rect({
        left: 540,
        top: 300,
        width: 200,
        height: 4,
        fill: slideData.accentColor,
        originX: 'center',
        originY: 'center'
      })

      let currentY = 400
      const lineHeight = 1.8
      const objects = [title, accentRect]

      slideData.subheadings.forEach((subheading) => {
        const subheadingText = new fabric.Text(subheading.heading, {
          left: 540,
          top: currentY,
          fontSize: slideData.subheadingStyle.fontSize,
          fontFamily: slideData.subheadingStyle.fontFamily,
          fill: slideData.subheadingStyle.color,
          fontWeight: slideData.subheadingStyle.fontWeight,
          textAlign: 'center',
          originX: 'center',
          originY: 'center',
          width: maxTextWidth,
          splitByGrapheme: true,
          lineHeight: 1.6
        })

        objects.push(subheadingText)
        currentY += slideData.subheadingStyle.fontSize * lineHeight + 40

        subheading.keyPoints.forEach((keyPoint) => {
          const wrappedKeyPoint = wrapText(keyPoint, maxTextWidth, slideData.textStyle.fontSize)
          const keyPointText = new fabric.Text(wrappedKeyPoint, {
            left: 540,
            top: currentY,
            fontSize: slideData.textStyle.fontSize,
            fontFamily: slideData.textStyle.fontFamily,
            fill: slideData.textStyle.color,
            fontWeight: slideData.textStyle.fontWeight,
            textAlign: 'center',
            originX: 'center',
            originY: 'center',
            width: maxTextWidth,
            splitByGrapheme: true,
            lineHeight: 1.6
          })

          objects.push(keyPointText)
          currentY += slideData.textStyle.fontSize * lineHeight + 30
        })

        currentY += 50
      })

      // Add arrow
      const arrowSize = 50
      const arrowWidth = arrowSize
      const arrowHeight = arrowSize * 0.7
      const arrowPath = `M 0 ${arrowHeight * 0.2} L ${arrowWidth * 0.7} ${arrowHeight * 0.5} L 0 ${arrowHeight * 0.8} L ${arrowWidth * 0.2} ${arrowHeight * 0.5} Z`
      
      const nextArrow = new fabric.Path(arrowPath, {
        left: 1060,
        top: 1230,
        fill: slideData.accentColor,
        originX: 'center',
        originY: 'center'
      })

      objects.push(nextArrow)
      objects.forEach(obj => canvas.add(obj))
    }

    canvas.renderAll()
    return canvas
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
              onClick={downloadCanvas}
              className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Download PDF</span>
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
              className="max-w-full max-h-[60vh] object-contain"
            />
          </div>
        </div>
      </div>

      {/* Editing Controls - Compact layout for side-by-side */}
      <div className="grid grid-cols-1 gap-4">
        {/* Add Elements */}
        <div className="card">
          <h4 className="font-semibold mb-3 flex items-center">
            <Square className="h-4 w-4 mr-2" />
            Add Elements
          </h4>
          <div className="grid grid-cols-3 gap-2">
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
          </div>
        </div>

        {/* Object Properties */}
        {selectedObject && (
          <div className="card">
            <h4 className="font-semibold mb-3 flex items-center">
              <Palette className="h-4 w-4 mr-2" />
              Properties
              {selectedObject.type === 'text' && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  Double-click to edit
                </span>
              )}
            </h4>
            <div className="space-y-3">
              {selectedObject.type === 'text' && (
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
