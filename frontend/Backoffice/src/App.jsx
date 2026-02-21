import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import RolesPermissions from './pages/RolesPermissions';

import ManageRolesPage from './pages/ManageRolesPage';

import UserManagement from './pages/UserManagement';
import SettingsPage, { useInitSettings } from './pages/Settingspage '; 
import { Layout } from './components/Layout';
function App() {
  
  return (
    
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/permission" element={<Layout><RolesPermissions /></Layout>} />
        <Route path="/roles" element={<Layout><ManageRolesPage /></Layout>} />
        <Route path="/users" element={<Layout><UserManagement /></Layout>} />
        <Route path="/settings" element={<Layout><SettingsPage /></Layout>} />

        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;