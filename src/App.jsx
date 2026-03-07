import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Menu from './components/Menu';
import Contact from './components/Contact';
import Footer from './components/Footer';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import Reservation from './components/Reservation';
import OrderStatus from './components/OrderStatus';
import ChatBot from './components/ChatBot';
import AdminLayout from './admin/AdminLayout';
import AdminDashboard from './admin/AdminDashboard';
import AdminOrders from './admin/AdminOrders';
import AdminMenu from './admin/AdminMenu';
import AdminReservations from './admin/AdminReservations';
import AdminSettings from './admin/AdminSettings';

function HomePage() {
  return (
    <>
      <Hero />
      <Menu />
      <Contact />
    </>
  );
}

function MenuPage() {
  return (
    <div className="page-container">
      <Menu showTitle={true} />
    </div>
  );
}

function PublicLayout() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/cart" element={<div className="page-container"><Cart /></div>} />
          <Route path="/checkout" element={<div className="page-container"><Checkout /></div>} />
          <Route path="/reservation" element={<div className="page-container"><Reservation /></div>} />
          <Route path="/orders" element={<div className="page-container"><OrderStatus /></div>} />
        </Routes>
      </main>
      <Footer />
      <ChatBot />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="menu" element={<AdminMenu />} />
        <Route path="reservations" element={<AdminReservations />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
      <Route path="/*" element={<PublicLayout />} />
    </Routes>
  );
}
