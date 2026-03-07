import { useState, useEffect, useCallback } from 'react';
import { useAdmin } from '../context/AdminContext';

const STATUS_FLOW = ['confirmed', 'preparing', 'ready', 'delivered'];

export default function AdminOrders() {
  const { adminFetch } = useAdmin();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    try {
      const res = await adminFetch(`/api/admin/orders?status=${filter}`);
      setOrders(await res.json());
    } catch (err) {
      console.error('Load orders error:', err);
    } finally {
      setLoading(false);
    }
  }, [adminFetch, filter]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const updateStatus = async (id, status) => {
    try {
      await adminFetch(`/api/admin/orders/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      loadOrders();
    } catch (err) {
      console.error('Update order error:', err);
    }
  };

  const deleteOrder = async (id) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    try {
      await adminFetch(`/api/admin/orders/${id}`, { method: 'DELETE' });
      loadOrders();
    } catch (err) {
      console.error('Delete order error:', err);
    }
  };

  const getNextStatus = (current) => {
    const idx = STATUS_FLOW.indexOf(current);
    return idx >= 0 && idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;
  };

  if (loading) return <div className="admin-loading">Loading orders...</div>;

  return (
    <div className="admin-orders">
      <div className="admin-page-header">
        <h2 className="admin-page-title">Orders</h2>
        <select className="admin-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Orders</option>
          <option value="confirmed">Confirmed</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {orders.length === 0 ? (
        <p className="admin-empty">No orders found</p>
      ) : (
        <div className="admin-orders-list">
          {orders.map(order => (
            <div key={order.id} className="admin-order-card">
              <div
                className="admin-order-header"
                onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
              >
                <div className="admin-order-summary">
                  <strong>{order.id}</strong>
                  <span className="admin-order-customer">{order.customerName}</span>
                  <span className="admin-order-phone">{order.phone}</span>
                </div>
                <div className="admin-order-meta">
                  <span className="admin-order-total">PKR {order.total}</span>
                  <span className={`admin-badge admin-badge-${order.status}`}>{order.status}</span>
                  <span className="admin-order-date">{new Date(order.date || order.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {expandedId === order.id && (
                <div className="admin-order-details">
                  <div className="admin-order-items">
                    <h4>Items</h4>
                    {order.items.map((item, i) => (
                      <div key={i} className="admin-order-item-row">
                        <span>{item.name} x{item.quantity}</span>
                        <span>PKR {item.price * item.quantity}</span>
                      </div>
                    ))}
                    <div className="admin-order-item-row admin-order-item-total">
                      <strong>Total</strong>
                      <strong>PKR {order.total}</strong>
                    </div>
                  </div>
                  <div className="admin-order-info">
                    <p><strong>Type:</strong> {order.deliveryType}</p>
                    {order.address && <p><strong>Address:</strong> {order.address}</p>}
                  </div>
                  <div className="admin-order-actions">
                    {getNextStatus(order.status) && (
                      <button
                        className="admin-btn admin-btn-primary"
                        onClick={() => updateStatus(order.id, getNextStatus(order.status))}
                      >
                        Mark as {getNextStatus(order.status)}
                      </button>
                    )}
                    {order.status !== 'cancelled' && order.status !== 'delivered' && (
                      <button
                        className="admin-btn admin-btn-danger"
                        onClick={() => updateStatus(order.id, 'cancelled')}
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      className="admin-btn admin-btn-delete"
                      onClick={() => deleteOrder(order.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
