import { motion } from 'motion/react';
import { ArrowUpRight, Globe, ShoppingBag, Leaf } from 'lucide-react';

const projects = [
  {
    title: "Nestcraft Living",
    category: "E-Commerce & Retail",
    description: "A complete digital transformation for a premium furniture brand. Features a custom React storefront, dynamic product catalog, and seamless checkout powered by Kalp API.",
    metrics: ["150% Sales Growth", "30% Faster Load Time", "Automated Invoicing"],
    icon: <ShoppingBag className="w-6 h-6 text-pink-400" />,
    color: "from-fuchsia-500/20 to-teal-900/20"
  },
  {
    title: "Surya Mahal",
    category: "Hospitality & Events",
    description: "An elegant, high-performance booking platform for a luxury marriage garden. Includes virtual tours, availability calendars, and CRM integration.",
    metrics: ["200% More Inquiries", "Zero Downtime", "Unified Dashboard"],
    icon: <Globe className="w-6 h-6 text-pink-400" />,
    color: "from-blue-500/20 to-indigo-900/20"
  },
  {
    title: "Ethical Solar",
    category: "Green Energy",
    description: "A lead-generation powerhouse built with interactive ROI calculators and educational blog modules to drive solar adoption.",
    metrics: ["3x Lead Conversion", "SEO Optimized", "Content Management"],
    icon: <Leaf className="w-6 h-6 text-pink-400" />,
    color: "from-green-500/20 to-indigo-900/20"
  }
];

export default function Portfolio({ setView }: { setView: (view: 'home' | 'onboard' | 'portfolio' | 'products') => void }) {
  return (
    <div className="min-h-screen pt-24 pb-20 px-6 relative z-10 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-slate-950 -z-20" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] -z-10" />

      {/* Abstract Tech Tree Background */}
      <div className="absolute inset-0 pointer-events-none -z-10 flex items-center justify-center opacity-10">
        <svg viewBox="0 0 800 800" className="w-full h-full max-w-4xl">
          <motion.path 
            d="M400,800 L400,500 M400,500 L200,300 M400,500 L600,300 M200,300 L100,150 M200,300 L300,150 M600,300 L500,150 M600,300 L700,150" 
            stroke="#ec4899" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 4, ease: "easeInOut" }}
          />
          {[
            { cx: 400, cy: 500 }, { cx: 200, cy: 300 }, { cx: 600, cy: 300 },
            { cx: 100, cy: 150 }, { cx: 300, cy: 150 }, { cx: 500, cy: 150 }, { cx: 700, cy: 150 }
          ].map((node, i) => (
            <motion.circle 
              key={i} cx={node.cx} cy={node.cy} r="6" fill="#3b82f6"
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
            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 mb-6"
          >
            <Leaf className="w-8 h-8 text-pink-400" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold tracking-tight mb-6"
          >
            The Forest of <span className="text-pink-400">Success</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-gray-400 max-w-2xl mx-auto"
          >
            Explore the thriving businesses powered by KalpTree's custom React development and enterprise backend.
          </motion.p>
        </div>

        <div className="space-y-12">
          {projects.map((project, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8 }}
              className={`relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${project.color} p-1`}
            >
              <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
              
              <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row gap-12 items-center">
                <div className="md:w-1/2 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-slate-950/50 rounded-xl border border-white/5">
                      {project.icon}
                    </div>
                    <span className="text-pink-400 font-medium tracking-wide uppercase text-sm">{project.category}</span>
                  </div>
                  
                  <h2 className="text-3xl md:text-4xl font-bold text-white">{project.title}</h2>
                  <p className="text-gray-300 text-lg leading-relaxed">{project.description}</p>
                  
                  <div className="flex flex-wrap gap-3 pt-4">
                    {project.metrics.map((metric, idx) => (
                      <span key={idx} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-blue-400">
                        {metric}
                      </span>
                    ))}
                  </div>
                  
                  <button onClick={() => setView('onboard')} className="mt-8 inline-flex items-center gap-2 text-pink-400 font-semibold hover:text-blue-400 transition-colors group">
                    Grow a similar platform <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </button>
                </div>
                
                <div className="md:w-1/2 w-full aspect-video rounded-2xl bg-slate-950/50 border border-white/10 relative overflow-hidden group">
                  {/* Abstract Representation of the Project */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full bg-fuchsia-500/20 blur-3xl group-hover:bg-pink-400/30 transition-colors duration-700" />
                    <div className="absolute w-full h-full bg-[radial-gradient(circle_at_center,_transparent_20%,_black_100%)]" />
                    <div className="text-white/20 font-mono text-sm absolute">
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
