/**
 * Rich Text Processor - Robust highlighting system
 * Replaces the flaky asterisk-based highlighting with explicit highlight objects
 */

export class RichTextProcessor {
  constructor() {
    this.accentColor = '#ff6600'
    this.darkAccentColor = '#4a9eff'
  }


  /**
   * Create rich text object from explicit data
   * @param {string} text - Plain text
   * @param {Array} highlights - Array of highlight objects
   * @returns {Object} Rich text object
   */
  createRichText(text, highlights = []) {
    return {
      text: text,
      highlights: highlights
    }
  }

  /**
   * Convert rich text to Fabric.js styles format
   * @param {Object} richText - Rich text object
   * @returns {Object} Fabric.js styles object
   */
  toFabricStyles(richText) {
    if (!richText || !richText.highlights || richText.highlights.length === 0) {
      return {}
    }

    // Safety check for text property
    if (!richText.text || typeof richText.text !== 'string') {
      console.warn('Rich text has no valid text property')
      return {}
    }

    const styles = {}
    const lines = richText.text.split('\n')
    let charIndex = 0

    // Sort highlights by start position to ensure proper processing
    const sortedHighlights = [...richText.highlights].sort((a, b) => a.start - b.start)

    // Process each line
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      styles[lineIndex] = {}
      
      // Calculate line boundaries more accurately
      const lineStart = charIndex
      const lineEnd = charIndex + lines[lineIndex].length
      
      // Find highlights that overlap with this line
      const lineHighlights = sortedHighlights.filter(highlight => {
        return highlight.start < lineEnd && highlight.end > lineStart
      })
      
      // Process each highlight for this line
      lineHighlights.forEach(highlight => {
        // Calculate the relative positions within this line
        const highlightStart = Math.max(highlight.start, lineStart) - lineStart
        const highlightEnd = Math.min(highlight.end, lineEnd) - lineStart
        
        // Ensure we don't go beyond the line length
        const safeStart = Math.max(0, highlightStart)
        const safeEnd = Math.min(lines[lineIndex].length, highlightEnd)
        
        // Apply highlight to characters in this line
        for (let i = safeStart; i < safeEnd; i++) {
          if (i < lines[lineIndex].length) {
            styles[lineIndex][i] = {
              fill: highlight.color,
              fontWeight: highlight.weight || 'bold'
            }
          }
        }
      })
      
      // Move to next line (accounting for newline character)
      charIndex = lineEnd + 1
    }

