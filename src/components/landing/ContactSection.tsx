"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./css/ContactSection.module.css";

// Import contact data
import contactData from "@/data/contactData.json";

interface ContactInfo {
  label: string;
  value: string;
  icon: string;
  link?: string;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
}

export default function ContactSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const sectionRef = useRef<HTMLElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    console.log("🚀 ContactSection MOUNTED - Component loaded successfully");
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          console.log("📱 Section visible in viewport");
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      observer.disconnect();
      console.log("👋 ContactSection UNMOUNTED");
    };
  }, []);

  const validateForm = (): boolean => {
    console.log("🔍 Starting validation with data:", { ...formData, message: formData.message.substring(0, 20) + "..." });
    
    const newErrors: FormErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
      console.log("❌ Name validation failed");
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
      console.log("❌ Name too short:", formData.name.length);
    } else {
      console.log("✅ Name validation passed");
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
      console.log("❌ Email validation failed");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
      console.log("❌ Email format invalid:", formData.email);
    } else {
      console.log("✅ Email validation passed");
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
      console.log("❌ Phone validation failed");
    } else if (!/^[0-9]{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
      console.log("❌ Phone invalid:", formData.phone);
    } else {
      console.log("✅ Phone validation passed");
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
      console.log("❌ Message validation failed");
    } else if (formData.message.length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
      console.log("❌ Message too short:", formData.message.length);
    } else {
      console.log("✅ Message validation passed");
    }
    
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    console.log(`📊 Validation ${isValid ? "PASSED ✅" : "FAILED ❌"}`, newErrors);
    return isValid;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    console.log(`✏️ Input changed: ${name} = "${value}"`);
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // ✅ FIXED: Submit DIRECTLY to Netlify, NOT through API route
  // const handleSubmit = async (e: React.FormEvent) => {
  //   console.log("🎯🎯🎯 SUBMIT BUTTON CLICKED! 🎯🎯🎯");
  //   e.preventDefault();
  //   console.log("PreventDefault called - page won't reload");
    
  //   console.log("Current form data:", formData);
    
  //   console.log("Starting validation...");
  //   if (!validateForm()) {
  //     console.log("❌ Validation failed - stopping submission");
  //     return;
  //   }
    
  //   console.log("✅ Validation passed - proceeding with submission");
    
  //   setIsSubmitting(true);
  //   setSubmitStatus({ type: null, message: '' });
    
  //   try {
  //     console.log("📦 Creating URLSearchParams for direct Netlify submission");
      
  //     // ✅ CRITICAL FIX: Use URLSearchParams (NOT FormData) for direct Netlify submission
  //     const formDataToSend = new URLSearchParams();
  //     formDataToSend.append("form-name", "consultation");
  //     formDataToSend.append("name", formData.name);
  //     formDataToSend.append("email", formData.email);
  //     formDataToSend.append("phone", formData.phone);
  //     formDataToSend.append("message", formData.message);
      
  //     console.log("✅ Data prepared for Netlify:", {
  //       "form-name": "consultation",
  //       name: formData.name,
  //       email: formData.email,
  //       phone: formData.phone,
  //       messageLength: formData.message.length
  //     });
      
  //     // Get bot-field value
  //     const botFieldInput = document.querySelector('input[name="bot-field"]') as HTMLInputElement;
  //     if (botFieldInput) {
  //       console.log("🤖 Bot-field found, value:", botFieldInput.value || "(empty - good)");
  //       if (botFieldInput.value) {
  //         formDataToSend.append("bot-field", botFieldInput.value);
  //       }
  //     } else {
  //       console.log("⚠️ Bot-field input NOT found in DOM");
  //     }
      
  //     // ✅ CRITICAL FIX: Submit DIRECTLY to Netlify (root URL), NOT to /api/contact
  //     console.log("📤 Sending DIRECT POST request to Netlify (/)...");
  //     const response = await fetch("/", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/x-www-form-urlencoded",
  //       },
  //       body: formDataToSend.toString(),
  //     });
      
  //     console.log("📥 Response received:", {
  //       status: response.status,
  //       statusText: response.statusText,
  //       ok: response.ok
  //     });
      
  //     // ✅ Netlify returns 200 OK with HTML page on success
  //     if (response.ok) {
  //       console.log("🎉🎉🎉 SUCCESS! Form submitted DIRECTLY to Netlify! 🎉🎉🎉");
  //       console.log("✅ Check your Netlify dashboard in 30-60 seconds");
  //       setSubmitStatus({
  //         type: 'success',
  //         message: 'Thank you! Our jewellery expert will contact you within 24 hours.'
  //       });
  //       setFormData({ name: '', email: '', phone: '', message: '' });
  //       console.log("Form reset after successful submission");
  //     } else {
  //       console.error("❌ Netlify returned error:", response.status);
  //       throw new Error('Form submission failed');
  //     }
  //   } catch (error) {
  //     console.error("❌❌❌ CATCH BLOCK - Submission failed:", error);
  //     setSubmitStatus({
  //       type: 'error',
  //       message: 'Something went wrong. Please try again or call us directly.'
  //     });
  //   } finally {
  //     setIsSubmitting(false);
  //     console.log("🏁 Submission process completed");
  //     setTimeout(() => {
  //       setSubmitStatus({ type: null, message: '' });
  //       console.log("Status message cleared");
  //     }, 5000);
  //   }
  // };


  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!validateForm()) return;
  
  setIsSubmitting(true);
  setSubmitStatus({ type: null, message: '' });
  
  try {
    const formDataToSend = new URLSearchParams();
    formDataToSend.append("form-name", "consultation");
    formDataToSend.append("name", formData.name);
    formDataToSend.append("email", formData.email);
    formDataToSend.append("phone", formData.phone);
    formDataToSend.append("message", formData.message);
    
    const botFieldInput = document.querySelector('input[name="bot-field"]') as HTMLInputElement;
    if (botFieldInput && botFieldInput.value) {
      formDataToSend.append("bot-field", botFieldInput.value);
    }
    
    // ✅ CRITICAL FIX: POST to static HTML file, NOT to "/"
    const response = await fetch("/__forms.html", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formDataToSend.toString(),
    });
    
    if (response.ok) {
      setSubmitStatus({
        type: 'success',
        message: 'Thank you! Our jewellery expert will contact you within 24 hours.'
      });
      setFormData({ name: '', email: '', phone: '', message: '' });
    } else {
      throw new Error('Form submission failed');
    }
  } catch (error) {
    console.error("Form submission error:", error);
    setSubmitStatus({
      type: 'error',
      message: 'Something went wrong. Please try again or call us directly.'
    });
  } finally {
    setIsSubmitting(false);
    setTimeout(() => setSubmitStatus({ type: null, message: '' }), 5000);
  }
};

  const contactInfo: ContactInfo[] = [
    { label: "Phone", value: contactData.contact.phone, icon: "📞", link: `tel:${contactData.contact.phone}` },
    { label: "Email", value: contactData.contact.email, icon: "✉️", link: `mailto:${contactData.contact.email}` },
    { label: "WhatsApp", value: "Chat with us", icon: "💬", link: contactData.social.whatsapp },
    { label: "Studio", value: contactData.contact.studio, icon: "📍" },
    { label: "Hours", value: contactData.contact.hours, icon: "🕐" },
  ];

  return (
    <section ref={sectionRef} id="contact" className={styles.section}>
      <div className={styles.bgElements}>
        <div className={styles.goldParticles} />
        <div className={styles.glowOrb1} />
        <div className={styles.glowOrb2} />
        <div className={styles.diamondDust} />
      </div>

      <div className={styles.container}>
        <div className={`${styles.header} ${isVisible ? styles.visible : ""}`}>
          <div className={styles.eyebrowWrapper}>
            <span className={styles.eyebrowLine}></span>
            <p className={styles.eyebrow}>Connect With Us</p>
            <span className={styles.eyebrowLine}></span>
          </div>
          <h2 className={styles.title}>
            Let&apos;s Begin Your 
            <span className={styles.goldText}> Luxury Journey</span>
          </h2>
          <p className={styles.subtitle}>
            Experience personalized service and expert guidance for your special moments
          </p>
          <div className={styles.headerAccent} />
        </div>

        <div className={`${styles.grid} ${isVisible ? styles.visible : ""}`}>
          {/* Left Column - Contact Info */}
          <div className={styles.infoColumn}>
            <div className={styles.brandCard}>
              <h3 className={styles.brandName}>
                {contactData.brand.name}
                <span className={styles.sinceTag}>{contactData.brand.tagline}</span>
              </h3>
              <p className={styles.brandDescription}>{contactData.brand.description}</p>
            </div>

            <div className={styles.contactCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIcon}>💎</div>
                <h4>Get in Touch</h4>
              </div>
              
              <div className={styles.contactList}>
                {contactInfo.map((item, index) => (
                  <div 
                    key={item.label} 
                    className={styles.contactItem}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className={styles.contactIcon}>{item.icon}</div>
                    <div className={styles.contactDetail}>
                      <span className={styles.contactLabel}>{item.label}</span>
                      {item.link ? (
                        <a href={item.link} className={styles.contactValue}>
                          {item.value}
                        </a>
                      ) : (
                        <strong className={styles.contactValue}>{item.value}</strong>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.appointmentNote}>
                <div className={styles.noteIcon}>📅</div>
                <div>
                  <strong>Private Consultations Available</strong>
                  <p>{contactData.appointment.notice}</p>
                </div>
              </div>
            </div>

            <div className={styles.socialCard}>
              <h4>Follow Our Journey</h4>
              <div className={styles.socialLinks}>
                <a href={contactData.social.instagram} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                  <span>📷</span> Instagram
                </a>
                <a href={contactData.social.facebook} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                  <span>📘</span> Facebook
                </a>
                <a href={contactData.social.youtube} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                  <span>▶️</span> YouTube
                </a>
              </div>
            </div>
          </div>

          {/* Right Column - Contact Form & Map */}
          <div className={styles.formColumn}>
            <div className={styles.formCard}>
              <div className={styles.formHeader}>
                <h3>Schedule a Consultation</h3>
                <p>Fill out the form and our experts will reach out within 24 hours</p>
              </div>
              
              {submitStatus.type && (
                <div className={`${styles.statusMessage} ${styles[submitStatus.type]}`}>
                  {submitStatus.message}
                </div>
              )}
              
              <form 
                ref={formRef}
                onSubmit={handleSubmit} 
                className={styles.contactForm}
                name="consultation"
                method="POST"
                data-netlify="true"
                data-netlify-honeypot="bot-field"
                noValidate
              >
                <input type="hidden" name="form-name" value="consultation" />
                
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder=" "
                      className={errors.name ? styles.error : ''}
                    />
                    <label>Full Name *</label>
                    {errors.name && <span className={styles.errorMessage}>{errors.name}</span>}
                  </div>
                  
                  <div className={styles.formGroup}>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder=" "
                      className={errors.email ? styles.error : ''}
                    />
                    <label>Email Address *</label>
                    {errors.email && <span className={styles.errorMessage}>{errors.email}</span>}
                  </div>
                </div>
                
                <div className={styles.formGroup}>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    placeholder=" "
                    className={errors.phone ? styles.error : ''}
                  />
                  <label>Phone Number *</label>
                  {errors.phone && <span className={styles.errorMessage}>{errors.phone}</span>}
                </div>
                
                <div className={styles.formGroup}>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    placeholder=" "
                    className={errors.message ? styles.error : ''}
                  />
                  <label>Tell us about your requirements *</label>
                  {errors.message && <span className={styles.errorMessage}>{errors.message}</span>}
                </div>
                
                {/* Honeypot field for spam protection */}
                <div style={{ position: 'absolute', left: '-5000px', top: '-5000px' }}>
                  <input 
                    type="text" 
                    name="bot-field" 
                    tabIndex={-1}
                    autoComplete="off"
                    onChange={() => {}} 
                  />
                </div>
                
                <button 
                  type="submit" 
                  className={styles.submitButton}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>Sending <span className={styles.spinner}></span></>
                  ) : (
                    <>
                      Send Message
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                      </svg>
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className={styles.mapCard}>
              <div className={styles.mapHeader}>
                <span className={styles.mapPinIcon}>📍</span>
                <h4>Visit Our Studio</h4>
              </div>
              <p className={styles.mapAddress}>{contactData.contact.studio}</p>
              
              <div className={styles.mapContainer}>
                <iframe
                  src="https://maps.google.com/maps?q=22.695814,72.858726&z=15&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Pradeep Jewellers Location Map"
                  className={styles.googleMap}
                />
              </div>
              
              <div className={styles.mapDirections}>
                <a 
                  href="https://maps.google.com/maps?daddr=22.695814,72.858726" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.directionsButton}
                >
                  Get Directions
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </a>
              </div>
              
              <div className={styles.businessHours}>
                <div className={styles.hoursTitle}>Business Hours</div>
                {contactData.businessHours.map((hours, index) => (
                  <div key={index} className={styles.hoursRow}>
                    <span>{hours.day}</span>
                    <strong>{hours.hours}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
