export type LandingTemplateSection = {
    key: string;
    label: string;
    html: string;
};

export type LandingTemplate = {
    key: string;
    name: string;
    businessType: string;
    format: 'grapesjs';
    html: string;
    sections: LandingTemplateSection[];
    updatedAt: string;
};

const UPDATED_AT = '2026-03-03';

const travelHero = `
<style>
#section-travel-hero-a1b2c3 .kt-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--container-pad);
}
#section-travel-hero-a1b2c3 {
  padding: var(--section-pad-y) 0;
  background: radial-gradient(1200px 600px at 10% 10%, rgba(0, 0, 0, 0.18), transparent),
              radial-gradient(900px 600px at 90% 20%, rgba(0, 0, 0, 0.12), transparent),
              var(--bg);
}
#section-travel-hero-a1b2c3 .hero-grid {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 48px;
  align-items: center;
}
#section-travel-hero-a1b2c3 .hero-card {
  border-radius: var(--radius-lg);
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  box-shadow: var(--card-shadow);
  padding: 32px;
}
#section-travel-hero-a1b2c3 .hero-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 999px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  color: var(--muted-text);
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
#section-travel-hero-a1b2c3 .hero-title {
  font-family: var(--font-heading);
  font-size: var(--h1-size);
  font-weight: var(--h1-weight);
  line-height: var(--h1-lh);
  letter-spacing: var(--h1-ls);
  color: var(--text);
  margin: 16px 0 12px 0;
}
#section-travel-hero-a1b2c3 .hero-sub {
  font-family: var(--font-body);
  font-size: var(--body-size);
  line-height: var(--body-lh);
  color: var(--muted-text);
  max-width: var(--body-maxw);
}
#section-travel-hero-a1b2c3 .hero-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 20px;
}
#section-travel-hero-a1b2c3 .hero-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 24px;
}
#section-travel-hero-a1b2c3 .stat {
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  padding: 12px;
  background: var(--surface-2);
  text-align: center;
}
#section-travel-hero-a1b2c3 .stat-value {
  font-family: var(--font-heading);
  font-size: var(--h4-size);
  font-weight: var(--h4-weight);
  color: var(--text);
}
#section-travel-hero-a1b2c3 .stat-label {
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--muted-text);
}
#section-travel-hero-a1b2c3 .hero-media {
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--border);
  box-shadow: var(--shadow-md);
}
#section-travel-hero-a1b2c3 .hero-media img {
  width: 100%;
  height: auto;
  display: block;
}
#section-travel-hero-a1b2c3 .kt-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: var(--btn-height);
  padding: 0 var(--btn-pad-x);
  border-radius: var(--btn-radius);
  border-width: var(--btn-border-w);
  border-style: solid;
  font-family: var(--font-button);
  font-size: var(--btn-size);
  font-weight: var(--btn-weight);
  letter-spacing: var(--btn-ls);
  text-transform: var(--btn-transform);
  cursor: pointer;
  text-decoration: none;
  transition: background-color var(--btn-transition), color var(--btn-transition), border-color var(--btn-transition);
}
#section-travel-hero-a1b2c3 .kt-btn-primary {
  background-color: var(--btn-primary-bg);
  color: var(--btn-primary-text);
  border-color: var(--btn-primary-border);
}
#section-travel-hero-a1b2c3 .kt-btn-primary:hover {
  background-color: var(--btn-primary-hover-bg);
  color: var(--btn-primary-hover-text);
  border-color: var(--btn-primary-hover-border);
}
#section-travel-hero-a1b2c3 .kt-btn-outline {
  background-color: var(--btn-outline-bg);
  color: var(--btn-outline-text);
  border-color: var(--btn-outline-border);
}
#section-travel-hero-a1b2c3 .kt-btn-outline:hover {
  background-color: var(--btn-outline-hover-bg);
  border-color: var(--btn-outline-hover-border);
}
@media (max-width: 900px) {
  #section-travel-hero-a1b2c3 .hero-grid {
    grid-template-columns: 1fr;
  }
  #section-travel-hero-a1b2c3 .hero-stats {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
<section id="section-travel-hero-a1b2c3" data-gjs-custom-name="Travel Hero">
  <div class="kt-container">
    <div class="hero-grid">
      <div class="hero-card">
        <div class="hero-chip">Curated Journeys</div>
        <h1 class="hero-title">Design your next journey with precision</h1>
        <p class="hero-sub">Private itineraries, transparent pricing, and a concierge team that stays with you from planning to arrival.</p>
        <div class="hero-actions">
          <a class="kt-btn kt-btn-primary" data-scroll-to="#section-travel-cta-7788cc">Plan My Trip</a>
          <a class="kt-btn kt-btn-outline" data-scroll-to="#section-travel-services-d4e5f6">Browse Packages</a>
        </div>
        <div class="hero-stats">
          <div class="stat">
            <div class="stat-value">120+</div>
            <div class="stat-label">Destinations</div>
          </div>
          <div class="stat">
            <div class="stat-value">4.9</div>
            <div class="stat-label">Avg Rating</div>
          </div>
          <div class="stat">
            <div class="stat-value">24/7</div>
            <div class="stat-label">Support</div>
          </div>
        </div>
      </div>
      <div class="hero-media">
        <img src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200" alt="Travel hero" />
      </div>
    </div>
  </div>
</section>
`;

