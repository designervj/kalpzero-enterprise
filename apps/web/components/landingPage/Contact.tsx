"use client";

import { motion } from 'motion/react';
import { Mail, MapPin, Send, MessageSquare } from 'lucide-react';
import { useState } from 'react';

export default function Contact() {
  const [formState, setFormState] = useState<'idle' | 'submitting' | 'success'>('idle');

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
    <div className="min-h-screen pt-24 pb-20 px-6 relative z-10 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-slate-950 -z-20" />
      <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-fuchsia-900/20 via-slate-950 to-slate-950 -z-10" />
      <div className="absolute bottom-0 right-0 w-full h-1/2 bg-[linear-gradient(to_top,rgba(59,130,246,0.05),transparent)] -z-10" />

      {/* Subtle Mandala Background */}
      <div className="absolute inset-0 pointer-events-none -z-10 flex items-center justify-center opacity-5 overflow-hidden">
        <motion.div 
          animate={{ rotate: -360 }} 
          transition={{ duration: 250, repeat: Infinity, ease: "linear" }}
          className="w-[1800px] h-[1800px] rounded-full border border-white/20 flex items-center justify-center"
        >
          <div className="w-[1400px] h-[1400px] rounded-full border border-white/20 flex items-center justify-center">
            <div className="w-[1000px] h-[1000px] rounded-full border border-white/20 flex items-center justify-center">
              <div className="w-[600px] h-[600px] rounded-full border border-white/20" />
            </div>
          </div>
          {[...Array(40)].map((_, i) => (
            <div 
              key={i} 
              className="absolute w-[1000px] h-[1000px] border border-white/20 rounded-full"
              style={{ transform: `rotate(${i * 9}deg) translateX(400px)` }}
            />
          ))}
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        <div className="text-center mb-20">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-6xl font-bold tracking-tight mb-6"
          >
            Connect with the <span className="text-pink-400">Roots</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-xl text-gray-400 max-w-2xl mx-auto"
          >
            {"Whether you're an agency looking to scale or a business ready for a digital transformation, we're here to help you grow."}
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-5 gap-12 items-start">
          
          {/* Contact Info Cards */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="p-8 rounded-3xl bg-gradient-to-br from-indigo-900/20 to-black border border-white/10 relative overflow-hidden group"
            >
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-fuchsia-500/10 rounded-full blur-2xl group-hover:bg-pink-400/20 transition-colors duration-500" />
              <Mail className="w-8 h-8 text-pink-400 mb-6 relative z-10" />
              <h3 className="text-xl font-bold mb-2 relative z-10">Email Us</h3>
              <p className="text-gray-400 mb-4 relative z-10">For general inquiries and partnerships.</p>
              <a href="mailto:hello@kalptree.xyz" className="text-blue-400 font-medium hover:text-blue-300 transition-colors relative z-10">hello@kalptree.xyz</a>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="p-8 rounded-3xl bg-white/5 border border-white/10 relative overflow-hidden group hover:bg-white/10 transition-colors"
            >
              <MapPin className="w-8 h-8 text-pink-400 mb-6 relative z-10" />
              <h3 className="text-xl font-bold mb-2 relative z-10">Global Headquarters</h3>
              <p className="text-gray-400 relative z-10">
                Innovation Hub, Tech District<br />
                San Francisco, CA 94105
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="p-8 rounded-3xl bg-white/5 border border-white/10 relative overflow-hidden group hover:bg-white/10 transition-colors"
            >
              <MessageSquare className="w-8 h-8 text-pink-400 mb-6 relative z-10" />
              <h3 className="text-xl font-bold mb-2 relative z-10">Support</h3>
              <p className="text-gray-400 mb-4 relative z-10">Current clients can access 24/7 priority support via the Agency Hub.</p>
              <button className="text-blue-400 font-medium hover:text-blue-300 transition-colors relative z-10">Go to Support Portal &rarr;</button>
            </motion.div>
          </div>

          {/* Contact Form */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="lg:col-span-3 p-8 md:p-12 rounded-3xl bg-slate-950/50 border border-white/10 backdrop-blur-md relative overflow-hidden"
          >
            {/* Subtle Mandala Background */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/10 to-transparent rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />

            <h2 className="text-3xl font-bold mb-8 relative z-10">Send a Message</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">First Name</label>
                  <input required type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-all" placeholder="John" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Last Name</label>
                  <input required type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-all" placeholder="Doe" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Work Email</label>
                <input required type="email" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-all" placeholder="john@company.com" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Subject</label>
                <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-all appearance-none">
                  <option value="" className="bg-gray-900">Select a topic</option>
                  <option value="agency" className="bg-gray-900">Agency Partnership</option>
                  <option value="business" className="bg-gray-900">Business Website Development</option>
                  <option value="demo" className="bg-gray-900">Request a Demo</option>
                  <option value="other" className="bg-gray-900">Other Inquiry</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Message</label>
                <textarea required rows={5} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition-all resize-none" placeholder="How can we help you grow?"></textarea>
              </div>

              <button 
                disabled={formState !== 'idle'}
                type="submit" 
                className="w-full py-4 bg-fuchsia-500 hover:bg-pink-400 disabled:bg-fuchsia-500/50 text-black font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
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
