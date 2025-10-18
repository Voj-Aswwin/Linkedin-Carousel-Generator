# Font Integration Guide

This guide explains how to add new fonts to the LinkedIn Carousel Generator application.

## How to Add a New Font

### 1. Add Google Fonts Link (for Google Fonts)

If you're using a Google Font, add the font link to `index.html`:

```html
<!-- Add this to the <head> section -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=FontName:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">
```

Replace `FontName` with your actual font name.

### 2. Add Font to Properties Panel

Update `src/components/PropertiesPanel.jsx` to include the new font in the dropdown:

```jsx
<select
  key={`fontFamily-${selectedObject.fontFamily || 'Arial'}`}
  value={selectedObject.fontFamily || 'Arial'}
  onChange={(e) => onUpdateSelectedObject('fontFamily', e.target.value)}
  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
>
  <option value="Arial">Arial</option>
  <option value="Helvetica">Helvetica</option>
  <option value="Georgia">Georgia</option>
  <option value="Times New Roman">Times New Roman</option>
  <option value="YourNewFont">Your New Font</option>  <!-- Add this line -->
</select>
```

### 3. Update Gemini Service

Update `src/services/geminiService.js` to include the new font in all font family type definitions:

```javascript
// Find all instances of fontFamily definitions and add your font
"fontFamily": "Arial" | "Helvetica" | "Georgia" | "Times New Roman" | "Inter" | "Poppins" | "Montserrat" | "YourNewFont",
```

### 4. For Custom Fonts (Non-Google Fonts)

If you're using a custom font file:

1. Add the font file to the `public/fonts/` directory
2. Add CSS to load the font in `src/index.css`:

```css
@font-face {
  font-family: 'YourCustomFont';
  src: url('/fonts/your-font-file.woff2') format('woff2'),
       url('/fonts/your-font-file.woff') format('woff');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}
```

## Example: Adding ANDON Font

The ANDON font has been successfully added to this application. Here's what was done:

1. **Google Fonts Link Added** to `index.html`
2. **Properties Panel Updated** with "Andon" option
3. **Gemini Service Updated** with "Andon" in all font family type definitions

## Testing Your Font

1. Start the development server: `npm run dev`
2. Open the application in your browser
3. Create or edit text elements
4. Select your new font from the Properties Panel dropdown
5. Verify the font renders correctly in the canvas

## Notes

- Font names in the code should match exactly with the CSS font-family name
- For Google Fonts, use the exact name as specified in the Google Fonts URL
- Make sure to test the font with different font weights and styles if available
- Consider the font's readability and how it looks at different sizes


