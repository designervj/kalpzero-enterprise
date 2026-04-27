import { motion } from 'framer-motion';
import { Quote, Star } from 'lucide-react';
import { useTheme } from '@/components/providers/theme-provider';

const testimonials = [
  {
    quote: "KalpTree didn't just build us a website; they planted a digital ecosystem. Our online sales grew by 150% in the first quarter.",
    author: "Sarah Jenkins",
    role: "Founder, Nestcraft Living",
    delay: 0.1
  },
  {
    quote: "The transition was seamless. The custom React frontend is blazingly fast, and the Kalp API backend handles our complex booking logic effortlessly.",
    author: "Rajesh Kumar",
    role: "Director, Surya Mahal",
    delay: 0.2
  },
  {
    quote: "As an agency, we needed a platform that could scale with our clients. KalpTree's multi-tenant architecture is the robust trunk we needed to branch out.",
    author: "Elena Rodriguez",
    role: "CEO, Codified Web Solutions",
    delay: 0.3
  }
];

export default function Testimonials() {
  const { themeMode } = useTheme();

  return (
    <section className={`relative z-10 py-32 px-6 overflow-hidden transition-colors duration-500 ${
      themeMode === 'light' ? 'bg-white' : 'bg-slate-950'
    }`}>
      {/* Background Effects */}
      <div className={`absolute inset-0 -z-20 transition-colors duration-500 ${
        themeMode === 'light' ? 'bg-slate-50' : 'bg-slate-950'
      }`} />
      
      <div className={`absolute inset-0 pointer-events-none -z-10 transition-opacity duration-500 ${
        themeMode === 'light'
          ? 'bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.05)_0%,_transparent_70%)]'
          : 'bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-900/10 via-slate-950 to-slate-950'
      }`} />
      
      <div className={`absolute top-1/2 left-0 w-64 h-64 rounded-full blur-[100px] -z-10 transition-colors duration-500 ${
        themeMode === 'light' ? 'bg-indigo-500/5' : 'bg-fuchsia-600/10'
      }`} />
      <div className={`absolute bottom-0 right-0 w-64 h-64 rounded-full blur-[100px] -z-10 transition-colors duration-500 ${
        themeMode === 'light' ? 'bg-blue-500/5' : 'bg-blue-600/10'
      }`} />
      
      {/* Subtle Mandala Background */}
      <div className={`absolute inset-0 pointer-events-none -z-10 flex items-center justify-center overflow-hidden transition-opacity duration-500 ${
        themeMode === 'light' ? 'opacity-[0.03]' : 'opacity-5'
      }`}>
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
          className={`w-[1200px] h-[1200px] rounded-full border flex items-center justify-center ${
            themeMode === 'light' ? 'border-indigo-500' : 'border-white/20'
          }`}
        >
          <div className={`w-[1000px] h-[1000px] rounded-full border flex items-center justify-center ${
            themeMode === 'light' ? 'border-indigo-500' : 'border-white/20'
          }`}>
            <div className={`w-[800px] h-[800px] rounded-full border flex items-center justify-center ${
              themeMode === 'light' ? 'border-indigo-500' : 'border-white/20'
            }`}>
              <div className={`w-[600px] h-[600px] rounded-full border ${
                themeMode === 'light' ? 'border-indigo-500' : 'border-white/20'
              }`} />
            </div>
          </div>
          {[...Array(24)].map((_, i) => (
            <div 
              key={i} 
              className={`absolute w-[600px] h-[600px] border rounded-full ${
                themeMode === 'light' ? 'border-indigo-500' : 'border-white/20'
              }`}
              style={{ transform: `rotate(${i * 15}deg) translateX(300px)` }}
            />
          ))}
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-24">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`text-4xl md:text-7xl font-black tracking-tighter mb-8 transition-colors ${
              themeMode === 'light' ? 'text-slate-900' : 'text-white'
            }`}
          >
            Fruits of Our <span className={themeMode === 'light' ? 'text-indigo-600' : 'text-pink-400'}>Ecosystem</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className={`text-xl max-w-2xl mx-auto leading-relaxed transition-colors ${
              themeMode === 'light' ? 'text-slate-600' : 'text-gray-400'
            }`}
          >
            Hear from the businesses that have rooted their digital presence in KalpTree and watched their success bloom.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-10">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: t.delay }}
              className={`relative p-10 rounded-[2.5rem] border transition-all group overflow-hidden ${
                themeMode === 'light' 
                  ? 'bg-white border-slate-200 hover:border-indigo-400 hover:shadow-2xl hover:shadow-indigo-500/10' 
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              {/* Mandala/Tree Ring Hover Effect */}
              <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full blur-2xl transition-colors duration-500 ${
                themeMode === 'light' ? 'bg-indigo-500/5' : 'bg-fuchsia-500/10'
              }`} />
              <div className={`absolute -right-20 -top-20 w-60 h-60 border rounded-full group-hover:scale-110 transition-all duration-700 ${
                themeMode === 'light' ? 'border-indigo-500/5' : 'border-fuchsia-500/10'
              }`} />

              <Quote className={`w-12 h-12 mb-8 relative z-10 transition-colors ${
                themeMode === 'light' ? 'text-indigo-500/20' : 'text-fuchsia-500/40'
              }`} />
              
              <div className="flex gap-1.5 mb-8 relative z-10">
                {[...Array(5)].map((_, idx) => (
                  <Star key={idx} className={`w-5 h-5 fill-current transition-colors ${
                    themeMode === 'light' ? 'text-indigo-500' : 'text-pink-400'
                  }`} />
                ))}
              </div>
              
              <p className={`text-lg leading-relaxed mb-10 relative z-10 transition-colors font-medium ${
                themeMode === 'light' ? 'text-slate-700' : 'text-gray-300'
              }`}>
                "{t.quote}"
              </p>
              
              <div className="relative z-10">
                <h4 className={`text-xl font-bold transition-colors ${
                  themeMode === 'light' ? 'text-slate-900' : 'text-white'
                }`}>{t.author}</h4>
                <p className={`font-bold transition-colors ${
                  themeMode === 'light' ? 'text-indigo-600' : 'text-pink-400'
                }`}>{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
