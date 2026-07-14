import type { Role } from "../types";
import pool from './database';

/**
 * Server-side authentication — reads the PIN from the database.
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

    const connection = await pool.getConnection();
    try {
      const [rows]: any[] = await connection.query('SELECT * FROM pins WHERE role = ? AND pin = ?', [roleParam.toLowerCase(), pinParam]);
      if (rows.length > 0) {
        console.log("[AUTH] Authentication successful.");
        return { authenticated: true, role: roleParam as Role };
      } else {
        console.log("[AUTH] Invalid PIN for role.");
        return { authenticated: false, error: `Invalid PIN for role: ${roleParam}` };
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("[AUTH] Authentication error caught:", error);
    return {
      authenticated: false,
      error: error instanceof Error ? error.message : "Authentication failed",
    };
  }
}
