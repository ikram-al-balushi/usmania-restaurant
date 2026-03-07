import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';

export default function OrderStatus() {
  const { orders } = useCart();

  if (orders.length === 0) {
    return (
      <section className="orders-section">
        <div className="section-header">
          <h2 className="section-title">Your Orders</h2>
        </div>
        <div className="empty-state">
          <span className="empty-icon">&#128230;</span>
          <p>No orders yet</p>
          <Link to="/menu" className="btn btn-primary">Order Now</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="orders-section">
      <div className="section-header">
        <h2 className="section-title">Your Orders</h2>
      </div>

      <div className="orders-list">
        {orders.map(order => (
          <div key={order.id} className="order-card">
            <div className="order-header">
              <div>
                <strong>{order.id}</strong>
                <p className="order-date">{order.date}</p>
              </div>
              <span className={`status-badge status-${order.status}`}>{order.status}</span>
            </div>
            <div className="order-items">
              {order.items.map(item => (
                <div key={item.id} className="order-item-row">
                  <span>{item.name} x{item.quantity}</span>
                  <span>PKR {item.price * item.quantity}</span>
                </div>
              ))}
            </div>
            <div className="order-footer">
              <span className="order-delivery-type">{order.deliveryType}</span>
              <strong>Total: PKR {order.total}</strong>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
