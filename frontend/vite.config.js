import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';

dotenv.config();

// Local dev only: proxies relative /api/* calls to whichever host:port each
// service is running on. In Docker/Kubernetes this same relative-path
// contract is fulfilled by the nginx reverse proxy instead (see
// nginx.conf.template), so the app code never hardcodes a hostname.
const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL || 'http://localhost:4001';
const TASKS_SERVICE_URL = process.env.TASKS_SERVICE_URL || 'http://localhost:4002';
const NOTIFICATIONS_SERVICE_URL = process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:4003';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // /api/auth/register, /api/auth/login -> users-service root routes
      '/api/auth': {
        target: USERS_SERVICE_URL,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/auth/, ''),
      },
      // /api/users/:id -> users-service GET /users/:id
      '/api/users': {
        target: USERS_SERVICE_URL,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // /api/tasks... -> tasks-service GET/POST/PUT/DELETE /tasks...
      '/api/tasks': {
        target: TASKS_SERVICE_URL,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // /api/notifications/:userId -> notifications-service GET /notifications/:userId
      '/api/notifications': {
        target: NOTIFICATIONS_SERVICE_URL,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
