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
   * @param {boolean} usePhoneFrame - Whether to include phone frame
   * @param {Array} phoneFramePhotos - Array of phone frame photos
   */
  async generateCarouselPDF(carouselData, headerPicture = null, usePhoneFrame = false, phoneFramePhotos = []) {
    try {
      this.initializePDF()
      
      const totalSlides = 2 + carouselData.infoSlides.length // Header + info slides + end slide
      
      // Add header slide
      console.log('Generating header slide...')
      const headerCanvas = await canvasGenerator.createSlideCanvas(
        carouselData.headerSlide, 
        'header', 
        headerPicture, 
        0, 
        totalSlides,
        usePhoneFrame,
        phoneFramePhotos,
        0 // Use first photo for header
      )
      await this.addFabricCanvasToPDF(headerCanvas, 0)
      
      // Add info slides
      for (let i = 0; i < carouselData.infoSlides.length; i++) {
        console.log(`Generating info slide ${i + 1}...`)
        const infoCanvas = await canvasGenerator.createSlideCanvas(
          carouselData.infoSlides[i], 
          'info', 
          null, 
          i + 1, 
          totalSlides,
          usePhoneFrame,
          phoneFramePhotos,
          Math.min(i, phoneFramePhotos.length - 1) // Cycle through photos
        )
        await this.addFabricCanvasToPDF(infoCanvas, i + 1)
      }
      
      // Add end slide
      console.log('Generating end slide...')
      const endSlideIndex = carouselData.infoSlides.length + 1
      const endCanvas = await canvasGenerator.createSlideCanvas(
        carouselData.endSlide, 
        'end', 
        null, 
        endSlideIndex, 
        totalSlides,
        usePhoneFrame,
        phoneFramePhotos,
        Math.min(endSlideIndex, phoneFramePhotos.length - 1) // Use last photo for end slide
      )
      await this.addFabricCanvasToPDF(endCanvas, endSlideIndex, true)
      
      return this.pdf
    } catch (error) {
      console.error('Error generating carousel PDF:', error)
      throw new Error(`Failed to generate PDF: ${error.message}`)
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
