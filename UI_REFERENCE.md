# Character-Level Editing - UI Reference

## Properties Panel Layout

### When Text is NOT in Editing Mode

```
┌─────────────────────────────────────────┐
│ 💡 Character-Level Editing              │
│ 1. Double-click text to enter editing   │
│ 2. Select characters/words to format    │
│ 3. Click formatting buttons or set size │
│ 4. Click outside to exit editing mode   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Character Formatting                    │
│ Double-click text to enable character   │
│ formatting                              │
│                                         │
│ ┌───┐ ┌───┐ ┌───┐ ┌───┐               │
│ │ B │ │ I │ │ U │ │ S │ (disabled)    │
│ └───┘ └───┘ └───┘ └───┘               │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Selected Text Font Size                 │
│ Enter editing mode first                │
│                                         │
│ [    Font size    ] [Apply] (disabled)  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Global Font Size: 24px                  │
│ Applies to entire text                  │
│ ●━━━━━━━━━━○━━━━━━━━━━━━              │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Font Family                             │
│ ▼ Arial                                 │
└─────────────────────────────────────────┘
```

### When Text IS in Editing Mode (No Selection)

```
┌─────────────────────────────────────────┐
│ 💡 Character-Level Editing              │
│ 1. Double-click text to enter editing   │
│ 2. Select characters/words to format    │
│ 3. Click formatting buttons or set size │
│ 4. Click outside to exit editing mode   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Character Formatting                    │
│ ✓ Editing mode active                   │
│ Select text and click buttons below     │
│                                         │
│ ┌───┐ ┌───┐ ┌───┐ ┌───┐               │
│ │ B │ │ I │ │ U │ │ S │ (enabled)     │
│ └───┘ └───┘ └───┘ └───┘               │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Selected Text Font Size                 │
│ Select characters first                 │
│                                         │
│ [    Font size    ] [Apply] (enabled)   │
└─────────────────────────────────────────┘
```

### When Text IS in Editing Mode (With Selection)

```
┌─────────────────────────────────────────┐
│ 💡 Character-Level Editing              │
│ 1. Double-click text to enter editing   │
│ 2. Select characters/words to format    │
│ 3. Click formatting buttons or set size │
│ 4. Click outside to exit editing mode   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Character Formatting                    │
│ ✓ Editing mode active                   │
│ Select text and click buttons below     │
│ 12 characters selected                  │ ← Blue text
│                                         │
│ ┌───┐ ┌───┐ ┌───┐ ┌───┐               │
│ │ B │ │ I │ │ U │ │ S │ (enabled)     │
│ └───┘ └───┘ └───┘ └───┘               │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Selected Text Font Size                 │
│ ✓ Ready to apply (Enter to confirm)    │ ← Green text
│                                         │
│ [    Font size    ] [Apply] (enabled)   │
└─────────────────────────────────────────┘
```

## Button Styles

### Bold Button (B)
- **Text**: Bold weight "B"
- **Enabled**: Gray background, darker on hover
- **Disabled**: Light gray, 50% opacity, no pointer
- **Title**: "Bold (Toggle)"

### Italic Button (I)
- **Text**: Italic style "I"  
- **Enabled**: Gray background, darker on hover
- **Disabled**: Light gray, 50% opacity, no pointer
- **Title**: "Italic (Toggle)"

### Underline Button (U)
- **Text**: Underlined "U"
- **Enabled**: Gray background, darker on hover
- **Disabled**: Light gray, 50% opacity, no pointer
- **Title**: "Underline (Toggle)"

### Strikethrough Button (S)
- **Text**: Line-through "S"
- **Enabled**: Gray background, darker on hover
- **Disabled**: Light gray, 50% opacity, no pointer
- **Title**: "Strikethrough (Toggle)"

### Apply Button (Font Size)
- **Text**: "Apply"
- **Enabled**: Blue background, darker blue on hover
- **Disabled**: Gray, 50% opacity, no pointer

## Status Messages

### Editing Mode Status
- ✓ (Green checkmark) = Editing active
- "Double-click text to enable character formatting" = Not editing

### Selection Status  
- "X characters selected" (Blue) = Text selected
- "Select text and click buttons below" = Ready to format
- "Select characters first" = Need to select text

### Font Size Status
- "✓ Ready to apply (Enter to confirm)" (Green) = Text selected, ready
- "Select characters first" = No selection
- "Enter editing mode first" = Not editing

## Color Scheme

### Info Box (Instructions)
- Background: Light blue (`bg-blue-50`)
- Border: Blue (`border-blue-200`)
- Title: Dark blue (`text-blue-900`)
- Text: Blue (`text-blue-800`)

### Status Indicators
- Success/Active: Green (`text-green-600`)
- Information: Blue (`text-blue-600`)
- Neutral: Gray (`text-gray-500`, `text-gray-700`)

### Buttons
- Primary (Apply): Blue (`bg-blue-600`, hover: `bg-blue-700`)
- Secondary (Format): Gray (`bg-gray-100`, hover: `bg-gray-200`)
- Disabled: Gray with 50% opacity

## Example Usage Scenarios

### Scenario 1: Making a Word Bold

```
Canvas Text: "Transform Your Business Today"

1. Double-click "Transform Your Business Today"
   → Text enters editing mode
   → Panel shows "✓ Editing mode active"

2. Select "Transform" with mouse
   → Panel shows "9 characters selected"

3. Click [B] button
   → "Transform" becomes bold
   → Rest of text stays normal

Result: "Transform Your Business Today"
         ^^^^^^^^^
         (bold)
```

### Scenario 2: Mixed Formatting

```
Canvas Text: "Increase ROI by 300%"

1. Enter editing mode
2. Select "ROI"
   → Click [B] (Bold)
   → Click [I] (Italic)
3. Select "300%"  
   → Enter "48" in font size, click Apply
   → Click [B] (Bold)

Result: "Increase ROI by 300%"
                 ^^^    ^^^^
              (bold+italic)(bold+48px)
```

### Scenario 3: Font Size Variation

```
Canvas Text: "BIG small BIG"

1. Enter editing mode
2. Select first "BIG"
   → Enter "48" in font size
   → Press Enter or click Apply
3. Select "small"
   → Enter "12" in font size  
   → Press Enter or click Apply
4. Select second "BIG"
   → Enter "48" in font size
   → Press Enter or click Apply

Result: "BIG small BIG"
         ^^^  ^^^^^  ^^^ 
        (48px)(12px)(48px)
```

## Keyboard Interactions

- **Enter** (in font size input) → Apply font size to selection
- **Click outside text** → Exit editing mode
- **Double-click text** → Enter editing mode
- **Click + Drag** → Select characters
- **Double-click word** → Select word
- **Triple-click** → Select line

## Visual States Summary

| State | B/I/U/S Buttons | Font Size Input | Status Message |
|-------|-----------------|-----------------|----------------|
| Not editing | Disabled (gray) | Disabled (gray) | "Double-click to enable" |
| Editing, no selection | Enabled | Enabled | "✓ Editing mode active" |
| Editing, with selection | Enabled | Enabled | "X characters selected" + "✓ Ready to apply" |

## Accessibility Features

- Clear visual states (enabled/disabled)
- Helpful status messages
- Keyboard support (Enter key)
- Tooltips on buttons (title attribute)
- Color contrast for readability
- Visual feedback on all interactions

---

This UI provides an intuitive, professional interface for character-level text editing with clear visual feedback at every step.

