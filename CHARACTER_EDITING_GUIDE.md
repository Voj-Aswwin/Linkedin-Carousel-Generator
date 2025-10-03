# Character-Level Text Editing Guide

## Overview
The LinkedIn Carousel Generator now supports **character-level text editing**, allowing you to format individual characters, words, or phrases independently within the same text box.

## Features Implemented

### 1. Character-Level Formatting
You can now apply the following formatting to selected text only:

- **Bold** - Makes selected text bold
- **Italic** - Makes selected text italic  
- **Underline** - Adds underline to selected text
- **Strikethrough** - Adds strikethrough line to selected text

### 2. Character-Level Font Size
Change the font size of selected characters independently from the rest of the text.

## How to Use

### Step-by-Step Instructions

1. **Enter Editing Mode**
   - Double-click on any text element in the canvas
   - You'll see "✓ Editing mode active" in the properties panel
   - The text will have a cursor and be ready for editing

2. **Select Text**
   - Click and drag to highlight the characters or words you want to format
   - The properties panel will show "X characters selected"

3. **Apply Formatting**
   - **For Bold/Italic/Underline/Strikethrough:**
     - Click the respective formatting button (B/I/U/S)
     - The formatting toggles on/off for the selected text
   
   - **For Font Size:**
     - Enter a number (8-120) in the "Selected Text Font Size" input
     - Press Enter or click "Apply" button
     - The font size applies only to selected characters

4. **Exit Editing Mode**
   - Click anywhere outside the text box
   - Your changes will be saved automatically

## Visual Feedback

### Editing Mode Indicators
- **Green checkmark (✓)**: Editing mode is active
- **Blue text**: Shows number of characters selected
- **Disabled buttons**: Formatting buttons are disabled when not in editing mode

### Button States
- **Enabled**: Text is in editing mode and ready for formatting
- **Disabled (grayed out)**: Need to enter editing mode first

## Tips & Best Practices

1. **Mix and Match**: You can combine multiple formatting styles on the same text (e.g., bold + italic + larger font size)

2. **Toggle Formatting**: Click the formatting button again to remove the formatting from selected text

3. **Quick Font Size**: Use the "Selected Text Font Size" for specific characters, and "Global Font Size" slider to adjust all text at once

4. **Undo Support**: All character-level changes support undo/redo functionality

5. **Selection Tips**: 
   - Double-click a word to select it quickly
   - Triple-click to select an entire line

## Global vs Character-Level Properties

### Character-Level (Requires editing mode)
- Bold/Italic/Underline/Strikethrough formatting
- Font size for selected text
- Applies only to selected characters

### Global (Works without editing mode)  
- Font family (Arial, Helvetica, etc.)
- Text color
- Opacity
- Global font size (affects all text)

## Examples

### Example 1: Emphasize Keywords
```
Transform your LinkedIn presence
         ^^^^^^^^^^^              (make this bold and larger)
```

### Example 2: Mixed Formatting
```
Increase ROI by 300%
         ^^^    ^^^^  (make ROI bold, 300% bold + larger + different color)
```

### Example 3: Strikethrough for Corrections
```
Was $99 Now $49
    ^^^         (strikethrough old price)
```

## Keyboard Shortcuts

- **Enter**: Apply font size when in the font size input field
- **Escape**: Exit editing mode
- **Delete/Backspace**: Delete selected text (when in editing mode)

## Troubleshooting

### Formatting buttons are disabled
- **Solution**: Double-click the text to enter editing mode

### Changes not applying
- **Solution**: Make sure you have text selected before clicking formatting buttons

### Text not selectable
- **Solution**: Ensure the text object is selected first, then double-click to edit

### Font size not changing for selected text
- **Solution**: Enter a value between 8-120, then press Enter or click Apply

## Technical Details

This feature uses Fabric.js's character-level styling capabilities:
- `setSelectionStyles()` for applying styles to selected text
- `getSelectionStyles()` for reading current styles
- Character styles are stored in the `styles` property of text objects
- Supports hot reloading and undo/redo functionality

## Limitations

1. Font family cannot be changed per character (Fabric.js limitation)
2. Character-level color styling is available but requires additional UI (can be added if needed)
3. Formatting buttons require text to be in editing mode

---

**Need Help?** If you encounter any issues with character-level editing, make sure:
1. You've double-clicked the text to enter editing mode
2. You've selected some text before applying formatting
3. The text object is not locked or grouped