    return styles
  }

  /**
   * Create Fabric.js Textbox with rich text formatting
   * @param {Object} richText - Rich text object
   * @param {Object} options - Fabric.js options
   * @returns {fabric.Textbox} Fabric.js textbox object
   */
  createFabricTextbox(richText, options = {}) {
    try {
      // Ensure we have valid rich text data
      if (!richText) {
        console.warn('Rich text is null or undefined')
        richText = { text: '', highlights: [] }
      }
      
      if (!richText.text) {
        console.warn('Rich text has no text property')
        richText.text = ''
      }
      
      // Validate rich text before processing
      const validation = this.validateRichText(richText)
      if (!validation.isValid) {
        console.warn('Rich text validation failed:', validation.issues)
        // Return basic textbox without styles if validation fails
        return new fabric.Textbox(richText.text || '', {
          ...options,
          splitByGrapheme: true,
          lineHeight: 1.2,
          charSpacing: 0,
          textAlign: options.textAlign || 'left',
          width: options.width || 200, // Ensure width is set for text wrapping
          maxWidth: options.width || 200, // Set maximum width
          minWidth: 0, // Allow minimum width
          breakWords: true, // Enable word breaking for better text wrapping
          wordBreak: 'break-word', // Force word breaking when needed
          overflow: 'hidden', // Hide overflow text
          lockScalingX: false, // Allow horizontal scaling like manual text boxes
          lockMovementX: false, // Allow horizontal movement
          lockMovementY: false, // Allow vertical movement
          lockRotation: false, // Allow rotation
          lockScalingY: false, // Allow vertical scaling
          clipPath: null // Remove any clipping path that might interfere
        })
      }
      
      const styles = this.toFabricStyles(richText)
      
      const textbox = new fabric.Textbox(richText.text || '', {
        ...options,
        splitByGrapheme: true,
        lineHeight: 1.2,
        charSpacing: 0,
        textAlign: options.textAlign || 'left',
        width: options.width || 200, // Ensure width is set for text wrapping
        maxWidth: options.width || 200, // Set maximum width
        minWidth: 0, // Allow minimum width
        breakWords: true, // Enable word breaking for better text wrapping
        wordBreak: 'break-word', // Force word breaking when needed
        overflow: 'hidden', // Hide overflow text
        lockScalingX: false, // Allow horizontal scaling like manual text boxes
        lockMovementX: false, // Allow horizontal movement
        lockMovementY: false, // Allow vertical movement
        lockRotation: false, // Allow rotation
        lockScalingY: false, // Allow vertical scaling
        clipPath: null // Remove any clipping path that might interfere
      })
      
      // Apply styles if any highlights exist
      if (Object.keys(styles).length > 0) {
        textbox.set('styles', styles)
      }
      
      return textbox
    } catch (error) {
      console.error('Error creating Fabric textbox:', error)
      console.error('Rich text data:', richText)
      
      // Return a basic textbox as fallback
      return new fabric.Textbox('', {
        ...options,
        splitByGrapheme: true,
        lineHeight: 1.2,
        charSpacing: 0,
        textAlign: options.textAlign || 'left',
        width: options.width || 200,
        maxWidth: options.width || 200,
        minWidth: 0,
        breakWords: true,
        wordBreak: 'break-word',
        overflow: 'hidden',
        lockScalingX: false, // Allow horizontal scaling like manual text boxes
        lockMovementX: false, // Allow horizontal movement
        lockMovementY: false, // Allow vertical movement
        lockRotation: false, // Allow rotation
        lockScalingY: false, // Allow vertical scaling
        clipPath: null
      })
    }
  }

  /**
   * Update highlights in existing Fabric.js textbox
   * @param {fabric.Textbox} textbox - Fabric.js textbox
   * @param {Object} richText - Rich text object
   */
  updateTextboxHighlights(textbox, richText) {
    // Validate rich text before processing
    const validation = this.validateRichText(richText)
    if (!validation.isValid) {
      console.warn('Rich text validation failed during update:', validation.issues)
      textbox.set('styles', {})
      textbox.setCoords()
      return
    }
    
    const styles = this.toFabricStyles(richText)
    
    if (Object.keys(styles).length > 0) {
      textbox.set('styles', styles)
    } else {
      // Remove styles if no highlights
      textbox.set('styles', {})
    }
    
    textbox.setCoords()
  }

  /**
   * Convert Fabric.js textbox back to rich text format
   * @param {fabric.Textbox} textbox - Fabric.js textbox
   * @returns {Object} Rich text object
   */
  fromFabricTextbox(textbox) {
    const text = textbox.text || ''
    const styles = textbox.styles || {}
    const highlights = []
    
    // Extract highlights from Fabric.js styles
    Object.keys(styles).forEach(lineIndex => {
      const lineStyles = styles[lineIndex]
      const lineStart = this.getLineStartPosition(text, parseInt(lineIndex))
      
      Object.keys(lineStyles).forEach(charIndex => {
        const style = lineStyles[charIndex]
        const globalCharIndex = lineStart + parseInt(charIndex)
        
        // Check if this character has special styling
        if (style.fill && style.fill !== textbox.fill) {
          // Find or create highlight for this position
          let highlight = highlights.find(h => 
            h.start <= globalCharIndex && h.end > globalCharIndex
          )
          
          if (!highlight) {
            highlight = {
              start: globalCharIndex,
              end: globalCharIndex + 1,
              color: style.fill,
              weight: style.fontWeight || 'bold'
            }
            highlights.push(highlight)
          } else {
            // Extend existing highlight
            if (globalCharIndex === highlight.end) {
              highlight.end = globalCharIndex + 1
            }
          }
        }
      })
    })
    
    return {
      text: text,
      highlights: highlights
    }
  }

  /**
   * Get the starting position of a line in the text
   * @param {string} text - Full text
   * @param {number} lineIndex - Line index
   * @returns {number} Starting position
   */
  getLineStartPosition(text, lineIndex) {
    if (!text || typeof text !== 'string' || lineIndex < 0) return 0
    
    const lines = text.split('\n')
    if (lineIndex >= lines.length) return text.length
    
    let position = 0
    
    for (let i = 0; i < lineIndex; i++) {
      position += lines[i].length + 1 // +1 for newline
    }
    
    return position
  }

  /**
   * Merge highlights that are adjacent and have the same styling
   * @param {Array} highlights - Array of highlight objects
   * @returns {Array} Merged highlights
   */
  mergeHighlights(highlights) {
    if (!highlights || highlights.length === 0) return []
    
    // Validate and filter highlights
    const validHighlights = highlights.filter(h => 
      h && 
      typeof h.start === 'number' && 
      typeof h.end === 'number' && 
      h.start >= 0 && 
      h.end > h.start
    )
    
    if (validHighlights.length === 0) return []
    
    // Sort by start position
    const sorted = [...validHighlights].sort((a, b) => a.start - b.start)
    const merged = []
    
    for (const highlight of sorted) {
      const last = merged[merged.length - 1]
      
      if (last && 
          last.end === highlight.start && 
          last.color === highlight.color && 
          last.weight === highlight.weight) {
        // Merge with previous highlight
        last.end = highlight.end
      } else {
        // Add as new highlight
        merged.push({ ...highlight })
      }
    }
    
    return merged
  }


  /**
   * Validate rich text object for common issues
   * @param {Object} richText - Rich text object to validate
   * @returns {Object} Validation result with issues and suggestions
   */
  validateRichText(richText) {
    const issues = []
    const suggestions = []
    
    if (!richText) {
      issues.push('Rich text object is null or undefined')
      return { issues, suggestions, isValid: false }
    }
    
    if (!richText.text || typeof richText.text !== 'string') {
      issues.push('Text property is missing or not a string')
      suggestions.push('Ensure text property is a valid string')
    }
    
    if (!richText.highlights || !Array.isArray(richText.highlights)) {
      issues.push('Highlights property is missing or not an array')
      suggestions.push('Ensure highlights property is an array')
    } else {
      richText.highlights.forEach((highlight, index) => {
        if (!highlight || typeof highlight !== 'object') {
          issues.push(`Highlight at index ${index} is not a valid object`)
          suggestions.push('Ensure all highlights are objects with start, end, color, and weight properties')
        } else {
          if (typeof highlight.start !== 'number' || highlight.start < 0) {
            issues.push(`Highlight at index ${index} has invalid start position`)
            suggestions.push('Start position must be a non-negative number')
          }
          
          if (typeof highlight.end !== 'number' || highlight.end <= highlight.start) {
            issues.push(`Highlight at index ${index} has invalid end position`)
            suggestions.push('End position must be greater than start position')
          }
          
          if (highlight.start >= richText.text.length || highlight.end > richText.text.length) {
            issues.push(`Highlight at index ${index} extends beyond text length`)
            suggestions.push('Ensure highlight positions are within text bounds')
          }
          
          if (!highlight.color || typeof highlight.color !== 'string') {
            issues.push(`Highlight at index ${index} has invalid color`)
            suggestions.push('Color must be a valid hex color string')
          }
          
          // Check for partial word highlighting
          if (richText.text) {
            const highlightedText = richText.text.substring(highlight.start, highlight.end)
            const words = highlightedText.split(/\s+/)
            
            // Check if highlight starts or ends in the middle of a word
            const charBefore = highlight.start > 0 ? richText.text[highlight.start - 1] : ' '
            const charAfter = highlight.end < richText.text.length ? richText.text[highlight.end] : ' '
            
            if (charBefore && charBefore !== ' ' && charBefore !== '\n' && charBefore !== '\t') {
              issues.push(`Highlight at index ${index} starts in middle of word: "${highlightedText}"`)
              suggestions.push('Ensure highlights start at word boundaries')
            }
            
            if (charAfter && charAfter !== ' ' && charAfter !== '\n' && charAfter !== '\t') {
              issues.push(`Highlight at index ${index} ends in middle of word: "${highlightedText}"`)
              suggestions.push('Ensure highlights end at word boundaries')
            }
            
            // Check for very short highlights that might be partial words
            if (highlightedText.length < 3 && !/\s/.test(highlightedText)) {
              issues.push(`Highlight at index ${index} is very short and might be partial: "${highlightedText}"`)
              suggestions.push('Avoid highlighting very short text fragments')
            }
          }
        }
      })
    }
    
    return {
      issues,
      suggestions,
      isValid: issues.length === 0
    }
  }

  /**
   * Fix partial word highlighting by expanding to word boundaries
   * @param {Object} richText - Rich text object to fix
   * @returns {Object} Fixed rich text object
   */
  fixPartialWordHighlighting(richText) {
    if (!richText || !richText.text || typeof richText.text !== 'string' || !richText.highlights) {
      return richText
    }
    
    const fixedHighlights = richText.highlights.map(highlight => {
      if (!highlight || typeof highlight.start !== 'number' || typeof highlight.end !== 'number') {
        return highlight
      }
      
      let start = highlight.start
      let end = highlight.end
      
      // Expand start to word boundary
      while (start > 0 && richText.text[start - 1] !== ' ' && richText.text[start - 1] !== '\n' && richText.text[start - 1] !== '\t') {
        start--
      }
      
      // Expand end to word boundary
      while (end < richText.text.length && richText.text[end] !== ' ' && richText.text[end] !== '\n' && richText.text[end] !== '\t') {
        end++
      }
      
      // Ensure end doesn't exceed text length
      end = Math.min(end, richText.text.length)
      
      return {
        ...highlight,
        start: start,
        end: end
      }
    })
    
    return {
      ...richText,
      highlights: fixedHighlights
    }
  }

  /**
   * Debug rich text processing with detailed logging
   * @param {Object} richText - Rich text object to debug
   * @param {string} context - Context for debugging (e.g., 'parsing', 'rendering')
   */
  debugRichText(richText, context = 'processing') {
    console.group(`🔍 Rich Text Debug - ${context}`)
    
    if (!richText) {
      console.error('❌ Rich text object is null/undefined')
      console.groupEnd()
      return
    }
    
    console.log('📝 Text:', richText.text)
    console.log('📏 Text length:', richText.text?.length || 0)
    console.log('🎨 Highlights count:', richText.highlights?.length || 0)
    
    if (richText.highlights && richText.highlights.length > 0) {
      console.table(richText.highlights.map((h, i) => ({
        index: i,
        start: h.start,
        end: h.end,
        length: h.end - h.start,
        color: h.color,
        weight: h.weight,
        text: richText.text?.substring(h.start, h.end) || 'N/A'
      })))
    }
    
    // Validate and show issues
    const validation = this.validateRichText(richText)
    if (!validation.isValid) {
      console.warn('⚠️ Validation issues found:')
      validation.issues.forEach(issue => console.warn('  -', issue))
      validation.suggestions.forEach(suggestion => console.info('  💡', suggestion))
    } else {
      console.log('✅ Rich text is valid')
    }
    
    console.groupEnd()
  }
}

// Export singleton instance
export const richTextProcessor = new RichTextProcessor()
