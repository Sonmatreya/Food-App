const configuredApiUrl = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? 'https://food-app-backend-lxic.onrender.com' : 'http://localhost:5000');

export const API_URL = configuredApiUrl.replace(/\/+$/, '');
