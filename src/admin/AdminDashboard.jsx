import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';

export default function AdminDashboard() {
  const { adminFetch } = useAdmin();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0, pendingOrders: 0, todayReservations: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, ordersRes] = await Promise.all([
          adminFetch('/api/admin/stats'),
          adminFetch('/api/admin/orders'),
        ]);
        setStats(await statsRes.json());
        const orders = await ordersRes.json();
        setRecentOrders(orders.slice(0, 5));
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [adminFetch]);

  if (loading) return <div className="admin-loading">Loading dashboard...</div>;

  const statCards = [
    { label: 'Total Orders', value: stats.totalOrders, color: '#3b82f6' },
    { label: 'Revenue', value: `PKR ${stats.totalRevenue.toLocaleString()}`, color: '#10b981' },
    { label: 'Pending Orders', value: stats.pendingOrders, color: '#f59e0b' },
    { label: "Today's Reservations", value: stats.todayReservations, color: '#8b5cf6' },
  ];

  return (
    <div className="admin-dashboard">
      <h2 className="admin-page-title">Dashboard</h2>

      <div className="admin-stats-grid">
        {statCards.map(card => (
          <div key={card.label} className="admin-stat-card" style={{ borderTopColor: card.color }}>
            <span className="admin-stat-value">{card.value}</span>
            <span className="admin-stat-label">{card.label}</span>
          </div>
        ))}
      </div>

      <div className="admin-section">
        <div className="admin-section-header">
          <h3>Recent Orders</h3>
          <button className="admin-btn admin-btn-sm" onClick={() => navigate('/admin/orders')}>View All</button>
        </div>
        {recentOrders.length === 0 ? (
          <p className="admin-empty">No orders yet</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(order => (
                <tr key={order.id}>
                  <td><strong>{order.id}</strong></td>
                  <td>{order.customerName}</td>
                  <td>PKR {order.total}</td>
                  <td><span className={`admin-badge admin-badge-${order.status}`}>{order.status}</span></td>
                  <td>{new Date(order.date || order.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="admin-quick-actions">
        <h3>Quick Actions</h3>
        <div className="admin-quick-btns">
          <button className="admin-btn" onClick={() => navigate('/admin/orders')}>Manage Orders</button>
          <button className="admin-btn" onClick={() => navigate('/admin/menu')}>Edit Menu</button>
          <button className="admin-btn" onClick={() => navigate('/admin/reservations')}>Reservations</button>
          <button className="admin-btn" onClick={() => navigate('/admin/settings')}>Settings</button>
        </div>
      </div>
    </div>
  );
}
