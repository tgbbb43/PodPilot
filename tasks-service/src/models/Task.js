const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['todo', 'in-progress', 'done'],
      default: 'todo',
    },
    assignedTo: { type: String, default: null }, // users-service user id
  },
  { timestamps: true, collection: 'tasks' }
);

module.exports = mongoose.model('Task', taskSchema);
