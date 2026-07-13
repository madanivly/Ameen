import type { Role } from "../types";
import { getDoc } from "./google-sheets";

/**
 * Server-side authentication — reads the PIN sheet directly from Google Sheets.
 * Never call from client code.
 */
export async function authenticateRequest(request: Request): Promise<{
  authenticated: boolean;
  role?: Role;
  error?: string;
}> {
  try {
    const url = new URL(request.url);
    const roleParam = url.searchParams.get("role");
    const pinParam = url.searchParams.get("pin");

    console.log("[AUTH] Attempting authentication...");
    console.log(`[AUTH] Role: ${roleParam}, PIN: ${pinParam ? '********' : 'N/A'}`);

    if (!roleParam || !pinParam) {
      console.log("[AUTH] Missing role or PIN.");
      return { authenticated: false, error: "Missing role or PIN" };
    }

    const doc = await getDoc();
    if (!doc) {
      console.log("[AUTH] Google Sheets not configured.");
      return { authenticated: false, error: "Google Sheets not configured" };
    }

    const sheet = doc.sheetsByTitle["PIN"];
    if (!sheet) {
      console.error("[AUTH] PIN sheet not found in spreadsheet");
      return { authenticated: false, error: "PIN sheet not found" };
    }
    console.log("[AUTH] PIN sheet found.");

    const rows = await sheet.getRows();
    const headerValues = sheet.headerValues || [];
    console.log("[AUTH] PIN sheet header values:", headerValues);

    const roleIndex = headerValues.indexOf("role");
    const pinIndex = headerValues.indexOf("pin");

    if (roleIndex === -1 || pinIndex === -1) {
      console.error("[AUTH] PIN sheet missing role or pin columns");
      return { authenticated: false, error: "PIN sheet misconfigured" };
    }
    console.log(`[AUTH] Role index: ${roleIndex}, PIN index: ${pinIndex}`);

    const match = rows.find(
      (r: any) => {
        const rowRole = String(r._rawData[roleIndex]).trim().toLowerCase();
        const rowPin = String(r._rawData[pinIndex]).trim();
        console.log(`[AUTH] Comparing - Row Role: ${rowRole}, Provided Role: ${roleParam.toLowerCase()} | Row PIN: ${rowPin ? '********' : 'N/A'}, Provided PIN: ${pinParam ? '********' : 'N/A'}`);
        return rowRole === roleParam.toLowerCase() && rowPin === pinParam;
      }
    );

    if (match) {
      console.log("[AUTH] Authentication successful.");
      return { authenticated: true, role: roleParam as Role };
    }

    console.log("[AUTH] Invalid PIN for role.");
    return { authenticated: false, error: `Invalid PIN for role: ${roleParam}` };
  } catch (error) {
    console.error("[AUTH] Authentication error caught:", error);
    return {
      authenticated: false,
      error: error instanceof Error ? error.message : "Authentication failed",
    };
  }
}
