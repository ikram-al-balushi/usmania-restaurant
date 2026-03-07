import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

const BACKGROUND_IMAGES = [
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&h=900&fit=crop', // Interior
  'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=1600&h=900&fit=crop', // Biryani
  'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=1600&h=900&fit=crop', // Seekh Kabab
  'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1600&h=900&fit=crop', // Ambiance
  'https://images.unsplash.com/photo-1544025162-d76694265947?w=1600&h=900&fit=crop'  // Traditional Food
];

export default function Hero() {
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="hero">
      <div className="hero-slides">
        {BACKGROUND_IMAGES.map((img, index) => (
          <div
            key={img}
            className={`hero-slide ${index === currentImage ? 'active' : ''}`}
            style={{ backgroundImage: `url(${img})` }}
          />
        ))}
      </div>
      <div className="hero-overlay"></div>
      <div className="hero-content">
        <h1 className="hero-title">Usmania Restaurant</h1>
        <p className="hero-subtitle">Quetta's Finest Pakistani Cuisine</p>
        <p className="hero-tagline">Experience the authentic flavors of Balochistan with our traditional recipes passed down through generations</p>
        <div className="hero-buttons">
          <Link to="/menu" className="btn btn-primary">View Menu</Link>
          <Link to="/reservation" className="btn btn-outline">Book a Table</Link>
        </div>
      </div>
    </section>
  );
}
