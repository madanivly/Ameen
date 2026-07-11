# How to Create a Vercel API Token

Follow these steps to create an API token:

## Step 1: Go to Vercel Settings
1. Open https://vercel.com/account/tokens
2. Sign in if needed

## Step 2: Create New Token
1. Click **"Create"** button
2. Give it a name, e.g., `ameen-redeploy-token`
3. Select scope: **Full Account**
4. Leave expiration as default or set to 90 days
5. Click **"Create Token"**

## Step 3: Copy Token
1. The token will appear on screen (looks like a long string)
2. **Copy it immediately** - it won't be shown again
3. Keep it secure - don't share or commit it to git

## Step 4: Provide to Me
Paste the token here in your next response, and I'll:
1. Use it to configure the Google Sheets environment variables on Vercel
2. Trigger an automatic redeploy
3. Verify that real-time sync is working

**Example token format:** `vk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

**Security Note:** This token will only be used to:
- Add environment variables to your Vercel project
- Trigger a redeploy
- It will NOT be stored anywhere or used for anything else