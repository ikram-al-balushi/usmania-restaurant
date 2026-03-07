import { useState, useEffect, useCallback } from 'react';
import { useAdmin } from '../context/AdminContext';

export default function AdminReservations() {
  const { adminFetch } = useAdmin();
  const [reservations, setReservations] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const loadReservations = useCallback(async () => {
    try {
      const res = await adminFetch('/api/admin/reservations');
      setReservations(await res.json());
    } catch (err) {
      console.error('Load reservations error:', err);
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);

  useEffect(() => { loadReservations(); }, [loadReservations]);

  const updateStatus = async (id, status) => {
    try {
      await adminFetch(`/api/admin/reservations/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      loadReservations();
    } catch (err) {
      console.error('Update reservation error:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await adminFetch(`/api/admin/reservations/${id}`, { method: 'DELETE' });
      setDeleteConfirm(null);
      loadReservations();
    } catch (err) {
      console.error('Delete reservation error:', err);
    }
  };

  const filtered = filter === 'all'
    ? reservations
    : reservations.filter(r => r.status === filter);

  // Group by date
  const grouped = {};
  filtered.forEach(r => {
    const date = r.date || 'Unknown';
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(r);
  });

  if (loading) return <div className="admin-loading">Loading reservations...</div>;

  return (
    <div className="admin-reservations">
      <div className="admin-page-header">
        <h2 className="admin-page-title">Reservations</h2>
        <select className="admin-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <p className="admin-empty">No reservations found</p>
      ) : (
        Object.entries(grouped)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([date, items]) => (
            <div key={date} className="admin-reservation-group">
              <h3 className="admin-reservation-date">{date}</h3>
              {items.map(r => (
                <div key={r.id} className="admin-reservation-card">
                  <div className="admin-reservation-info">
                    <div className="admin-reservation-main">
                      <strong>{r.name}</strong>
                      <span>{r.time} - {r.guests} guest{r.guests !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="admin-reservation-contact">
                      <span>{r.phone}</span>
                      {r.notes && <span className="admin-reservation-notes">Note: {r.notes}</span>}
                    </div>
                  </div>
                  <div className="admin-reservation-actions">
                    <span className={`admin-badge admin-badge-${r.status}`}>{r.status}</span>
                    {r.status === 'pending' && (
                      <>
                        <button className="admin-btn admin-btn-sm admin-btn-success" onClick={() => updateStatus(r.id, 'approved')}>Approve</button>
                        <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => updateStatus(r.id, 'rejected')}>Reject</button>
                      </>
                    )}
                    {deleteConfirm === r.id ? (
                      <>
                        <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => handleDelete(r.id)}>Confirm</button>
                        <button className="admin-btn admin-btn-sm" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                      </>
                    ) : (
                      <button className="admin-btn admin-btn-sm admin-btn-outline" onClick={() => setDeleteConfirm(r.id)}>Delete</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))
      )}
    </div>
  );
}
