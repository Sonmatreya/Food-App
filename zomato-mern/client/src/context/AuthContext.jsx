import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    api('/auth/me', { token })
      .then((d) => setUser(d.user))
      .catch(() => {
        localStorage.removeItem('token');
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const saveSession = (d) => {
    localStorage.setItem('token', d.token);
    setToken(d.token);
    setUser(d.user);
  };

  const login = async (email, password) =>
    saveSession(await api('/auth/login', { method: 'POST', body: { email, password } }));
  const register = async (name, email, password) =>
    saveSession(await api('/auth/register', { method: 'POST', body: { name, email, password } }));
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const addAddress = useCallback(
    async (address) => {
      const d = await api('/auth/address', { method: 'POST', body: address, token });
      setUser((u) => ({ ...u, addresses: d.addresses }));
      return d.addresses;
    },
    [token]
  );
  const removeAddress = useCallback(
    async (id) => {
      const d = await api(`/auth/address/${id}`, { method: 'DELETE', token });
      setUser((u) => ({ ...u, addresses: d.addresses }));
    },
    [token]
  );

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, addAddress, removeAddress }}>
      {children}
    </AuthContext.Provider>
  );
}