const travelPackages = `
<style>
#section-travel-services-d4e5f6 .kt-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--container-pad);
}
#section-travel-services-d4e5f6 {
  padding: var(--section-pad-y) 0;
  background: var(--surface);
}
#section-travel-services-d4e5f6 .section-title {
  font-family: var(--font-heading);
  font-size: var(--h2-size);
  font-weight: var(--h2-weight);
  color: var(--text);
}
#section-travel-services-d4e5f6 .section-sub {
  font-family: var(--font-body);
  color: var(--muted-text);
  margin-top: 8px;
}
#section-travel-services-d4e5f6 .card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-top: 28px;
}
#section-travel-services-d4e5f6 .card {
  border-radius: var(--radius-lg);
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  box-shadow: var(--card-shadow);
  padding: 22px;
}
#section-travel-services-d4e5f6 .card h3 {
  font-family: var(--font-heading);
  font-size: var(--h4-size);
  margin-bottom: 8px;
  color: var(--text);
}
#section-travel-services-d4e5f6 .card p {
  font-size: var(--body-size);
  color: var(--muted-text);
}
@media (max-width: 900px) {
  #section-travel-services-d4e5f6 .card-grid {
    grid-template-columns: 1fr;
  }
}
</style>
<section id="section-travel-services-d4e5f6" data-gjs-custom-name="Travel Packages">
  <div class="kt-container">
    <h2 class="section-title">Featured Travel Packages</h2>
    <p class="section-sub">Shortlisted experiences with verified stays, transfers, and guided activities.</p>
    <div class="card-grid">
      <div class="card">
        <h3>Royal Jaipur - 3D/2N</h3>
        <p>Heritage stays, private tours, and curated dining.</p>
      </div>
      <div class="card">
        <h3>Dubai - 5D Luxury Escape</h3>
        <p>Desert safari, marina cruise, and premium hospitality.</p>
      </div>
      <div class="card">
        <h3>Vietnam - 7D Explorer</h3>
        <p>Culture-forward itinerary with boutique hotels and guides.</p>
      </div>
    </div>
  </div>
</section>
`;

const travelGallery = `
<style>
#section-travel-gallery-1122aa .kt-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--container-pad);
}
#section-travel-gallery-1122aa {
  padding: var(--section-pad-y) 0;
  background: var(--bg);
}
#section-travel-gallery-1122aa .gallery-track {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(240px, 1fr);
  gap: 16px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  padding-bottom: 8px;
}
#section-travel-gallery-1122aa .gallery-card {
  scroll-snap-align: start;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--border);
  background: var(--surface);
}
#section-travel-gallery-1122aa .gallery-card img {
  width: 100%;
  height: 220px;
  object-fit: cover;
  display: block;
}
</style>
<section id="section-travel-gallery-1122aa" data-gjs-custom-name="Travel Gallery">
  <div class="kt-container">
    <h2 class="section-title">Moments From The Journey</h2>
    <p class="section-sub">Swipe through recent itineraries and destinations.</p>
    <div class="gallery-track">
      <div class="gallery-card"><img src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=800" alt="Gallery 1" /></div>
      <div class="gallery-card"><img src="https://images.unsplash.com/photo-1489515217757-5fd1be406fef?q=80&w=800" alt="Gallery 2" /></div>
      <div class="gallery-card"><img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800" alt="Gallery 3" /></div>
      <div class="gallery-card"><img src="https://images.unsplash.com/photo-1518684079-3c830dcef090?q=80&w=800" alt="Gallery 4" /></div>
    </div>
  </div>
</section>
`;

const travelTestimonials = `
<style>
#section-travel-testimonials-b3c4d5 .kt-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--container-pad);
}
#section-travel-testimonials-b3c4d5 {
  padding: var(--section-pad-y) 0;
  background: var(--surface);
}
#section-travel-testimonials-b3c4d5 .testimonial-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  margin-top: 24px;
}
#section-travel-testimonials-b3c4d5 .testimonial {
  border-radius: var(--radius-lg);
  border: 1px solid var(--card-border);
  background: var(--card-bg);
  padding: 20px;
}
#section-travel-testimonials-b3c4d5 .testimonial p {
  color: var(--muted-text);
}
#section-travel-testimonials-b3c4d5 .testimonial .name {
  margin-top: 12px;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text);
}
@media (max-width: 900px) {
  #section-travel-testimonials-b3c4d5 .testimonial-grid {
    grid-template-columns: 1fr;
  }
}
</style>
<section id="section-travel-testimonials-b3c4d5" data-gjs-custom-name="Travel Testimonials">
  <div class="kt-container">
    <h2 class="section-title">Traveller Stories</h2>
    <p class="section-sub">Real feedback from recent clients.</p>
    <div class="testimonial-grid">
      <div class="testimonial">
        <p>"Impeccable coordination. Every transfer was on time and the stays were beyond expectation."</p>
        <div class="name">Aanya Kapoor</div>
      </div>
      <div class="testimonial">
        <p>"The itinerary was premium without being overwhelming. Perfect balance."</p>
        <div class="name">Joshua Lee</div>
      </div>
      <div class="testimonial">
        <p>"Loved the visibility into every day's plan. The team was proactive."</p>
        <div class="name">Sara Ahmed</div>
      </div>
    </div>
  </div>
</section>
`;

