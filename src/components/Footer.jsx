import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';

export default function Footer() {
  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAdmin } = useAdmin();
  const navigate = useNavigate();

  const handleAdminClick = (e) => {
    e.preventDefault();
    if (isAdmin) {
      navigate('/admin');
    } else {
      setShowLogin(true);
      setError('');
      setPassword('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(password);
      setShowLogin(false);
      setPassword('');
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Invalid password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <h3><span>&#127860;</span> Usmania Restaurant</h3>
          <p>Quetta's finest Pakistani cuisine since generations. Experience the authentic flavors of Balochistan.</p>
        </div>

        <div className="footer-links">
          <h4>Quick Links</h4>
          <Link to="/">Home</Link>
          <Link to="/menu">Menu</Link>
          <Link to="/reservation">Reservations</Link>
          <Link to="/cart">Cart</Link>
          <a href="#" onClick={handleAdminClick}>Admin Panel</a>
        </div>

        <div className="footer-contact">
          <h4>Contact</h4>
          <p>&#128222; 0332-3133978</p>
          <p>&#9993; ikrambaloch112001@gmail.com</p>
          <p>&#128344; Mon-Sun: 11 AM - 11 PM</p>
          <p>&#128205; Quetta, Balochistan</p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2026 Usmania Restaurant Quetta. All rights reserved.</p>
      </div>

      {showLogin && (
        <div className="admin-modal-overlay" onClick={() => setShowLogin(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <button className="admin-modal-close" onClick={() => setShowLogin(false)}>&times;</button>
            <div className="admin-modal-logo">U</div>
            <h2>Admin Panel</h2>
            <p>Usmania Restaurant</p>
            {error && <div className="admin-modal-error">{error}</div>}
            <form onSubmit={handleSubmit}>
              <input
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              <button type="submit" className="admin-modal-btn" disabled={loading || !password}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </div>
        </div>
      )}
    </footer>
  );
}
