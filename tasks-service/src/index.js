require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const requireAuth = require('./middleware/auth');
const taskRoutes = require('./routes/tasks');
const { register, metricsMiddleware } = require('./metrics');
const app = express();
app.use(cors());
app.use(express.json());
app.use(metricsMiddleware);
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'tasks-service' }));
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
app.use('/', requireAuth, taskRoutes);
const PORT = process.env.PORT || 4002;
connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`tasks-service listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });
