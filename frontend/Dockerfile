# --- build stage: compile the React app ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

# --- runtime stage: serve static files + reverse-proxy /api/* via nginx ---
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Sensible defaults for docker-compose; override with real Kubernetes
# Service DNS names (e.g. http://tasks-service:4002) at deploy time.
ENV USERS_SERVICE_URL=http://users-service:4001
ENV TASKS_SERVICE_URL=http://tasks-service:4002
ENV NOTIFICATIONS_SERVICE_URL=http://notifications-service:4003

EXPOSE 80
