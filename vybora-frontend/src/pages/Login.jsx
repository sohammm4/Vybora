import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (isSignUp && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email.trim(), password);
        setMessage('Account created! Check your email for a confirmation link, then sign in.');
        setIsSignUp(false);
        setPassword('');
        setConfirmPassword('');
      } else {
        await signIn(email.trim(), password);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setMessage('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="welcome-brand"><i /> VYBORA</div>
        <span className="welcome-kicker">
          {isSignUp ? 'JOIN THE COMMUNITY' : 'WELCOME BACK'}
        </span>
        <h1 id="login-title">
          {isSignUp ? (
            <>Create your<br /><span>account.</span></>
          ) : (
            <>Sign in to<br /><span>your vibes.</span></>
          )}
        </h1>
        <p className="login-subtitle">
          {isSignUp
            ? 'Sign up to save concerts, sync across devices, and never miss a show.'
            : 'Access your saved concerts and personalized experience.'}
        </p>

        {error && <div className="login-error" role="alert">{error}</div>}
        {message && <div className="login-success" role="status">{message}</div>}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="login-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              required
            />
          </div>

          {isSignUp && (
            <div className="login-field">
              <label htmlFor="login-confirm">Confirm Password</label>
              <input
                id="login-confirm"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
          )}

          <button className="btn pr login-submit" type="submit" disabled={loading}>
            {loading
              ? (isSignUp ? 'Creating account...' : 'Signing in...')
              : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div className="login-divider">
          <span>or</span>
        </div>

        <button className="login-switch" onClick={switchMode}>
          {isSignUp
            ? 'Already have an account? Sign in'
            : "Don't have an account? Sign up"}
        </button>
      </section>
    </main>
  );
}

