const express = require('express');
const Notification = require('../models/Notification');

const router = express.Router();

router.post('/notify', async (req, res) => {
  try {
    const { userId, taskId, message, type } = req.body;
    if (!userId || !taskId || !message) {
      return res.status(400).json({ error: 'userId, taskId and message are required' });
    }

    const notification = await Notification.create({ userId, taskId, message, type });
    res.status(201).json(notification);
  } catch (err) {
    console.error('create notification error', err);
    res.status(500).json({ error: 'internal server error' });
  }
});

router.get('/notifications/:userId', async (req, res) => {
  const notifications = await Notification.find({ userId: req.params.userId }).sort({ createdAt: -1 });
  res.json(notifications);
});

module.exports = router;
