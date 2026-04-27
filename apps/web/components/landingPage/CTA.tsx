import { motion } from 'framer-motion';
import { ArrowRight, Sprout } from 'lucide-react';
import { useTheme } from '@/components/providers/theme-provider';

export default function CTA({ setView }: { setView: (view: 'home' | 'onboard') => void }) {
  const { themeMode } = useTheme();

  return (
    <section className={`relative z-10 py-32 px-6 overflow-hidden transition-colors duration-500 ${
      themeMode === 'light' ? 'bg-white' : 'bg-slate-950'
    }`}>
      {/* Background Glow */}
      <div className={`absolute inset-0 -z-20 transition-colors duration-500 ${
        themeMode === 'light' ? 'bg-slate-50' : 'bg-slate-950'
      }`} />
      
      <div className={`absolute inset-0 pointer-events-none -z-10 transition-opacity duration-500 ${
        themeMode === 'light'
          ? 'bg-[radial-gradient(circle_at_bottom,_rgba(99,102,241,0.08)_0%,_transparent_70%)]'
          : 'bg-[radial-gradient(circle_at_bottom,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950'
      }`} />
      
      <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] blur-[120px] rounded-full -z-10 transition-colors duration-500 ${
        themeMode === 'light' ? 'bg-indigo-200/50' : 'bg-fuchsia-600/20'
      }`} />
      
      {/* Subtle Mandala Background */}
      <div className={`absolute inset-0 pointer-events-none -z-10 flex items-center justify-center overflow-hidden transition-opacity duration-500 ${
        themeMode === 'light' ? 'opacity-[0.03]' : 'opacity-5'
      }`}>
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
          className={`w-[600px] h-[600px] rounded-full border flex items-center justify-center ${
            themeMode === 'light' ? 'border-indigo-500' : 'border-white/20'
          }`}
        >
          <div className={`w-[400px] h-[400px] rounded-full border flex items-center justify-center ${
            themeMode === 'light' ? 'border-indigo-500' : 'border-white/20'
          }`}>
            <div className={`w-[200px] h-[200px] rounded-full border ${
              themeMode === 'light' ? 'border-indigo-500' : 'border-white/20'
            }`} />
          </div>
          {[...Array(8)].map((_, i) => (
            <div 
              key={i} 
              className={`absolute w-[200px] h-[200px] border rounded-full ${
                themeMode === 'light' ? 'border-indigo-500' : 'border-white/20'
              }`}
              style={{ transform: `rotate(${i * 45}deg) translateX(100px)` }}
            />
          ))}
        </motion.div>
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, type: "spring" }}
          className={`w-24 h-24 p-3 mx-auto rounded-full flex items-center justify-center mb-10 border transition-all ${
            themeMode === 'light'
              ? 'bg-white border-indigo-200 shadow-xl shadow-indigo-500/10'
              : 'bg-fuchsia-500/20 border-fuchsia-500/30 shadow-[0_0_30px_rgba(236,72,153,0.3)]'
          }`}
        >
          <img
            src="/img/img.svg"
            alt="KalpTree Logo"
            className="h-full w-auto object-contain relative z-10"
          />
        </motion.div>
        
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={`text-4xl md:text-7xl font-bold mb-8 tracking-tighter transition-colors ${
            themeMode === 'light' ? 'text-slate-900' : 'text-white'
          }`}
        >
          Ready to Grow Your <br className="hidden md:block" /> Digital Identity?
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className={`text-xl mb-12 max-w-2xl mx-auto leading-relaxed transition-colors ${
            themeMode === 'light' ? 'text-slate-600' : 'text-gray-400'
          }`}
        >
          Join KalpTree today. Let us build your custom React platform powered by our enterprise-grade backend OS.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setView('onboard')}
            className={`group relative inline-flex items-center gap-3 px-10 py-5 font-bold rounded-full overflow-hidden transition-all shadow-xl ${
              themeMode === 'light'
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-indigo-500/25 hover:from-indigo-500 hover:to-blue-500'
                : 'bg-white text-black hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]'
            }`}
          >
            <div className={`absolute inset-0 bg-gradient-to-r from-pink-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity ${
              themeMode === 'light' ? 'hidden' : ''
            }`} />
            <span className="relative z-10">Start Onboarding Now</span>
            <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
