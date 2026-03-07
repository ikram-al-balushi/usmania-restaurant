import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import { useState } from 'react';
import AdminLogin from './AdminLogin';
import './admin.css';

export default function AdminLayout() {
  const { isAdmin, logout } = useAdmin();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isAdmin) return <AdminLogin />;

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const links = [
    { to: '/admin', label: 'Dashboard', icon: '\u2302' },
    { to: '/admin/orders', label: 'Orders', icon: '\uD83D\uDCCB' },
    { to: '/admin/menu', label: 'Menu', icon: '\uD83C\uDF7D\uFE0F' },
    { to: '/admin/reservations', label: 'Reservations', icon: '\uD83D\uDCC5' },
    { to: '/admin/settings', label: 'Settings', icon: '\u2699\uFE0F' },
  ];

  return (
    <div className="admin-wrapper">
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <span className="admin-sidebar-logo">U</span>
          <span className="admin-sidebar-title">Usmania Admin</span>
        </div>
        <nav className="admin-nav">
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/admin'}
              className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="admin-nav-icon">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <a href="/" className="admin-nav-link">
            <span className="admin-nav-icon">{'\u2190'}</span>
            Back to Site
          </a>
          <button className="admin-nav-link admin-logout-btn" onClick={handleLogout}>
            <span className="admin-nav-icon">{'\uD83D\uDEAA'}</span>
            Logout
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="admin-overlay" onClick={() => setSidebarOpen(false)} />}

      <div className="admin-main">
        <header className="admin-topbar">
          <button className="admin-menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {'\u2630'}
          </button>
          <h1 className="admin-topbar-title">Admin Dashboard</h1>
          <div className="admin-topbar-actions">
            <span className="admin-user-badge">Admin</span>
          </div>
        </header>
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
