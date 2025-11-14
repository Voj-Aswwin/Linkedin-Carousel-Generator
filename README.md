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
- Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. **For local development with API calls**, you need to use Vercel CLI:
   ```bash
   # Install Vercel CLI (one-time)
   npm i -g vercel
   
   # Create .env.local file with your API key
   echo "GEMINI_API_KEY=your_key_here" > .env.local
   
   # Start development server with serverless functions
   npm run dev:vercel
   ```
   
   **Note**: If you just run `npm run dev`, the API routes won't work (404 errors). See [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md) for details.

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment to Vercel (Get Your Public URL)

Deploying to Vercel gives you a **free public URL** that you can share with anyone! See [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) for detailed step-by-step instructions.

### Quick Steps:

1. **Push code to GitHub** (create repo and push your code)

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com) and sign in with GitHub
   - Click "Add New Project" → Import your repository
   - Vercel auto-detects Vite settings

3. **Set Environment Variable** (CRITICAL):
   - In project settings, go to **Environment Variables**
   - Add: `GEMINI_API_KEY` = your API key
   - Select all environments (Production, Preview, Development)
   - Click "Save"

4. **Deploy**:
   - Click "Deploy"
   - Wait 2-3 minutes
   - ✅ **Done!** You'll get a public URL like `https://your-app.vercel.app`

### Your App is Now Public! 🎉

After deployment, you can:
- ✅ Share the URL with anyone
- ✅ Use it from any device
- ✅ All features work automatically
- ✅ API keys stay secure (server-side only)

**See [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) for complete instructions.**

### Important Security Notes:

- ✅ **API keys are secure**: The `GEMINI_API_KEY` is only used in serverless functions (server-side), never exposed to the browser
- ✅ **No client-side exposure**: All API calls go through `/api/*` routes which run on the server
- ❌ **Never use `VITE_` prefix**: Variables with `VITE_` prefix are exposed to the client-side code, which is a security risk for API keys

### Project Structure for API Routes:

```
api/
├── generate-header-slide.js      # Serverless function for header slide generation
├── generate-carousel-slides.js   # Serverless function for carousel generation
├── generate-image.js             # Serverless function for image generation
└── analyze-slide-content.js      # Serverless function for visual analysis
```

All these functions run server-side and have access to `process.env.GEMINI_API_KEY` without exposing it to the client.

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