const travelCta = `
<style>
#section-travel-cta-7788cc .kt-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--container-pad);
}
#section-travel-cta-7788cc {
  padding: var(--section-pad-y) 0;
  background: radial-gradient(700px 400px at 80% 40%, rgba(0,0,0,0.2), transparent), var(--bg);
}
#section-travel-cta-7788cc .cta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  align-items: center;
}
#section-travel-cta-7788cc .cta-box {
  border-radius: var(--radius-lg);
  border: 1px solid var(--card-border);
  background: var(--card-bg);
  padding: 24px;
}
#section-travel-cta-7788cc .form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
#section-travel-cta-7788cc .cta-actions {
  margin-top: 16px;
}
#section-travel-cta-7788cc .kt-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: var(--btn-height);
  padding: 0 var(--btn-pad-x);
  border-radius: var(--btn-radius);
  border-width: var(--btn-border-w);
  border-style: solid;
  font-family: var(--font-button);
  font-size: var(--btn-size);
  font-weight: var(--btn-weight);
  letter-spacing: var(--btn-ls);
  text-transform: var(--btn-transform);
  cursor: pointer;
  text-decoration: none;
  transition: background-color var(--btn-transition), color var(--btn-transition), border-color var(--btn-transition);
}
#section-travel-cta-7788cc .kt-btn-primary {
  background-color: var(--btn-primary-bg);
  color: var(--btn-primary-text);
  border-color: var(--btn-primary-border);
}
#section-travel-cta-7788cc .kt-btn-primary:hover {
  background-color: var(--btn-primary-hover-bg);
  color: var(--btn-primary-hover-text);
  border-color: var(--btn-primary-hover-border);
}
#section-travel-cta-7788cc input,
#section-travel-cta-7788cc select,
#section-travel-cta-7788cc textarea {
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: var(--radius-md);
  padding: 12px;
  font-family: var(--font-body);
  color: var(--text);
}
#section-travel-cta-7788cc textarea {
  grid-column: span 2;
  min-height: 110px;
}
@media (max-width: 900px) {
  #section-travel-cta-7788cc .cta-grid {
    grid-template-columns: 1fr;
  }
}
</style>
<section id="section-travel-cta-7788cc" data-gjs-custom-name="Travel Lead Form">
  <div class="kt-container">
    <div class="cta-grid">
      <div>
        <h2 class="section-title">Plan Your Next Trip</h2>
        <p class="section-sub">Share your destination and travel window. We will craft the itinerary within 24 hours.</p>
      </div>
      <div class="cta-box">
        <div class="form-grid">
          <input type="text" placeholder="Full Name" />
          <input type="email" placeholder="Email" />
          <input type="text" placeholder="Destination" />
          <select>
            <option>Travel Style</option>
            <option>Premium</option>
            <option>Luxury</option>
            <option>Budget</option>
          </select>
          <textarea placeholder="Notes"></textarea>
        </div>
        <div class="cta-actions">
          <a class="kt-btn kt-btn-primary" data-redirect-url="/contact">Submit Request</a>
        </div>
      </div>
    </div>
  </div>
</section>
`;

const travelMap = `
<style>
#section-travel-map-2211bb .kt-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--container-pad);
}
#section-travel-map-2211bb {
  padding: var(--section-pad-y) 0;
  background: var(--surface);
}
#section-travel-map-2211bb .map-frame {
  width: 100%;
  height: 340px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}
</style>
<section id="section-travel-map-2211bb" data-gjs-custom-name="Travel Map">
  <div class="kt-container">
    <h2 class="section-title">Nearby Offices</h2>
    <p class="section-sub">Visit us for itinerary planning and in-person consultations.</p>
    <iframe class="map-frame" src="https://maps.google.com/maps?q=Dubai&t=&z=11&ie=UTF8&iwloc=&output=embed" title="Office Map"></iframe>
  </div>
</section>
`;

const travelFooter = `
<style>
#section-travel-footer-ff9012 .kt-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--container-pad);
}
#section-travel-footer-ff9012 {
  padding: 60px 0;
  background: var(--footer-bg);
}
#section-travel-footer-ff9012 .footer-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 20px;
}
#section-travel-footer-ff9012 .footer-title {
  font-family: var(--font-heading);
  font-size: var(--h4-size);
  color: var(--text);
}
#section-travel-footer-ff9012 a {
  color: var(--muted-text);
  text-decoration: none;
}
@media (max-width: 900px) {
  #section-travel-footer-ff9012 .footer-grid {
    grid-template-columns: 1fr;
  }
}
</style>
<footer id="section-travel-footer-ff9012" data-gjs-custom-name="Travel Footer">
  <div class="kt-container">
    <div class="footer-grid">
      <div>
        <div class="footer-title">Kalp Travel</div>
        <p class="section-sub">Premium travel experiences designed to feel effortless.</p>
      </div>
      <div>
        <div class="footer-title">Quick Links</div>
        <a href="#section-travel-services-d4e5f6">Packages</a><br />
        <a href="#section-travel-gallery-1122aa">Gallery</a><br />
        <a href="#section-travel-cta-7788cc">Plan Trip</a>
      </div>
      <div>
        <div class="footer-title">Contact</div>
        <p class="section-sub">hello@kalptravel.com</p>
        <p class="section-sub">+91 99999 00000</p>
      </div>
    </div>
  </div>
</footer>
`;

const travelTemplateHtml = [
    travelHero,
    travelPackages,
    travelGallery,
    travelTestimonials,
    travelCta,
    travelMap,
    travelFooter,
].join('\n');

const resumeHero = `
<style>
#section-resume-hero-001 .kt-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 var(--container-pad);
}
#section-resume-hero-001 {
  padding: var(--section-pad-y) 0;
  background: var(--bg);
}
#section-resume-hero-001 .hero-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 32px;
  align-items: center;
}
#section-resume-hero-001 .profile {
  border-radius: var(--radius-lg);
  border: 1px solid var(--card-border);
  background: var(--card-bg);
  box-shadow: var(--card-shadow);
  padding: 28px;
}
#section-resume-hero-001 .hero-title {
  font-family: var(--font-heading);
  font-size: var(--h1-size);
  font-weight: var(--h1-weight);
  color: var(--text);
}
#section-resume-hero-001 .hero-sub {
  font-size: var(--body-size);
  color: var(--muted-text);
}
#section-resume-hero-001 .hero-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 18px;
}
#section-resume-hero-001 .kt-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: var(--btn-height);
  padding: 0 var(--btn-pad-x);
  border-radius: var(--btn-radius);
  border-width: var(--btn-border-w);
  border-style: solid;
  font-family: var(--font-button);
  font-size: var(--btn-size);
  font-weight: var(--btn-weight);
  letter-spacing: var(--btn-ls);
  text-transform: var(--btn-transform);
  cursor: pointer;
  text-decoration: none;
  transition: background-color var(--btn-transition), color var(--btn-transition), border-color var(--btn-transition);
}
#section-resume-hero-001 .kt-btn-primary {
  background-color: var(--btn-primary-bg);
  color: var(--btn-primary-text);
  border-color: var(--btn-primary-border);
}
#section-resume-hero-001 .kt-btn-primary:hover {
  background-color: var(--btn-primary-hover-bg);
  color: var(--btn-primary-hover-text);
  border-color: var(--btn-primary-hover-border);
}
#section-resume-hero-001 .kt-btn-outline {
  background-color: var(--btn-outline-bg);
  color: var(--btn-outline-text);
  border-color: var(--btn-outline-border);
}
#section-resume-hero-001 .kt-btn-outline:hover {
  background-color: var(--btn-outline-hover-bg);
  border-color: var(--btn-outline-hover-border);
}
@media (max-width: 900px) {
  #section-resume-hero-001 .hero-grid {
    grid-template-columns: 1fr;
  }
}
</style>
<section id="section-resume-hero-001" data-gjs-custom-name="Resume Hero">
  <div class="kt-container">
    <div class="hero-grid">
      <div>
        <div class="hero-title">Aarav Mehta</div>
        <p class="hero-sub">Product Designer focused on travel and hospitality experiences.</p>
        <div class="hero-actions">
          <a class="kt-btn kt-btn-primary" data-redirect-url="/resume.pdf" data-redirect-newtab="true">Download Resume</a>
          <a class="kt-btn kt-btn-outline" data-scroll-to="#section-resume-contact-005">Contact</a>
        </div>
      </div>
      <div class="profile">
        <img src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=800" alt="Profile" />
      </div>
    </div>
  </div>
</section>
`;

const resumePortfolio = `
<style>
#section-resume-portfolio-002 .kt-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 var(--container-pad);
}
#section-resume-portfolio-002 {
  padding: var(--section-pad-y) 0;
  background: var(--surface);
}
#section-resume-portfolio-002 .kt-title {
  font-family: var(--font-heading);
  font-size: var(--h2-size);
  font-weight: var(--h2-weight);
  color: var(--text);
}
#section-resume-portfolio-002 .kt-sub {
  font-family: var(--font-body);
  font-size: var(--body-size);
  color: var(--muted-text);
  line-height: var(--body-lh);
}
#section-resume-portfolio-002 .card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  margin-top: 20px;
}
#section-resume-portfolio-002 .card {
  border-radius: var(--radius-lg);
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  box-shadow: var(--card-shadow);
  padding: 18px;
}
@media (max-width: 900px) {
  #section-resume-portfolio-002 .card-grid {
    grid-template-columns: 1fr;
  }
}
</style>
<section id="section-resume-portfolio-002" data-gjs-custom-name="Resume Portfolio">
  <div class="kt-container">
    <h2 class="kt-title">Featured Projects</h2>
    <p class="kt-sub">Selected work across travel, ecommerce, and SaaS.</p>
    <div class="card-grid">
      <div class="card">
        <h3>Travel Concierge Platform</h3>
        <p>End-to-end booking workflow redesign.</p>
      </div>
      <div class="card">
        <h3>Luxury Resort Landing</h3>
        <p>Conversion-first hero and itinerary cards.</p>
      </div>
      <div class="card">
        <h3>Marketplace Studio</h3>
        <p>Modular product builder with variant matrix.</p>
      </div>
    </div>
  </div>
</section>
`;

const resumeSkills = `
<style>
#section-resume-skills-003 .kt-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 var(--container-pad);
}
#section-resume-skills-003 {
  padding: var(--section-pad-y) 0;
  background: var(--bg);
}
#section-resume-skills-003 .kt-title {
  font-family: var(--font-heading);
  font-size: var(--h2-size);
  font-weight: var(--h2-weight);
  color: var(--text);
}
#section-resume-skills-003 .pill-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
#section-resume-skills-003 .pill {
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--surface-2);
  padding: 10px 14px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
@media (max-width: 900px) {
  #section-resume-skills-003 .pill-grid {
    grid-template-columns: 1fr;
  }
}
</style>
<section id="section-resume-skills-003" data-gjs-custom-name="Resume Skills">
  <div class="kt-container">
    <h2 class="kt-title">Skills</h2>
    <div class="pill-grid">
      <div class="pill">UX Research</div>
      <div class="pill">Visual Design</div>
      <div class="pill">Design Systems</div>
      <div class="pill">Prototyping</div>
      <div class="pill">Figma</div>
      <div class="pill">Framer</div>
      <div class="pill">Product Strategy</div>
      <div class="pill">Presentation</div>
    </div>
  </div>
</section>
`;

const resumeTestimonials = `
<style>
#section-resume-testimonials-004 .kt-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 var(--container-pad);
}
#section-resume-testimonials-004 {
  padding: var(--section-pad-y) 0;
  background: var(--surface);
}
#section-resume-testimonials-004 .kt-title {
  font-family: var(--font-heading);
  font-size: var(--h2-size);
  font-weight: var(--h2-weight);
  color: var(--text);
}
#section-resume-testimonials-004 .testimonial-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
}
#section-resume-testimonials-004 .kt-glass {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  box-shadow: var(--card-shadow);
  border-radius: var(--radius-lg);
}
#section-resume-testimonials-004 .testimonial-card {
  padding: 18px;
}
#section-resume-testimonials-004 .section-sub {
  font-family: var(--font-body);
  color: var(--muted-text);
}
@media (max-width: 900px) {
  #section-resume-testimonials-004 .testimonial-grid {
    grid-template-columns: 1fr;
  }
}
</style>
<section id="section-resume-testimonials-004" data-gjs-custom-name="Resume Testimonials">
  <div class="kt-container">
    <h2 class="kt-title">What Teams Say</h2>
    <div class="testimonial-grid">
      <div class="kt-glass testimonial-card">
        <p>"Strong ownership and crisp storytelling. Always raises the bar."</p>
        <div class="section-sub">Design Lead, JourneyOne</div>
      </div>
      <div class="kt-glass testimonial-card">
        <p>"Delivered a polished product studio in record time."</p>
        <div class="section-sub">CTO, Atlas</div>
      </div>
    </div>
  </div>
</section>
`;

const resumeContact = `
<style>
#section-resume-contact-005 .kt-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 var(--container-pad);
}
#section-resume-contact-005 {
  padding: var(--section-pad-y) 0;
  background: var(--bg);
}
#section-resume-contact-005 .kt-title {
  font-family: var(--font-heading);
  font-size: var(--h2-size);
  font-weight: var(--h2-weight);
  color: var(--text);
}
#section-resume-contact-005 .form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
#section-resume-contact-005 input,
#section-resume-contact-005 textarea {
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 12px;
  background: var(--surface);
}
#section-resume-contact-005 textarea {
  grid-column: span 2;
  min-height: 120px;
}
#section-resume-contact-005 .contact-actions {
  margin-top: 16px;
}
#section-resume-contact-005 .kt-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: var(--btn-height);
  padding: 0 var(--btn-pad-x);
  border-radius: var(--btn-radius);
  border-width: var(--btn-border-w);
  border-style: solid;
  font-family: var(--font-button);
  font-size: var(--btn-size);
  font-weight: var(--btn-weight);
  letter-spacing: var(--btn-ls);
  text-transform: var(--btn-transform);
  cursor: pointer;
  text-decoration: none;
  transition: background-color var(--btn-transition), color var(--btn-transition), border-color var(--btn-transition);
}
#section-resume-contact-005 .kt-btn-primary {
  background-color: var(--btn-primary-bg);
  color: var(--btn-primary-text);
  border-color: var(--btn-primary-border);
}
#section-resume-contact-005 .kt-btn-primary:hover {
  background-color: var(--btn-primary-hover-bg);
  color: var(--btn-primary-hover-text);
  border-color: var(--btn-primary-hover-border);
}
</style>
<section id="section-resume-contact-005" data-gjs-custom-name="Resume Contact">
  <div class="kt-container">
    <h2 class="kt-title">Let's Connect</h2>
    <div class="form-grid">
      <input type="text" placeholder="Your Name" />
      <input type="email" placeholder="Email" />
      <textarea placeholder="Project Details"></textarea>
    </div>
    <div class="contact-actions">
      <a class="kt-btn kt-btn-primary" data-redirect-url="/contact">Send</a>
    </div>
  </div>
</section>
`;

