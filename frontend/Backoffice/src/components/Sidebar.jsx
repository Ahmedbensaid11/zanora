import React from 'react';
import { LogOut } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faUserShield, faKey, faBrain} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

export const Sidebar = ({ activeItem, onNavigate }) => {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const isAdmin = currentUser?.role?.name === 'Admin';

  const menuItems = [
    ...(isAdmin
      ? [
          { id: 'users',      label: 'Users',               icon: faUser,       color: '#10B981' },
          { id: 'roles',      label: 'Roles & Permissions',  icon: faUserShield, color: '#E879F9' },
          { id: 'permission', label: 'Permissions',          icon: faKey,        color: '#60A5FA' },
          { id: 'settings',   label: 'Settings',             icon: faKey,        color: '#60A5FA' },
          { id: 'ml-health',  label: 'AI Health',           icon: faBrain,      color: '#22d3a5' },
        ]
      : []),
  ];

  const handleSignOut = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <img src="/src/assets/logo.png" alt="ZANORA Logo" className="logo-image2" />
        <span>ZANORA</span>
      </div>

      <nav className="sidebar-menu">
        {menuItems.map(item => {
          const isActive = activeItem === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
            >
              <FontAwesomeIcon icon={item.icon} style={{ color: item.color, fontSize: '18px' }} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <button onClick={handleSignOut} className="sidebar-signout">
        <LogOut size={18} />
        <span>Sign Out</span>
      </button>

      <style jsx>{`
        .sidebar {
          width: 270px;
          height: 100vh;
          background-color: var(--color-bg-sidebar);       /* ← was #141615 */
          display: flex;
          flex-direction: column;
          position: fixed;
          left: 0;
          top: 0;
          transition: all 0.3s ease;
        }

        .sidebar-logo {
          padding: 24px 20px;
          border-bottom: 1px solid var(--color-border-sidebar);  /* ← was #2a2a2a */
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--color-text-primary);                /* ← was #fff */
          font-size: var(--font-size-lg);                  /* ← was 18px */
          font-weight: var(--font-weight-semibold);        /* ← was 600 */
        }

        .sidebar-menu {
          flex: 1;
          padding: 16px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .sidebar-item {
          width: 100%;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          border: none;
          background-color: transparent;
          color: var(--color-text-secondary);              /* ← was #9ca3af */
          cursor: pointer;
          font-size: var(--font-size-base);                /* ← was 14px */
          font-weight: var(--font-weight-semibold);        /* ← was 600 */
          border-radius: var(--radius-lg);                 /* ← was 8px */
          transition: var(--transition-fast);              /* ← was all 0.2s */
        }

        .sidebar-item.active,
        .sidebar-item:hover {
          background-color: rgba(255, 255, 255, 0.1);
          color: var(--color-text-primary);                /* ← was #ffffff */
        }

        .sidebar-signout {
          width: calc(100% - 24px);
          margin: 0 12px 16px 12px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          border: none;
          background-color: transparent;
          color: var(--color-danger);                      /* ← was #ef4444 */
          font-size: var(--font-size-base);                /* ← was 14px */
          font-weight: var(--font-weight-semibold);        /* ← was 600 */
          border-radius: var(--radius-lg);                 /* ← was 8px */
          border-top: 1px solid var(--color-border-sidebar); /* ← was #2a2a2a */
          cursor: pointer;
        }

        @media (max-width: 1150px) {
          .sidebar {
            width: 100%;
            height: 60px;
            flex-direction: row;
            bottom: 0;
            top: auto;
            left: 0;
            justify-content: space-around;
            padding: 0 10px;
            position: fixed;
            z-index: var(--z-dropdown);                    /* ← was 1000 */
          }

          .sidebar-logo { display: none; }

          .sidebar-menu {
            flex-direction: row;
            align-items: center;
            padding: 0;
            gap: 0;
          }

          .sidebar-item {
            flex-direction: column;
            justify-content: center;
            padding: 4px 8px;
            font-size: var(--font-size-xs);                /* ← was 12px */
          }

          .sidebar-signout { display: none; }
        }
      `}</style>
    </div>
  );
};