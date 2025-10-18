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
  async createSlideCanvas(slideData, slideType, headerPicture = null, currentSlideIndex = 0, totalSlides = 1) {
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

    // Set background with safe defaults
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
    const scaleFactor = this.slideWidth / 1080
    const maxTextWidth = this.slideWidth * 0.95

    // Safe style defaults
    const titleStyle = slideData.titleStyle || { fontSize: 48, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold' }
    const subtitleStyle = slideData.subtitleStyle || { fontSize: 24, fontFamily: 'Arial', color: '#333333', fontWeight: 'normal' }
    const bulletStyle = slideData.bulletStyle || { fontSize: 30, fontFamily: 'Arial', color: '#fff4e2', fontWeight: 'normal' }
    const paragraphStyle = slideData.paragraphStyle || { fontSize: 30, fontFamily: 'Arial', color: '#fff4e2', fontWeight: 'normal' }
    const ctaStyle = slideData.ctaStyle || { fontSize: 32, fontFamily: 'Arial', color: '#000000', fontWeight: 'bold' }
    const accentColor = slideData.accentColor || '#F4B400'

    // Helper function to wrap text
    const wrapText = (text, maxWidth, fontSize) => {
      const words = text.split(' ')
      const lines = []
      let currentLine = ''
      
      const avgCharWidth = fontSize * 0.6
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

    const cleanTitleFormatting = (text) => {
      if (!text) return text
      return text
        .replace(/(?<!\*)\*(?!\*)([^*]+?)\*(?!\*)/g, '$1')
        .replace(/\s{2,}/g, ' ')
    }

    const highlightImportantWords = (text) => {
      if (!text) return text
      
      // Return text as-is without asterisk formatting
      // Users can highlight content later as per their need
      return text
    }

    // Helper function to limit words in bullet points (5-6 words)
    const limitBulletPointWords = (text, maxWords = 6) => {
      if (!text) return text
      const words = text.trim().split(/\s+/)
      if (words.length <= maxWords) return text
      return words.slice(0, maxWords).join(' ')
    }

    // Helper function to limit words in paragraphs (15-20 words)
    const limitParagraphWords = (text, maxWords = 20) => {
      if (!text) return text
      const words = text.trim().split(/\s+/)
      if (words.length <= maxWords) return text
      return words.slice(0, maxWords).join(' ')
    }

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
        globalIndex++
      }
      return Object.keys(nested).length > 0 ? nested : null
    }

    const createFormattedText = (text, options = {}) => {
      const { text: cleanText, styles } = parseMarkdownText(text)
      
      const textObj = new fabric.Textbox(cleanText, {
        ...options,
        splitByGrapheme: true
      })
      
      const nestedStyles = toTextboxStyles(cleanText, styles)
      if (nestedStyles) {
        textObj.set('styles', nestedStyles)
      }
      
      return textObj
    }

    const createTextHighlight = (textObj, color = '#ffff00', opacity = 0.3) => {
      const fontSize = textObj.fontSize
      const horizontalPadding = fontSize * 0.4
      const verticalPadding = fontSize * 0.3
      const cornerRadius = fontSize * 0.3
      
      // Adjust vertical offset to account for text baseline and center the text better
      const verticalOffset = fontSize * -0.05
      
      return new fabric.Rect({
        left: textObj.left,
        top: textObj.top + verticalOffset,
        width: textObj.getScaledWidth() + horizontalPadding,
        height: textObj.getScaledHeight() + (verticalPadding * 2),
        fill: color,
        opacity: opacity,
        originX: textObj.originX || 'center',
        originY: textObj.originY || 'center',
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
      // Set background color and add grid
      canvas.setBackgroundColor('#FBEFDB', canvas.renderAll.bind(canvas));
      const gridSpacing = 40;
      const gridLines = [];
      for (let i = 1; i < this.slideWidth / gridSpacing; i++) {
        gridLines.push(new fabric.Line([i * gridSpacing, 0, i * gridSpacing, this.slideHeight], { stroke: 'rgba(0,0,0,0.05)', strokeWidth: 1.5, selectable: false, evented: false }));
      }
      for (let i = 1; i < this.slideHeight / gridSpacing; i++) {
        gridLines.push(new fabric.Line([0, i * gridSpacing, this.slideWidth, i * gridSpacing], { stroke: 'rgba(0,0,0,0.05)', strokeWidth: 1.5, selectable: false, evented: false }));
      }
      canvas.add(new fabric.Group(gridLines, { selectable: false, evented: false }));

      // Add "Liceria.Co"
      canvas.add(new fabric.Textbox('Liceria.Co', {
        left: 80,
        top: 80,
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
              left: this.slideWidth - 280 + j * 12,
              top: 80 + i * 12,
              radius: 3,
              fill: dotColor,
              selectable: false,
              evented: false
            }));
          }
        }
      }
      canvas.add(new fabric.Group(dotPattern, { selectable: false, evented: false }));

      // Add quotation mark
      canvas.add(new fabric.Textbox('“', {
        left: 70,
        top: 180,
        fontFamily: 'Georgia',
        fontSize: 180 * scaleFactor,
        fill: '#000000',
        opacity: 0.8,
        selectable: false,
      }));

      // Add main title
      const titleLines = slideData.title.split('\n');
      let currentTop = 300;
      const titleFontSize = 110 * scaleFactor;
      const lineSpacing = 120 * scaleFactor;

      titleLines.forEach(line => {
        // Strip any asterisks in header title lines
        const cleanLine = String(line).replace(/\*/g, '').trim();

        const text = new fabric.Textbox(cleanLine, {
          left: 80,
          top: currentTop,
          fontFamily: 'Inter',
          fontSize: titleFontSize,
          fill: '#000000',
          fontWeight: 900, // Black weight
          selectable: false,
          lineHeight: 1,
        });
        
        canvas.add(text);
        currentTop += lineSpacing;
      });

      // Sleek progress bar with percentage (bottom center)
      {
        const progressBarWidth = this.slideWidth * 0.5
        const progressBarHeight = 15 * scaleFactor
        const progressBarY = this.slideHeight - 60
        const progress = ((currentSlideIndex + 1) / totalSlides) * 100
        const accent = '#F4B400'

        const titleColor = (slideData?.titleStyle?.color || '#000000').toString().toLowerCase()
        const isWhiteText = titleColor === '#ffffff' || titleColor === 'white' || titleColor === 'rgb(255,255,255)'

        const progressBarBg = new fabric.Rect({
          left: this.slideWidth / 2,
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
          left: this.slideWidth / 2 - progressBarWidth / 2,
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
          left: this.slideWidth / 2,
          top: progressBarY + 20,
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
        left: this.slideWidth - 100,
        top: this.slideHeight - 100,
        fontFamily: 'Inter',
        fontSize: 48 * scaleFactor,
        fill: '#000000',
        selectable: false,
      }));
      
      canvas.renderAll();
      return canvas;

    } else if (slideType === 'info') {
      // Themed info slide: dark grid, brand, X pattern, left-aligned layout
      console.log('Rendering info slide with data:', slideData)

      canvas.setBackgroundColor('#0F0F10', canvas.renderAll.bind(canvas))
      // Brand label
      canvas.add(new fabric.Textbox('Liceria.Co', { left: 80, top: 80, fontFamily: 'Inter', fontSize: 32 * scaleFactor, fill: '#F4B400', fontWeight: 'bold', selectable: false }))
      // X pattern
      {
        const xGroup = []
        const cols = 4, rows = 4
        const xSize = 28 * scaleFactor
        const spacing = 56 * scaleFactor
        const startX = this.slideWidth - (spacing * cols) - (40 * scaleFactor)
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
      }

      const titleLeft = this.slideWidth * 0.1
      const wrappedTitle = wrapText(slideData.title, maxTextWidth * 0.8, titleStyle.fontSize * scaleFactor)
      const title = createFormattedText(wrappedTitle, {
        left: titleLeft,
        top: this.slideHeight * 0.22,
        fontFamily: titleStyle.fontFamily,
        fontSize: titleStyle.fontSize * scaleFactor,
        fill: accentColor,
        fontWeight: titleStyle.fontWeight,
        textAlign: 'left',
        originX: 'left',
        originY: 'top',
        width: maxTextWidth * 0.8,
        splitByGrapheme: true,
        lineHeight: 1.1
      })

      const footerSpace = 140 * scaleFactor
      const availableHeight = this.slideHeight - footerSpace
      let currentY = this.slideHeight * 0.42
      const lineHeight = 1.2
      const objects = [title]

      const slidePattern = slideData.slidePattern || 'bulletPoints'
      
      if (slidePattern === 'bulletPoints') {
        if (slideData.bulletPoints && slideData.bulletPoints.length > 0) {
          slideData.bulletPoints.forEach((bulletPoint, index) => {
          const bulletText = wrapText(String(bulletPoint).trim(), maxTextWidth, bulletStyle.fontSize * scaleFactor)
            const lines = bulletText.split('\n')
            const estimatedTextHeight = lines.length * bulletStyle.fontSize * scaleFactor * 1.2 + 50
            if (currentY + estimatedTextHeight > this.slideHeight - footerSpace) {
              return
            }
            const bulletSymbol = new fabric.Text('•', {
              left: titleLeft,
              top: currentY,
              fontSize: bulletStyle.fontSize * scaleFactor * 1.2,
              fontFamily: bulletStyle.fontFamily,
              fill: accentColor,
              fontWeight: 'bold',
              textAlign: 'left',
              originX: 'left',
              originY: 'center'
            })
            const bulletTextObj = createFormattedText(bulletText, {
              left: titleLeft + this.slideWidth * 0.05,
              top: currentY,
              fontSize: bulletStyle.fontSize * scaleFactor,
              fontFamily: bulletStyle.fontFamily,
              fill: bulletStyle.color || '#fff4e2',
              fontWeight: bulletStyle.fontWeight,
              textAlign: 'left',
              originX: 'left',
              originY: 'center',
              width: maxTextWidth * 0.75,
              splitByGrapheme: true,
              lineHeight: 1.2
            })
            objects.push(bulletSymbol, bulletTextObj)
            currentY += estimatedTextHeight
          })
        }
      } else if (slidePattern === 'singleParagraph') {
        if (slideData.paragraphs && slideData.paragraphs.length > 0) {
          const paragraph = slideData.paragraphs[0]
          const paragraphText = wrapText(String(paragraph).trim(), maxTextWidth, paragraphStyle.fontSize * scaleFactor)
          const lines = paragraphText.split('\n')
          const estimatedTextHeight = lines.length * paragraphStyle.fontSize * scaleFactor * 1.3 + 50
          if (currentY + estimatedTextHeight > this.slideHeight - footerSpace) {
            return
          }
          const paragraphTextObj = createFormattedText(paragraphText, {
            left: titleLeft,
            top: currentY,
            fontSize: paragraphStyle.fontSize * scaleFactor,
            fontFamily: paragraphStyle.fontFamily,
            fill: paragraphStyle.color || '#fff4e2',
            fontWeight: paragraphStyle.fontWeight,
            textAlign: 'left',
            originX: 'left',
            originY: 'top',
            width: maxTextWidth * 0.8,
            splitByGrapheme: true,
            lineHeight: 1.4
          })
          objects.push(paragraphTextObj)
          currentY += estimatedTextHeight
        }
      } else if (slidePattern === 'impactfulLine') {
        if (slideData.impactfulLine) {
          const impactfulText = wrapText(String(slideData.impactfulLine).trim(), maxTextWidth, paragraphStyle.fontSize * scaleFactor)
          const lines = impactfulText.split('\n')
          const estimatedTextHeight = lines.length * paragraphStyle.fontSize * scaleFactor * 1.3 + 50
          if (currentY + estimatedTextHeight > this.slideHeight - footerSpace) {
            return
          }
          const impactfulTextObj = createFormattedText(impactfulText, {
            left: titleLeft,
            top: currentY,
            fontSize: paragraphStyle.fontSize * scaleFactor,
            fontFamily: paragraphStyle.fontFamily,
            fill: paragraphStyle.color || '#fff4e2',
            fontWeight: 'bold',
            textAlign: 'left',
            originX: 'left',
            originY: 'top',
            width: maxTextWidth * 0.8,
            splitByGrapheme: true,
            lineHeight: 1.3
          })
          objects.push(impactfulTextObj)
          currentY += estimatedTextHeight
        }
      } else if (slidePattern === 'mixedContent') {
        if (slideData.bulletPoints && slideData.bulletPoints.length > 0) {
          slideData.bulletPoints.forEach((bulletPoint, index) => {
          const bulletText = wrapText(String(bulletPoint).trim(), maxTextWidth, bulletStyle.fontSize * scaleFactor)
            const lines = bulletText.split('\n')
            const estimatedTextHeight = lines.length * bulletStyle.fontSize * scaleFactor * 1.2 + 50
            if (currentY + estimatedTextHeight > this.slideHeight - footerSpace) {
              return
            }
            const bulletSymbol = new fabric.Text('•', {
              left: titleLeft,
              top: currentY,
              fontSize: bulletStyle.fontSize * scaleFactor * 1.2,
              fontFamily: bulletStyle.fontFamily,
              fill: accentColor,
              fontWeight: 'bold',
              textAlign: 'left',
              originX: 'left',
              originY: 'center'
            })
            const bulletTextObj = createFormattedText(bulletText, {
              left: titleLeft + this.slideWidth * 0.05,
              top: currentY,
              fontSize: bulletStyle.fontSize * scaleFactor,
              fontFamily: bulletStyle.fontFamily,
              fill: bulletStyle.color || '#fff4e2',
              fontWeight: bulletStyle.fontWeight,
              textAlign: 'left',
              originX: 'left',
              originY: 'center',
              width: maxTextWidth * 0.75,
              splitByGrapheme: true,
              lineHeight: 1.2
            })
            objects.push(bulletSymbol, bulletTextObj)
            currentY += estimatedTextHeight
          })
        }
        if (slideData.paragraphs && slideData.paragraphs.length > 0) {
          const paragraph = slideData.paragraphs[0]
          const limitedParagraph = limitParagraphWords(paragraph, 20)
          const paragraphText = wrapText(limitedParagraph, maxTextWidth, paragraphStyle.fontSize * scaleFactor)
          const lines = paragraphText.split('\n')
          const estimatedTextHeight = lines.length * paragraphStyle.fontSize * scaleFactor * 1.3 + 30
          if (currentY + estimatedTextHeight > this.slideHeight - footerSpace) {
            return
          }
          const paragraphTextObj = createFormattedText(paragraphText, {
            left: titleLeft,
            top: currentY,
            fontSize: paragraphStyle.fontSize * scaleFactor,
            fontFamily: paragraphStyle.fontFamily,
            fill: paragraphStyle.color || '#fff4e2',
            fontWeight: paragraphStyle.fontWeight,
            textAlign: 'left',
            originX: 'left',
            originY: 'top',
            width: maxTextWidth * 0.8,
            splitByGrapheme: true,
            lineHeight: 1.3
          })
          objects.push(paragraphTextObj)
          currentY += estimatedTextHeight
        }
      }

      // Accent stroke near bottom-left
      const accentRect = new fabric.Rect({
        left: titleLeft + 180 * scaleFactor,
        top: this.slideHeight * 0.78,
        width: 300 * scaleFactor,
        height: 6 * scaleFactor,
        fill: accentColor,
        originX: 'center',
        originY: 'center',
        rx: 3 * scaleFactor,
        ry: 3 * scaleFactor
      })

      canvas.add(accentRect)
      objects.forEach(obj => canvas.add(obj))

      // Page number indicator removed

      // Arrow similar to header, bottom-right
      canvas.add(new fabric.Textbox('→', {
        left: this.slideWidth - 100,
        top: this.slideHeight - 100,
        fontFamily: 'Inter',
        fontSize: 48 * scaleFactor,
        fill: accentColor,
        selectable: false,
      }))

      // Sleek progress bar with percentage
      {
        const progressBarWidth = this.slideWidth * 0.5
        const progressBarHeight = 15 * scaleFactor
        const progressBarY = this.slideHeight - 60
        const progress = ((currentSlideIndex + 1) / totalSlides) * 100
        const accent = accentColor

        const titleColorInfo = (titleStyle.color || '#fff4e2').toString().toLowerCase()
        const isWhiteTextInfo = titleColorInfo === '#ffffff' || titleColorInfo === 'white' || titleColorInfo === 'rgb(255,255,255)'
        const progressBarBg = new fabric.Rect({
          left: this.slideWidth / 2,
          top: progressBarY,
          width: progressBarWidth,
          height: progressBarHeight,
          fill: isWhiteTextInfo ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.15)',
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
          fill: accent,
          originX: 'left',
          originY: 'center',
          selectable: false,
          evented: false,
          rx: progressBarHeight / 2,
          ry: progressBarHeight / 2
        })

        const progressText = new fabric.Text(`${Math.round(progress)}%`, {
          left: this.slideWidth / 2,
          top: progressBarY + 20,
          fontSize: 14 * scaleFactor,
          fill: isWhiteTextInfo ? '#FFFFFF' : accent,
          fontFamily: 'Arial',
          textAlign: 'center',
          originX: 'center',
          originY: 'center',
          selectable: false,
          evented: false
        })

        canvas.add(progressBarBg, progressBarFill, progressText)
      }
      
    } else if (slideType === 'end') {
      // Create end slide with CTA using same theme as header
      const objects = []
      let availableHeight = this.slideHeight * 0.9
      let currentY = this.slideHeight * 0.1

      // Override background to match header theme (beach color + grid)
      canvas.setBackgroundColor('#FBEFDB', canvas.renderAll.bind(canvas))
      const gridSpacingEnd = 40
      const gridLinesEnd = []
      for (let i = 1; i < this.slideWidth / gridSpacingEnd; i++) {
        gridLinesEnd.push(new fabric.Line([i * gridSpacingEnd, 0, i * gridSpacingEnd, this.slideHeight], { stroke: 'rgba(0,0,0,0.05)', strokeWidth: 1.5, selectable: false, evented: false }))
      }
      for (let i = 1; i < this.slideHeight / gridSpacingEnd; i++) {
        gridLinesEnd.push(new fabric.Line([0, i * gridSpacingEnd, this.slideWidth, i * gridSpacingEnd], { stroke: 'rgba(0,0,0,0.05)', strokeWidth: 1.5, selectable: false, evented: false }))
      }
      canvas.add(new fabric.Group(gridLinesEnd, { selectable: false, evented: false }))

      // Brand label top-left
      canvas.add(new fabric.Textbox('Liceria.Co', {
        left: 80,
        top: 80,
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
              left: this.slideWidth - 280 + j * 12,
              top: 80 + i * 12,
              radius: 3,
              fill: dotColorEnd,
              selectable: false,
              evented: false
            }))
          }
        }
      }
      canvas.add(new fabric.Group(dotPatternEnd, { selectable: false, evented: false }))
      
      // Do not render generated images on the end slide to match the editor
      
      const title = createFormattedText(slideData.title, {
        fontFamily: titleStyle.fontFamily,
        fontSize: titleStyle.fontSize * scaleFactor,
        fill: '#000000',
        fontWeight: titleStyle.fontWeight,
        textAlign: 'center',
        originX: 'center',
        width: maxTextWidth,
        splitByGrapheme: true,
        lineHeight: 1.2
      })
      
      const subtitle = createFormattedText(slideData.subtitle, {
        fontFamily: subtitleStyle.fontFamily,
        fontSize: subtitleStyle.fontSize * scaleFactor,
        fill: '#000000',
        fontWeight: subtitleStyle.fontWeight,
        textAlign: 'center',
        originX: 'center',
        width: maxTextWidth,
        splitByGrapheme: true,
        lineHeight: 1.4
      })

      const cta = createFormattedText(slideData.ctaText, {
        fontFamily: ctaStyle.fontFamily,
        fontSize: ctaStyle.fontSize * scaleFactor,
        fill: '#000000',
        fontWeight: ctaStyle.fontWeight,
        textAlign: 'center',
        originX: 'center',
        width: maxTextWidth,
        splitByGrapheme: true,
        lineHeight: 1.2,
        backgroundColor: '#F4B400',
        padding: 20
      })
      
      // Vertical distribution
      const totalTextHeight = title.height + subtitle.height + cta.height + 80 // with padding
      const textStartY = currentY + (availableHeight - totalTextHeight) / 2
      
      title.set({ top: textStartY, left: this.slideWidth / 2 })
      subtitle.set({ top: textStartY + title.height + 40, left: this.slideWidth / 2 })
      cta.set({ top: textStartY + title.height + subtitle.height + 80, left: this.slideWidth / 2 })
      
      objects.push(title, subtitle, cta)
      canvas.add(...objects)

      // Rotated page label removed (keep arrow only)

      canvas.add(new fabric.Textbox('←', {
        left: this.slideWidth - 100,
        top: this.slideHeight - 100,
        fontFamily: 'Inter',
        fontSize: 48 * scaleFactor,
        fill: '#000000',
        selectable: false,
      }))

      // Sleek progress bar with percentage (bottom center)
      {
        const progressBarWidth = this.slideWidth * 0.5
        const progressBarHeight = 15 * scaleFactor
        const progressBarY = this.slideHeight - 60
        const progress = ((currentSlideIndex + 1) / totalSlides) * 100
        const accent = accentColor

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
          fill: '#000000',
          originX: 'left',
          originY: 'center',
          selectable: false,
          evented: false,
          rx: progressBarHeight / 2,
          ry: progressBarHeight / 2
        })

        const progressText = new fabric.Text(`${Math.round(progress)}%`, {
          left: this.slideWidth / 2,
          top: progressBarY + 20,
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
    } else if (slideType === 'image') {
      // Image slide: image + title/subtitle + progress bar, page indicator circle, arrow
      const objects = []

      if (slideData.generatedImage) {
        await new Promise(resolve => {
          fabric.Image.fromURL(slideData.generatedImage, (img) => {
            const maxWidth = this.slideWidth * 0.8
            const maxHeight = this.slideHeight * 0.5
            const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1)

            img.set({
              left: this.slideWidth / 2,
              top: this.slideHeight * 0.30,
              scaleX: scale,
              scaleY: scale,
              originX: 'center',
              originY: 'center',
              shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.3)', blur: 20, offsetX: 0, offsetY: 10 })
            })
            objects.push(img)
            resolve()
          }, { crossOrigin: 'anonymous' })
        })
      }

      const accentRect = new fabric.Rect({ left: this.slideWidth / 2, top: this.slideHeight * 0.58, width: 200 * scaleFactor, height: 4 * scaleFactor, fill: slideData.accentColor || '#F4B400', originX: 'center', originY: 'center' })
      objects.push(accentRect)

      const title = createFormattedText(wrapText(slideData.title || '', maxTextWidth, (slideData.titleStyle?.fontSize || 48) * scaleFactor), {
        left: this.slideWidth / 2,
        top: this.slideHeight * 0.65,
        fontFamily: slideData.titleStyle?.fontFamily || 'Arial',
        fontSize: (slideData.titleStyle?.fontSize || 48) * scaleFactor,
        fill: slideData.accentColor || accentColor,
        fontWeight: slideData.titleStyle?.fontWeight || 'bold',
        textAlign: 'center',
        originX: 'center',
        originY: 'center',
        width: maxTextWidth,
        splitByGrapheme: true,
        lineHeight: 1.4
      })
      objects.push(title)

      const subtitle = createFormattedText(wrapText(slideData.subtitle || '', maxTextWidth, (slideData.subtitleStyle?.fontSize || 24) * scaleFactor), {
        left: this.slideWidth / 2,
        top: this.slideHeight * 0.8,
        fontFamily: slideData.subtitleStyle?.fontFamily || 'Arial',
        fontSize: (slideData.subtitleStyle?.fontSize || 24) * scaleFactor,
        fill: slideData.subtitleStyle?.color || '#333333',
        fontWeight: slideData.subtitleStyle?.fontWeight || 'normal',
        textAlign: 'center',
        originX: 'center',
        originY: 'center',
        width: maxTextWidth,
        splitByGrapheme: true,
        lineHeight: 1.4
      })
      objects.push(subtitle)

      objects.forEach(o => canvas.add(o))

      // Progress bar with percentage
      {
        const progressBarWidth = this.slideWidth * 0.5
        const progressBarHeight = 15 * scaleFactor
        const progressBarY = this.slideHeight - 60
        const progress = ((currentSlideIndex + 1) / totalSlides) * 100
        const accent = slideData.accentColor || '#F4B400'

        const titleColorEnd = (slideData?.titleStyle?.color || '#000000').toString().toLowerCase()
        const isWhiteTextEnd = titleColorEnd === '#ffffff' || titleColorEnd === 'white' || titleColorEnd === 'rgb(255,255,255)'
        const progressBarBg = new fabric.Rect({ left: this.slideWidth / 2, top: progressBarY, width: progressBarWidth, height: progressBarHeight, fill: isWhiteTextEnd ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)', originX: 'center', originY: 'center', selectable: false, evented: false, rx: progressBarHeight / 2, ry: progressBarHeight / 2 })
        const progressBarFill = new fabric.Rect({ left: this.slideWidth / 2 - progressBarWidth / 2, top: progressBarY, width: (progressBarWidth * progress) / 100, height: progressBarHeight, fill: '#000000', originX: 'left', originY: 'center', selectable: false, evented: false, rx: progressBarHeight / 2, ry: progressBarHeight / 2 })
        const progressText = new fabric.Text(`${Math.round(progress)}%`, { left: this.slideWidth / 2, top: progressBarY + 20, fontSize: 14 * scaleFactor, fill: isWhiteTextEnd ? '#FFFFFF' : accent, fontFamily: 'Arial', textAlign: 'center', originX: 'center', originY: 'center', selectable: false, evented: false })
        canvas.add(progressBarBg, progressBarFill, progressText)
      }

      // Page number indicator removed for image slide

      // Arrow similar to header (bottom-right)
      canvas.add(new fabric.Textbox('→', { left: this.slideWidth - 100, top: this.slideHeight - 100, fontFamily: 'Inter', fontSize: 48 * scaleFactor, fill: '#000000', selectable: false }))
    }

    // Unified: do not add x/y slide number label; progress bar shows percentage

    canvas.renderAll()
    return canvas
  }

  /**
   * Create a Fabric canvas from a previously saved state (from canvas.toJSON())
   * @param {Object} savedState - { objects: JSON|Object, width?: number, height?: number }
   * @returns {Promise<fabric.Canvas>} The restored canvas
   */
  async createCanvasFromSavedState(savedState) {
    const canvasElement = document.createElement('canvas')
    const width = savedState?.width || this.slideWidth
    const height = savedState?.height || this.slideHeight
    canvasElement.width = width
    canvasElement.height = height

    const canvas = new fabric.Canvas(canvasElement, {
      width,
      height,
      backgroundColor: '#ffffff',
      selection: false,
      preserveObjectStacking: true
    })

    await new Promise((resolve) => {
      const json = savedState.objects
      canvas.loadFromJSON(json, () => {
        canvas.renderAll()
        resolve()
      })
    })

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
      fill: '#000000',
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
