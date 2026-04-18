import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CenterLayout } from '../components/CenterLayout';
import { authAPI } from '../api/auth';
import '../styles/login.css';
import logo from "../assets/logo.png";
export const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(formData.email, formData.password);
      
      localStorage.setItem('token', response.token);
      const user = await authAPI.getCurrentUser(response.token)
      localStorage.setItem('currentUser', JSON.stringify(user));
      
      console.log("=============================",localStorage.getItem('token'))
      navigate('/users');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CenterLayout>
      <div className="auth-container">
        <div className="logo-container">
          <img 
            src={logo} 
            alt="SmartWater Logo" 
            className="logo-image"
          />
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <div className="input-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="7" r="4" strokeWidth="2"/>
              </svg>
            </div>
            <input
              type="text"
              name="email"
              placeholder="USERNAME"
              value={formData.email}
              onChange={handleChange}
              required
              className="auth-input"
            />
          </div>

          <div className="input-group">
            <div className="input-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeWidth="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <input
              type="password"
              name="password"
              placeholder="PASSWORD"
              value={formData.password}
              onChange={handleChange}
              required
              className="auth-input"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'LOGGING IN...' : 'LOGIN'}
          </button>
        </form>
      </div>
    </CenterLayout>
  );
};