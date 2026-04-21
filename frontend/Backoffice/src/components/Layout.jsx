import React from 'react';
import { Sidebar } from './Sidebar';
import { useLocation, useNavigate } from 'react-router-dom';

export const Layout = ({ children, onOpenSettings }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const routeToItem = {
    '/users':      'users',
    '/permission': 'permission',
    '/roles':      'roles',
    '/settings':   'settings',
    '/ml-health':  'ml-health',
  };

  const activeItem = routeToItem[location.pathname] || null;

  const onNavigate = (itemId) => {
    const path = Object.keys(routeToItem).find(
      (key) => routeToItem[key] === itemId
    );
    if (path) navigate(path);
  };

  return (
    <div className="layout">
      <Sidebar activeItem={activeItem} onNavigate={onNavigate} />

      <main className="main-content">
        {children}
      </main>

      <style jsx>{`
        .layout {
          display: flex;
          min-height: 100vh;
          background-color: var(--color-bg-sidebar);   /* ← was #141615 */
          gap: 24px;
        }

        .main-content {
          background-color: var(--color-bg-page);      /* ← was #141615, now the page bg */
          margin-left: 270px;
          flex: 1;
          width: calc(100% - 270px);
          overflow: auto;
          padding-left: 24px;
          transition: var(--transition-slow);           /* ← was all 0.3s ease */
        }

        @media (max-width: 1150px) {
          .layout {
            flex-direction: column;
          }

          .main-content {
            margin-left: 0;
            width: 100%;
            padding-left: 12px;
            padding-bottom: 60px;
          }
        }
      `}</style>
    </div>
  );
};