import { useEffect, useState } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import { Nav } from './components';
import { hasCompletedWelcome } from './location';
import Artist from './pages/Artist';
import Concert from './pages/Concert';
import Explore from './pages/Explore';
import Landing from './pages/Landing';
import Saved from './pages/Saved';
import Welcome from './pages/Welcome';

function Top() {
  useEffect(() => {
    window.scrollTo(0, 0);
  });
  return null;
}

export default function App() {
  const [welcomeComplete, setWelcomeComplete] = useState(hasCompletedWelcome);

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
