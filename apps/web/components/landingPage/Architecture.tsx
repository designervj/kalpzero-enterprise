import { motion } from 'motion/react';
import { Cpu, Shield, Zap } from 'lucide-react';

export default function Architecture() {
  return (
    <section id="architecture" className="relative z-10 py-32 px-6 bg-slate-950/40 backdrop-blur-xl border-t border-white/5 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_24px] -z-10" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent -z-10" />

      {/* Abstract Tech Tree Background */}
      <div className="absolute inset-0 pointer-events-none -z-10 flex items-center justify-center opacity-10">
        <svg viewBox="0 0 400 400" className="w-full h-full max-w-2xl">
          <motion.path 
            d="M200,400 L200,200 M200,200 L100,100 M200,200 L300,100 M100,100 L50,50 M100,100 L150,50 M300,100 L250,50 M300,100 L350,50" 
            stroke="#ec4899" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"
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
              key={i} cx={node.cx} cy={node.cy} r="4" fill="#3b82f6"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 1 + i * 0.2, duration: 0.5 }}
            />
          ))}
        </svg>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="mb-20">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">Data Architecture <span className="text-gray-600">("The Brain")</span></h2>
          <p className="text-gray-400 text-lg max-w-3xl">
            Utilizing MongoDB's flexibility to handle Polymorphic Data for dynamic products and Atomic Design for the visual builder.
          </p>
        </div>

        <div className="space-y-8">
          <ArchitectureCard 
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

function ArchitectureCard({ icon, title, code, description }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="flex flex-col lg:flex-row gap-8 p-8 rounded-3xl bg-gradient-to-br from-white/5 to-transparent border border-white/10"
    >
      <div className="lg:w-1/3">
        <div className="w-14 h-14 rounded-2xl bg-fuchsia-500/10 flex items-center justify-center mb-6 text-pink-400">
          {icon}
        </div>
        <h3 className="text-2xl font-semibold mb-4">{title}</h3>
        <p className="text-gray-400 leading-relaxed">{description}</p>
      </div>
      <div className="lg:w-2/3 bg-slate-950/80 rounded-2xl p-6 border border-white/5 overflow-x-auto">
        <pre className="text-sm font-mono text-blue-400">
          <code>{code}</code>
        </pre>
      </div>
    </motion.div>
  );
}
