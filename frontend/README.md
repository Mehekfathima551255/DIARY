# Smart Diary — Frontend

React + Vite single-page app for Smart Diary. See the [root README](../README.md)
for the full project overview and backend setup.

## Scripts

```bash
npm install      # install dependencies
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # production build → dist/
npm run preview  # preview the production build
npm run lint     # run oxlint
```

## Configuration

The backend URL is read from `VITE_API_URL` (defaults to `http://localhost:8000`).
Create a `.env` file to override it:

```env
VITE_API_URL=http://localhost:8000
```

## Structure

```text
src/
├── main.jsx          # entrypoint
├── App.jsx           # layout, view routing & auth gate
├── index.css         # global design system
├── context/          # AuthContext (session state)
├── lib/              # api.js (backend client) + demo.js (sample data)
├── components/       # Sidebar, charts
└── pages/            # one file per screen
```

> Tip: click **"Try the demo"** on the login page to browse the app with sample
> data — no backend required.
