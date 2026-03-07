import { useState, useEffect, useCallback } from 'react';
import { useAdmin } from '../context/AdminContext';

const EMPTY_ITEM = { name: '', price: '', category: 'Biryani', description: '', image: '', available: true };
const DEFAULT_CATEGORIES = ['Biryani', 'BBQ', 'Bread', 'Drinks', 'Curry', 'Rice', 'Desserts'];

export default function AdminMenu() {
  const { adminFetch } = useAdmin();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_ITEM);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [uploading, setUploading] = useState(false);

  const loadMenu = useCallback(async () => {
    try {
      const res = await adminFetch('/api/admin/menu');
      setItems(await res.json());
    } catch (err) {
      console.error('Load menu error:', err);
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);

  useEffect(() => { loadMenu(); }, [loadMenu]);

  const openAdd = () => {
    setEditItem(null);
    setForm(EMPTY_ITEM);
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ ...item, price: String(item.price) });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.category) return;

    try {
      if (editItem) {
        await adminFetch(`/api/admin/menu/${editItem.id}`, {
          method: 'PUT',
          body: JSON.stringify({ ...form, price: Number(form.price) }),
        });
      } else {
        await adminFetch('/api/admin/menu', {
          method: 'POST',
          body: JSON.stringify({ ...form, price: Number(form.price) }),
        });
      }
      setShowModal(false);
      loadMenu();
    } catch (err) {
      console.error('Save menu error:', err);
    }
  };

  const toggleAvailability = async (item) => {
    try {
      await adminFetch(`/api/admin/menu/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({ available: !item.available }),
      });
      loadMenu();
    } catch (err) {
      console.error('Toggle availability error:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await adminFetch(`/api/admin/menu/${id}`, { method: 'DELETE' });
      setDeleteConfirm(null);
      loadMenu();
    } catch (err) {
      console.error('Delete menu error:', err);
    }
  };

  if (loading) return <div className="admin-loading">Loading menu...</div>;

  return (
    <div className="admin-menu-page">
      <div className="admin-page-header">
        <h2 className="admin-page-title">Menu Items</h2>
        <button className="admin-btn admin-btn-primary" onClick={openAdd}>+ Add Item</button>
      </div>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Available</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id} className={!item.available ? 'admin-row-disabled' : ''}>
              <td>
                {item.image ? (
                  <img src={item.image} alt={item.name} className="admin-menu-thumb" />
                ) : (
                  <div className="admin-menu-thumb-placeholder">No img</div>
                )}
              </td>
              <td><strong>{item.name}</strong><br /><small>{item.description}</small></td>
              <td>{item.category}</td>
              <td>PKR {item.price}</td>
              <td>
                <label className="admin-toggle">
                  <input
                    type="checkbox"
                    checked={item.available !== false}
                    onChange={() => toggleAvailability(item)}
                  />
                  <span className="admin-toggle-slider" />
                </label>
              </td>
              <td>
                <div className="admin-action-btns">
                  <button className="admin-btn admin-btn-sm" onClick={() => openEdit(item)}>Edit</button>
                  {deleteConfirm === item.id ? (
                    <>
                      <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => handleDelete(item.id)}>Confirm</button>
                      <button className="admin-btn admin-btn-sm" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                    </>
                  ) : (
                    <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => setDeleteConfirm(item.id)}>Delete</button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h3>{editItem ? 'Edit Item' : 'Add New Item'}</h3>
            <form onSubmit={handleSave}>
              <div className="admin-form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="admin-form-group">
                <label>Price (PKR)</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={e => setForm({ ...form, price: e.target.value })}
                  required
                />
              </div>
              <div className="admin-form-group">
                <label>Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  required
                >
                  {[...new Set([...DEFAULT_CATEGORIES, ...items.map(i => i.category)])].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="admin-form-group">
                <label>Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="admin-form-group">
                <label>Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    setUploading(true);
                    try {
                      const fd = new FormData();
                      fd.append('image', file);
                      const res = await adminFetch('/api/admin/upload', { method: 'POST', body: fd });
                      const data = await res.json();
                      setForm(prev => ({ ...prev, image: data.url }));
                    } catch (err) {
                      console.error('Upload error:', err);
                    } finally {
                      setUploading(false);
                    }
                  }}
                />
                {uploading && <small>Uploading...</small>}
                {form.image && (
                  <img
                    src={form.image}
                    alt="Preview"
                    style={{ marginTop: 8, maxWidth: 120, maxHeight: 120, objectFit: 'cover', borderRadius: 8 }}
                  />
                )}
              </div>
              <div className="admin-form-group admin-form-check">
                <label>
                  <input
                    type="checkbox"
                    checked={form.available !== false}
                    onChange={e => setForm({ ...form, available: e.target.checked })}
                  />
                  Available
                </label>
              </div>
              <div className="admin-modal-actions">
                <button type="submit" className="admin-btn admin-btn-primary">
                  {editItem ? 'Save Changes' : 'Add Item'}
                </button>
                <button type="button" className="admin-btn" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
