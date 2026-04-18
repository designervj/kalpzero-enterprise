"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Navbar from "./Navbar";
import Hero from "./Hero";
import Brands from "./Brands";
import Concept from "./Concept";
import Features from "./Features";
import Testimonials from "./Testimonials";
import Architecture from "./Architecture";
import CTA from "./CTA";
import Footer from "./Footer";
import Onboarding from "./Onboarding";
import Portfolio from "./Portfolio";
import Products from "./Products";
import About from "./About";
import Contact from "./Contact";

type ViewState = 'home' | 'onboard' | 'portfolio' | 'products' | 'about' | 'contact';

export default function PublicHomeClient() {
  const [view, setView] = useState<ViewState>('home');

  return (
    <div className="relative w-full overflow-x-hidden">
      <Navbar setView={setView} currentView={view} />
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 15, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -15, filter: 'blur(4px)' }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="relative z-10"
        >
          {view === 'home' && (
            <>
              <Hero setView={setView} />
              <Brands />
              <Concept />
              <Features />
              <Testimonials />
              <Architecture />
              <CTA setView={setView} />
              <Footer />
            </>
          )}
          
          {view === 'onboard' && <Onboarding setView={setView} />}
          
          {view === 'portfolio' && <Portfolio setView={setView} />}
          
          {view === 'products' && <Products setView={setView} />}

          {view === 'about' && <About />}

          {view === 'contact' && <Contact />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
