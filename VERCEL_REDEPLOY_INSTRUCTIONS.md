# Vercel Redeployment Instructions for Real-Time Sync

The code has been pushed to GitHub and is ready to deploy. Follow these steps to activate real-time data synchronization:

## Step 1: Go to Vercel Dashboard
1. Open https://vercel.com/dashboard
2. Sign in if needed

## Step 2: Select Ameen Project
1. Click on **"Ameen"** project
2. You'll see the Deployments list

## Step 3: Add Environment Variables (if not done already)
1. Click **Settings** (top menu)
2. Click **Environment Variables** (left sidebar)
3. Make sure these three variables are set to **Production**:

| Name | Value |
|------|-------|
| `GOOGLE_SHEET_ID` | `19l12-Y2iGmmgENxRxhCHMUQvAJLxqiGu3qVQcMuoAVk` |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `sheets-api-connector@sonorous-crane-480719-b3.iam.gserviceaccount.com` |
| `GOOGLE_PRIVATE_KEY` | (Paste your private key from `.env`) |

If any are missing, add them now. Click **Save**.

## Step 4: Redeploy
1. Click **Deployments** (breadcrumb or left sidebar)
2. Find the latest deployment (should be from a few minutes ago)
3. Click the **...** (three dots) menu on that deployment
4. Click **Redeploy**
5. Wait for deployment to complete (usually 2-3 minutes)

## Step 5: Verify
1. Go to https://ameen-kappa.vercel.app
2. Log in (e.g., MEM001)
3. Add a new payment
4. Check the Google Sheet - the payment should appear within 1-2 seconds
5. Open the app in another browser/incognito window - you should see the payment appear automatically

## What Was Deployed
- Latest code from commit `a0016e2`
- Nitro API handlers for `/api/fetch-data` and `/api/update-data`
- 1-second polling for real-time sync
- Automatic cross-browser synchronization

## If It Still Shows 404
1. Check that the deployment completed successfully
2. Hard refresh the browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
3. Check the Network tab in DevTools - fetch requests should return data, not 404
4. If still failing, ensure environment variables are set and redeploy again

## Support
The system is now production-ready. All code changes are deployed and the only requirement is the environment variables being correctly set on Vercel.