require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const notificationRoutes = require('./routes/notifications');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'notifications-service' }));
app.use('/', notificationRoutes);

const PORT = process.env.PORT || 4003;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`notifications-service listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });
