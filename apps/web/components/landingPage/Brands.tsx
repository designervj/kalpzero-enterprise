import { motion } from 'motion/react';
import { Hexagon } from 'lucide-react';

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
  return (
    <section className="relative z-10 py-20 px-6 overflow-hidden border-y border-white/5 bg-slate-950/20 backdrop-blur-sm">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-slate-950 -z-20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-fuchsia-900/10 via-slate-950 to-slate-950 -z-10" />

      {/* Subtle Mandala Background */}
      <div className="absolute inset-0 pointer-events-none -z-10 flex items-center justify-center opacity-5 overflow-hidden">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
          className="w-[800px] h-[800px] rounded-full border border-white/20 flex items-center justify-center"
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

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-sm font-medium text-pink-400 uppercase tracking-widest"
          >
            The Roots of Our Ecosystem
          </motion.p>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-2xl md:text-3xl font-bold text-gray-300 mt-2"
          >
            Empowering growth for visionary brands
          </motion.h2>
        </div>

        <div className="relative flex overflow-x-hidden group">
          {/* Gradient Masks for smooth fade on edges */}
          <div className="absolute top-0 bottom-0 left-0 w-32 z-10 bg-gradient-to-r from-black to-transparent" />
          <div className="absolute top-0 bottom-0 right-0 w-32 z-10 bg-gradient-to-l from-black to-transparent" />

          <motion.div
            className="flex space-x-12 items-center whitespace-nowrap py-4"
            animate={{ x: ["0%", "-50%"] }}
            transition={{
              duration: 20,
              ease: "linear",
              repeat: Infinity,
            }}
          >
            {/* Duplicate the array to create a seamless loop */}
            {[...brands, ...brands].map((brand, index) => (
              <div key={index} className="flex items-center gap-3 opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
                <Hexagon className="w-6 h-6 text-fuchsia-500" />
                <span className="text-xl font-semibold text-gray-400">{brand}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
