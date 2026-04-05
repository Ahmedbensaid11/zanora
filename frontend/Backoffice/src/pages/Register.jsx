import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CenterLayout } from '../components/CenterLayout';
import { authAPI } from '../api/auth';
import '../styles/login.css';

export const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    city: '',
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
      const response = await authAPI.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        city: formData.city,
        active: true
      });

      localStorage.setItem('token', response.token);
      navigate('/MonthlyUsageManager');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CenterLayout>
      <div className="auth-container register-container">
        <div className="logo-container">
          <img 
            src="/src/assets/smartwaterlogo.png" 
            alt="SmartWater Logo" 
            className="logo-image2"
          />
        </div>

        <form onSubmit={handleSubmit} className="auth-form register-form">
          
          <div className="input-group">
            <input
              type="text"
              name="username"
              placeholder="USERNAME"
              value={formData.username}
              onChange={handleChange}
              required
              className="auth-input"
            />
          </div>

          <div className="input-group">
            <input
              type="email"
              name="email"
              placeholder="EMAIL"
              value={formData.email}
              onChange={handleChange}
              required
              className="auth-input"
            />
          </div>

          <div className="input-group">
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

          <div className="input-group">
            <input
              type="text"
              name="city"
              placeholder="CITY"
              value={formData.city}
              onChange={handleChange}
              required
              className="auth-input"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'SIGNING UP...' : 'SIGN UP'}
          </button>
        </form>

        <div className="auth-links">
          <div className="signup-text">
            <span>Already have an account?</span>{' '}
            <button onClick={() => navigate('/login')} className="link-button">
              Login here!
            </button>
          </div>
        </div>
      </div>
    </CenterLayout>
  );
};