const resumeFooter = `
<style>
#section-resume-footer-006 .kt-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 var(--container-pad);
}
#section-resume-footer-006 {
  padding: 60px 0;
  background: var(--footer-bg);
}
#section-resume-footer-006 .kt-sub {
  font-family: var(--font-body);
  color: var(--muted-text);
}
</style>
<footer id="section-resume-footer-006" data-gjs-custom-name="Resume Footer">
  <div class="kt-container">
    <p class="kt-sub">(c) 2026 Aarav Mehta - Portfolio</p>
  </div>
</footer>
`;

const resumeTemplateHtml = [
    resumeHero,
    resumePortfolio,
    resumeSkills,
    resumeTestimonials,
    resumeContact,
    resumeFooter,
].join('\n');

const ecommerceHero = `
<style>
#section-ecom-hero-100 .kt-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--container-pad);
}
#section-ecom-hero-100 {
  padding: var(--section-pad-y) 0;
  background: radial-gradient(900px 500px at 10% 10%, rgba(0,0,0,0.18), transparent), var(--bg);
}
#section-ecom-hero-100 .hero-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 32px;
  align-items: center;
}
#section-ecom-hero-100 .hero-title {
  font-family: var(--font-heading);
  font-size: var(--h1-size);
  font-weight: var(--h1-weight);
  color: var(--text);
}
#section-ecom-hero-100 .hero-sub {
  font-family: var(--font-body);
  color: var(--muted-text);
  line-height: var(--body-lh);
}
#section-ecom-hero-100 .hero-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 16px;
}
#section-ecom-hero-100 .hero-media {
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  overflow: hidden;
  box-shadow: var(--shadow-md);
}
#section-ecom-hero-100 .hero-media img {
  width: 100%;
  height: auto;
  display: block;
}
#section-ecom-hero-100 .kt-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: var(--btn-height);
  padding: 0 var(--btn-pad-x);
  border-radius: var(--btn-radius);
  border-width: var(--btn-border-w);
  border-style: solid;
  font-family: var(--font-button);
  font-size: var(--btn-size);
  font-weight: var(--btn-weight);
  letter-spacing: var(--btn-ls);
  text-transform: var(--btn-transform);
  cursor: pointer;
  text-decoration: none;
  transition: background-color var(--btn-transition), color var(--btn-transition), border-color var(--btn-transition);
}
#section-ecom-hero-100 .kt-btn-primary {
  background-color: var(--btn-primary-bg);
  color: var(--btn-primary-text);
  border-color: var(--btn-primary-border);
}
#section-ecom-hero-100 .kt-btn-primary:hover {
  background-color: var(--btn-primary-hover-bg);
  color: var(--btn-primary-hover-text);
  border-color: var(--btn-primary-hover-border);
}
#section-ecom-hero-100 .kt-btn-outline {
  background-color: var(--btn-outline-bg);
  color: var(--btn-outline-text);
  border-color: var(--btn-outline-border);
}
#section-ecom-hero-100 .kt-btn-outline:hover {
  background-color: var(--btn-outline-hover-bg);
  border-color: var(--btn-outline-hover-border);
}
@media (max-width: 900px) {
  #section-ecom-hero-100 .hero-grid {
    grid-template-columns: 1fr;
  }
}
</style>
<section id="section-ecom-hero-100" data-gjs-custom-name="Ecommerce Hero">
  <div class="kt-container">
    <div class="hero-grid">
      <div>
        <div class="hero-title">Designed essentials for modern living</div>
        <p class="hero-sub">A curated store with minimal design, fast shipping, and transparent pricing.</p>
        <div class="hero-actions">
          <a class="kt-btn kt-btn-primary" data-scroll-to="#section-ecom-products-200">Shop Collection</a>
          <a class="kt-btn kt-btn-outline" data-scroll-to="#section-ecom-benefits-300">Why Us</a>
        </div>
      </div>
      <div class="hero-media">
        <img src="https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=1200" alt="Featured product" />
      </div>
    </div>
  </div>
</section>
`;

