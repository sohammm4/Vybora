const WELCOME_KEY = 'vybora_welcome_completed';
const LOCATION_KEY = 'vybora_user_location';

export const hasCompletedWelcome = () => {
  try {
    return localStorage.getItem(WELCOME_KEY) === 'true';
  } catch {
    return false;
  }
};

export const completeWelcome = () => {
  try {
    localStorage.setItem(WELCOME_KEY, 'true');
  } catch {
    // Keep the current visit usable when browser storage is unavailable.
  }
};

export const getSavedLocation = () => {
  try {
    const value = JSON.parse(localStorage.getItem(LOCATION_KEY) || 'null');
    if (
      value &&
      Number.isFinite(value.latitude) &&
      Number.isFinite(value.longitude) &&
      value.latitude >= -90 &&
      value.latitude <= 90 &&
      value.longitude >= -180 &&
      value.longitude <= 180
    ) {
      return value;
    }
  } catch {
    return null;
  }
  return null;
};

export const saveLocation = ({ latitude, longitude }) => {
  try {
    localStorage.setItem(LOCATION_KEY, JSON.stringify({ latitude, longitude }));
  } catch {
    return false;
  }
  return true;
};
