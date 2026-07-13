// Server-only module — uses dynamic imports to avoid bundling Node.js packages into client code
// This file should ONLY be imported from API routes (server-side)

const SHEET_ID = process.env.GOOGLE_SHEET_ID || process.env.VITE_GOOGLE_SHEET_ID || null;
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || null;
const PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n') || null;

if (!SHEET_ID || !SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY) {
  console.warn('Google Sheets disabled — missing credentials in environment variables');
}

let docInstance: any = null;

export const getDoc = async () => {
  if (!SHEET_ID || !SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY) {
    return null;
  }

  if (!docInstance) {
    // Dynamic imports to prevent Node.js modules from being bundled into client code
    const { GoogleSpreadsheet } = await import('google-spreadsheet');
    const { JWT } = await import('google-auth-library');

    const serviceAccountAuth = new JWT({
      email: SERVICE_ACCOUNT_EMAIL,
      key: PRIVATE_KEY,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const instance = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);
    try {
      await instance.loadInfo();
    } catch (error) {
      console.error('Failed to load Google Sheet info:', error);
      throw error;
    }
    docInstance = instance;
  }

  return docInstance;
};

export const resetDoc = () => {
  docInstance = null;
};

// Simple in-memory cache
let cachedData: any = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export const getCachedData = () => {
  if (cachedData && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedData;
  }
  return null;
};

export const setCachedData = (data: any) => {
  cachedData = data;
  cacheTimestamp = Date.now();
};
