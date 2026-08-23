import { useEffect, useRef, useState } from 'react';
import { notifications } from '../api';

const POLL_INTERVAL_MS = 5000;

export default function NotificationsBadge({ userId }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    async function poll() {
      try {
        const data = await notifications.list(userId);
        setItems(data);
      } catch (err) {
        console.error('failed to poll notifications', err);
      }
    }

    poll();
    timerRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(timerRef.current);
  }, [userId]);

  return (
    <div className="notifications">
      <button className="notifications__bell" onClick={() => setOpen(!open)}>
        Notifications
        {items.length > 0 && <span className="notifications__count">{items.length}</span>}
      </button>

      {open && (
        <div className="notifications__panel">
          {items.length === 0 && <p className="notifications__empty">No notifications yet</p>}
          {items.map((n) => (
            <div key={n._id} className="notifications__item">
              <div>{n.message}</div>
              <div className="notifications__time">{new Date(n.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
