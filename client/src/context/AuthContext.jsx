import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, getToken, setToken, clearToken, setUnauthorizedHandler } from '../api/client.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!getToken()); // true while we verify a saved token

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  // Any 401 from the API logs the user out (ProtectedRoute then redirects to login).
  useEffect(() => { setUnauthorizedHandler(logout); }, [logout]);

  // On app start: if a token is saved, ask the server who we are. Fails -> log out.
  useEffect(() => {
    if (!getToken()) return;
    api.me().then(setUser).catch(logout).finally(() => setLoading(false));
  }, [logout]);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
