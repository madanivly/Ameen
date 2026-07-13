import "./lib/error-capture";
import { consumeLastCapturedError } from "./lib/error-capture"; // Import the function

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const mod = await import("@tanstack/react-start/server-entry");
      const handler = (mod.default ?? mod) as {
        fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
      };
      return handler.fetch(request, env, ctx);
    } catch (error) {
      console.error("Server fetch error:", error);
      const capturedError = consumeLastCapturedError();
      if (capturedError) {
        console.error("Captured error details:", capturedError);
      }
      throw error; // Re-throw to ensure the error page is rendered
    }
  },
};
