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
      
      // Return text as-is without asterisk formatting
      // Users can highlight content later as per their need
      return text
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

    const createFormattedText = (text, options = {}) => {
      const { text: cleanText, styles } = parseMarkdownText(text)
      
      const textObj = new fabric.Textbox(cleanText, {
        ...options,
        splitByGrapheme: true
      })
      
      if (Object.keys(styles).length > 0) {
        textObj.set('styles', styles)
      }
      
      return textObj
    }

    const createTextHighlight = (textObj, color = '#ffff00', opacity = 0.3) => {
      const fontSize = textObj.fontSize
      const boundingRect = textObj.getBoundingRect()
      const padding = fontSize * 0.2
      const cornerRadius = fontSize * 0.3
      
      return new fabric.Rect({
        left: 0, // Position relative to group center
        top: 0, // Position relative to group center
        width: boundingRect.width + padding,
        height: boundingRect.height + (padding * 0.6),
        fill: color,
        opacity: opacity,
        originX: 'center',
        originY: 'center',
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
      const padding = 30 * scaleFactor;
      const textColor = slideData.subtitleStyle.color || '#333333';

      // Social Handle
      const socialHandle = new fabric.Text(slideData.socialHandle || '@socialhandle', {
          left: padding,
          top: padding,
          fontFamily: slideData.subtitleStyle.fontFamily || 'Arial',
          fontSize: 18 * scaleFactor,
          fill: textColor,
          selectable: false,
      });

      // Page Number
      const pageNumber = new fabric.Text(`${currentSlideIndex + 1}/${totalSlides}`, {
          left: this.slideWidth - padding,
          top: padding,
          fontFamily: slideData.subtitleStyle.fontFamily || 'Arial',
          fontSize: 18 * scaleFactor,
          fill: textColor,
          originX: 'right',
          selectable: false,
      });

      // Title
      const wrappedTitle = wrapText(slideData.title, this.slideWidth - (padding * 2), (slideData.titleStyle.fontSize || 80) * scaleFactor);
      const title = createFormattedText(wrappedTitle, {
          left: padding,
          top: this.slideHeight * 0.45,
          originY: 'center',
          fontFamily: slideData.titleStyle.fontFamily || 'Arial',
          fontSize: (slideData.titleStyle.fontSize || 80) * scaleFactor,
          fill: slideData.titleStyle.color || '#000000',
          fontWeight: slideData.titleStyle.fontWeight || 'bold',
          textAlign: 'left',
          width: this.slideWidth - (padding * 2),
          lineHeight: 1.2,
      });

      // Arrow Icon
      const arrowContainerSize = 50 * scaleFactor;
      const arrowContainer = new fabric.Rect({
          width: arrowContainerSize,
          height: arrowContainerSize,
          fill: slideData.accentColor || '#000000',
          rx: 10 * scaleFactor,
          ry: 10 * scaleFactor,
          originX: 'center',
          originY: 'center',
      });

      const arrow = new fabric.Text('→', {
          fontSize: 30 * scaleFactor,
          fill: slideData.background.color1,
          originX: 'center',
          originY: 'center',
      });

      const arrowGroup = new fabric.Group([arrowContainer, arrow], {
          left: this.slideWidth - padding - (arrowContainerSize / 2),
          top: this.slideHeight - padding - (arrowContainerSize / 2),
          selectable: false,
      });

      canvas.add(socialHandle, pageNumber, title, arrowGroup);

      // Author Info
      if (slideData.authorImageUrl && slideData.authorName) {
        return new Promise((resolve) => {
            fabric.Image.fromURL(slideData.authorImageUrl, (img) => {
                const authorImageSize = 50 * scaleFactor;

                const circle = new fabric.Circle({
                    radius: authorImageSize / 2,
                    originX: 'center',
                    originY: 'center',
                });

                img.scaleToWidth(authorImageSize);
                img.set({
                    clipPath: circle,
                    originX: 'center',
                    originY: 'center',
                });

                const authorNameText = new fabric.Text(slideData.authorName, {
                    left: authorImageSize / 2 + 10 * scaleFactor,
                    top: 0,
                    fontFamily: slideData.subtitleStyle.fontFamily || 'Arial',
                    fontSize: 20 * scaleFactor,
                    fill: textColor,
                    fontWeight: 'bold',
                    originX: 'left',
                    originY: 'center',
                });

                const authorGroup = new fabric.Group([img, authorNameText], {
                    left: padding + authorImageSize / 2,
                    top: this.slideHeight - padding - authorImageSize / 2,
                });

                canvas.add(authorGroup);
                canvas.renderAll();
                resolve(canvas);
            }, { crossOrigin: 'anonymous' });
        });
      }
    } else if (slideType === 'info') {
      // Create info slide content with bullet points
      console.log('Rendering info slide with data:', slideData)
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

      // Process bullet points (new format) or subheadings (old format)
      if (slideData.bulletPoints && slideData.bulletPoints.length > 0) {
        // New bullet point format
        slideData.bulletPoints.forEach((bulletPoint, index) => {
          // Calculate actual text height more accurately
          const bulletText = wrapText(bulletPoint, maxTextWidth, slideData.bulletStyle.fontSize * scaleFactor)
          const lines = bulletText.split('\n')
          const estimatedTextHeight = lines.length * slideData.bulletStyle.fontSize * scaleFactor * 1.1 + 40
          
          // Check if we have enough space for this bullet point
          if (currentY + estimatedTextHeight > this.slideHeight - footerSpace) {
            return // Skip if not enough space
          }
          
          // Create bullet point with bullet symbol
          const bulletSymbol = new fabric.Text('•', {
            left: this.slideWidth * 0.1,
            top: currentY,
            fontSize: slideData.bulletStyle.fontSize * scaleFactor * 1.2,
            fontFamily: slideData.bulletStyle.fontFamily,
            fill: slideData.accentColor,
            fontWeight: 'bold',
            textAlign: 'left',
            originX: 'left',
            originY: 'center'
          })

          // Create bullet point text
          const bulletTextObj = createFormattedText(bulletText, {
            left: this.slideWidth * 0.15,
            top: currentY,
            fontSize: slideData.bulletStyle.fontSize * scaleFactor,
            fontFamily: slideData.bulletStyle.fontFamily,
            fill: slideData.bulletStyle.color,
            fontWeight: slideData.bulletStyle.fontWeight,
            textAlign: 'left',
            originX: 'left',
            originY: 'center',
            width: maxTextWidth * 0.8,
            splitByGrapheme: true,
            lineHeight: 1.1
          })

          objects.push(bulletSymbol, bulletTextObj)
          currentY += estimatedTextHeight
        })
        
        // Handle different slide patterns based on slidePattern
        const slidePattern = slideData.slidePattern || 'bulletPoints'
        
        if (slidePattern === 'bulletPoints') {
          // Traditional bullet points pattern - already handled above
        } else if (slidePattern === 'singleParagraph') {
          // Single impactful paragraph pattern
          if (slideData.paragraphs && slideData.paragraphs.length > 0) {
            const paragraph = slideData.paragraphs[0] // Use only the first paragraph
            const paragraphText = wrapText(paragraph, maxTextWidth, slideData.paragraphStyle.fontSize * scaleFactor)
            const lines = paragraphText.split('\n')
            const estimatedTextHeight = lines.length * slideData.paragraphStyle.fontSize * scaleFactor * 1.4 + 40
            
            if (currentY + estimatedTextHeight > this.slideHeight - footerSpace) {
              return
            }
            
            const paragraphTextObj = createFormattedText(paragraphText, {
              left: this.slideWidth / 2,
              top: currentY,
              fontSize: slideData.paragraphStyle.fontSize * scaleFactor,
              fontFamily: slideData.paragraphStyle.fontFamily,
              fill: slideData.paragraphStyle.color,
              fontWeight: slideData.paragraphStyle.fontWeight,
              textAlign: 'center',
              originX: 'center',
              originY: 'center',
              width: maxTextWidth,
              splitByGrapheme: true,
              lineHeight: 1.4
            })

            objects.push(paragraphTextObj)
            currentY += estimatedTextHeight
          }
        } else if (slidePattern === 'impactfulLine') {
          // Single impactful line pattern
          if (slideData.impactfulLine) {
            const impactfulText = wrapText(slideData.impactfulLine, maxTextWidth, slideData.paragraphStyle.fontSize * scaleFactor)
            const lines = impactfulText.split('\n')
            const estimatedTextHeight = lines.length * slideData.paragraphStyle.fontSize * scaleFactor * 1.3 + 50
            
            if (currentY + estimatedTextHeight > this.slideHeight - footerSpace) {
              return
            }
            
            const impactfulTextObj = createFormattedText(impactfulText, {
              left: this.slideWidth / 2,
              top: currentY,
              fontSize: slideData.paragraphStyle.fontSize * scaleFactor,
              fontFamily: slideData.paragraphStyle.fontFamily,
              fill: slideData.paragraphStyle.color,
              fontWeight: 'bold',
              textAlign: 'center',
              originX: 'center',
              originY: 'center',
              width: maxTextWidth,
              splitByGrapheme: true,
              lineHeight: 1.3
            })

            objects.push(impactfulTextObj)
            currentY += estimatedTextHeight
          }
        } else if (slidePattern === 'mixedContent') {
          // Mixed content pattern - bullets + paragraph
          // Bullets are already handled above, now add paragraph
          if (slideData.paragraphs && slideData.paragraphs.length > 0) {
            const paragraph = slideData.paragraphs[0]
            const paragraphText = wrapText(paragraph, maxTextWidth, slideData.paragraphStyle.fontSize * scaleFactor)
            const lines = paragraphText.split('\n')
            const estimatedTextHeight = lines.length * slideData.paragraphStyle.fontSize * scaleFactor * 1.3 + 30
            
            if (currentY + estimatedTextHeight > this.slideHeight - footerSpace) {
              return
            }
            
            const paragraphTextObj = createFormattedText(paragraphText, {
              left: this.slideWidth / 2,
              top: currentY,
              fontSize: slideData.paragraphStyle.fontSize * scaleFactor,
              fontFamily: slideData.paragraphStyle.fontFamily,
              fill: slideData.paragraphStyle.color,
              fontWeight: slideData.paragraphStyle.fontWeight,
              textAlign: 'center',
              originX: 'center',
              originY: 'center',
              width: maxTextWidth,
              splitByGrapheme: true,
              lineHeight: 1.3
            })

            objects.push(paragraphTextObj)
            currentY += estimatedTextHeight
          }
        }
      } else if (slideData.subheadings && slideData.subheadings.length > 0) {
        // Old subheading format - convert to bullet points
        slideData.subheadings.forEach((subheading, index) => {
          // Add subheading as a bullet point
          const subheadingText = wrapText(subheading.heading, maxTextWidth, slideData.subheadingStyle.fontSize * scaleFactor)
          const lines = subheadingText.split('\n')
          const estimatedTextHeight = lines.length * slideData.subheadingStyle.fontSize * scaleFactor * 1.1 + 40
          
          if (currentY + estimatedTextHeight > this.slideHeight - footerSpace) {
            return
          }
          
          // Create bullet point with bullet symbol
          const bulletSymbol = new fabric.Text('•', {
            left: this.slideWidth * 0.1,
            top: currentY,
            fontSize: slideData.subheadingStyle.fontSize * scaleFactor * 1.2,
            fontFamily: slideData.subheadingStyle.fontFamily,
            fill: slideData.accentColor,
            fontWeight: 'bold',
            textAlign: 'left',
            originX: 'left',
            originY: 'center'
          })

          // Create subheading text
          const subheadingTextObj = createFormattedText(subheadingText, {
            left: this.slideWidth * 0.15,
            top: currentY,
            fontSize: slideData.subheadingStyle.fontSize * scaleFactor,
            fontFamily: slideData.subheadingStyle.fontFamily,
            fill: slideData.subheadingStyle.color,
            fontWeight: slideData.subheadingStyle.fontWeight,
            textAlign: 'left',
            originX: 'left',
            originY: 'center',
            width: maxTextWidth * 0.8,
            splitByGrapheme: true,
            lineHeight: 1.1
          })

          objects.push(bulletSymbol, subheadingTextObj)
          currentY += estimatedTextHeight

          // Add key points as sub-bullets
          if (subheading.keyPoints && subheading.keyPoints.length > 0) {
            subheading.keyPoints.forEach((keyPoint, pointIndex) => {
              const keyPointText = wrapText(highlightImportantWords(keyPoint), maxTextWidth, slideData.textStyle.fontSize * scaleFactor)
              const keyPointLines = keyPointText.split('\n')
              const keyPointHeight = keyPointLines.length * slideData.textStyle.fontSize * scaleFactor * 1.1 + 30
              
              if (currentY + keyPointHeight > this.slideHeight - footerSpace) {
                return
              }
              
              // Create sub-bullet symbol
              const subBulletSymbol = new fabric.Text('◦', {
                left: this.slideWidth * 0.15,
                top: currentY,
                fontSize: slideData.textStyle.fontSize * scaleFactor * 1.1,
                fontFamily: slideData.textStyle.fontFamily,
                fill: slideData.accentColor,
                fontWeight: 'bold',
                textAlign: 'left',
                originX: 'left',
                originY: 'center'
              })

              // Create key point text
              const keyPointTextObj = createFormattedText(keyPointText, {
                left: this.slideWidth * 0.2,
                top: currentY,
                fontSize: slideData.textStyle.fontSize * scaleFactor,
                fontFamily: slideData.textStyle.fontFamily,
                fill: slideData.textStyle.color,
                fontWeight: slideData.textStyle.fontWeight,
                textAlign: 'left',
                originX: 'left',
                originY: 'center',
                width: maxTextWidth * 0.75,
                splitByGrapheme: true,
                lineHeight: 1.1
              })

              objects.push(subBulletSymbol, keyPointTextObj)
              currentY += keyPointHeight
            })
          }
        })
      }

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
      
    } else if (slideType === 'image') {
      // Create image slide with generated image and text
      if (slideData.generatedImage) {
        return new Promise((resolve) => {
          fabric.Image.fromURL(slideData.generatedImage, (img) => {
            // Calculate image dimensions to fit in the upper portion of the slide
            const maxWidth = this.slideWidth * 0.8
            const maxHeight = this.slideHeight * 0.5
            const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1)
            
            img.set({
              left: this.slideWidth / 2,
              top: this.slideHeight * 0.25,
              scaleX: scale,
              scaleY: scale,
              originX: 'center',
              originY: 'center',
              shadow: new fabric.Shadow({
                color: 'rgba(0,0,0,0.3)',
                blur: 20,
                offsetX: 0,
                offsetY: 10
              })
            })
            
            // Add title below the image
            const wrappedTitle = wrapText(slideData.title, maxTextWidth, slideData.titleStyle.fontSize * scaleFactor)
            const title = createFormattedText(wrappedTitle, {
              left: this.slideWidth / 2,
              top: this.slideHeight * 0.65,
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

            // Add subtitle below the title
            const wrappedSubtitle = wrapText(slideData.subtitle, maxTextWidth, slideData.subtitleStyle.fontSize * scaleFactor)
            const subtitle = createFormattedText(wrappedSubtitle, {
              left: this.slideWidth / 2,
              top: this.slideHeight * 0.8,
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

            const accentRect = new fabric.Rect({
              left: this.slideWidth / 2,
              top: this.slideHeight * 0.58,
              width: 200 * scaleFactor,
              height: 4 * scaleFactor,
              fill: slideData.accentColor,
              originX: 'center',
              originY: 'center'
            })

            canvas.add(img, accentRect, title, subtitle)
            this.addProgressBar(canvas, currentSlideIndex, totalSlides, slideData.accentColor, scaleFactor)
            canvas.renderAll()
            resolve(canvas)
          })
        })
      } else {
        // Fallback if image generation failed
        const wrappedTitle = wrapText(slideData.title, maxTextWidth, slideData.titleStyle.fontSize * scaleFactor)
        const title = createFormattedText(wrappedTitle, {
          left: this.slideWidth / 2,
          top: this.slideHeight * 0.4,
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
          top: this.slideHeight * 0.6,
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

        canvas.add(title, subtitle)
        this.addProgressBar(canvas, currentSlideIndex, totalSlides, slideData.accentColor, scaleFactor)
      }
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