const ecommerceProducts = `
<style>
#section-ecom-products-200 .kt-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--container-pad);
}
#section-ecom-products-200 {
  padding: var(--section-pad-y) 0;
  background: var(--surface);
}
#section-ecom-products-200 .grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  margin-top: 20px;
}
#section-ecom-products-200 .card {
  border-radius: var(--radius-lg);
  border: 1px solid var(--card-border);
  background: var(--card-bg);
  box-shadow: var(--card-shadow);
  overflow: hidden;
}
#section-ecom-products-200 .card img {
  width: 100%;
  height: 220px;
  object-fit: cover;
  display: block;
}
#section-ecom-products-200 .card-body {
  padding: 16px;
}
#section-ecom-products-200 .price {
  font-family: var(--font-heading);
  font-size: var(--h4-size);
  color: var(--text);
}
@media (max-width: 900px) {
  #section-ecom-products-200 .grid {
    grid-template-columns: 1fr;
  }
}
</style>
<section id="section-ecom-products-200" data-gjs-custom-name="Ecommerce Products">
  <div class="kt-container">
    <h2 class="section-title">Featured Products</h2>
    <p class="section-sub">Top sellers curated by the team.</p>
    <div class="grid">
      <div class="card">
        <img src="https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=800" alt="Product 1" />
        <div class="card-body">
          <h3>Minimal Desk</h3>
          <p class="price">USD 299</p>
        </div>
      </div>
      <div class="card">
        <img src="https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=800" alt="Product 2" />
        <div class="card-body">
          <h3>Soft Lounge Chair</h3>
          <p class="price">USD 189</p>
        </div>
      </div>
      <div class="card">
        <img src="https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=800" alt="Product 3" />
        <div class="card-body">
          <h3>Layered Throw</h3>
          <p class="price">USD 79</p>
        </div>
      </div>
    </div>
  </div>
</section>
`;

const ecommerceBenefits = `
<style>
#section-ecom-benefits-300 .kt-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--container-pad);
}
#section-ecom-benefits-300 {
  padding: var(--section-pad-y) 0;
  background: var(--bg);
}
#section-ecom-benefits-300 .grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  margin-top: 20px;
}
#section-ecom-benefits-300 .card {
  border-radius: var(--radius-lg);
  border: 1px solid var(--card-border);
  background: var(--card-bg);
  box-shadow: var(--card-shadow);
  padding: 20px;
}
@media (max-width: 900px) {
  #section-ecom-benefits-300 .grid {
    grid-template-columns: 1fr;
  }
}
</style>
<section id="section-ecom-benefits-300" data-gjs-custom-name="Ecommerce Benefits">
  <div class="kt-container">
    <h2 class="section-title">Why Customers Choose Us</h2>
    <p class="section-sub">Designed for clarity and convenience.</p>
    <div class="grid">
      <div class="card">
        <h3>Fast Dispatch</h3>
        <p>Orders ship within 24 hours on business days.</p>
      </div>
      <div class="card">
        <h3>Secure Payments</h3>
        <p>Multi-gateway checkout with fraud monitoring.</p>
      </div>
      <div class="card">
        <h3>Easy Returns</h3>
        <p>Simple return flow within 30 days.</p>
      </div>
    </div>
  </div>
</section>
`;

const ecommerceGallery = `
<style>
#section-ecom-gallery-400 .kt-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--container-pad);
}
#section-ecom-gallery-400 {
  padding: var(--section-pad-y) 0;
  background: var(--surface);
}
#section-ecom-gallery-400 .gallery-track {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(240px, 1fr);
  gap: 16px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
}
#section-ecom-gallery-400 .gallery-card {
  scroll-snap-align: start;
  border-radius: var(--radius-lg);
  overflow: hidden;
  border: 1px solid var(--border);
  background: var(--surface);
}
#section-ecom-gallery-400 .gallery-card img {
  width: 100%;
  height: 220px;
  object-fit: cover;
  display: block;
}
</style>
<section id="section-ecom-gallery-400" data-gjs-custom-name="Ecommerce Gallery">
  <div class="kt-container">
    <h2 class="section-title">Lookbook</h2>
    <p class="section-sub">Lifestyle scenes from recent collections.</p>
    <div class="gallery-track">
      <div class="gallery-card"><img src="https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=800" alt="Gallery 1" /></div>
      <div class="gallery-card"><img src="https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=800" alt="Gallery 2" /></div>
      <div class="gallery-card"><img src="https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=800" alt="Gallery 3" /></div>
      <div class="gallery-card"><img src="https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=800" alt="Gallery 4" /></div>
    </div>
  </div>
</section>
`;

