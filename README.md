## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`


## Auth API environment variables

Set these server-side variables in your deployment platform (e.g. Vercel):

- `ADMIN_PASSWORD`
- `GUEST_PASSWORD`

Do **not** prefix them with `VITE_`, otherwise they may be exposed to the client bundle.
