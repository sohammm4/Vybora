import { useState } from 'react';
import { completeWelcome, saveLocation } from '../location';

export default function Welcome({ onComplete }) {
  const [requestingLocation, setRequestingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');

  const continueToApp = () => {
    completeWelcome();
    onComplete();
  };

  const useLocation = () => {
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError('Location is not available in this browser. You can continue without it.');
      return;
    }

    setRequestingLocation(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        saveLocation({ latitude: coords.latitude, longitude: coords.longitude });
        completeWelcome();
        onComplete();
      },
      (error) => {
        setRequestingLocation(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError('Location permission was denied. You can continue without location.');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setLocationError('Your location could not be determined. Try again or continue without it.');
        } else {
          setLocationError('The location request timed out. Try again or continue without it.');
        }
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 5 * 60 * 1000 },
    );
  };

  return (
    <main className="welcome-page">
      <section className="welcome-card" aria-labelledby="welcome-title">
        <div className="welcome-brand"><i /> VYBORA</div>
        <span className="welcome-kicker">LIVE MUSIC, WHEREVER YOU ARE</span>
        <h1 id="welcome-title">Find your next<br /><span>live moment.</span></h1>
        <p className="welcome-intro">
          Discover real upcoming concerts, explore them on the map, and follow official ticket links.
          Event listings come from Ticketmaster and availability can change at the source.
        </p>

        <div className="welcome-features">
          <div><b>01</b><span>Browse current concert listings</span></div>
          <div><b>02</b><span>Explore real venues on the map</span></div>
          <div><b>03</b><span>Open official event and ticket details</span></div>
        </div>

        <div className="welcome-location">
          <div>
            <h2>Discover shows near you</h2>
            <p>Allow location access to show nearby events. Your browser asks permission first; coordinates are saved on this device for the nearby feed.</p>
          </div>
          <button className="btn pr welcome-location-button" onClick={useLocation} disabled={requestingLocation}>
            {requestingLocation ? 'Finding your location...' : 'Use my location'}
          </button>
        </div>
        {locationError && <p className="welcome-error" role="status">{locationError}</p>}
        <button className="welcome-skip" onClick={continueToApp}>
          Continue without location
        </button>
      </section>
      <p className="welcome-provider">Real event data · Ticketmaster listings · No sample concerts</p>
    </main>
  );
}
