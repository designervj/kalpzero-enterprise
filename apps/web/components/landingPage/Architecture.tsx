import { motion } from 'framer-motion';
import { Cpu, Shield, Zap } from 'lucide-react';
import { useTheme } from '@/components/providers/theme-provider';

export default function Architecture() {
  const { themeMode } = useTheme();

  return (
    <section id="architecture" className={`relative z-10 py-32 px-6 backdrop-blur-xl border-t transition-colors duration-500 ${
      themeMode === 'light' ? 'bg-white/40 border-slate-200' : 'bg-slate-950/40 border-white/5'
    } overflow-hidden`}>
      {/* Background Effects */}
      <div className={`absolute inset-0 -z-10 opacity-20 transition-opacity duration-500 ${
        themeMode === 'light' 
          ? 'bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_24px]' 
          : 'bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_24px]'
      }`} />
      
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] rounded-full blur-3xl -z-10 transition-colors duration-500 ${
        themeMode === 'light' 
          ? 'bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.05)_0%,_transparent_70%)]' 
          : 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent'
      }`} />

      {/* Abstract Tech Tree Background */}
      <div className={`absolute inset-0 pointer-events-none -z-10 flex items-center justify-center transition-opacity duration-500 ${
        themeMode === 'light' ? 'opacity-[0.05]' : 'opacity-10'
      }`}>
        <svg viewBox="0 0 400 400" className="w-full h-full max-w-2xl">
          <motion.path 
            d="M200,400 L200,200 M200,200 L100,100 M200,200 L300,100 M100,100 L50,50 M100,100 L150,50 M300,100 L250,50 M300,100 L350,50" 
            stroke={themeMode === 'light' ? "#6366f1" : "#ec4899"} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 3, ease: "easeInOut" }}
          />
          {[
            { cx: 200, cy: 200 }, { cx: 100, cy: 100 }, { cx: 300, cy: 100 },
            { cx: 50, cy: 50 }, { cx: 150, cy: 50 }, { cx: 250, cy: 50 }, { cx: 350, cy: 50 }
          ].map((node, i) => (
            <motion.circle 
              key={i} cx={node.cx} cy={node.cy} r="4" fill={themeMode === 'light' ? "#4f46e5" : "#3b82f6"}
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 1 + i * 0.2, duration: 0.5 }}
            />
          ))}
        </svg>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="mb-24">
          <h2 className={`text-3xl md:text-6xl font-black tracking-tighter mb-8 transition-colors ${
            themeMode === 'light' ? 'text-slate-900' : 'text-white'
          }`}>Data Architecture <span className={themeMode === 'light' ? 'text-slate-400' : 'text-gray-600'}>("The Brain")</span></h2>
          <p className={`text-xl max-w-3xl leading-relaxed transition-colors ${
            themeMode === 'light' ? 'text-slate-600' : 'text-gray-400'
          }`}>
            Utilizing MongoDB's flexibility to handle Polymorphic Data for dynamic products and Atomic Design for the visual builder.
          </p>
        </div>

        <div className="space-y-12">
          <ArchitectureCard 
            themeMode={themeMode}
            icon={<Shield className="w-6 h-6" />}
            title="Identity & Access Layer"
            code={`{
  "type": "AGENCY",
  "parentId": "ObjectId(Tenant)",
  "config": {
    "whiteLabel": { "logo": "Url", "primaryColor": "Hex" }
  }
}`}
            description="Hierarchical tenants distinguishing between Service Provider (Agency) and Service Consumer (Business). Global users can belong to multiple tenants."
          />
          
          <ArchitectureCard 
            themeMode={themeMode}
            icon={<Zap className="w-6 h-6" />}
            title="Universal Product Engine"
            code={`{
  "name": "Consultation Service",
  "attributesSchema": [
    { "key": "duration", "type": "number", "unit": "minutes" },
    { "key": "platform", "type": "select", "options": ["Zoom", "Meet"] }
  ]
}`}
            description="Defines the 'Shape' of a product. Allows selling T-shirts and Tours side-by-side with dynamic attributes."
          />

          <ArchitectureCard 
            themeMode={themeMode}
            icon={<Cpu className="w-6 h-6" />}
            title="Visual Builder & Branding"
            code={`{
  "palette": { "primary": "#FF5733" },
  "typography": { "heading": "Inter" },
  "components": { "buttonStyle": "FLAT" }
}`}
            description="Centralized design tokens (Atomic Design). Changing this updates the entire site instantly. Stores editable JSON and compiled HTML for performance."
          />
        </div>
      </div>
    </section>
  );
}

function ArchitectureCard({ icon, title, code, description, themeMode }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`flex flex-col lg:flex-row gap-12 p-10 rounded-[2.5rem] border transition-all ${
        themeMode === 'light' 
          ? 'bg-white border-slate-200 shadow-xl shadow-indigo-500/5' 
          : 'bg-gradient-to-br from-white/5 to-transparent border-white/10'
      }`}
    >
      <div className="lg:w-1/3">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 transition-colors ${
          themeMode === 'light' ? 'bg-indigo-50 text-indigo-600' : 'bg-fuchsia-500/10 text-pink-400'
        }`}>
          {icon}
        </div>
        <h3 className={`text-2xl font-bold mb-4 tracking-tight transition-colors ${
          themeMode === 'light' ? 'text-slate-900' : 'text-white'
        }`}>{title}</h3>
        <p className={`leading-relaxed transition-colors ${
          themeMode === 'light' ? 'text-slate-600' : 'text-gray-400'
        }`}>{description}</p>
      </div>
      <div className={`lg:w-2/3 rounded-2xl p-8 border overflow-x-auto transition-colors ${
        themeMode === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-slate-950/80 border-white/5'
      }`}>
        <pre className={`text-sm font-mono transition-colors ${
          themeMode === 'light' ? 'text-indigo-600' : 'text-blue-400'
        }`}>
          <code>{code}</code>
        </pre>
      </div>
    </motion.div>
  );
}
