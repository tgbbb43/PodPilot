const express = require('express');
const axios = require('axios');
const Task = require('../models/Task');

const router = express.Router();

const USERS_SERVICE_URL = process.env.USERS_SERVICE_URL;
const NOTIFICATIONS_SERVICE_URL = process.env.NOTIFICATIONS_SERVICE_URL;

async function userExists(userId) {
  if (!userId) return true; // unassigned tasks are allowed
  try {
    await axios.get(`${USERS_SERVICE_URL}/users/${userId}`);
    return true;
  } catch (err) {
    return false;
  }
}

async function notify(userId, taskId, message, type) {
  if (!userId) return;
  try {
    await axios.post(`${NOTIFICATIONS_SERVICE_URL}/notify`, { userId, taskId, message, type });
  } catch (err) {
    console.error('failed to send notification', err.message);
  }
}

router.get('/tasks', async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;

  const tasks = await Task.find(filter).sort({ createdAt: -1 });
  res.json(tasks);
});

router.post('/tasks', async (req, res) => {
  try {
    const { title, description, status, assignedTo } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'title is required' });
    }

    if (!(await userExists(assignedTo))) {
      return res.status(400).json({ error: `assigned user ${assignedTo} does not exist` });
    }

    const task = await Task.create({ title, description, status, assignedTo });

    await notify(assignedTo, task._id.toString(), `New task "${task.title}" assigned to you`, 'task_created');

    res.status(201).json(task);
  } catch (err) {
    console.error('create task error', err);
    res.status(500).json({ error: 'internal server error' });
  }
});

router.put('/tasks/:id', async (req, res) => {
  try {
    const existing = await Task.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'task not found' });
    }

    const { title, description, status, assignedTo } = req.body;

    if (assignedTo !== undefined && !(await userExists(assignedTo))) {
      return res.status(400).json({ error: `assigned user ${assignedTo} does not exist` });
    }

    const statusChanged = status !== undefined && status !== existing.status;

    if (title !== undefined) existing.title = title;
    if (description !== undefined) existing.description = description;
    if (status !== undefined) existing.status = status;
    if (assignedTo !== undefined) existing.assignedTo = assignedTo;

    await existing.save();

    if (statusChanged) {
      await notify(
        existing.assignedTo,
        existing._id.toString(),
        `Task "${existing.title}" moved to ${existing.status}`,
        'status_changed'
      );
    }

    res.json(existing);
  } catch (err) {
    console.error('update task error', err);
    res.status(400).json({ error: 'invalid task id or payload' });
  }
});

router.delete('/tasks/:id', async (req, res) => {
  try {
    const deleted = await Task.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'task not found' });
    }
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ error: 'invalid task id' });
  }
});

module.exports = router;
