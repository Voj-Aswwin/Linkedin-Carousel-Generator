import { fabric } from 'fabric'

/**
 * Canvas Generator Utility
 * Creates temporary canvas elements for PDF export
 */
export class CanvasGenerator {
  constructor() {
    this.slideWidth = 1080
    this.slideHeight = 1350
  }

  /**
   * Create a temporary canvas element for a specific slide
   * @param {Object} slideData - The slide data
   * @param {string} slideType - Type of slide (header, info, end)
   * @param {string} headerPicture - Optional header picture data URL
   * @param {number} currentSlideIndex - Current slide index
   * @param {number} totalSlides - Total number of slides
   * @param {boolean} usePhoneFrame - Whether to include phone frame
   * @param {Array} phoneFramePhotos - Array of phone frame photos
   * @param {number} selectedPhonePhoto - Index of selected phone photo
   * @returns {Promise<fabric.Canvas>} The generated canvas
   */
  async createSlideCanvas(slideData, slideType, headerPicture = null, currentSlideIndex = 0, totalSlides = 1, usePhoneFrame = false, phoneFramePhotos = [], selectedPhonePhoto = 0) {
    // Create a temporary canvas element
    const canvasElement = document.createElement('canvas')
    canvasElement.width = this.slideWidth
    canvasElement.height = this.slideHeight
    
    // Create Fabric.js canvas
    const canvas = new fabric.Canvas(canvasElement, {
      width: this.slideWidth,
      height: this.slideHeight,
      backgroundColor: '#ffffff',
      selection: false,
      preserveObjectStacking: true
    })

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
    const scaleFactor = this.slideWidth / 1080
    const maxTextWidth = this.slideWidth * 0.95

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

    const highlightImportantWords = (text) => {
      if (!text) return text
      
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

    const parseMarkdownText = (text) => {
      if (!text) return { text: '', styles: [] }
      
      const styles = []
      let cleanText = text
      let currentIndex = 0
      
      const boldRegex = /\*\*(.*?)\*\*/g
      let match
      
      while ((match = boldRegex.exec(text)) !== null) {
        const startIndex = match.index - (currentIndex * 4)
        const endIndex = startIndex + match[1].length
        
        styles.push({
          start: startIndex,
          end: endIndex,
          style: 'bold'
        })
        
        cleanText = cleanText.replace(match[0], match[1])
        currentIndex++
      }
      
      return { text: cleanText, styles }
    }

    const createFormattedText = (text, options = {}) => {
      const { text: cleanText, styles } = parseMarkdownText(text)
      
      const textObj = new fabric.Textbox(cleanText, {
        ...options,
        splitByGrapheme: true
      })
      
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

    const createTextHighlight = (textObj, color = '#ffff00', opacity = 0.3) => {
      const fontSize = textObj.fontSize
      const boundingRect = textObj.getBoundingRect()
      const padding = fontSize * 0.2
      const cornerRadius = fontSize * 0.3
      
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
        rx: cornerRadius,
        ry: cornerRadius,
        stroke: 'none',
        shadow: new fabric.Shadow({
          color: 'rgba(0,0,0,0.1)',
          blur: fontSize * 0.2,
          offsetX: 0,
          offsetY: fontSize * 0.1
        })
      })
    }

    if (slideType === 'header') {
      // Create header slide content
      const wrappedTitle = wrapText(slideData.title, maxTextWidth, slideData.titleStyle.fontSize * scaleFactor)
      const title = createFormattedText(wrappedTitle, {
        left: this.slideWidth / 2,
        top: headerPicture ? this.slideHeight * 0.5 : this.slideHeight * 0.3,
        fontFamily: slideData.titleStyle.fontFamily,
        fontSize: slideData.titleStyle.fontSize * scaleFactor,
        fill: slideData.titleStyle.color,
        fontWeight: slideData.titleStyle.fontWeight,
        textAlign: 'center',
        originX: 'center',
        originY: 'center',
        width: maxTextWidth,
        splitByGrapheme: true,
        lineHeight: 1.6
      })

      const titleHighlight = createTextHighlight(title, slideData.accentColor, 0.3)
      titleHighlight.highlightFor = title

      const wrappedSubtitle = wrapText(slideData.subtitle, maxTextWidth, slideData.subtitleStyle.fontSize * scaleFactor)
      const subtitle = createFormattedText(wrappedSubtitle, {
        left: this.slideWidth / 2,
        top: headerPicture ? this.slideHeight * 0.75 : this.slideHeight * 0.6,
        fontFamily: slideData.subtitleStyle.fontFamily,
        fontSize: slideData.subtitleStyle.fontSize * scaleFactor,
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
        left: this.slideWidth / 2,
        top: headerPicture ? this.slideHeight * 0.7 : this.slideHeight * 0.5,
        width: 200 * scaleFactor,
        height: 4 * scaleFactor,
        fill: slideData.accentColor,
        originX: 'center',
        originY: 'center'
      })

      // Add header picture if provided
      if (headerPicture && slideType === 'header') {
        return new Promise((resolve) => {
          fabric.Image.fromURL(headerPicture, (img) => {
            const maxWidth = this.slideWidth * 0.4
            const maxHeight = this.slideHeight * 0.3
            const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1)
            
            img.set({
              left: this.slideWidth / 2,
              top: this.slideHeight * 0.15,
              scaleX: scale,
              scaleY: scale,
              originX: 'center',
              originY: 'center'
            })
            
            canvas.add(titleHighlight, title, subtitle, accentRect, img)
            this.addProgressBar(canvas, currentSlideIndex, totalSlides, slideData.accentColor, scaleFactor)
            canvas.renderAll()
            resolve(canvas)
          })
        })
      }
      
      canvas.add(titleHighlight, title, subtitle, accentRect)
      this.addProgressBar(canvas, currentSlideIndex, totalSlides, slideData.accentColor, scaleFactor)
      
    } else if (slideType === 'info') {
      // Create info slide content
      const wrappedTitle = wrapText(slideData.title, maxTextWidth, slideData.titleStyle.fontSize * scaleFactor)
      const title = createFormattedText(wrappedTitle, {
        left: this.slideWidth / 2,
        top: this.slideHeight * 0.15,
        fontFamily: slideData.titleStyle.fontFamily,
        fontSize: slideData.titleStyle.fontSize * scaleFactor,
        fill: slideData.titleStyle.color,
        fontWeight: slideData.titleStyle.fontWeight,
        textAlign: 'center',
        originX: 'center',
        originY: 'center',
        width: maxTextWidth,
        splitByGrapheme: true,
        lineHeight: 1.4
      })

      const footerSpace = 120 * scaleFactor
      const availableHeight = this.slideHeight - footerSpace
      let currentY = availableHeight * 0.3 + (this.slideHeight - availableHeight) / 2
      const lineHeight = 1.2
      const objects = [title]

      // Process all subheadings (no artificial limit for PDF export)
      slideData.subheadings.forEach((subheading, index) => {
        // Check if we have enough space for the subheading
        const subheadingHeight = slideData.subheadingStyle.fontSize * scaleFactor * lineHeight + 20
        if (currentY + subheadingHeight > this.slideHeight - footerSpace) {
          return // Skip if not enough space
        }

        const subheadingText = createFormattedText(subheading.heading, {
          left: this.slideWidth / 2,
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
          lineHeight: 1.2
        })

        objects.push(subheadingText)
        currentY += slideData.subheadingStyle.fontSize * scaleFactor * lineHeight + 20

        // Process key points with better spacing calculation
        subheading.keyPoints.forEach((keyPoint, pointIndex) => {
          // Calculate actual text height more accurately
          const keyPointText = wrapText(highlightImportantWords(keyPoint), maxTextWidth, slideData.textStyle.fontSize * scaleFactor)
          const lines = keyPointText.split('\n')
          const estimatedTextHeight = lines.length * slideData.textStyle.fontSize * scaleFactor * 1.1 + 35
          
          // Check if we have enough space for this key point
          if (currentY + estimatedTextHeight > this.slideHeight - footerSpace) {
            return // Skip if not enough space
          }
          
          const keyPointTextObj = createFormattedText(keyPointText, {
            left: this.slideWidth / 2,
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
            lineHeight: 1.1
          })

          objects.push(keyPointTextObj)
          currentY += estimatedTextHeight
        })

        currentY += 25 // Space between subheadings
      })

      const accentRect = new fabric.Rect({
        left: this.slideWidth / 2,
        top: this.slideHeight * 0.25,
        width: 200 * scaleFactor,
        height: 4 * scaleFactor,
        fill: slideData.accentColor,
        originX: 'center',
        originY: 'center'
      })

      canvas.add(accentRect)
      objects.forEach(obj => canvas.add(obj))
      this.addProgressBar(canvas, currentSlideIndex, totalSlides, slideData.accentColor, scaleFactor)
      
    } else if (slideType === 'end') {
      // Create end slide with CTA
      const wrappedTitle = wrapText(slideData.title, maxTextWidth, slideData.titleStyle.fontSize * scaleFactor)
      const title = createFormattedText(wrappedTitle, {
        left: this.slideWidth / 2,
        top: this.slideHeight * 0.3,
        fontFamily: slideData.titleStyle.fontFamily,
        fontSize: slideData.titleStyle.fontSize * scaleFactor,
        fill: slideData.titleStyle.color,
        fontWeight: slideData.titleStyle.fontWeight,
        textAlign: 'center',
        originX: 'center',
        originY: 'center',
        width: maxTextWidth,
        splitByGrapheme: true,
        lineHeight: 1.4
      })

      const wrappedSubtitle = wrapText(slideData.subtitle, maxTextWidth, slideData.subtitleStyle.fontSize * scaleFactor)
      const subtitle = createFormattedText(wrappedSubtitle, {
        left: this.slideWidth / 2,
        top: this.slideHeight * 0.5,
        fontFamily: slideData.subtitleStyle.fontFamily,
        fontSize: slideData.subtitleStyle.fontSize * scaleFactor,
        fill: slideData.subtitleStyle.color,
        fontWeight: slideData.subtitleStyle.fontWeight,
        textAlign: 'center',
        originX: 'center',
        originY: 'center',
        width: maxTextWidth,
        splitByGrapheme: true,
        lineHeight: 1.4
      })

      const wrappedCTA = wrapText(slideData.ctaText, maxTextWidth, slideData.ctaStyle.fontSize * scaleFactor)
      const ctaText = createFormattedText(wrappedCTA, {
        left: this.slideWidth / 2,
        top: this.slideHeight * 0.7,
        fontFamily: slideData.ctaStyle.fontFamily,
        fontSize: slideData.ctaStyle.fontSize * scaleFactor,
        fill: slideData.ctaStyle.color,
        fontWeight: slideData.ctaStyle.fontWeight,
        textAlign: 'center',
        originX: 'center',
        originY: 'center',
        width: maxTextWidth,
        splitByGrapheme: true,
        lineHeight: 1.4
      })

      const accentRect = new fabric.Rect({
        left: this.slideWidth / 2,
        top: this.slideHeight * 0.4,
        width: 200 * scaleFactor,
        height: 4 * scaleFactor,
        fill: slideData.accentColor,
        originX: 'center',
        originY: 'center'
      })

      canvas.add(accentRect, title, subtitle, ctaText)
      this.addProgressBar(canvas, currentSlideIndex, totalSlides, slideData.accentColor, scaleFactor)
    }
    
