import { Target, Zap, ShieldCheck, Sprout } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '@/components/providers/theme-provider';

const values = [
  {
    icon: <Sprout className="w-8 h-8 transition-colors" />,
    title: "Nurturing Growth",
    description: "Like the Kalp Vriksha, we provide the essential nutrients—technology, infrastructure, and design—for businesses to flourish."
  },
  {
    icon: <Target className="w-8 h-8 transition-colors" />,
    title: "Precision Engineering",
    description: "We don't believe in one-size-fits-all. Every React storefront is meticulously crafted to meet exact business objectives."
  },
  {
    icon: <ShieldCheck className="w-8 h-8 transition-colors" />,
    title: "Enterprise Reliability",
    description: "Built on a multi-tenant architecture that guarantees data isolation, security, and 99.9% uptime for all our partners."
  },
  {
    icon: <Zap className="w-8 h-8 transition-colors" />,
    title: "Blazing Performance",
    description: "Speed is a feature. Our custom frontends are optimized for millisecond load times, driving higher conversions."
  }
];

export default function About() {
  const { themeMode } = useTheme();

  return (
    <div className={`min-h-screen pt-24 pb-20 px-6 relative z-10 overflow-hidden transition-colors duration-500 ${
      themeMode === 'light' ? 'bg-white' : 'bg-slate-950'
    }`}>
      {/* Background Effects */}
      <div className={`absolute inset-0 -z-20 transition-colors duration-500 ${
        themeMode === 'light' ? 'bg-slate-50' : 'bg-slate-950'
      }`} />
      
      <div className={`absolute top-0 left-0 w-full h-full -z-10 transition-opacity duration-500 ${
        themeMode === 'light' 
          ? 'bg-[radial-gradient(ellipse_at_top_right,_rgba(99,102,241,0.08)_0%,_transparent_60%)]' 
          : 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950'
      }`} />
      
      <div className={`absolute bottom-0 left-0 w-full h-1/2 -z-10 transition-opacity duration-500 ${
        themeMode === 'light'
          ? 'bg-[linear-gradient(to_top,rgba(99,102,241,0.03),transparent)]'
          : 'bg-[linear-gradient(to_top,rgba(236,72,153,0.05),transparent)]'
      }`} />

      {/* Subtle Mandala Background */}
      <div className={`absolute inset-0 pointer-events-none -z-10 flex items-center justify-center overflow-hidden transition-opacity duration-500 ${
        themeMode === 'light' ? 'opacity-[0.03]' : 'opacity-5'
      }`}>
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 200, repeat: Infinity, ease: "linear" }}
          className={`w-[1500px] h-[1500px] rounded-full border flex items-center justify-center ${
            themeMode === 'light' ? 'border-indigo-500' : 'border-white/20'
          }`}
        >
          <div className={`w-[1200px] h-[1200px] rounded-full border flex items-center justify-center ${
            themeMode === 'light' ? 'border-indigo-500' : 'border-white/20'
          }`}>
            <div className={`w-[900px] h-[900px] rounded-full border flex items-center justify-center ${
              themeMode === 'light' ? 'border-indigo-500' : 'border-white/20'
            }`}>
              <div className={`w-[600px] h-[600px] rounded-full border ${
                themeMode === 'light' ? 'border-indigo-500' : 'border-white/20'
              }`} />
            </div>
          </div>
          {[...Array(32)].map((_, i) => (
            <div 
              key={i} 
              className={`absolute w-[800px] h-[800px] border rounded-full ${
                themeMode === 'light' ? 'border-indigo-500' : 'border-white/20'
              }`}
              style={{ transform: `rotate(${i * 11.25}deg) translateX(350px)` }}
            />
          ))}
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Hero Section */}
        <div className="text-center mb-32 relative">
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none transition-opacity duration-500 ${
            themeMode === 'light'
              ? 'bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.1)_0%,_transparent_70%)]'
              : 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent'
          }`} />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, type: "spring" }}
            className={`relative inline-flex items-center justify-center w-24 h-24 rounded-full border mb-8 overflow-hidden transition-colors ${
              themeMode === 'light' 
                ? 'border-indigo-200 bg-white shadow-lg shadow-indigo-100' 
                : 'border-fuchsia-500/30 bg-slate-950/50'
            }`}
          >
            <div className={`absolute inset-0 animate-pulse ${
              themeMode === 'light' ? 'bg-indigo-50' : 'bg-fuchsia-500/10'
            }`} />
            <img src="/img/img.svg" alt="KalpTree" className="w-12 h-12 relative z-10" />
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className={`text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 transition-colors ${
              themeMode === 'light' ? 'text-slate-900' : 'text-white'
            }`}
          >
            The Roots of <span className={themeMode === 'light' ? 'text-indigo-600' : 'text-pink-400'}>KalpTree</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className={`text-xl max-w-3xl mx-auto leading-relaxed transition-colors ${
              themeMode === 'light' ? 'text-slate-600' : 'text-gray-400'
            }`}
          >
            We are architects of digital ecosystems. Born from the need to unify fragmented agency tools, KalpTree is the enterprise operating system that turns freelancers into powerhouses and businesses into industry leaders.
          </motion.p>
        </div>

        {/* Story Section */}
        <div className="grid md:grid-cols-2 gap-16 items-center mb-32">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <h2 className={`text-3xl md:text-5xl font-bold tracking-tight ${themeMode === 'light' ? 'text-slate-900' : 'text-white'}`}>From Seed to Forest</h2>
            <p className={`text-lg leading-relaxed ${themeMode === 'light' ? 'text-slate-600' : 'text-gray-400'}`}>
              The digital landscape is cluttered with generic site builders and disconnected plugins. We saw agencies struggling to scale because their technology stack was a fragile house of cards.
            </p>
            <p className={`text-lg leading-relaxed ${themeMode === 'light' ? 'text-slate-600' : 'text-gray-400'}`}>
              KalpTree was built to be the bedrock. A single, multi-tenant platform where commerce, content, and client management coexist perfectly. We handle the complex backend infrastructure, allowing us to deliver stunning, bespoke React frontends that actually move the needle for your business.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className={`relative aspect-square rounded-full border flex items-center justify-center p-8 transition-colors ${
              themeMode === 'light' ? 'border-slate-200' : 'border-white/10'
            }`}
          >
            {/* Concentric Tree Rings Animation */}
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className={`absolute rounded-full border transition-colors ${
                  themeMode === 'light' ? 'border-indigo-500/10' : 'border-fuchsia-500/20'
                }`}
                style={{
                  width: `${(i + 1) * 25}%`,
                  height: `${(i + 1) * 25}%`,
                }}
                animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
                transition={{ duration: 40 + i * 10, repeat: Infinity, ease: "linear" }}
              />
            ))}
            <div className={`w-full h-full rounded-full border backdrop-blur-md flex items-center justify-center relative z-10 transition-all ${
              themeMode === 'light' 
                ? 'bg-gradient-to-br from-white to-indigo-50 border-indigo-200 shadow-xl' 
                : 'bg-gradient-to-br from-indigo-900/40 to-black border-fuchsia-500/30'
            }`}>
               <div className="text-center">
                 <div className={`text-6xl font-black mb-2 tracking-tighter ${themeMode === 'light' ? 'text-indigo-600' : 'text-white'}`}>100%</div>
                 <div className={`font-bold tracking-widest uppercase text-sm ${themeMode === 'light' ? 'text-slate-500' : 'text-pink-400'}`}>In-House Tech</div>
               </div>
            </div>
          </motion.div>
        </div>

        {/* Core Values */}
        <div className="text-center mb-16">
          <h2 className={`text-3xl md:text-5xl font-bold mb-4 tracking-tight ${themeMode === 'light' ? 'text-slate-900' : 'text-white'}`}>Our Core Values</h2>
          <p className={`text-lg font-medium ${themeMode === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>The principles that guide our ecosystem.</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((value, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`p-8 rounded-3xl border transition-all group relative overflow-hidden ${
                themeMode === 'light' 
                  ? 'bg-white border-slate-200 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-500/5' 
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-500 ${
                themeMode === 'light' ? 'bg-indigo-500/5' : 'bg-fuchsia-500/10'
              }`} />
              
              <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center mb-6 relative z-10 transition-colors ${
                themeMode === 'light' 
                  ? 'bg-indigo-50 border-indigo-100' 
                  : 'bg-slate-950/50 border-white/10'
              }`}>
                {/* Clone the icon and inject theme colors */}
                {Object.assign({}, value.icon, {
                  props: { 
                    ...value.icon.props, 
                    className: `${value.icon.props.className} ${themeMode === 'light' ? 'text-indigo-600' : 'text-pink-400'}` 
                  }
                })}
              </div>
              <h3 className={`text-xl font-bold mb-3 relative z-10 transition-colors ${
                themeMode === 'light' ? 'text-slate-900' : 'text-white'
              }`}>{value.title}</h3>
              <p className={`text-sm leading-relaxed relative z-10 transition-colors ${
                themeMode === 'light' ? 'text-slate-600' : 'text-gray-400'
              }`}>{value.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
