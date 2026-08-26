import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { registerSW } from "virtual:pwa-register";
import { routeTree } from "./routeTree.gen";
import "./styles.css";

// Create a QueryClient instance
const queryClient = new QueryClient();

// Create the router instance
const router = createRouter({
  routeTree,
  context: { queryClient },
  scrollRestoration: true,
  defaultPreloadStaleTime: 0,
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// ── Global Chunk Loading Error Handler & Auto-Reload ──────────────────
// Automatically catches dynamic import failures (e.g., when a user has an older version open and new build hashes are deployed)
window.addEventListener("vite:preloadError", (event) => {
  console.warn("[App] Vite preload error detected, reloading to fetch latest assets...", event);
  window.location.reload();
});

window.addEventListener("error", (event) => {
  const msg = event.message || "";
  if (
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("Importing a module script failed") ||
    msg.includes("Loading chunk")
  ) {
    console.warn("[App] Dynamic import chunk error detected, forcing page refresh...", msg);
    window.location.reload();
  }
});
// ── Automatic Background Service Worker Registration ─────────────────
// Auto-update ensures instant cache invalidation and reload upon deployment
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log("[PWA] New version available, updating automatically...");
    updateSW(true);
  },
  onOfflineReady() {
    console.log("[PWA] Application ready for offline usage.");
  },
  onRegisteredSW(swUrl, registration) {
    console.log("[PWA] Service Worker registered:", swUrl, registration?.scope);
  },
  onRegisterError(error) {
    console.warn("[PWA] Service Worker registration failed:", error);
  },
});

// Render the app
const rootElement = document.getElementById("root")!;

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

