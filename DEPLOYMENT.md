# Vercel Deployment Guide for TriveHive

This guide will walk you through deploying your TriveHive Next.js application to Vercel.

## Prerequisites

- A Vercel account (sign up at [vercel.com](https://vercel.com))
- Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
- Access to your Supabase project settings

## Step-by-Step Deployment

### 1. Prepare Your Repository

Ensure your code is committed and pushed to your Git repository:

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 2. Connect Your Repository to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New..."** → **"Project"**
3. Import your Git repository
4. Vercel will auto-detect Next.js - no configuration needed!

### 3. Configure Environment Variables

In the Vercel project settings, add the following environment variables:

#### Required Environment Variables:

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Get this from: Supabase Dashboard → Project Settings → API → Project URL
   - Example: `https://xxxxxxxxxxxxx.supabase.co`

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Get this from: Supabase Dashboard → Project Settings → API → Project API keys → `anon` `public`
   - This is safe to expose in the browser (it's public)

3. **SUPABASE_URL**
   - Same as `NEXT_PUBLIC_SUPABASE_URL` (used for server-side webhooks)
   - Example: `https://xxxxxxxxxxxxx.supabase.co`

4. **SUPABASE_SERVICE_ROLE_KEY**
   - Get this from: Supabase Dashboard → Project Settings → API → Project API keys → `service_role` `secret`
   - ⚠️ **IMPORTANT**: This is a secret key - never expose it in client-side code
   - Used only for the webhook endpoint to bypass Row Level Security (RLS)

#### How to Add Environment Variables in Vercel:

1. In your Vercel project dashboard, go to **Settings** → **Environment Variables**
2. Add each variable:
   - **Key**: The variable name (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
   - **Value**: The actual value from Supabase
   - **Environment**: Select all (Production, Preview, Development)
3. Click **Save**

### 4. Configure Supabase for Production

#### Update Supabase Redirect URLs:

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your Vercel deployment URL to **Redirect URLs**:
   - Production: `https://your-app.vercel.app`
   - Preview: `https://your-app-*.vercel.app` (for preview deployments)
3. Add to **Site URL**: `https://your-app.vercel.app`

#### Update Webhook URL in Vapi (if applicable):

If you're using Vapi webhooks, update the webhook URL to:
- `https://your-app.vercel.app/api/webhooks/vapi`

### 5. Deploy

1. After adding environment variables, Vercel will automatically trigger a new deployment
2. Or manually trigger by going to **Deployments** → **Redeploy**
3. Wait for the build to complete (usually 1-3 minutes)

### 6. Verify Deployment

1. Visit your deployment URL (provided by Vercel)
2. Test the login flow
3. Verify webhook endpoints are accessible (if using Vapi)

## Post-Deployment Checklist

- [ ] Environment variables are set correctly
- [ ] Supabase redirect URLs are configured
- [ ] Login functionality works
- [ ] Dashboard pages load correctly
- [ ] Webhook endpoint is accessible (if applicable)
- [ ] Custom domain is configured (optional)

## Troubleshooting

### Build Fails

- Check build logs in Vercel dashboard
- Ensure all environment variables are set
- Verify `package.json` has correct build script: `"build": "next build"`

### Authentication Issues

- Verify Supabase redirect URLs include your Vercel domain
- Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct
- Ensure Supabase project is active and accessible

### Webhook Issues

- Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Check webhook URL is accessible: `https://your-app.vercel.app/api/webhooks/vapi`
- Review Vercel function logs for errors

### Environment Variables Not Working

- Ensure variables starting with `NEXT_PUBLIC_` are set for client-side access
- Redeploy after adding new environment variables
- Check variable names match exactly (case-sensitive)

## Custom Domain (Optional)

1. In Vercel project → **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update Supabase redirect URLs to include your custom domain

## Continuous Deployment

Vercel automatically deploys:
- **Production**: On push to `main` branch
- **Preview**: On push to other branches or pull requests

Each deployment gets a unique URL for testing before merging to production.

## Additional Resources

- [Vercel Next.js Documentation](https://vercel.com/docs/frameworks/nextjs)
- [Supabase with Next.js Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
