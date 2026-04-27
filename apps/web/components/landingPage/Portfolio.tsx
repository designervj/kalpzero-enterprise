import { motion } from 'framer-motion';
import { ArrowUpRight, Globe, ShoppingBag, Leaf } from 'lucide-react';
import { useTheme } from '@/components/providers/theme-provider';

const projects = [
  {
    title: "Nestcraft Living",
    category: "E-Commerce & Retail",
    description: "A complete digital transformation for a premium furniture brand. Features a custom React storefront, dynamic product catalog, and seamless checkout powered by Kalp API.",
    metrics: ["150% Sales Growth", "30% Faster Load Time", "Automated Invoicing"],
    icon: <ShoppingBag className="w-6 h-6 transition-colors" />,
    color: "from-fuchsia-500/20 to-teal-900/20"
  },
  {
    title: "Surya Mahal",
    category: "Hospitality & Events",
    description: "An elegant, high-performance booking platform for a luxury marriage garden. Includes virtual tours, availability calendars, and CRM integration.",
    metrics: ["200% More Inquiries", "Zero Downtime", "Unified Dashboard"],
    icon: <Globe className="w-6 h-6 transition-colors" />,
    color: "from-blue-500/20 to-indigo-900/20"
  },
  {
    title: "Ethical Solar",
    category: "Green Energy",
    description: "A lead-generation powerhouse built with interactive ROI calculators and educational blog modules to drive solar adoption.",
    metrics: ["3x Lead Conversion", "SEO Optimized", "Content Management"],
    icon: <Leaf className="w-6 h-6 transition-colors" />,
    color: "from-green-500/20 to-indigo-900/20"
  }
];

