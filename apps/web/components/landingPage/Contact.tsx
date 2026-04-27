"use client";

import { motion } from 'framer-motion';
import { Mail, MapPin, Send, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '@/components/providers/theme-provider';

export default function Contact() {
  const [formState, setFormState] = useState<'idle' | 'submitting' | 'success'>('idle');
  const { themeMode } = useTheme();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormState('submitting');
    // Simulate API call
    setTimeout(() => {
      setFormState('success');
      setTimeout(() => setFormState('idle'), 3000);
    }, 1500);
  };

  return (
    <div className={`min-h-screen pt-24 pb-20 px-6 relative z-10 overflow-hidden transition-colors duration-500 ${
      themeMode === 'light' ? 'bg-white' : 'bg-slate-950'
    }`}>
      {/* Background Effects */}
      <div className={`absolute inset-0 -z-20 transition-colors duration-500 ${
        themeMode === 'light' ? 'bg-slate-50' : 'bg-slate-950'
      }`} />
      
      <div className={`absolute top-0 right-0 w-full h-full -z-10 transition-opacity duration-500 ${
        themeMode === 'light' 
          ? 'bg-[radial-gradient(ellipse_at_top_left,_rgba(99,102,241,0.05)_0%,_transparent_70%)]' 
          : 'bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-fuchsia-900/20 via-slate-950 to-slate-950'
      }`} />
      
      <div className={`absolute bottom-0 right-0 w-full h-1/2 -z-10 transition-opacity duration-500 ${
        themeMode === 'light' ? 'bg-[linear-gradient(to_top,rgba(99,102,241,0.03),transparent)]' : 'bg-[linear-gradient(to_top,rgba(59,130,246,0.05),transparent)]'
      }`} />

      {/* Subtle Mandala Background */}
      <div className={`absolute inset-0 pointer-events-none -z-10 flex items-center justify-center overflow-hidden transition-opacity duration-500 ${
        themeMode === 'light' ? 'opacity-[0.03]' : 'opacity-5'
      }`}>
        <motion.div 
          animate={{ rotate: -360 }} 
          transition={{ duration: 250, repeat: Infinity, ease: "linear" }}
          className={`w-[1800px] h-[1800px] rounded-full border flex items-center justify-center ${
            themeMode === 'light' ? 'border-indigo-500' : 'border-white/20'
          }`}
        >
          <div className={`w-[1400px] h-[1400px] rounded-full border flex items-center justify-center ${
            themeMode === 'light' ? 'border-indigo-500' : 'border-white/20'
          }`}>
            <div className={`w-[1000px] h-[1000px] rounded-full border flex items-center justify-center ${
              themeMode === 'light' ? 'border-indigo-500' : 'border-white/20'
            }`}>
              <div className={`w-[600px] h-[600px] rounded-full border ${
                themeMode === 'light' ? 'border-indigo-500' : 'border-white/20'
              }`} />
            </div>
          </div>
          {[...Array(40)].map((_, i) => (
            <div 
              key={i} 
              className={`absolute w-[1000px] h-[1000px] border rounded-full ${
                themeMode === 'light' ? 'border-indigo-500' : 'border-white/20'
              }`}
              style={{ transform: `rotate(${i * 9}deg) translateX(400px)` }}
            />
          ))}
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-24">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className={`text-4xl md:text-7xl font-black tracking-tighter mb-8 transition-colors ${
              themeMode === 'light' ? 'text-slate-900' : 'text-white'
            }`}
          >
            Connect with the <span className={themeMode === 'light' ? 'text-indigo-600' : 'text-pink-400'}>Roots</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className={`text-xl max-w-2xl mx-auto leading-relaxed transition-colors ${
              themeMode === 'light' ? 'text-slate-600' : 'text-gray-400'
            }`}
          >
            {"Whether you're an agency looking to scale or a business ready for a digital transformation, we're here to help you grow."}
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-5 gap-12 items-start">
          {/* Contact Info Cards */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className={`p-10 rounded-[2.5rem] border relative overflow-hidden group transition-all ${
                themeMode === 'light' 
                  ? 'bg-white border-slate-200 shadow-xl shadow-indigo-500/5' 
                  : 'bg-gradient-to-br from-indigo-900/20 to-black border-white/10'
              }`}
            >
              <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full blur-2xl transition-colors duration-500 ${
                themeMode === 'light' ? 'bg-indigo-500/5' : 'bg-fuchsia-500/10'
              }`} />
              <Mail className={`w-10 h-10 mb-8 relative z-10 transition-colors ${
                themeMode === 'light' ? 'text-indigo-600' : 'text-pink-400'
              }`} />
              <h3 className={`text-2xl font-bold mb-4 relative z-10 transition-colors ${
                themeMode === 'light' ? 'text-slate-900' : 'text-white'
              }`}>Email Us</h3>
              <p className={`mb-6 relative z-10 leading-relaxed transition-colors ${
                themeMode === 'light' ? 'text-slate-600' : 'text-gray-400'
              }`}>For general inquiries and partnerships.</p>
              <a href="mailto:hello@kalptree.xyz" className={`text-lg font-bold hover:underline transition-colors relative z-10 ${
                themeMode === 'light' ? 'text-indigo-600' : 'text-blue-400'
              }`}>hello@kalptree.xyz</a>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className={`p-10 rounded-[2.5rem] border relative overflow-hidden group transition-all ${
                themeMode === 'light' 
                  ? 'bg-white border-slate-200 shadow-xl shadow-indigo-500/5' 
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <MapPin className={`w-10 h-10 mb-8 relative z-10 transition-colors ${
                themeMode === 'light' ? 'text-indigo-600' : 'text-pink-400'
              }`} />
              <h3 className={`text-2xl font-bold mb-4 relative z-10 transition-colors ${
                themeMode === 'light' ? 'text-slate-900' : 'text-white'
              }`}>Global Headquarters</h3>
              <p className={`leading-relaxed transition-colors ${
                themeMode === 'light' ? 'text-slate-600' : 'text-gray-400'
              }`}>
                Innovation Hub, Tech District<br />
                San Francisco, CA 94105
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className={`p-10 rounded-[2.5rem] border relative overflow-hidden group transition-all ${
                themeMode === 'light' 
                  ? 'bg-white border-slate-200 shadow-xl shadow-indigo-500/5' 
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <MessageSquare className={`w-10 h-10 mb-8 relative z-10 transition-colors ${
                themeMode === 'light' ? 'text-indigo-600' : 'text-pink-400'
              }`} />
              <h3 className={`text-2xl font-bold mb-4 relative z-10 transition-colors ${
                themeMode === 'light' ? 'text-slate-900' : 'text-white'
              }`}>Support</h3>
              <p className={`mb-6 relative z-10 leading-relaxed transition-colors ${
                themeMode === 'light' ? 'text-slate-600' : 'text-gray-400'
              }`}>Current clients can access 24/7 priority support via the Agency Hub.</p>
              <button className={`font-bold hover:underline transition-colors relative z-10 ${
                themeMode === 'light' ? 'text-indigo-600' : 'text-blue-400'
              }`}>Go to Support Portal &rarr;</button>
            </motion.div>
          </div>

          {/* Contact Form */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className={`lg:col-span-3 p-10 md:p-14 rounded-[2.5rem] border backdrop-blur-md relative overflow-hidden transition-all ${
              themeMode === 'light' 
                ? 'bg-white border-slate-200 shadow-2xl shadow-indigo-500/5' 
                : 'bg-slate-950/50 border-white/10'
            }`}
          >
            {/* Subtle Mandala Background */}
            <div className={`absolute top-0 right-0 w-[500px] h-[500px] rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none transition-colors ${
              themeMode === 'light' ? 'bg-indigo-500/5' : 'bg-indigo-900/10'
            }`} />

            <h2 className={`text-3xl md:text-5xl font-black tracking-tighter mb-10 relative z-10 transition-colors ${
              themeMode === 'light' ? 'text-slate-900' : 'text-white'
            }`}>Send a Message</h2>
            
            <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className={`text-sm font-bold uppercase tracking-widest transition-colors ${
                    themeMode === 'light' ? 'text-slate-500' : 'text-gray-300'
                  }`}>First Name</label>
                  <input required type="text" className={`w-full border rounded-2xl px-6 py-4 transition-all focus:outline-none focus:ring-2 ${
                    themeMode === 'light' 
                      ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500/20' 
                      : 'bg-white/5 border-white/10 text-white focus:border-fuchsia-500 focus:ring-fuchsia-500/20'
                  }`} placeholder="John" />
                </div>
                <div className="space-y-3">
                  <label className={`text-sm font-bold uppercase tracking-widest transition-colors ${
                    themeMode === 'light' ? 'text-slate-500' : 'text-gray-300'
                  }`}>Last Name</label>
                  <input required type="text" className={`w-full border rounded-2xl px-6 py-4 transition-all focus:outline-none focus:ring-2 ${
                    themeMode === 'light' 
                      ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500/20' 
                      : 'bg-white/5 border-white/10 text-white focus:border-fuchsia-500 focus:ring-fuchsia-500/20'
                  }`} placeholder="Doe" />
                </div>
              </div>

              <div className="space-y-3">
                <label className={`text-sm font-bold uppercase tracking-widest transition-colors ${
                  themeMode === 'light' ? 'text-slate-500' : 'text-gray-300'
                }`}>Work Email</label>
                <input required type="email" className={`w-full border rounded-2xl px-6 py-4 transition-all focus:outline-none focus:ring-2 ${
                  themeMode === 'light' 
                    ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500/20' 
                    : 'bg-white/5 border-white/10 text-white focus:border-fuchsia-500 focus:ring-fuchsia-500/20'
                }`} placeholder="john@company.com" />
              </div>

              <div className="space-y-3">
                <label className={`text-sm font-bold uppercase tracking-widest transition-colors ${
                  themeMode === 'light' ? 'text-slate-500' : 'text-gray-300'
                }`}>Subject</label>
                <div className="relative">
                  <select className={`w-full border rounded-2xl px-6 py-4 appearance-none transition-all focus:outline-none focus:ring-2 ${
                    themeMode === 'light' 
                      ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500/20' 
                      : 'bg-white/5 border-white/10 text-white focus:border-fuchsia-500 focus:ring-fuchsia-500/20'
                  }`}>
                    <option value="" className={themeMode === 'light' ? 'bg-white' : 'bg-slate-900'}>Select a topic</option>
                    <option value="agency" className={themeMode === 'light' ? 'bg-white' : 'bg-slate-900'}>Agency Partnership</option>
                    <option value="business" className={themeMode === 'light' ? 'bg-white' : 'bg-slate-900'}>Business Website Development</option>
                    <option value="demo" className={themeMode === 'light' ? 'bg-white' : 'bg-slate-900'}>Request a Demo</option>
                    <option value="other" className={themeMode === 'light' ? 'bg-white' : 'bg-slate-900'}>Other Inquiry</option>
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className={`text-sm font-bold uppercase tracking-widest transition-colors ${
                  themeMode === 'light' ? 'text-slate-500' : 'text-gray-300'
                }`}>Message</label>
                <textarea required rows={5} className={`w-full border rounded-2xl px-6 py-4 transition-all focus:outline-none focus:ring-2 resize-none ${
                  themeMode === 'light' 
                    ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500/20' 
                    : 'bg-white/5 border-white/10 text-white focus:border-fuchsia-500 focus:ring-fuchsia-500/20'
                }`} placeholder="How can we help you grow?"></textarea>
              </div>

              <button 
                disabled={formState !== 'idle'}
                type="submit" 
                className={`w-full py-5 font-bold rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl ${
                  themeMode === 'light'
                    ? 'bg-indigo-600 text-white shadow-indigo-500/25 hover:bg-indigo-700'
                    : 'bg-fuchsia-500 hover:bg-pink-400 text-black shadow-fuchsia-500/30'
                } disabled:opacity-50`}
              >
                {formState === 'idle' && <><Send className="w-5 h-5" /> Send Message</>}
                {formState === 'submitting' && <span className="animate-pulse">Sending...</span>}
                {formState === 'success' && <span>Message Sent Successfully!</span>}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
