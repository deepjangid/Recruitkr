# Recruitkr Frontend

Recruitkr ka frontend application `Vite`, `React`, `TypeScript`, `Tailwind CSS`, aur `shadcn/ui` stack par built hai.

## Local development

Requirements:

- Node.js
- npm

Run locally:

```sh
npm install
npm run dev
```

Optional frontend env for local API:

```sh
VITE_API_URL=http://localhost:5000/api/v1
```

If `VITE_API_URL` is not set:
- local development uses `http://localhost:5000/api/v1`
- production uses `/api/v1` on the same domain as the frontend

## Deployment

For a separate frontend + backend deployment:

- Set frontend `VITE_API_URL` to your public backend URL, for example `https://your-backend.example.com/api/v1`
- Set backend `CORS_ORIGIN` to your frontend URL, for example `https://your-frontend.vercel.app`
- After deploy, test `https://your-backend.example.com/api/v1/health`

If the frontend shows `Backend server is not reachable`, the most common cause is that the frontend was built without `VITE_API_URL` and is calling the wrong host.

## Available scripts

- `npm run dev` - start local dev server
- `npm run build` - create production build
- `npm run preview` - preview production build locally
- `npm run lint` - run ESLint
- `npm run test` - run Vitest once
- `npm run test:watch` - run Vitest in watch mode
