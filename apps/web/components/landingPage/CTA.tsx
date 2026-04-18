import { motion } from 'motion/react';
import { ArrowRight, Sprout } from 'lucide-react';

export default function CTA({ setView }: { setView: (view: 'home' | 'onboard') => void }) {
  return (
    <section className="relative z-10 py-32 px-6 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-slate-950 -z-20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950 pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-fuchsia-600/20 blur-[120px] rounded-full -z-10" />
      
      {/* Subtle Mandala Background */}
      <div className="absolute inset-0 pointer-events-none -z-10 flex items-center justify-center opacity-5 overflow-hidden">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
          className="w-[600px] h-[600px] rounded-full border border-white/20 flex items-center justify-center"
        >
          <div className="w-[400px] h-[400px] rounded-full border border-white/20 flex items-center justify-center">
            <div className="w-[200px] h-[200px] rounded-full border border-white/20" />
          </div>
          {[...Array(8)].map((_, i) => (
            <div 
              key={i} 
              className="absolute w-[200px] h-[200px] border border-white/20 rounded-full"
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
          className="w-20 h-20 p-2 mx-auto bg-fuchsia-500/20 rounded-full flex items-center justify-center mb-8 border border-fuchsia-500/30 shadow-[0_0_30px_rgba(236,72,153,0.3)]"
        >
          {/* <Sprout className="w-10 h-10 text-pink-400" /> */}
            <img
            src="/img/favicon.svg"
            alt="KalpTree Logo"
            className="h-full w-auto object-contain"
         
          />
        </motion.div>
        
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl md:text-6xl font-bold mb-6 tracking-tight"
        >
          Ready to Grow Your <br className="hidden md:block" /> Digital Identity?
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto"
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
            className="group relative inline-flex items-center gap-3 px-8 py-4 bg-white text-black font-semibold rounded-full overflow-hidden transition-shadow hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative z-10">Start Onboarding Now</span>
            <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