    // Add phone frame if enabled
    if (usePhoneFrame && phoneFramePhotos && phoneFramePhotos.length > 0) {
      await this.addPhoneFrameToCanvas(canvas, phoneFramePhotos, selectedPhonePhoto, scaleFactor)
    }
    
    canvas.renderAll()
    return canvas
  }

  /**
   * Add progress bar to canvas
   * @param {fabric.Canvas} canvas - The canvas to add progress bar to
   * @param {number} currentSlideIndex - Current slide index
   * @param {number} totalSlides - Total number of slides
   * @param {string} accentColor - Accent color for progress bar
   * @param {number} scaleFactor - Scale factor for sizing
   */
  addProgressBar(canvas, currentSlideIndex, totalSlides, accentColor, scaleFactor) {
    const footerSpace = 120 * scaleFactor
    const progressBarWidth = this.slideWidth * 0.5
    const progressBarHeight = 15 * scaleFactor
    const progressBarY = this.slideHeight - (footerSpace / 2)
    const progress = ((currentSlideIndex + 1) / totalSlides) * 100
    
    const progressBarBg = new fabric.Rect({
      left: this.slideWidth / 2,
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
      left: this.slideWidth / 2 - progressBarWidth / 2,
      top: progressBarY,
      width: (progressBarWidth * progress) / 100,
      height: progressBarHeight,
      fill: accentColor,
      originX: 'left',
      originY: 'center',
      selectable: false,
      evented: false,
      rx: progressBarHeight / 2,
      ry: progressBarHeight / 2
    })
    
    const progressText = new fabric.Text(`${currentSlideIndex + 1}/${totalSlides}`, {
      left: this.slideWidth / 2,
      top: progressBarY + 20 * scaleFactor,
      fontSize: 14 * scaleFactor,
      fill: accentColor,
      fontFamily: 'Arial',
      textAlign: 'center',
      originX: 'center',
      originY: 'center',
      selectable: false,
      evented: false
    })
    
    canvas.add(progressBarBg, progressBarFill, progressText)
  }

  /**
   * Add phone frame to canvas
   * @param {fabric.Canvas} canvas - The canvas to add phone frame to
   * @param {Array} phoneFramePhotos - Array of phone frame photos
   * @param {number} selectedPhotoIndex - Index of selected photo
   * @param {number} scaleFactor - Scale factor for sizing
   */
  async addPhoneFrameToCanvas(canvas, phoneFramePhotos, selectedPhotoIndex, scaleFactor) {
    return new Promise((resolve) => {
      // Create phone frame background (black bezel)
      const phoneFrame = new fabric.Rect({
        left: this.slideWidth - 200 * scaleFactor,
        top: 50 * scaleFactor,
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
        left: this.slideWidth - 190 * scaleFactor,
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
      if (phoneFramePhotos[selectedPhotoIndex]) {
        fabric.Image.fromURL(phoneFramePhotos[selectedPhotoIndex], (img) => {
          const maxWidth = 100 * scaleFactor
          const maxHeight = 220 * scaleFactor
          const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1)
          
          img.set({
            left: this.slideWidth - 190 * scaleFactor,
            top: 60 * scaleFactor,
            scaleX: scale,
            scaleY: scale,
            originX: 'left',
            originY: 'top',
            selectable: false,
            evented: false
          })
          
          canvas.add(phoneFrame, screen, img)
          resolve()
        })
      } else {
        canvas.add(phoneFrame, screen)
        resolve()
      }
    })
  }
}

export const canvasGenerator = new CanvasGenerator()
