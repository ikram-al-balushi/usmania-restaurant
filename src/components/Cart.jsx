import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Cart() {
  const { cartItems, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart();

  if (cartItems.length === 0) {
    return (
      <section className="cart-section">
        <div className="section-header">
          <h2 className="section-title">Your Cart</h2>
        </div>
        <div className="empty-state">
          <span className="empty-icon">&#128722;</span>
          <p>Your cart is empty</p>
          <Link to="/menu" className="btn btn-primary">Browse Menu</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="cart-section">
      <div className="section-header">
        <h2 className="section-title">Your Cart</h2>
      </div>

      <div className="cart-content">
        <div className="cart-items">
          {cartItems.map(item => (
            <div key={item.id} className="cart-item">
              <img src={item.image} alt={item.name} className="cart-item-img" />
              <div className="cart-item-info">
                <h4>{item.name}</h4>
                <p className="cart-item-price">PKR {item.price}</p>
              </div>
              <div className="cart-item-controls">
                <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                <span className="qty-display">{item.quantity}</span>
                <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
              </div>
              <div className="cart-item-subtotal">
                PKR {item.price * item.quantity}
              </div>
              <button className="cart-item-remove" onClick={() => removeFromCart(item.id)}>&times;</button>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <div className="cart-total">
            <span>Total:</span>
            <span>PKR {cartTotal}</span>
          </div>
          <div className="cart-actions">
            <button className="btn btn-outline" onClick={clearCart}>Clear Cart</button>
            <Link to="/checkout" className="btn btn-primary">Proceed to Checkout</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
