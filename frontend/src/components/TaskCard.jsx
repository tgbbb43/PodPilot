const STATUSES = ['todo', 'in-progress', 'done'];

export default function TaskCard({ task, currentUser, onChangeStatus, onDelete }) {
  const nextStatus = STATUSES[(STATUSES.indexOf(task.status) + 1) % STATUSES.length];
  const isMine = task.assignedTo === currentUser.id;

  return (
    <div className={`task-card${isMine ? ' task-card--mine' : ''}`}>
      <div className="task-card__title">{task.title}</div>
      {task.description && <div className="task-card__desc">{task.description}</div>}
      <div className="task-card__meta">
        {task.assignedTo ? `assigned: ${task.assignedTo.slice(-6)}` : 'unassigned'}
      </div>
      <div className="task-card__actions">
        <button onClick={() => onChangeStatus(task, nextStatus)}>Move to {nextStatus}</button>
        <button className="danger" onClick={() => onDelete(task)}>
          Delete
        </button>
      </div>
    </div>
  );
}
