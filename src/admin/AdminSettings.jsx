import { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';

export default function AdminSettings() {
  const { adminFetch } = useAdmin();
  const [settings, setSettings] = useState({
    restaurantName: '',
    phone: '',
    email: '',
    address: '',
    openingHours: '',
    description: '',
  });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(true);
  const [saveMsg, setSaveMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await adminFetch('/api/admin/settings');
        setSettings(await res.json());
      } catch (err) {
        console.error('Load settings error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [adminFetch]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaveMsg('');
    try {
      const res = await adminFetch('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaveMsg('Settings saved successfully!');
        setTimeout(() => setSaveMsg(''), 3000);
      }
    } catch (err) {
      setSaveMsg('Error saving settings');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMsg('');
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPwMsg('Passwords do not match');
      return;
    }
    if (passwords.newPassword.length < 6) {
      setPwMsg('Password must be at least 6 characters');
      return;
    }
    try {
      const res = await adminFetch('/api/admin/password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwMsg(data.message || 'Password updated!');
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setPwMsg(data.error || 'Failed to update password');
      }
    } catch (err) {
      setPwMsg('Error changing password');
    }
  };

  if (loading) return <div className="admin-loading">Loading settings...</div>;

  return (
    <div className="admin-settings">
      <h2 className="admin-page-title">Settings</h2>

      <div className="admin-settings-grid">
        <form className="admin-settings-card" onSubmit={handleSaveSettings}>
          <h3>Restaurant Information</h3>
          {saveMsg && <div className={`admin-msg ${saveMsg.includes('Error') ? 'error' : 'success'}`}>{saveMsg}</div>}

          <div className="admin-form-group">
            <label>Restaurant Name</label>
            <input
              type="text"
              value={settings.restaurantName}
              onChange={e => setSettings({ ...settings, restaurantName: e.target.value })}
            />
          </div>
          <div className="admin-form-group">
            <label>Phone</label>
            <input
              type="text"
              value={settings.phone}
              onChange={e => setSettings({ ...settings, phone: e.target.value })}
            />
          </div>
          <div className="admin-form-group">
            <label>Email</label>
            <input
              type="email"
              value={settings.email}
              onChange={e => setSettings({ ...settings, email: e.target.value })}
            />
          </div>
          <div className="admin-form-group">
            <label>Address</label>
            <input
              type="text"
              value={settings.address}
              onChange={e => setSettings({ ...settings, address: e.target.value })}
            />
          </div>
          <div className="admin-form-group">
            <label>Opening Hours</label>
            <input
              type="text"
              value={settings.openingHours}
              onChange={e => setSettings({ ...settings, openingHours: e.target.value })}
            />
          </div>
          <div className="admin-form-group">
            <label>Description</label>
            <textarea
              value={settings.description}
              onChange={e => setSettings({ ...settings, description: e.target.value })}
              rows={3}
            />
          </div>
          <button type="submit" className="admin-btn admin-btn-primary">Save Settings</button>
        </form>

        <form className="admin-settings-card" onSubmit={handleChangePassword}>
          <h3>Change Password</h3>
          {pwMsg && <div className={`admin-msg ${pwMsg.includes('Error') || pwMsg.includes('match') || pwMsg.includes('incorrect') || pwMsg.includes('Failed') || pwMsg.includes('least') ? 'error' : 'success'}`}>{pwMsg}</div>}

          <div className="admin-form-group">
            <label>Current Password</label>
            <input
              type="password"
              value={passwords.currentPassword}
              onChange={e => setPasswords({ ...passwords, currentPassword: e.target.value })}
              required
            />
          </div>
          <div className="admin-form-group">
            <label>New Password</label>
            <input
              type="password"
              value={passwords.newPassword}
              onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })}
              required
            />
          </div>
          <div className="admin-form-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              value={passwords.confirmPassword}
              onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="admin-btn admin-btn-primary">Change Password</button>
        </form>
      </div>
    </div>
  );
}
