import { useEffect, useState } from 'react';
import { tasks as tasksApi } from '../api';
import TaskCard from './TaskCard';

const COLUMNS = [
  { key: 'todo', label: 'To Do' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
];

export default function Board({ currentUser }) {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState(currentUser.id);
  const [error, setError] = useState('');

  async function refresh() {
    try {
      const data = await tasksApi.list();
      setTasks(data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    try {
      await tasksApi.create({ title, description, status: 'todo', assignedTo: assignedTo || null });
      setTitle('');
      setDescription('');
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleChangeStatus(task, status) {
    try {
      await tasksApi.update(task._id, { status });
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(task) {
    try {
      await tasksApi.remove(task._id);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <form className="new-task-form" onSubmit={handleCreate}>
        <input
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          placeholder="Assigned user id (optional)"
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
        />
        <button type="submit">➕ Add Task</button>
      </form>

      {error && <p className="auth-error">{error}</p>}

      <div className="board">
        {COLUMNS.map((col) => (
          <div key={col.key} className="board-column">
            <h2>{col.label}</h2>
            {tasks
              .filter((t) => t.status === col.key)
              .map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  currentUser={currentUser}
                  onChangeStatus={handleChangeStatus}
                  onDelete={handleDelete}
                />
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
