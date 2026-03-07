import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Checkout() {
  const { cartItems, cartTotal, placeOrder } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    deliveryType: 'dine-in',
    cardNumber: '',
    expiry: '',
    cvv: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (cartItems.length === 0) {
    navigate('/cart');
    return null;
  }

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.phone.trim() || form.phone.length < 10) errs.phone = 'Valid phone number required';
    if (form.deliveryType === 'delivery' && !form.address.trim()) errs.address = 'Address required for delivery';
    if (!form.cardNumber.replace(/\s/g, '').match(/^\d{16}$/)) errs.cardNumber = 'Enter 16-digit card number';
    if (!form.expiry.match(/^(0[1-9]|1[0-2])\/\d{2}$/)) errs.expiry = 'Format: MM/YY';
    if (!form.cvv.match(/^\d{3,4}$/)) errs.cvv = 'Enter 3 or 4 digit CVV';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
          total: cartTotal,
          deliveryType: form.deliveryType,
          customerName: form.name,
          phone: form.phone,
          address: form.address,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Order failed');
      }

      const order = await res.json();

      // Also save locally for the OrderStatus page
      placeOrder({
        ...order,
        items: cartItems,
        date: new Date().toLocaleString(),
      });

      navigate('/orders');
    } catch (err) {
      console.error('Order error:', err);
      setErrors({ submit: err.message || 'Failed to place order. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const formatCardNumber = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiry = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length > 2) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
  };

  return (
    <section className="checkout-section">
      <div className="section-header">
        <h2 className="section-title">Checkout</h2>
      </div>

      <div className="checkout-content">
        <form className="checkout-form" onSubmit={handleSubmit}>
          {errors.submit && <div className="alert" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>{errors.submit}</div>}

          <div className="form-group">
            <h3>Delivery Details</h3>
            <div className="delivery-options">
              {['dine-in', 'takeout', 'delivery'].map(type => (
                <label key={type} className={`delivery-option ${form.deliveryType === type ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="deliveryType"
                    value={type}
                    checked={form.deliveryType === type}
                    onChange={(e) => setForm({ ...form, deliveryType: e.target.value })}
                  />
                  <span>{type === 'dine-in' ? 'Dine In' : type === 'takeout' ? 'Takeout' : 'Home Delivery'}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your full name"
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

          {form.deliveryType === 'delivery' && (
            <div className="form-group">
              <label>Delivery Address</label>
              <textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Your delivery address in Quetta"
                rows={3}
              />
              {errors.address && <span className="form-error">{errors.address}</span>}
            </div>
          )}

          <div className="form-group">
            <h3>Payment Details</h3>
            <p className="form-hint">Demo only - no real charges</p>
          </div>

          <div className="form-group">
            <label>Card Number</label>
            <input
              type="text"
              value={form.cardNumber}
              onChange={(e) => setForm({ ...form, cardNumber: formatCardNumber(e.target.value) })}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
            />
            {errors.cardNumber && <span className="form-error">{errors.cardNumber}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Expiry</label>
              <input
                type="text"
                value={form.expiry}
                onChange={(e) => setForm({ ...form, expiry: formatExpiry(e.target.value) })}
                placeholder="MM/YY"
                maxLength={5}
              />
              {errors.expiry && <span className="form-error">{errors.expiry}</span>}
            </div>
            <div className="form-group">
              <label>CVV</label>
              <input
                type="text"
                value={form.cvv}
                onChange={(e) => setForm({ ...form, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                placeholder="123"
                maxLength={4}
              />
              {errors.cvv && <span className="form-error">{errors.cvv}</span>}
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={submitting}>
            {submitting ? 'Placing Order...' : `Pay PKR ${cartTotal} & Place Order`}
          </button>
        </form>

        <div className="checkout-summary">
          <h3>Order Summary</h3>
          {cartItems.map(item => (
            <div key={item.id} className="checkout-item">
              <span>{item.name} x{item.quantity}</span>
              <span>PKR {item.price * item.quantity}</span>
            </div>
          ))}
          <div className="checkout-total">
            <strong>Total</strong>
            <strong>PKR {cartTotal}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
