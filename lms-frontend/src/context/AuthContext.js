// src/context/AuthContext.js

import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null); // ⭐️ New state for the JWT token
  const [userId, setUserId] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);

  // Load user info from localStorage on app start
  useEffect(() => {
    const storedToken = localStorage.getItem('token'); // ⭐️ Load token
    const storedUserId = localStorage.getItem('userId');
    const storedName = localStorage.getItem('name');
    const storedEmail = localStorage.getItem('email');
    const storedRole = localStorage.getItem('role');

    if (storedToken && storedUserId && storedRole) {
      setIsAuthenticated(true);
      setToken(storedToken); // ⭐️ Set token
      setUserId(storedUserId);
      setName(storedName);
      setEmail(storedEmail);
      setRole(storedRole);
    }

    setLoading(false);
  }, []);

  const login = (newToken, user) => {
    localStorage.setItem('token', newToken); // Use newToken to avoid variable shadowing
    localStorage.setItem('userId', user.id);
    localStorage.setItem('name', user.name);
    localStorage.setItem('email', user.email);
    localStorage.setItem('role', user.role);

    setIsAuthenticated(true);
    setToken(newToken); // ⭐️ Set token
    setUserId(user.id);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
  };

  const logout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
    setToken(null); // ⭐️ Clear token
    setUserId(null);
    setName('');
    setEmail('');
    setRole('');
  };

  return (
    // ⭐️ Expose token in the context value
    <AuthContext.Provider value={{ isAuthenticated, login, logout, userId, name, email, role, loading, token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);