import { motion } from 'framer-motion';
import { Hexagon } from 'lucide-react';
import { useTheme } from '@/components/providers/theme-provider';

const brands = [
  "Nestcraft Living",
  "Surya Mahal",
  "Codified Web",
  "Ethical Solar",
  "Aura Dynamics",
  "Zenith Retail",
  "Lumina Tech",
  "Vertex Solutions"
];

export default function Brands() {
  const { themeMode } = useTheme();

  return (
    <section className={`relative z-10 py-24 px-6 overflow-hidden border-y transition-colors duration-500 ${
      themeMode === 'light' 
        ? 'border-slate-100 bg-white' 
        : 'border-white/5 bg-slate-950/20 backdrop-blur-sm'
    }`}>
      {/* Background Effects */}
      <div className={`absolute inset-0 -z-20 transition-colors duration-500 ${
        themeMode === 'light' ? 'bg-slate-50' : 'bg-slate-950'
      }`} />
      
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10 transition-opacity duration-500 ${
        themeMode === 'light' 
          ? 'bg-[radial-gradient(ellipse_at_center,_rgba(99,102,241,0.05)_0%,_transparent_70%)]' 
          : 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-fuchsia-900/10 via-slate-950 to-slate-950'
      }`} />

      {/* Subtle Mandala Background */}
      <div className={`absolute inset-0 pointer-events-none -z-10 flex items-center justify-center overflow-hidden transition-opacity duration-500 ${
        themeMode === 'light' ? 'opacity-[0.03]' : 'opacity-5'
      }`}>
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
          className={`w-[800px] h-[800px] rounded-full border flex items-center justify-center ${
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

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`text-sm font-bold uppercase tracking-widest ${
              themeMode === 'light' ? 'text-indigo-600' : 'text-pink-400'
            }`}
          >
            The Roots of Our Ecosystem
          </motion.p>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className={`text-2xl md:text-4xl font-bold mt-4 tracking-tight ${
              themeMode === 'light' ? 'text-slate-900' : 'text-gray-300'
            }`}
          >
            Empowering growth for visionary brands
          </motion.h2>
        </div>

        <div className="relative flex overflow-x-hidden group">
          {/* Gradient Masks for smooth fade on edges */}
          <div className={`absolute top-0 bottom-0 left-0 w-48 z-10 transition-colors duration-500 ${
            themeMode === 'light' 
              ? 'bg-gradient-to-r from-white to-transparent' 
              : 'bg-gradient-to-r from-slate-950 to-transparent'
          }`} />
          <div className={`absolute top-0 bottom-0 right-0 w-48 z-10 transition-colors duration-500 ${
            themeMode === 'light' 
              ? 'bg-gradient-to-l from-white to-transparent' 
              : 'bg-gradient-to-l from-slate-950 to-transparent'
          }`} />

          <motion.div
            className="flex space-x-16 items-center whitespace-nowrap py-8"
            animate={{ x: ["0%", "-50%"] }}
            transition={{
              duration: 30,
              ease: "linear",
              repeat: Infinity,
            }}
          >
            {/* Duplicate the array to create a seamless loop */}
            {[...brands, ...brands].map((brand, index) => (
              <div key={index} className="flex items-center gap-4 group/brand cursor-pointer">
                <Hexagon className={`w-6 h-6 transition-colors ${
                  themeMode === 'light' ? 'text-indigo-500' : 'text-fuchsia-500'
                }`} />
                <span className={`text-2xl font-bold tracking-tight transition-colors ${
                  themeMode === 'light' 
                    ? 'text-slate-400 group-hover/brand:text-slate-900' 
                    : 'text-gray-500 group-hover/brand:text-white'
                }`}>{brand}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
