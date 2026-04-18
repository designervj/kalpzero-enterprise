import { motion } from 'motion/react';
import { Layers, Box, Code, ShoppingCart } from 'lucide-react';

const features = [
  {
    icon: <Layers className="w-6 h-6 text-pink-400" />,
    title: "Multi-Tier Hierarchy",
    description: "Platform provisions Agencies. Agencies brand their portal and provision Client Businesses. A true white-labeled B2B2B architecture."
  },
  {
    icon: <Box className="w-6 h-6 text-pink-400" />,
    title: "Universal Product Engine",
    description: "Sell anything. Define 'Service' products like consultations, or 'Physical' products like merchandise, all side-by-side."
  },
  {
    icon: <Code className="w-6 h-6 text-pink-400" />,
    title: "Custom React Development",
    description: "We don't use generic site builders. We develop your high-performance website in React, powered by our robust Kalp API backend."
  },
  {
    icon: <ShoppingCart className="w-6 h-6 text-pink-400" />,
    title: "The Commerce Loop",
    description: "Guest customers view published products, add to cart, and complete 'Snapshot Orders' capturing price and attributes at sale time."
  }
];

export default function Features() {
  return (
    <section id="features" className="relative z-10 py-32 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] -z-10" />
      <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-fuchsia-500 opacity-20 blur-[100px]" />
      
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

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">The Steel Thread MVP</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Focusing strictly on validating the Agency → Client → Customer value chain with bespoke frontend experiences.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group cursor-default"
            >
              <div className="w-14 h-14 rounded-2xl bg-fuchsia-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
