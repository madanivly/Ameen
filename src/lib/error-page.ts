export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>This page didn't load</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #fafafa; color: #111; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
      p { color: #4b5563; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.375rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #111; color: #fff; }
      .secondary { background: #fff; color: #111; border-color: #d1d5db; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>This page didn't load</h1>
      <p>Something went wrong on our end. You can try refreshing or head back home.</p>
      <div class="actions">
        <button class="primary" onclick="retryWithCacheBust()">Try again</button>
        <a class="secondary" href="/">Go home</a>
      </div>
    </div>
    <script>
      /* Retry with a cache-busting navigate so TanStack Router re-runs fresh */
      function retryWithCacheBust() {
        try {
          /* Clear any stale TanStack Router / query cache from session storage */
          const keys: string[] = [];
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && (key.includes('tanstack') || key.includes('router') || key.includes('tsr') || key.includes('query'))) {
              keys.push(key);
            }
          }
          keys.forEach(k => sessionStorage.removeItem(k));
        } catch (_) { /* ignore */ }
        /* Force a hard navigation to the same path, bypassing any cached SPA state */
        window.location.replace(window.location.pathname + '?_=' + Date.now());
      }
    </script>
  </body>
</html>`;
}