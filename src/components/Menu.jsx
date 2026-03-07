import { useState, useEffect } from 'react';
import menuDataFallback, { categories as fallbackCategories } from '../data/menuData';
import MenuCard from './MenuCard';

export default function Menu({ showTitle = true }) {
  const [menuItems, setMenuItems] = useState(menuDataFallback);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    fetch('/api/menu')
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        if (data && data.length > 0) setMenuItems(data);
      })
      .catch(() => {});
  }, []);

  const categories = ['All', ...new Set(menuItems.map(item => item.category))];

  const filtered = activeCategory === 'All'
    ? menuItems
    : menuItems.filter(item => item.category === activeCategory);

  return (
    <section className="menu-section" id="menu">
      {showTitle && (
        <div className="section-header">
          <h2 className="section-title">Our Menu</h2>
          <p className="section-subtitle">Discover our carefully crafted dishes</p>
        </div>
      )}

      <div className="menu-categories">
        {categories.map(cat => (
          <button
            key={cat}
            className={`category-btn ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="menu-grid">
        {filtered.map(item => (
          <MenuCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
