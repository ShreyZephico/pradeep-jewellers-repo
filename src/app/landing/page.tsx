'use client';

import { useEffect, useState } from 'react';
import BestSellerSection from "@/components/landing/BestSellerSection";
import ContactSection from "@/components/landing/ContactSection";
import CraftsmanshipSection from "@/components/landing/CraftsmanshipSection";
import CTASection from "@/components/landing/CTASection";
import FAQSection from "@/components/landing/FAQSection";
import FeaturedCollectionSection from "@/components/landing/FeaturedCollectionSection";
import HeroSection from "@/components/landing/HeroSection";
import OfferBannerSection from "@/components/landing/OfferBannerSection";
import ShopByCategorySection from "@/components/landing/ShopByCategorySection";
import TestimonialSection from "@/components/landing/TestimonialSection";

export default function LandingPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loginMethod, setLoginMethod] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check');
        const data = await response.json();

        if (!data.isAuthenticated) {
          setIsLoggedIn(false);
          return;
        }

        setIsLoggedIn(true);
        setUserEmail(data.email ?? localStorage.getItem('customerEmail'));
        setLoginMethod(data.loginMethod ?? localStorage.getItem('loginMethod'));
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsLoggedIn(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <>
      {isLoggedIn ? (
        <div className="bg-green-50 border-b border-green-200 py-2 px-4">
          <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm">
            <span className="text-green-800">Logged in as:</span>
            <span className="font-semibold text-green-900">{userEmail || 'User'}</span>
            {loginMethod ? (
              <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded">
                via {loginMethod === 'google' ? 'Google' : loginMethod === 'shopify' ? 'Shopify' : 'Email'}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
      <main>
        <HeroSection />
        <ShopByCategorySection />
        <FeaturedCollectionSection />
        <BestSellerSection />
        <CraftsmanshipSection />
        <TestimonialSection />
        <OfferBannerSection />
        <FAQSection />
        <CTASection />
        <ContactSection />
      </main>
    </>
  );
}
