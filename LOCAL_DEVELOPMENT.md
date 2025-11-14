# Local Development Guide

## The Problem

When you run `npm run dev`, Vite starts a frontend development server, but **it cannot run Vercel serverless functions**. This means the `/api/*` routes return 404 errors.

## Solution: Use Vercel CLI for Local Development

Vercel CLI can run your serverless functions locally, making them available at `/api/*` just like in production.

### Step 1: Install Vercel CLI

```bash
npm i -g vercel
```

Or use npx (no installation needed):
```bash
npx vercel dev
```

### Step 2: Set Up Environment Variable

Create a `.env.local` file in the root directory:

```bash
# .env.local
GEMINI_API_KEY=your_gemini_api_key_here
```

**Important**: `.env.local` is already in `.gitignore`, so it won't be committed to git.

### Step 3: Run Vercel Dev

```bash
npm run dev:vercel
```

Or directly:
```bash
vercel dev
```

This will:
- Start Vercel's development server
- Run your serverless functions at `/api/*`
- Use environment variables from `.env.local`
- Proxy requests to your Vite frontend

### Step 4: Access Your App

Vercel CLI will start the server and show you the URL (usually `http://localhost:3000`).

## Alternative: Quick Test Without Serverless Functions

If you just want to test the frontend UI without API calls, you can:

1. Use the "Generate Mock" button (if available)
2. Or temporarily use direct API calls (⚠️ **NOT RECOMMENDED** - exposes API key)

## Troubleshooting

### "vercel: command not found"

Install Vercel CLI globally:
```bash
npm i -g vercel
```

### "GEMINI_API_KEY is not defined"

Make sure you have a `.env.local` file with:
```
GEMINI_API_KEY=your_key_here
```

### Port Already in Use

Vercel CLI will ask you to choose a different port if 3000 is taken.

### API Routes Still Return 404

1. Make sure you're running `vercel dev` (not `npm run dev`)
2. Check that your `/api` directory exists with `.js` files
3. Verify the route names match (e.g., `/api/generate-carousel-slides`)

## Development Workflow

**Recommended workflow:**

1. **For frontend-only changes**: Use `npm run dev` (faster, but API won't work)
2. **For full-stack testing**: Use `npm run dev:vercel` (slower, but everything works)

## Production Deployment

When you deploy to Vercel:
- The serverless functions automatically work
- Environment variables are set in Vercel dashboard
- No additional configuration needed

