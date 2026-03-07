import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { cartCount } = useCart();
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <span className="logo-icon">&#127860;</span>
          <span>Usmania</span>
        </Link>

        <button className="nav-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          <span className={`hamburger ${menuOpen ? 'open' : ''}`}></span>
        </button>

        <ul className={`nav-menu ${menuOpen ? 'show' : ''}`}>
          <li><Link to="/" className={isActive('/')} onClick={() => setMenuOpen(false)}>Home</Link></li>
          <li><Link to="/menu" className={isActive('/menu')} onClick={() => setMenuOpen(false)}>Menu</Link></li>
          <li><Link to="/reservation" className={isActive('/reservation')} onClick={() => setMenuOpen(false)}>Reserve</Link></li>
          <li><Link to="/orders" className={isActive('/orders')} onClick={() => setMenuOpen(false)}>Orders</Link></li>
          <li>
            <Link to="/cart" className={`nav-link cart-link ${location.pathname === '/cart' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
              Cart
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
