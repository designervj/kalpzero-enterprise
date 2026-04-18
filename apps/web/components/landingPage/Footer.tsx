import { motion } from 'motion/react';

export default function Footer() {
  return (
    <footer className="relative z-10 py-12 px-6 border-t border-white/10 bg-slate-950 overflow-hidden">
      {/* Subtle background effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_24px] -z-10" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-fuchsia-900/5 via-transparent to-transparent -z-10" />

      {/* Subtle Mandala Background */}
      <div className="absolute inset-0 pointer-events-none -z-10 flex items-center justify-center opacity-5 overflow-hidden">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
          className="w-[800px] h-[800px] rounded-full border border-white/20 flex items-center justify-center translate-y-1/2"
        >
          <div className="w-[600px] h-[600px] rounded-full border border-white/20 flex items-center justify-center">
            <div className="w-[400px] h-[400px] rounded-full border border-white/20 flex items-center justify-center">
              <div className="w-[200px] h-[200px] rounded-full border border-white/20" />
            </div>
          </div>
          {[...Array(12)].map((_, i) => (
            <div 
              key={i} 
              className="absolute w-[400px] h-[400px] border border-white/20 rounded-full"
              style={{ transform: `rotate(${i * 30}deg) translateX(200px)` }}
            />
          ))}
        </motion.div>
      </div>

      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
        <div className="flex items-center gap-3">
          <img src="/img/favicon.svg" alt="KalpTree Logo" className="w-10 h-10 opacity-50" />
          <span className="text-gray-500 font-medium tracking-tight">KalpTree OS</span>
        </div>
        <div className="text-gray-600 text-sm">
          &copy; {new Date().getFullYear()} KalpTree. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
