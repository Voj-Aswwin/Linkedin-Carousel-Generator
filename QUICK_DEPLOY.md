# Quick Deploy Guide - Get Your App Online in 5 Minutes

## What You'll Get

After deploying, you'll get a **free public URL** like:
- `https://linkedin-carousel-generator.vercel.app`
- Or a custom domain if you set one up

## Step-by-Step Deployment

### Step 1: Push Your Code to GitHub

If you haven't already, create a GitHub repository:

1. Go to [github.com](https://github.com) and sign in
2. Click the **"+"** icon → **"New repository"**
3. Name it (e.g., `linkedin-carousel-generator`)
4. Click **"Create repository"**
5. Follow the instructions to push your code:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/linkedin-carousel-generator.git
git push -u origin main
```

### Step 2: Deploy to Vercel

1. **Go to Vercel**: Visit [vercel.com](https://vercel.com)
2. **Sign up/Login**: Use your GitHub account (easiest way)
3. **Import Project**:
   - Click **"Add New Project"** or **"Import Project"**
   - Select your GitHub repository (`linkedin-carousel-generator`)
   - Click **"Import"**

4. **Configure Project** (Vercel auto-detects most settings):
   - **Framework Preset**: Vite (should be auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

5. **Set Environment Variable** (CRITICAL):
   - Click **"Environment Variables"** section
   - Click **"Add"** or **"Add New"**
   - **Name**: `GEMINI_API_KEY`
   - **Value**: Paste your Gemini API key
   - **Environments**: Select all three:
     - ✅ Production
     - ✅ Preview  
     - ✅ Development
   - Click **"Save"**

6. **Deploy**:
   - Click **"Deploy"** button
   - Wait 2-3 minutes for build to complete
   - ✅ **Success!** You'll see your app URL

### Step 3: Access Your Public App

After deployment, you'll see:
- **Production URL**: `https://your-project-name.vercel.app`
- This URL is **public** and can be shared with anyone!

## What Happens After Deployment

✅ **Your app is live** at the Vercel URL  
✅ **API routes work** automatically (serverless functions deployed)  
✅ **API key is secure** (only used server-side)  
✅ **Auto-updates**: Every time you push to GitHub, Vercel redeploys automatically

## Sharing Your App

Simply share the URL:
```
https://your-project-name.vercel.app
```

Anyone can:
- Open it in their browser
- Use all features
- Generate carousels
- Export slides

## Custom Domain (Optional)

Want a custom domain like `myapp.com`?

1. In Vercel dashboard, go to **Settings** → **Domains**
2. Enter your domain name
3. Follow DNS configuration instructions
4. Vercel provides free SSL certificates automatically

## Troubleshooting

### Build Fails
- Check that `GEMINI_API_KEY` is set in environment variables
- Verify all dependencies are in `package.json`
- Check build logs in Vercel dashboard

### API Routes Return 500
- Verify `GEMINI_API_KEY` is set correctly
- Check function logs in Vercel dashboard
- Ensure API key is valid

### App Works Locally But Not Online
- Make sure you pushed latest code to GitHub
- Check that environment variables are set in Vercel
- Review deployment logs

## Next Steps

1. **Test your deployed app** - Visit the URL and try generating a carousel
2. **Share the link** - Send it to friends, clients, or post it online
3. **Monitor usage** - Check Vercel dashboard for analytics
4. **Customize** - Add a custom domain if desired

## Free Tier Limits

Vercel's free tier includes:
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Serverless function execution time
- ✅ Perfect for most personal/small projects

Your app is ready to share! 🚀