export default function Portfolio({ setView }: { setView: (view: 'home' | 'onboard' | 'portfolio' | 'products') => void }) {
  const { themeMode } = useTheme();

  return (
    <div className={`min-h-screen pt-24 pb-20 px-6 relative z-10 overflow-hidden transition-colors duration-500 ${
      themeMode === 'light' ? 'bg-white' : 'bg-slate-950'
    }`}>
      {/* Background Effects */}
      <div className={`absolute inset-0 -z-20 transition-colors duration-500 ${
        themeMode === 'light' ? 'bg-slate-50' : 'bg-slate-950'
      }`} />
      <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[120px] -z-10 transition-colors duration-500 ${
        themeMode === 'light' ? 'bg-indigo-500/5' : 'bg-fuchsia-600/10'
      }`} />
      <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-[120px] -z-10 transition-colors duration-500 ${
        themeMode === 'light' ? 'bg-blue-500/5' : 'bg-blue-600/10'
      }`} />

      {/* Abstract Tech Tree Background */}
      <div className={`absolute inset-0 pointer-events-none -z-10 flex items-center justify-center transition-opacity duration-500 ${
        themeMode === 'light' ? 'opacity-[0.05]' : 'opacity-10'
      }`}>
        <svg viewBox="0 0 800 800" className="w-full h-full max-w-4xl">
          <motion.path 
            d="M400,800 L400,500 M400,500 L200,300 M400,500 L600,300 M200,300 L100,150 M200,300 L300,150 M600,300 L500,150 M600,300 L700,150" 
            stroke={themeMode === 'light' ? "#6366f1" : "#ec4899"} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 4, ease: "easeInOut" }}
          />
          {[
            { cx: 400, cy: 500 }, { cx: 200, cy: 300 }, { cx: 600, cy: 300 },
            { cx: 100, cy: 150 }, { cx: 300, cy: 150 }, { cx: 500, cy: 150 }, { cx: 700, cy: 150 }
          ].map((node, i) => (
            <motion.circle 
              key={i} cx={node.cx} cy={node.cy} r="6" fill={themeMode === 'light' ? "#4f46e5" : "#3b82f6"}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.5 + i * 0.3, duration: 0.8 }}
            />
          ))}
        </svg>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className={`inline-flex items-center justify-center w-16 h-16 rounded-full border mb-6 transition-all ${
              themeMode === 'light' ? 'bg-indigo-50 border-indigo-100' : 'bg-fuchsia-500/10 border-fuchsia-500/20'
            }`}
          >
            <Leaf className={`w-8 h-8 ${themeMode === 'light' ? 'text-indigo-600' : 'text-pink-400'}`} />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className={`text-4xl md:text-7xl font-bold tracking-tight mb-6 transition-colors ${
              themeMode === 'light' ? 'text-slate-900' : 'text-white'
            }`}
          >
            The Forest of <span className={themeMode === 'light' ? 'text-indigo-600' : 'text-pink-400'}>Success</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className={`text-xl max-w-2xl mx-auto leading-relaxed transition-colors ${
              themeMode === 'light' ? 'text-slate-600' : 'text-gray-400'
            }`}
          >
            Explore the thriving businesses powered by KalpTree's custom React development and enterprise backend.
          </motion.p>
        </div>

        <div className="space-y-16">
          {projects.map((project, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className={`relative overflow-hidden rounded-[2.5rem] border transition-all ${
                themeMode === 'light' 
                  ? 'border-slate-200 bg-white shadow-xl shadow-indigo-500/5' 
                  : `border-white/10 bg-gradient-to-br ${project.color} p-1`
              }`}
            >
              <div className={`absolute inset-0 transition-opacity duration-500 ${
                themeMode === 'light' ? 'bg-white' : 'bg-slate-950/60 backdrop-blur-sm'
              }`} />
              
              <div className="relative z-10 p-8 md:p-14 flex flex-col md:flex-row gap-16 items-center">
                <div className="md:w-1/2 space-y-8">
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl border transition-colors ${
                      themeMode === 'light' ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-950/50 border-white/5'
                    }`}>
                      {/* Clone the icon and inject theme colors */}
                      {Object.assign({}, project.icon, {
                        props: { 
                          ...project.icon.props, 
                          className: `${project.icon.props.className} ${themeMode === 'light' ? 'text-indigo-600' : 'text-pink-400'}` 
                        }
                      })}
                    </div>
                    <span className={`font-bold tracking-widest uppercase text-sm transition-colors ${
                      themeMode === 'light' ? 'text-indigo-600' : 'text-pink-400'
                    }`}>{project.category}</span>
                  </div>
                  
                  <h2 className={`text-3xl md:text-5xl font-bold tracking-tight transition-colors ${
                    themeMode === 'light' ? 'text-slate-900' : 'text-white'
                  }`}>{project.title}</h2>
                  <p className={`text-lg leading-relaxed transition-colors ${
                    themeMode === 'light' ? 'text-slate-700' : 'text-gray-300'
                  }`}>{project.description}</p>
                  
                  <div className="flex flex-wrap gap-4 pt-4">
                    {project.metrics.map((metric, idx) => (
                      <span key={idx} className={`px-5 py-2.5 rounded-full border text-sm font-bold transition-colors ${
                        themeMode === 'light' 
                          ? 'bg-slate-50 border-slate-200 text-slate-700' 
                          : 'bg-white/5 border-white/10 text-blue-400'
                      }`}>
                        {metric}
                      </span>
                    ))}
                  </div>
                  
                  <button onClick={() => setView('onboard')} className={`mt-10 inline-flex items-center gap-3 font-bold transition-colors group ${
                    themeMode === 'light' ? 'text-indigo-600 hover:text-indigo-800' : 'text-pink-400 hover:text-blue-400'
                  }`}>
                    Grow a similar platform <ArrowUpRight className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </button>
                </div>
                
                <div className={`md:w-1/2 w-full aspect-video rounded-3xl border relative overflow-hidden group transition-colors ${
                  themeMode === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-slate-950/50 border-white/10'
                }`}>
                  {/* Abstract Representation of the Project */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`w-40 h-40 rounded-full blur-3xl transition-colors duration-700 ${
                      themeMode === 'light' ? 'bg-indigo-500/10' : 'bg-fuchsia-500/20 group-hover:bg-pink-400/30'
                    }`} />
                    <div className={`absolute w-full h-full transition-opacity duration-500 ${
                      themeMode === 'light' ? 'opacity-0' : 'bg-[radial-gradient(circle_at_center,_transparent_20%,_black_100%)]'
                    }`} />
                    <div className={`font-mono text-xs absolute transition-colors ${
                      themeMode === 'light' ? 'text-indigo-500/30' : 'text-white/20'
                    }`}>
                      {`<KalpTree.Project name="${project.title.replace(/\s+/g, '')}" />`}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
