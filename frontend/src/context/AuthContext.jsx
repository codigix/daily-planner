import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('codigix_auth_token') || '');
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  // ── Auto-verify stored token on application boot ──
  useEffect(() => {
    async function checkAuth() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
          } else {
            logout();
          }
        } else {
          logout();
        }
      } catch (err) {
        console.warn('Auth verify network issue:', err.message);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [token]);

  // ── Login ──
  const login = async (email, password) => {
    setAuthError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed.');
      }
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('codigix_auth_token', data.token);
      return data.user;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  // ── Register Account ──
  const register = async (email, password, fullName, role) => {
    setAuthError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, role })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed.');
      }
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('codigix_auth_token', data.token);
      return data.user;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  // ── Google OAuth Sign In / Sign Up ──
  const loginWithGoogle = async (credential) => {
    setAuthError('');
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Google Authentication failed.');
      }
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('codigix_auth_token', data.token);
      return data.user;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  // ── Logout ──
  const logout = () => {
    setUser(null);
    setToken('');
    setAuthError('');
    localStorage.removeItem('codigix_auth_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, authError, login, register, loginWithGoogle, logout, setAuthError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
