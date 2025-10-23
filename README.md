# next_crud_deployment

A small Next.js CRUD app (Topics) running with MongoDB and nginx via Docker Compose.

This README explains how to run and deploy the project, environment variables, common troubleshooting steps (including DNS/URL/Undici issues), and verification steps.

---

## Quick start (Docker Compose)

Requirements:
- Docker & Docker Compose (v2 recommended)
- Node.js (only if you want to run outside Docker)
- Git (optional)

1. Clone the repo
```bash
git clone <repo-url>
cd next_deployment
```

2. Create a `.env` file (see `.env.example` below)
```env
# Example .env
MONGODB_URI=mongodb://mongodb_service:27017/topicsdb
# NEXT_API_URL is used by server-side code inside Docker (internal hostname)
NEXT_API_URL=http://nginx_service
# Do NOT expose Docker-only hostnames to the browser (do not set NEXT_PUBLIC_* to docker hostnames)
```

3. Run with Docker Compose (recommended)
```powershell
# from project root (Windows PowerShell)
docker compose up --build
```

4. Open the app
- Visit: http://localhost

---

## How it works

- `nginx_service` (nginx) listens on port 80 and proxies requests to the Next.js app instances via the `nextcrud_cluster` upstream.
- `next_node1` and `next_node2` are Next.js production containers running on port 3000 internally.
- `mongodb_service` runs MongoDB and persists data to a Docker volume.

API routes (Next) are available under `/api/...` and should be called from the browser using relative paths, e.g. `/api/topics`.

Important: Do not use Docker internal hostnames (like `http://nginx_service`) inside client-side code. Those hostnames are resolvable only inside the Docker network and will cause browser DNS errors (ERR_NAME_NOT_RESOLVED). For server-side code running in Docker, `NEXT_API_URL` can be set to `http://nginx_service`.

---

## Environment variables

- `MONGODB_URI` (required) — MongoDB connection string used by the server-side code. Example:
	- `mongodb://mongodb_service:27017/topicsdb`
- `NEXT_API_URL` (optional) — Internal URL pointing to nginx inside the Docker network (e.g., `http://nginx_service`). Only for server-side code. Do not expose it to the browser.
- If you need a client-visible API base URL, use a `NEXT_PUBLIC_*` variable but point it to a host the browser can reach (e.g., `http://localhost`) or prefer relative requests (`/api/…`) so no absolute URL is required.

Sample `.env`:
```
MONGODB_URI=mongodb://mongodb_service:27017/topicsdb
NEXT_API_URL=http://nginx_service
```

---

## Code changes you might care about

- Client-side components were changed to use relative API paths (`/api/...`) to avoid leaking Docker hostnames to the browser.
	- Files updated: `components/TopicsList.jsx`, `components/RemoveBtn.jsx`, `components/EditTopicForm.jsx`, `app/addTopic/page.jsx`.
- `app/editTopic/[id]/page.jsx` and `components/TopicsList.jsx` now use a helper to build an absolute URL when running server-side and fall back to a relative path when running in the browser. See `libs/apiUrl.js`.
- `libs/mongodb.js` uses a cached global connection pattern to avoid reconnecting on every request.

---

## Troubleshooting

Common errors and fixes:

1. Browser error: net::ERR_NAME_NOT_RESOLVED for `http://nginx_service`
	 - Cause: client (browser) attempted to fetch a Docker-only hostname like `nginx_service`.
	 - Fix: Use relative URLs (`/api/...`) in client code. The server (inside Docker) may still use `http://nginx_service` via `NEXT_API_URL`.

2. Server error: TypeError: Failed to parse URL from /api/topics or ERR_INVALID_URL
	 - Cause: Node's `fetch` (undici) requires an absolute URL when called outside of an incoming request context with a relative URL. Server-side code was calling `fetch('/api/topics')` without an absolute base.
	 - Fix: Build an absolute URL on the server (e.g. `${process.env.NEXT_API_URL}/api/topics`) and use relative URLs in the browser. The project includes a helper `libs/apiUrl.js` that does this detection.

3. MongoDB issues
	 - If you see repeated connection attempts or many open connections, ensure `libs/mongodb.js` uses a cached connection. This repo includes a cached connection pattern to prevent leaking connections in dev.

4. Compose / Docker issues
	 - If you change `compose.yaml`, run:
		 ```powershell
		 docker compose down
		 docker compose up --build
		 ```
	 - To view logs:
		 ```powershell
		 docker compose logs -f
		 ```

---

## Development (without Docker)

If you prefer to run Next locally (outside Docker) and connect to a separate MongoDB instance:

1. Start MongoDB locally or use a cloud MongoDB (MongoDB Atlas). Set `MONGODB_URI` accordingly (e.g. `mongodb://localhost:27017/topicsdb`).
2. Install dependencies:
```bash
npm install
```
3. Run dev server:
```bash
npm run dev
```
4. Open http://localhost:3000

Note: When running Next locally, `NEXT_API_URL` should not point to `http://nginx_service` — either omit it or set a browser-reachable URL.

---

## Deploying

This project is containerized and intended to run with Docker Compose or in an orchestrator (Kubernetes).

- For Docker Compose on a server:
	- Copy the repository to the server, ensure Docker and Docker Compose are installed, configure `.env` (use a proper MongoDB endpoint) and run:
		```bash
		docker compose up -d --build
		```
	- Use a reverse proxy / TLS termination in front of nginx (or configure nginx for TLS) if exposing to the public internet.

- For Kubernetes:
	- Containerize the app image(s) and create Kubernetes manifests.
	- Use a `Service` and `Ingress` to expose the nginx or Next.js service.
	- Use a managed MongoDB or a StatefulSet with persistent volumes.

---

## Verification & smoke tests

After starting the stack with `docker compose up --build`:

1. Visit `http://localhost` — the app UI should load.
2. Create a topic via the UI (Add Topic) — a POST to `/api/topics` should return HTTP 201.
3. Visit home page — topics list should show the created topic (GET `/api/topics`).
4. Edit or remove a topic — check PUT/DELETE behavior.

Check logs for unexpected errors:
```powershell
docker compose logs -f
```

Expected healthy signs in the logs:
- `mongodb_service` shows `mongod startup complete` and `Listening on 0.0.0.0:27017`.
- `next_node1` / `next_node2` show Next.js ready on `0.0.0.0:3000`.
- `nginx_service` access logs 200/304/201 for normal requests.

---

## Files of interest

- `compose.yaml` — the Docker Compose stack
- `nginx.conf` — nginx config (upstream to `next_node1`/`next_node2`)
- `libs/mongodb.js` — MongoDB connect helper (cached connection)
- `libs/apiUrl.js` — helper to build API URLs for server/client
- `app/` & `components/` — Next.js app and components

---

## Final notes

- Keep server-side-only hostnames (like `nginx_service`) out of client bundles.
- Prefer relative API calls from browser code.
- Use the cached mongoose connection in `libs/mongodb.js` to prevent connection leaks.
