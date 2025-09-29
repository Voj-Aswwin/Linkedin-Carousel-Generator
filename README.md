# LinkedIn Carousel Generator

An MVP tool that converts text posts into editable LinkedIn carousels with a Canva-like canvas interface.

## Features

- **Text Input**: Simple textarea for pasting your content
- **AI Generation**: Converts text into multiple carousel slides
- **Editable Canvas**: Canva-like interface for further editing
- **Multiple Templates**: Header, Info, Data, Quote, and End slides
- **Export Options**: Download as high-quality images

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Input Your Content**: Paste your LinkedIn post, blog content, or any text into the textarea
2. **Generate Carousel**: Click the "Generate Carousel" button to create slides
3. **Edit & Customize**: Use the canvas interface to edit text, colors, fonts, and layouts
4. **Export**: Download your carousel slides as PNG images

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Fabric.js** - Canvas manipulation (coming soon)

## Project Structure

```
src/
├── components/
│   ├── TextInput.jsx      # Text input component
│   └── GenerateButton.jsx # Generate button component
├── App.jsx                # Main app component
├── main.jsx              # App entry point
└── index.css             # Global styles
```

## Roadmap

- [ ] AI integration for content processing
- [ ] Canvas editor with drag-and-drop
- [ ] Multiple slide templates
- [ ] Export functionality
- [ ] User authentication
- [ ] Save/load projects

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details
