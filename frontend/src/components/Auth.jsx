import { useState } from 'react';
import { auth } from '../api';

export default function Auth({ onAuthenticated }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const fn = mode === 'login' ? auth.login : auth.register;
      const { token, user } = await fn(username, password);
      auth.saveSession(token, user);
      onAuthenticated({ token, user });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-screen">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>PodPilot v2</h1>
        <p className="auth-subtitle">{mode === 'login' ? 'Sign in' : 'Create an account'}</p>

        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={4}
          />
        </label>

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Register'}
        </button>

        <button
          type="button"
          className="link-button"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        >
          {mode === 'login' ? "Need an account? Register" : 'Already have an account? Sign in'}
        </button>
      </form>
    </div>
  );
}
