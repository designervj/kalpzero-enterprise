import { motion } from 'framer-motion';
import { useTheme } from '@/components/providers/theme-provider';

export default function Footer() {
  const { themeMode } = useTheme();

  return (
    <footer className={`relative z-10 py-16 px-6 border-t overflow-hidden transition-colors duration-500 ${
      themeMode === 'light' ? 'border-slate-200 bg-white' : 'border-white/10 bg-slate-950'
    }`}>
      {/* Subtle background effect */}
      <div className={`absolute inset-0 -z-10 transition-opacity duration-500 ${
        themeMode === 'light' 
          ? 'bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:14px_24px] opacity-100' 
          : 'bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_24px] opacity-100'
      }`} />
      
      <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 transition-opacity duration-500 ${
        themeMode === 'light' 
          ? 'bg-[radial-gradient(ellipse_at_bottom,_rgba(99,102,241,0.05)_0%,_transparent_70%)]' 
          : 'bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-fuchsia-900/5 via-transparent to-transparent'
      }`} />

      {/* Subtle Mandala Background */}
      <div className={`absolute inset-0 pointer-events-none -z-10 flex items-center justify-center overflow-hidden transition-opacity duration-500 ${
        themeMode === 'light' ? 'opacity-[0.03]' : 'opacity-5'
      }`}>
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
          className={`w-[800px] h-[800px] rounded-full border flex items-center justify-center translate-y-1/2 ${
            themeMode === 'light' ? 'border-indigo-500' : 'border-white/20'
          }`}
        >
          <div className={`w-[600px] h-[600px] rounded-full border flex items-center justify-center ${
            themeMode === 'light' ? 'border-indigo-500' : 'border-white/20'
          }`}>
            <div className={`w-[400px] h-[400px] rounded-full border flex items-center justify-center ${
              themeMode === 'light' ? 'border-indigo-500' : 'border-white/20'
            }`}>
              <div className={`w-[200px] h-[200px] rounded-full border ${
                themeMode === 'light' ? 'border-indigo-500' : 'border-white/20'
              }`} />
            </div>
          </div>
          {[...Array(12)].map((_, i) => (
            <div 
              key={i} 
              className={`absolute w-[400px] h-[400px] border rounded-full ${
                themeMode === 'light' ? 'border-indigo-500' : 'border-white/20'
              }`}
              style={{ transform: `rotate(${i * 30}deg) translateX(200px)` }}
            />
          ))}
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-center gap-8 relative z-10">
        {/* <div className="flex items-center gap-4">
          <img src="/img/favicon.svg" alt="KalpTree Logo" className="w-12 h-12 grayscale opacity-50" />
          <span className={`text-xl font-black tracking-tighter transition-colors ${
            themeMode === 'light' ? 'text-slate-900' : 'text-gray-400'
          }`}>KalpTree OS</span>
        </div> */}
        <div className={`text-sm font-medium text-center transition-colors ${
          themeMode === 'light' ? 'text-slate-400' : 'text-gray-600'
        }`}>
          &copy; {new Date().getFullYear()} KalpTree. All rights reserved. Built for infinite growth.
        </div>
      </div>
    </footer>
  );
}
