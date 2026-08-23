# KubeKanban

A small kanban board app built as microservices, designed to be deployed on Kubernetes (Minikube). This repo contains only the application code, Dockerfiles, and a docker-compose setup for local testing — no Kubernetes manifests (Deployments/Services/ConfigMaps/Secrets/Ingress) are included; those are meant to be written by hand as a learning exercise.

## Architecture

```
frontend (React + nginx)
   |  /api/auth, /api/users   -> users-service
   |  /api/tasks              -> tasks-service
   |  /api/notifications      -> notifications-service
   v
users-service (Express, port 4001) ---- MongoDB db "users"
tasks-service (Express, port 4002) ---- MongoDB db "tasks"
   |  calls users-service to validate assignedTo
   |  calls notifications-service on create/status change
notifications-service (Express, port 4003) ---- MongoDB db "notifications"
```

Each backend service connects to its own MongoDB **database** on a single MongoDB instance (via `MONGO_URI`), not its own MongoDB container — MongoDB itself is assumed to be provided separately (a `mongodb` container in docker-compose locally; a `mongodb` Service/Pod you provide in the cluster).

No hostnames are hardcoded anywhere in application code:
- Backend services read `MONGO_URI`, `USERS_SERVICE_URL`, `NOTIFICATIONS_SERVICE_URL`, `JWT_SECRET` from env vars.
- The frontend's JS only ever calls relative paths (`/api/tasks`, `/api/auth/login`, etc). Those paths get resolved to real service hosts by:
  - Vite's dev-server proxy (local `npm run dev`, config in `frontend/vite.config.js`), or
  - nginx (`frontend/nginx.conf.template`, env-substituted from `USERS_SERVICE_URL`/`TASKS_SERVICE_URL`/`NOTIFICATIONS_SERVICE_URL` at container start) when built into a Docker image.

  This is the same pattern a Kubernetes Ingress will use later, so the app code doesn't need to change when you add manifests.

## Services

### users-service
- `POST /register` `{ username, password }` -> `{ token, user }`
- `POST /login` `{ username, password }` -> `{ token, user }`
- `GET /users/:id` -> `{ id, username, createdAt }`
- Env: `PORT`, `MONGO_URI`, `JWT_SECRET`

### tasks-service
- `GET /tasks` (optional `?status=` / `?assignedTo=` filters)
- `POST /tasks` `{ title, description, status, assignedTo }`
- `PUT /tasks/:id` `{ title?, description?, status?, assignedTo? }`
- `DELETE /tasks/:id`
- All routes require `Authorization: Bearer <token>` (JWT issued by users-service, verified with the same `JWT_SECRET`)
- On create/status-change, calls `NOTIFICATIONS_SERVICE_URL` `POST /notify`
- On create/update with an `assignedTo`, calls `USERS_SERVICE_URL` `GET /users/:id` to make sure the user exists
- Env: `PORT`, `MONGO_URI`, `JWT_SECRET`, `USERS_SERVICE_URL`, `NOTIFICATIONS_SERVICE_URL`

### notifications-service
- `POST /notify` `{ userId, taskId, message, type }`
- `GET /notifications/:userId`
- Env: `PORT`, `MONGO_URI`

### frontend
- React SPA (Vite): login/register screen, kanban board with todo/in-progress/done columns, a polling notifications badge
- Env (dev-server proxy only): `USERS_SERVICE_URL`, `TASKS_SERVICE_URL`, `NOTIFICATIONS_SERVICE_URL`
- Env (Docker image, substituted into nginx config at container start): same three variables

## Running locally without Docker

You'll need a local MongoDB running on `localhost:27017` (or point `MONGO_URI` at any Mongo instance).

For each backend service:

```bash
cd users-service          # or tasks-service / notifications-service
cp .env.example .env      # adjust MONGO_URI etc if needed
npm install
npm run dev                # nodemon-less watch mode via `node --watch`
```

Start them in this order so inter-service calls succeed: `users-service`, `notifications-service`, `tasks-service`.

For the frontend:

```bash
cd frontend
cp .env.example .env      # points the dev proxy at localhost:4001/4002/4003
npm install
npm run dev                # http://localhost:5173
```

## Running with docker-compose (recommended for local testing)

From the repo root:

```bash
docker compose up --build
```

This builds all four images, starts a `mongodb` container, and wires the services together using their compose service names as hostnames (e.g. `MONGO_URI=mongodb://mongodb:27017/tasks`, `USERS_SERVICE_URL=http://users-service:4001`).

Once it's up:
- Frontend: http://localhost:8080
- users-service: http://localhost:4001
- tasks-service: http://localhost:4002
- notifications-service: http://localhost:4003

Stop everything with `docker compose down` (add `-v` to also drop the MongoDB volume).

## Building individual Docker images

Each service has its own multi-stage Dockerfile, so you can build them independently:

```bash
docker build -t kubekanban/users-service ./users-service
docker build -t kubekanban/tasks-service ./tasks-service
docker build -t kubekanban/notifications-service ./notifications-service
docker build -t kubekanban/frontend ./frontend
```

For Minikube, either point your shell's Docker CLI at Minikube's daemon first (`eval $(minikube docker-env)` on Linux/macOS, or `minikube -p minikube docker-env | Invoke-Expression` in PowerShell) and then run the same `docker build` commands, or `minikube image load kubekanban/<service>` after building locally.

### Runtime env vars each image expects

| Service | Required env vars |
|---|---|
| users-service | `MONGO_URI`, `JWT_SECRET`, `PORT` (default 4001) |
| tasks-service | `MONGO_URI`, `JWT_SECRET`, `USERS_SERVICE_URL`, `NOTIFICATIONS_SERVICE_URL`, `PORT` (default 4002) |
| notifications-service | `MONGO_URI`, `PORT` (default 4003) |
| frontend | `USERS_SERVICE_URL`, `TASKS_SERVICE_URL`, `NOTIFICATIONS_SERVICE_URL` (used to render the nginx config at container start) |

When you write the Kubernetes manifests, these map directly to ConfigMap/Secret-backed env vars, with `MONGO_URI`/`*_SERVICE_URL` pointing at in-cluster Service DNS names (e.g. `http://tasks-service.default.svc.cluster.local:4002` or just `http://tasks-service:4002` within the same namespace).
# PodPilot
