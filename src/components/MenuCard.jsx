import { useCart } from '../context/CartContext';

export default function MenuCard({ item }) {
  const { addToCart } = useCart();

  return (
    <div className="menu-card">
      <div className="menu-card-img">
        <img src={item.image} alt={item.name} loading="lazy" />
        <span className="menu-card-category">{item.category}</span>
      </div>
      <div className="menu-card-body">
        <h3 className="menu-card-title">{item.name}</h3>
        <p className="menu-card-desc">{item.description}</p>
        <div className="menu-card-footer">
          <span className="menu-card-price">PKR {item.price}</span>
          <button className="btn btn-sm btn-primary" onClick={() => addToCart(item)}>
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
