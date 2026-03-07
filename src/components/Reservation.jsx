import { useState } from 'react';
import { useCart } from '../context/CartContext';

export default function Reservation() {
  const { reservations, addReservation, cancelReservation } = useCart();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    date: '',
    time: '',
    guests: 2,
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.phone.trim() || form.phone.length < 10) errs.phone = 'Valid phone required';
    if (!form.date) errs.date = 'Date is required';
    if (!form.time) errs.time = 'Time is required';
    if (form.guests < 1 || form.guests > 20) errs.guests = '1-20 guests allowed';

    if (form.date && form.time) {
      const bookingDate = new Date(`${form.date}T${form.time}`);
      const now = new Date();
      const diffMs = bookingDate - now;
      if (diffMs < 60 * 60 * 1000) {
        errs.time = 'Must book at least 1 hour in advance';
      }
      const hour = parseInt(form.time.split(':')[0]);
      if (hour < 11 || hour >= 23) {
        errs.time = 'We are open 11:00 AM - 11:00 PM';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          date: form.date,
          time: form.time,
          guests: form.guests,
          notes: form.notes,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Reservation failed');
      }

      const reservation = await res.json();

      // Also save locally
      addReservation({
        ...reservation,
        status: reservation.status || 'confirmed',
        createdAt: new Date().toLocaleString(),
      });

      setSuccess(`Reservation confirmed! ID: ${reservation.id}`);
      setForm({ name: '', phone: '', date: '', time: '', guests: 2, notes: '' });
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Reservation error:', err);
      setErrors({ submit: err.message || 'Failed to create reservation. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <section className="reservation-section">
      <div className="section-header">
        <h2 className="section-title">Reserve a Table</h2>
        <p className="section-subtitle">Book your dining experience at Usmania</p>
      </div>

      <div className="reservation-content">
        <form className="reservation-form" onSubmit={handleSubmit}>
          {success && <div className="alert alert-success">{success}</div>}
          {errors.submit && <div className="alert" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>{errors.submit}</div>}

          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your name"
            />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="03XX-XXXXXXX"
            />
            {errors.phone && <span className="form-error">{errors.phone}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                value={form.date}
                min={today}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
              {errors.date && <span className="form-error">{errors.date}</span>}
            </div>
            <div className="form-group">
              <label>Time</label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
              />
              {errors.time && <span className="form-error">{errors.time}</span>}
            </div>
          </div>

          <div className="form-group">
            <label>Number of Guests</label>
            <input
              type="number"
              value={form.guests}
              min={1}
              max={20}
              onChange={(e) => setForm({ ...form, guests: parseInt(e.target.value) || 1 })}
            />
            {errors.guests && <span className="form-error">{errors.guests}</span>}
          </div>

          <div className="form-group">
            <label>Special Requests (optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Any dietary requirements or special requests?"
              rows={3}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={submitting}>
            {submitting ? 'Booking...' : 'Confirm Reservation'}
          </button>
        </form>

        {reservations.length > 0 && (
          <div className="reservations-list">
            <h3>Your Reservations</h3>
            {reservations.map(res => (
              <div key={res.id} className="reservation-card">
                <div className="reservation-info">
                  <strong>{res.id}</strong>
                  <p>{res.date} at {res.time} - {res.guests} guests</p>
                  <p>Name: {res.name}</p>
                  <span className={`status-badge status-${res.status}`}>{res.status}</span>
                </div>
                <button className="btn btn-sm btn-danger" onClick={() => cancelReservation(res.id)}>
                  Cancel
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
