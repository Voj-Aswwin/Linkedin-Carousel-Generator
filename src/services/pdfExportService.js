import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { canvasGenerator } from '../utils/canvasGenerator'

/**
 * PDF Export Service for LinkedIn Carousel Generator
 * Handles the conversion of carousel slides to PDF format
 */
class PDFExportService {
  constructor() {
    this.pdf = null
    this.slideWidth = 1080 // LinkedIn carousel width
    this.slideHeight = 1350 // LinkedIn carousel height
  }

  /**
   * Initialize a new PDF document
   */
  initializePDF() {
    this.pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [this.slideWidth, this.slideHeight]
    })
  }

  /**
   * Convert a canvas element to image and add to PDF
   * @param {HTMLCanvasElement} canvas - The canvas element to convert
   * @param {number} slideIndex - Index of the slide (for page numbering)
   * @param {boolean} isLastSlide - Whether this is the last slide
   */
  async addSlideToPDF(canvas, slideIndex, isLastSlide = false) {
    if (!this.pdf) {
      this.initializePDF()
    }

    try {
      // Convert canvas to image
      const canvasDataURL = canvas.toDataURL('image/png', 1.0)
      
      // Add new page if not the first slide
      if (slideIndex > 0) {
        this.pdf.addPage()
      }

      // Add the slide image to the PDF
      this.pdf.addImage(
        canvasDataURL,
        'PNG',
        0,
        0,
        this.slideWidth,
        this.slideHeight
      )

      // Add slide number at the bottom (optional)
      this.pdf.setFontSize(12)
      this.pdf.setTextColor(100, 100, 100)
      this.pdf.text(
        `Slide ${slideIndex + 1}`,
        this.slideWidth - 100,
        this.slideHeight - 20
      )

    } catch (error) {
      console.error('Error adding slide to PDF:', error)
      throw new Error(`Failed to add slide ${slideIndex + 1} to PDF: ${error.message}`)
    }
  }

  /**
   * Convert a Fabric.js canvas to image and add to PDF
   * @param {fabric.Canvas} fabricCanvas - The Fabric.js canvas
   * @param {number} slideIndex - Index of the slide
   * @param {boolean} isLastSlide - Whether this is the last slide
   */
  async addFabricCanvasToPDF(fabricCanvas, slideIndex, isLastSlide = false) {
    if (!this.pdf) {
      this.initializePDF()
    }

    try {
      // Get the canvas element from Fabric.js
      const canvasElement = fabricCanvas.getElement()
      
      // Convert canvas to image
      const canvasDataURL = canvasElement.toDataURL('image/png', 1.0)
      
      // Add new page if not the first slide
      if (slideIndex > 0) {
        this.pdf.addPage()
      }

      // Add the slide image to the PDF
      this.pdf.addImage(
        canvasDataURL,
        'PNG',
        0,
        0,
        this.slideWidth,
        this.slideHeight
      )

      // Add slide number at the bottom (optional)
      this.pdf.setFontSize(12)
      this.pdf.setTextColor(100, 100, 100)
      this.pdf.text(
        `Slide ${slideIndex + 1}`,
        this.slideWidth - 100,
        this.slideHeight - 20
      )

    } catch (error) {
      console.error('Error adding Fabric canvas to PDF:', error)
      throw new Error(`Failed to add slide ${slideIndex + 1} to PDF: ${error.message}`)
    }
  }

  /**
   * Generate PDF from all carousel slides
   * @param {Object} carouselData - The carousel data containing all slides
   * @param {string} headerPicture - Optional header picture data URL
   */
  async generateCarouselPDF(carouselData, headerPicture = null, options = {}) {
    try {
      this.initializePDF()
      
      // Use saved slide states if provided to match user edits exactly
      const savedStates = options.savedStates || null

      // Use ALL image slides to match UI ordering (even if no generatedImage)
      const imageSlides = carouselData.imageSlides || []
      const hasImageSlides = imageSlides.length > 0
      const totalSlides = 2 + carouselData.infoSlides.length + imageSlides.length // Header + info slides + image slides + end slide
      
      console.log('PDF Export Debug Info:')
      console.log('- Total info slides:', carouselData.infoSlides.length)
      console.log('- Total image slides:', imageSlides.length)
      console.log('- Has image slides:', hasImageSlides)
      console.log('- Total slides in PDF:', totalSlides)
      
      let currentSlideIndex = 0
      
      // Add header slide (prefer saved state if present at index 0)
      console.log('Generating header slide...')
      if (savedStates && savedStates[0]?.objects) {
        const tmpCanvas = await canvasGenerator.createCanvasFromSavedState(savedStates[0])
        await this.addFabricCanvasToPDF(tmpCanvas, currentSlideIndex)
      } else {
        const headerCanvas = await canvasGenerator.createSlideCanvas(
          carouselData.headerSlide, 
          'header', 
          headerPicture, 
          currentSlideIndex, 
          totalSlides
        )
        await this.addFabricCanvasToPDF(headerCanvas, currentSlideIndex)
      }
      currentSlideIndex++
      
      // Add slides in interleaved pattern to match UI order: alternate between info and image slides
      const infoSlidesCount = carouselData.infoSlides.length
      const imageSlidesCount = imageSlides.length
      const maxSlides = Math.max(infoSlidesCount, imageSlidesCount)
      
      let infoIndex = 0
      let imageIndex = 0
      
      for (let i = 0; i < maxSlides; i++) {
        // Add info slide if available
        if (infoIndex < infoSlidesCount) {
          console.log(`Generating info slide ${infoIndex + 1}...`)
          // Calculate the absolute index for this interleaved slide: header is 0, then interleaved start at 1
          const absoluteIndex = currentSlideIndex
          if (savedStates && savedStates[absoluteIndex]?.objects) {
            const tmpCanvas = await canvasGenerator.createCanvasFromSavedState(savedStates[absoluteIndex])
            await this.addFabricCanvasToPDF(tmpCanvas, currentSlideIndex)
          } else {
            const infoCanvas = await canvasGenerator.createSlideCanvas(
              carouselData.infoSlides[infoIndex], 
              'info', 
              null, 
              currentSlideIndex, 
              totalSlides
            )
            await this.addFabricCanvasToPDF(infoCanvas, currentSlideIndex)
          }
          currentSlideIndex++
          infoIndex++
        }
        
        // Add image slide if available
        if (imageIndex < imageSlidesCount) {
          const currentImageSlide = imageSlides[imageIndex]
          console.log(`Generating image slide ${imageIndex + 1}...`)
          console.log('- Image slide data:', currentImageSlide)
          console.log('- Has generated image:', !!currentImageSlide?.generatedImage)
          
          const absoluteIndex = currentSlideIndex
          if (savedStates && savedStates[absoluteIndex]?.objects) {
            const tmpCanvas = await canvasGenerator.createCanvasFromSavedState(savedStates[absoluteIndex])
            await this.addFabricCanvasToPDF(tmpCanvas, currentSlideIndex)
          } else {
            const imageCanvas = await canvasGenerator.createSlideCanvas(
              currentImageSlide, 
              'image', 
              null, 
              currentSlideIndex, 
              totalSlides
            )
            await this.addFabricCanvasToPDF(imageCanvas, currentSlideIndex)
          }
          currentSlideIndex++
          imageIndex++
        }
      }
      
      // Add end slide (prefer saved state at last index)
      console.log('Generating end slide...')
      if (savedStates && savedStates[currentSlideIndex]?.objects) {
        const tmpCanvas = await canvasGenerator.createCanvasFromSavedState(savedStates[currentSlideIndex])
        await this.addFabricCanvasToPDF(tmpCanvas, currentSlideIndex, true)
      } else {
        const endCanvas = await canvasGenerator.createSlideCanvas(
          carouselData.endSlide, 
          'end', 
          null, 
          currentSlideIndex, 
          totalSlides
        )
        await this.addFabricCanvasToPDF(endCanvas, currentSlideIndex, true)
      }

      // If there are any additional saved states beyond totalSlides (custom slides), append them in order
      if (savedStates) {
        const extraIndices = Object.keys(savedStates)
          .map(n => parseInt(n, 10))
          .filter(n => Number.isInteger(n) && n >= totalSlides)
          .sort((a, b) => a - b)
        for (const idx of extraIndices) {
          currentSlideIndex++
          const tmpCanvas = await canvasGenerator.createCanvasFromSavedState(savedStates[idx])
          await this.addFabricCanvasToPDF(tmpCanvas, currentSlideIndex)
        }
      }
      
      return this.pdf
    } catch (error) {
      console.error('Error generating carousel PDF:', error)
      throw new Error(`Failed to generate PDF: ${error.message}`)
    }
  }

  /**
   * Generate PDF from current canvas state
   * @param {Object} canvasState - The current canvas state
   * @param {string} filename - The filename for the downloaded PDF
   */
  async generatePDFFromCanvasState(canvasState, filename = 'linkedin-carousel.pdf') {
    try {
      this.initializePDF()
      
      // Add the canvas image to the PDF
      this.pdf.addImage(
        canvasState.canvasData,
        'PNG',
        0,
        0,
        this.slideWidth,
        this.slideHeight
      )
      
      // Download the PDF
      this.downloadPDF(filename)
      
      console.log('PDF generated from canvas state successfully!')
    } catch (error) {
      console.error('Error generating PDF from canvas state:', error)
      throw new Error(`Failed to generate PDF from canvas state: ${error.message}`)
    }
  }

  /**
   * Download the generated PDF
   * @param {string} filename - The filename for the downloaded PDF
   */
  downloadPDF(filename = 'linkedin-carousel.pdf') {
    if (!this.pdf) {
      throw new Error('No PDF generated. Call generateCarouselPDF first.')
    }

    try {
      this.pdf.save(filename)
      console.log(`PDF downloaded as: ${filename}`)
    } catch (error) {
      console.error('Error downloading PDF:', error)
      throw new Error(`Failed to download PDF: ${error.message}`)
    }
  }

  /**
   * Get PDF as blob for preview or other uses
   * @returns {Blob} The PDF as a blob
   */
  getPDFBlob() {
    if (!this.pdf) {
      throw new Error('No PDF generated. Call generateCarouselPDF first.')
    }

    try {
      return this.pdf.output('blob')
    } catch (error) {
      console.error('Error getting PDF blob:', error)
      throw new Error(`Failed to get PDF blob: ${error.message}`)
    }
  }

  /**
   * Get PDF as data URL for preview
   * @returns {string} The PDF as a data URL
   */
  getPDFDataURL() {
    if (!this.pdf) {
      throw new Error('No PDF generated. Call generateCarouselPDF first.')
    }

    try {
      return this.pdf.output('dataurlstring')
    } catch (error) {
      console.error('Error getting PDF data URL:', error)
      throw new Error(`Failed to get PDF data URL: ${error.message}`)
    }
  }

  /**
   * Reset the PDF service
   */
  reset() {
    this.pdf = null
  }
}

// Export a singleton instance
export const pdfExportService = new PDFExportService()

// Export the class for custom instances if needed
export default PDFExportService
