import { useTheme } from '@/components/providers/theme-provider';
import { motion } from 'framer-motion';
import BokehBackground from './BokehBackground';
import { ChevronRight, Code2 } from 'lucide-react';

export default function Hero({ setView }: { setView: (view: 'home' | 'onboard') => void }) {
  const { themeMode } = useTheme();

  return (
    <section className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center pt-20">
      <div className="absolute inset-0 -z-10">
        <BokehBackground />
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className={`inline-flex items-center gap-2 px-4 py-1.5 mb-8 text-xs font-medium border rounded-full ${
          themeMode === 'light'
            ? 'border-indigo-200 bg-indigo-50 text-indigo-600'
            : 'border-fuchsia-500/30 bg-fuchsia-500/10 text-blue-400'
        }`}
      >
        <span className={`flex w-2 h-2 rounded-full animate-pulse ${themeMode === 'light' ? 'bg-indigo-500' : 'bg-fuchsia-500'}`}></span>
        Custom React Development Powered by KalpTree OS
      </motion.div>
      
      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className={`max-w-5xl text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b ${
          themeMode === 'light'
            ? 'from-slate-900 to-slate-500'
            : 'from-white to-gray-400'
        }`}
      >
        Plant the Seed of <br className="hidden md:block" /> Your Digital Future
      </motion.h1>
      
      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className={`max-w-2xl mt-8 text-lg md:text-xl leading-relaxed ${
          themeMode === 'light' ? 'text-slate-600' : 'text-gray-400'
        }`}
      >
        We build your high-performance React website, seamlessly integrated with our Enterprise Agency Operating System. E-commerce, AI Content, and Client Management—delivered.
      </motion.p>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="flex flex-col sm:flex-row items-center gap-4 mt-12"
      >
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setView('onboard')}
          className={`flex items-center gap-2 px-8 py-4 text-sm font-bold text-white transition-all rounded-full shadow-lg ${
            themeMode === 'light'
              ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-indigo-500/25'
              : 'bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-400 hover:to-blue-400 shadow-fuchsia-500/25'
          }`}
        >
          Onboard Your Business <ChevronRight className="w-4 h-4" />
        </motion.button>
        <motion.a 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          href="#architecture" 
          className={`flex items-center gap-2 px-8 py-4 text-sm font-semibold transition-colors border rounded-full ${
            themeMode === 'light'
              ? 'border-slate-200 text-slate-700 hover:bg-slate-50'
              : 'border-white/20 text-white hover:bg-white/5'
          }`}
        >
          <Code2 className="w-4 h-4" /> Explore the Tech
        </motion.a>
      </motion.div>
    </section>
  );
}
