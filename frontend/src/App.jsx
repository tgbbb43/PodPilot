import { useState } from 'react';
import { auth } from './api';
import AuthScreen from './components/Auth';
import Board from './components/Board';
import NotificationsBadge from './components/NotificationsBadge';

export default function App() {
  const [session, setSession] = useState(() => auth.loadSession());

  function handleLogout() {
    auth.clearSession();
    setSession(null);
  }

  if (!session) {
    return <AuthScreen onAuthenticated={setSession} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>PodPilot</h1>
        <div className="app-header__right">
          <NotificationsBadge userId={session.user.id} />
          <span className="app-header__user">{session.user.username}</span>
          <button onClick={handleLogout}>Log out</button>
        </div>
      </header>

      <main>
        <Board currentUser={session.user} />
      </main>
    </div>
  );
}
