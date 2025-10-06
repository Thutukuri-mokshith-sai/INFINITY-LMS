import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');

  // Load user info from localStorage on app start
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUserId = localStorage.getItem('userId');
    const storedName = localStorage.getItem('name');
    const storedEmail = localStorage.getItem('email');
    const storedRole = localStorage.getItem('role');

    if (token && storedUserId && storedRole) {
      setIsAuthenticated(true);
      setUserId(storedUserId);
      setName(storedName);
      setEmail(storedEmail);
      setRole(storedRole);
    }
  }, []);

  const login = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userId', user.id);
    localStorage.setItem('name', user.name);
    localStorage.setItem('email', user.email);
    localStorage.setItem('role', user.role);

    setIsAuthenticated(true);
    setUserId(user.id);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
  };

  const logout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
    setUserId(null);
    setName('');
    setEmail('');
    setRole('');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, userId, name, email, role }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
