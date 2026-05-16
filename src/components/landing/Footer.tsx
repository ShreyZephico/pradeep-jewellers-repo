"use client";

import styles from "./css/Footer.module.css";

// Import contact data
import contactData from "@/data/contactData.json";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const footerData = contactData.footer;
  const socialLinks = [
    { name: "Instagram", icon: "📷", url: contactData.social.instagram },
    { name: "Facebook", icon: "📘", url: contactData.social.facebook },
    { name: "YouTube", icon: "▶️", url: contactData.social.youtube },
    { name: "WhatsApp", icon: "💬", url: contactData.social.whatsapp },
  ];

  return (
    <footer className={styles.footer}>
      {/* Animated Background Elements */}
      <div className={styles.bgElements}>
        <div className={styles.goldParticles} />
        <div className={styles.glowOrb1} />
        <div className={styles.glowOrb2} />
        <div className={styles.goldLinePattern} />
      </div>

      <div className={styles.container}>
        {/* Main Footer Content */}
        <div className={styles.mainContent}>
          {/* Brand Section */}
          <div className={styles.brandSection}>
            <div className={styles.logoContainer}>
  <img 
    src="/logo.png" 
    alt={contactData.brand.name}
    style={{ maxWidth: '180px', height: 'auto' }}
    onError={(e) => {
      e.currentTarget.style.display = 'none';
    }}
  />
</div>
            <p className={styles.brandDescription}>{contactData.brand.description}</p>
            <div className={styles.tagline}>
              <span className={styles.taglineIcon}>✨</span>
              <span>{contactData.brand.tagline}</span>
            </div>
            <div className={styles.trustBadges}>
              {footerData.trustBadges.map((badge, index) => (
                <div key={index} className={styles.trustBadge}>
                  <span className={styles.trustIcon}>✓</span>
                  <span>{badge}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className={styles.linksSection}>
            <h4 className={styles.sectionTitle}>Quick Links</h4>
            <ul className={styles.linkList}>
              {footerData.quickLinks.map((link, index) => (
                <li key={index}>
                  <a href={link.url} className={styles.link}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Collections */}
          <div className={styles.linksSection}>
            <h4 className={styles.sectionTitle}>Collections</h4>
            <ul className={styles.linkList}>
              {footerData.collections.map((collection, index) => (
                <li key={index}>
                  <a href={collection.url} className={styles.link}>
                    {collection.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className={styles.contactSection}>
            <h4 className={styles.sectionTitle}>Visit Us</h4>
            <div className={styles.contactInfo}>
              <div className={styles.contactItem}>
                <span className={styles.contactIcon}>📍</span>
                <span>{contactData.contact.studio}</span>
              </div>
              <div className={styles.contactItem}>
                <span className={styles.contactIcon}>📞</span>
                <a href={`tel:${contactData.contact.phone}`} className={styles.contactLink}>
                  {contactData.contact.phone}
                </a>
              </div>
              <div className={styles.contactItem}>
                <span className={styles.contactIcon}>✉️</span>
                <a href={`mailto:${contactData.contact.email}`} className={styles.contactLink}>
                  {contactData.contact.email}
                </a>
              </div>
              <div className={styles.contactItem}>
                <span className={styles.contactIcon}>🕐</span>
                <span>{contactData.contact.hours}</span>
              </div>
              <div className={styles.contactItem}>
                <span className={styles.contactIcon}>📅</span>
                <span>{contactData.contact.sunday}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className={styles.newsletterSection}>
          <div className={styles.newsletterContent}>
            <div className={styles.newsletterText}>
              <h4>Subscribe to Our Newsletter</h4>
              <p>Get exclusive updates on new collections and special offers</p>
            </div>
            <form className={styles.newsletterForm} onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Enter your email address"
                className={styles.newsletterInput}
                required
              />
              <button type="submit" className={styles.newsletterButton}>
                Subscribe
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={styles.bottomBar}>
          <div className={styles.socialLinks}>
            {socialLinks.map((social, index) => (
              <a
                key={index}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                aria-label={social.name}
              >
                <span className={styles.socialIcon}>{social.icon}</span>
                <span className={styles.socialName}>{social.name}</span>
              </a>
            ))}
          </div>
          
          <div className={styles.copyright}>
            <p>© {currentYear} {contactData.brand.name}. {footerData.copyright}</p>
            <div className={styles.footerLinks}>
              <a href="/privacy-policy">Privacy Policy</a>
              <span className={styles.separator}>|</span>
              <a href="/terms-conditions">Terms & Conditions</a>
              <span className={styles.separator}>|</span>
              <a href="/returns">Return Policy</a>
            </div>
          </div>
          
          <div className={styles.paymentMethods}>
            {footerData.paymentMethods.map((method, index) => (
              <span key={index} className={styles.paymentIcon}>{method}</span>
            ))}
            <span className={styles.paymentText}>Secure Payments</span>
          </div>
        </div>

        {/* Back to Top Button */}
        <button 
          className={styles.backToTop}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 19V5M5 12l7-7 7 7"/>
          </svg>
        </button>
      </div>
    </footer>
  );
}
