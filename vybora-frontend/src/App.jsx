import { useEffect, useState } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import { Nav } from './components';
import { useAuth } from './contexts/AuthContext';
import { hasCompletedWelcome } from './location';
import Artist from './pages/Artist';
import Concert from './pages/Concert';
import Explore from './pages/Explore';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Saved from './pages/Saved';
import Welcome from './pages/Welcome';

function Top() {
  useEffect(() => {
    window.scrollTo(0, 0);
  });
  return null;
}

export default function App() {
  const { user, loading, supabaseReady } = useAuth();
  const [welcomeComplete, setWelcomeComplete] = useState(hasCompletedWelcome);

  // Show loading spinner only when Supabase is configured and still loading
  if (loading) {
    return (
      <main className="login-page">
        <div className="login-card" style={{ textAlign: 'center' }}>
          <div className="welcome-brand"><i /> VYBORA</div>
          <p className="login-subtitle" style={{ marginTop: 24 }}>Loading...</p>
        </div>
      </main>
    );
  }

  // If Supabase is configured but user is not logged in, show login page
  if (supabaseReady && !user) {
    return <Login />;
  }

  // Welcome flow (location permission)
  if (!welcomeComplete) {
    return <Welcome onComplete={() => setWelcomeComplete(true)} />;
  }

  return (
    <>
      <Nav />
      <Top />
      <main>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/concert/:id" element={<Concert />} />
          <Route path="/artists/:id" element={<Artist />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="*" element={<div className="empty"><h2>Page not found</h2><Link className="btn pr" to="/">Home</Link></div>} />
        </Routes>
      </main>
    </>
  );
}
