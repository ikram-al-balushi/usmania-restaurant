export default function Contact() {
  return (
    <section className="contact-section" id="contact">
      <div className="section-header">
        <h2 className="section-title">Contact Us</h2>
        <p className="section-subtitle">We'd love to hear from you</p>
      </div>

      <div className="contact-grid">
        <div className="contact-card">
          <span className="contact-icon">&#128222;</span>
          <h3>Phone</h3>
          <a href="tel:03323133978">0332-3133978</a>
        </div>
        <div className="contact-card">
          <span className="contact-icon">&#9993;</span>
          <h3>Email</h3>
          <a href="mailto:ikrambaloch112001@gmail.com">ikrambaloch112001@gmail.com</a>
        </div>
        <div className="contact-card">
          <span className="contact-icon">&#128344;</span>
          <h3>Hours</h3>
          <p>Mon - Sun<br />11:00 AM - 11:00 PM</p>
        </div>
        <div className="contact-card">
          <span className="contact-icon">&#128205;</span>
          <h3>Location</h3>
          <p>Quetta, Balochistan<br />Pakistan</p>
        </div>
      </div>
    </section>
  );
}
