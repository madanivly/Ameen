import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

const SPREADSHEET_ID = null;
const SERVICE_ACCOUNT_EMAIL = null;
const PRIVATE_KEY = null;

if (!SPREADSHEET_ID || !SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY) {
  console.warn('Google Sheets disabled');
}

const serviceAccountAuth = null;

export const getDoc = async () => {
  return null;
};
