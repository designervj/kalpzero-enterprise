import { motion } from 'motion/react';
import { Quote, Star } from 'lucide-react';

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
  return (
    <section className="relative z-10 py-32 px-6 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-slate-950 -z-20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-900/10 via-slate-950 to-slate-950 pointer-events-none -z-10" />
      <div className="absolute top-1/2 left-0 w-64 h-64 bg-fuchsia-600/10 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] -z-10" />
      
      {/* Subtle Mandala Background */}
      <div className="absolute inset-0 pointer-events-none -z-10 flex items-center justify-center opacity-5 overflow-hidden">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
          className="w-[1200px] h-[1200px] rounded-full border border-white/20 flex items-center justify-center"
        >
          <div className="w-[1000px] h-[1000px] rounded-full border border-white/20 flex items-center justify-center">
            <div className="w-[800px] h-[800px] rounded-full border border-white/20 flex items-center justify-center">
              <div className="w-[600px] h-[600px] rounded-full border border-white/20" />
            </div>
          </div>
          {[...Array(24)].map((_, i) => (
            <div 
              key={i} 
              className="absolute w-[600px] h-[600px] border border-white/20 rounded-full"
              style={{ transform: `rotate(${i * 15}deg) translateX(300px)` }}
            />
          ))}
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold tracking-tight mb-6"
          >
            Fruits of Our <span className="text-pink-400">Ecosystem</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 text-lg max-w-2xl mx-auto"
          >
            Hear from the businesses that have rooted their digital presence in KalpTree and watched their success bloom.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: t.delay }}
              className="relative p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group overflow-hidden"
            >
              {/* Mandala/Tree Ring Hover Effect */}
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-fuchsia-500/10 rounded-full blur-2xl group-hover:bg-pink-400/20 transition-colors duration-500" />
              <div className="absolute -right-20 -top-20 w-60 h-60 border border-fuchsia-500/10 rounded-full group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute -right-32 -top-32 w-80 h-80 border border-fuchsia-500/5 rounded-full group-hover:scale-110 transition-transform duration-1000" />

              <Quote className="w-10 h-10 text-fuchsia-500/40 mb-6 relative z-10" />
              
              <div className="flex gap-1 mb-6 relative z-10">
                {[...Array(5)].map((_, idx) => (
                  <Star key={idx} className="w-4 h-4 fill-pink-400 text-pink-400" />
                ))}
              </div>
              
              <p className="text-gray-300 text-lg leading-relaxed mb-8 relative z-10">
                "{t.quote}"
              </p>
              
              <div className="relative z-10">
                <h4 className="font-bold text-white">{t.author}</h4>
                <p className="text-sm text-pink-400">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
