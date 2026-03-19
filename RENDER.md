# Deploying to Render (SPA)

So that direct links like `/play`, `/admin`, `/manifesto` work (no 404), add a **Rewrite** in the Render Dashboard:

1. Open your **Static Site** → **Redirects/Rewrites** (or **Settings** → **Redirects/Rewrites**).
2. Add a **Rewrite** rule:

   | Field            | Value          |
   |------------------|----------------|
   | **Source Path**  | `/*`           |
   | **Destination**  | `/index.html`  |
   | **Action**       | **Rewrite**    |

3. Save.

Without this, visiting `https://yoursite.onrender.com/play` or `/admin` returns 404 because Render looks for a file at that path instead of serving the SPA.
