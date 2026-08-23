const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    taskId: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, default: 'info' },
    read: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'notifications' }
);

module.exports = mongoose.model('Notification', notificationSchema);