const ecommerceCta = `
<style>
#section-ecom-cta-500 .kt-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--container-pad);
}
#section-ecom-cta-500 {
  padding: var(--section-pad-y) 0;
  background: var(--bg);
}
#section-ecom-cta-500 .cta-box {
  border-radius: var(--radius-lg);
  border: 1px solid var(--card-border);
  background: var(--card-bg);
  padding: 24px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  align-items: center;
}
#section-ecom-cta-500 .kt-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: var(--btn-height);
  padding: 0 var(--btn-pad-x);
  border-radius: var(--btn-radius);
  border-width: var(--btn-border-w);
  border-style: solid;
  font-family: var(--font-button);
  font-size: var(--btn-size);
  font-weight: var(--btn-weight);
  letter-spacing: var(--btn-ls);
  text-transform: var(--btn-transform);
  cursor: pointer;
  text-decoration: none;
  transition: background-color var(--btn-transition), color var(--btn-transition), border-color var(--btn-transition);
}
#section-ecom-cta-500 .kt-btn-primary {
  background-color: var(--btn-primary-bg);
  color: var(--btn-primary-text);
  border-color: var(--btn-primary-border);
}
#section-ecom-cta-500 .kt-btn-primary:hover {
  background-color: var(--btn-primary-hover-bg);
  color: var(--btn-primary-hover-text);
  border-color: var(--btn-primary-hover-border);
}
@media (max-width: 900px) {
  #section-ecom-cta-500 .cta-box {
    grid-template-columns: 1fr;
  }
}
</style>
<section id="section-ecom-cta-500" data-gjs-custom-name="Ecommerce CTA">
  <div class="kt-container">
    <div class="cta-box">
      <div>
        <h2 class="section-title">Join the member list</h2>
        <p class="section-sub">Get early access to new drops and member-only pricing.</p>
      </div>
      <div>
        <a class="kt-btn kt-btn-primary" data-redirect-url="/signup">Create Account</a>
      </div>
    </div>
  </div>
</section>
`;

const ecommerceFooter = `
<style>
#section-ecom-footer-600 .kt-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--container-pad);
}
#section-ecom-footer-600 {
  padding: 60px 0;
  background: var(--footer-bg);
}
#section-ecom-footer-600 .footer-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 20px;
}
#section-ecom-footer-600 .footer-title {
  font-family: var(--font-heading);
  font-size: var(--h4-size);
  color: var(--text);
}
#section-ecom-footer-600 a {
  color: var(--muted-text);
  text-decoration: none;
}
@media (max-width: 900px) {
  #section-ecom-footer-600 .footer-grid {
    grid-template-columns: 1fr;
  }
}
</style>
<footer id="section-ecom-footer-600" data-gjs-custom-name="Ecommerce Footer">
  <div class="kt-container">
    <div class="footer-grid">
      <div>
        <div class="footer-title">Kalp Store</div>
        <p class="section-sub">Modern essentials curated for everyday living.</p>
      </div>
      <div>
        <div class="footer-title">Support</div>
        <a href="/support">Help Center</a><br />
        <a href="/returns">Returns</a><br />
        <a href="/shipping">Shipping</a>
      </div>
      <div>
        <div class="footer-title">Contact</div>
        <p class="section-sub">support@kalpstore.com</p>
        <p class="section-sub">+1 555 0101</p>
      </div>
    </div>
  </div>
</footer>
`;

const ecommerceTemplateHtml = [
    ecommerceHero,
    ecommerceProducts,
    ecommerceBenefits,
    ecommerceGallery,
    ecommerceCta,
    ecommerceFooter,
].join('\n');

export function getDefaultLandingTemplates(): LandingTemplate[] {
    return [
        {
            key: 'gjs_travel_digital',
            name: 'Travel Digital Glass',
            businessType: 'travel',
            format: 'grapesjs',
            html: travelTemplateHtml,
            sections: [
                { key: 'hero', label: 'Travel Hero', html: travelHero },
                { key: 'packages', label: 'Travel Packages', html: travelPackages },
                { key: 'gallery', label: 'Travel Gallery', html: travelGallery },
                { key: 'testimonials', label: 'Travel Testimonials', html: travelTestimonials },
                { key: 'cta', label: 'Travel Lead Form', html: travelCta },
                { key: 'map', label: 'Travel Map', html: travelMap },
                { key: 'footer', label: 'Travel Footer', html: travelFooter },
            ],
            updatedAt: UPDATED_AT,
        },
        {
            key: 'gjs_resume_digital',
            name: 'Resume Digital Glass',
            businessType: 'student',
            format: 'grapesjs',
            html: resumeTemplateHtml,
            sections: [
                { key: 'hero', label: 'Resume Hero', html: resumeHero },
                { key: 'portfolio', label: 'Resume Portfolio', html: resumePortfolio },
                { key: 'skills', label: 'Resume Skills', html: resumeSkills },
                { key: 'testimonials', label: 'Resume Testimonials', html: resumeTestimonials },
                { key: 'contact', label: 'Resume Contact', html: resumeContact },
                { key: 'footer', label: 'Resume Footer', html: resumeFooter },
            ],
            updatedAt: UPDATED_AT,
        },
        {
            key: 'gjs_ecommerce_digital',
            name: 'Ecommerce Digital Glass',
            businessType: 'ecommerce',
            format: 'grapesjs',
            html: ecommerceTemplateHtml,
            sections: [
                { key: 'hero', label: 'Ecommerce Hero', html: ecommerceHero },
                { key: 'products', label: 'Ecommerce Products', html: ecommerceProducts },
                { key: 'benefits', label: 'Ecommerce Benefits', html: ecommerceBenefits },
                { key: 'gallery', label: 'Ecommerce Gallery', html: ecommerceGallery },
                { key: 'cta', label: 'Ecommerce CTA', html: ecommerceCta },
                { key: 'footer', label: 'Ecommerce Footer', html: ecommerceFooter },
            ],
            updatedAt: UPDATED_AT,
        },
    ];
}
