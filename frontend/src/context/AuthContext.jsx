import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // 🛡️ Safe initialization for the active session
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('active_clearance_session');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.warn("Corrupted session discovered. Wiping entry...");
      localStorage.removeItem('active_clearance_session');
      return null;
    }
  });

  // 🛡️ Safe initialization for the local database records
  const [registeredUsers, setRegisteredUsers] = useState(() => {
    const defaultOfficer = { 
      email: 'officer@kabarak.ac.ke', 
      password: 'officer123', 
      name: 'Dean / University Librarian', 
      role: 'OFFICER', 
      department: 'University Library' 
    };

    try {
      const savedUsers = localStorage.getItem('system_users_db');
      if (savedUsers) {
        const parsed = JSON.parse(savedUsers);
        // Ensure the default testing officer is always present
        if (!parsed.some(u => u.email === defaultOfficer.email)) {
          parsed.push(defaultOfficer);
        }
        return parsed;
      }
      return [defaultOfficer];
    } catch (error) {
      console.warn("Corrupted database keys detected. Hard resetting user records ledger...");
      localStorage.setItem('system_users_db', JSON.stringify([defaultOfficer]));
      return [defaultOfficer];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('system_users_db', JSON.stringify(registeredUsers));
    } catch (e) {
      console.error("Failed to write to browser local database registry storage line", e);
    }
  }, [registeredUsers]);

  // Handle new registrations smoothly
  const register = (name, email, password, role, regNumber = '') => {
    const userExists = registeredUsers.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (userExists) throw new Error("Account with this email already exists within the registrar index.");

    const newUser = { 
      name, 
      email: email.trim(), 
      password, 
      role, 
      regNumber: role === 'OFFICER' ? '' : regNumber, 
      department: role === 'OFFICER' ? 'University Library' : null 
    };
    
    setRegisteredUsers(prev => [...prev, newUser]);
    return true;
  };

  // Login processing checking actual registered passwords
  const login = (email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    const foundUser = registeredUsers.find(u => u.email.toLowerCase() === cleanEmail && u.password === password);

    if (!foundUser) {
      throw new Error("Invalid email security mapping or incorrect password.");
    }

    setUser(foundUser);
    localStorage.setItem('active_clearance_session', JSON.stringify(foundUser));
    return foundUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('active_clearance_session');
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be called from directly inside an active <AuthProvider> rendering layout wrapper node.");
  }
  return context;
};