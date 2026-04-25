"use client";

import Link from 'next/link';
import { motion } from 'motion/react';
import { Leaf, Menu, X } from 'lucide-react';
import { useState } from 'react';

type ViewState = 'home' | 'onboard' | 'portfolio' | 'products' | 'about' | 'contact';

interface NavbarProps {
  setView: (view: ViewState) => void;
  currentView: ViewState;
}

const navItems: { id: ViewState, label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'products', label: 'Modules' },
  { id: 'portfolio', label: 'Showcase' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
];

export default function Navbar({ setView, currentView }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const handleNav = (view: ViewState) => {
    setView(view);
    setIsOpen(false);
  };

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-50 px-6 py-3 backdrop-blur-md border-b border-white/10 bg-slate-950/10"
      // bg-fuchsia-500/20
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <button
          type="button"
          onClick={() => handleNav('home')}
          className="h-12 md:h-16 flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
        >
          <img
            src="/img/white-logo-kalptree.svg"
            alt="KalpTree Logo"
            className="h-full w-auto object-contain"
            onError={() => setLogoFailed(true)}
          />
        </button>
        
        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-gray-300">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`relative px-1 py-2 hover:text-pink-400 transition-colors ${currentView === item.id ? 'text-pink-400' : ''}`}
            >
              {item.label}
              {currentView === item.id && (
                <motion.div
                  layoutId="navbar-indicator"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-pink-400 rounded-full shadow-[0_0_8px_rgba(236,72,153,0.8)]"
                  transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
                />
              )}
            </button>
          ))}
          <Link
            href="/docs"
            className="relative px-1 py-2 text-gray-300 transition-colors hover:text-pink-400"
          >
            Docs
          </Link>
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:border-fuchsia-400/50 hover:bg-white/5"
            >
              Login
            </Link>
          </motion.div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleNav(currentView === 'onboard' ? 'home' : 'onboard')}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-blue-500 rounded-full hover:from-pink-400 hover:to-blue-400 transition-colors shadow-[0_0_15px_rgba(236,72,153,0.4)]"
          >
            {currentView === 'onboard' ? 'Back to Home' : <><Leaf className="w-4 h-4" /> Grow Your Business</>}
          </motion.button>
        </div>

        {/* Mobile Menu Toggle */}
        <button className="lg:hidden text-white" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Nav Dropdown */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="lg:hidden pt-4 pb-6 px-4 flex flex-col gap-4 bg-slate-950/90 border-t border-white/10 mt-4 rounded-2xl"
        >
          {navItems.map((item) => (
            <button 
              key={item.id} 
              onClick={() => handleNav(item.id)} 
              className={`text-left py-2 ${currentView === item.id ? 'text-pink-400 font-bold' : 'text-gray-300 hover:text-pink-400'}`}
            >
              {item.label}
            </button>
          ))}
          <Link
            href="/docs"
            className="text-left py-2 text-gray-300 hover:text-pink-400"
            onClick={() => setIsOpen(false)}
          >
            Docs
          </Link>
          <button 
            onClick={() => handleNav('onboard')}
            className="flex items-center justify-center gap-2 px-5 py-3 mt-2 text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-blue-500 rounded-full hover:from-pink-400 hover:to-blue-400"
          >
            <Leaf className="w-4 h-4" /> Grow Your Business
          </button>
          <Link
            href="/login"
            className="flex items-center justify-center rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-white transition-colors hover:border-fuchsia-400/50 hover:bg-white/5"
            onClick={() => setIsOpen(false)}
          >
            Login
          </Link>
        </motion.div>
      )}
    </motion.nav>
  );
}
