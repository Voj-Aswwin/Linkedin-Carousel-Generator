# Deployment Guide - Vercel

This guide explains how to deploy your LinkedIn Carousel Generator to Vercel while keeping your API keys secure.

## Security Architecture

Your application uses a **serverless function architecture** to keep API keys secure:

- **Frontend** (React/Vite): Makes HTTP requests to `/api/*` routes
- **Backend** (Vercel Serverless Functions): Handles all Gemini API calls server-side
- **API Key**: Stored only in Vercel environment variables, never exposed to the browser

## Pre-Deployment Checklist

- [x] API routes created in `/api` directory
- [x] Frontend services updated to call API routes instead of direct API calls
- [x] `@google/generative-ai` package in dependencies
- [x] `.env` file in `.gitignore` (already done)

## Deployment Steps

### 1. Push to GitHub

```bash
git add .
git commit -m "Add secure API routes for Vercel deployment"
git push origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Vercel will auto-detect:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

### 3. Set Environment Variable

**Critical Step**: You must set the API key in Vercel's environment variables.

1. In your Vercel project dashboard, go to **Settings** → **Environment Variables**
2. Add a new variable:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: Your Gemini API key (from [Google AI Studio](https://makersuite.google.com/app/apikey))
   - **Environments**: Select all (Production, Preview, Development)
3. Click **"Save"**

### 4. Deploy

- Click **"Deploy"** or push a new commit
- Vercel will build and deploy your application
- Your API routes will be available at `https://your-domain.vercel.app/api/*`

## How It Works

### API Routes Structure

```
/api
├── generate-header-slide.js      → POST /api/generate-header-slide
├── generate-carousel-slides.js   → POST /api/generate-carousel-slides
├── generate-image.js             → POST /api/generate-image
└── analyze-slide-content.js      → POST /api/analyze-slide-content
```

### Request Flow

1. **User action** in React app (e.g., "Generate Carousel")
2. **Frontend** calls `fetch('/api/generate-carousel-slides', {...})`
3. **Vercel serverless function** receives request
4. **Serverless function** uses `process.env.GEMINI_API_KEY` (server-side only)
5. **Serverless function** calls Gemini API
6. **Response** sent back to frontend
7. **API key never exposed** to the browser

## Testing Locally

For local development, you can:

1. **Option A**: Use Vercel CLI (recommended)
   ```bash
   npm i -g vercel
   vercel dev
   ```
   This will run serverless functions locally and use your Vercel environment variables.

2. **Option B**: Set up local environment variable
   ```bash
   # Create .env.local (not committed to git)
   GEMINI_API_KEY=your_key_here
   ```
   Then run `vercel dev` to test serverless functions locally.

## Troubleshooting

### API Routes Return 500 Errors

- Check that `GEMINI_API_KEY` is set in Vercel environment variables
- Verify the API key is valid
- Check Vercel function logs in the dashboard

### API Routes Return 404

- Ensure files in `/api` directory use `.js` extension
- Verify the route names match the fetch URLs in your frontend code
- Check that files are committed to git

### Build Fails

- Ensure all dependencies are in `dependencies` (not `devDependencies`)
- Check that `@google/generative-ai` is installed
- Review build logs in Vercel dashboard

## Security Best Practices

✅ **DO**:
- Use `GEMINI_API_KEY` (without `VITE_` prefix) in serverless functions
- Store API keys only in Vercel environment variables
- Never commit `.env` files to git
- Use serverless functions for all API calls

❌ **DON'T**:
- Use `VITE_GEMINI_API_KEY` in production (exposes key to browser)
- Commit API keys to git
- Hardcode API keys in source code
- Make direct API calls from the frontend

## Additional Resources

- [Vercel Serverless Functions Docs](https://vercel.com/docs/functions)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Google AI Studio](https://makersuite.google.com/app/apikey)

