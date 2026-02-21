import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api/auth';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const userData = await authAPI.getCurrentUser(token);
        setUser(userData);
      } catch (error) {
        console.error('Failed to fetch user:', error);
        localStorage.removeItem('token');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#1a1a1a',
        color: 'white',
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#1a1a1a',
      color: 'white',
      padding: '40px',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '40px',
        }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold' }}>Dashboard</h1>
          <button 
            onClick={handleLogout}
            style={{
              padding: '10px 20px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            Logout
          </button>
        </div>

        {user && (
          <div style={{
            background: '#2d2d2d',
            padding: '30px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
          }}>
            <h2 style={{ marginBottom: '20px', fontSize: '24px' }}>
              Welcome, {user.username}!
            </h2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
            }}>
              <div>
                <strong>Email:</strong> {user.email}
              </div>
              <div>
                <strong>City:</strong> {user.city || 'N/A'}
              </div>
              <div>
                <strong>Property Type:</strong> {user.propertyType || 'N/A'}
              </div>
              <div>
                <strong>Area:</strong> {user.area ? `${user.area} m²` : 'N/A'}
              </div>
              <div>
                <strong>Water Consumption:</strong> {user.waterConsumption || 'N/A'}
              </div>
              <div>
                <strong>Energy Consumption:</strong> {user.energyConsumption || 'N/A'}
              </div>
              <div>
                <strong>Tariff:</strong> {user.tarif || 'N/A'}
              </div>
              <div>
                <strong>Role:</strong> {user.role?.name || 'N/A'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};