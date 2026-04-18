import { motion } from 'motion/react';
import { ShoppingCart, LayoutTemplate, Users, FileText, Settings, Database } from 'lucide-react';

const products = [
  {
    title: "Custom React Storefronts",
    icon: <LayoutTemplate className="w-8 h-8 text-pink-400" />,
    description: "Bespoke, blazingly fast frontend experiences built with React and Framer Motion. No generic templates, just pure performance and unique brand identity.",
    features: ["Mobile-First Design", "Smooth Animations", "SEO Optimized", "Global CDN"]
  },
  {
    title: "E-Commerce Engine",
    icon: <ShoppingCart className="w-8 h-8 text-pink-400" />,
    description: "A robust backend module to manage products, inventory, and orders. Supports physical goods, digital assets, and service bookings.",
    features: ["Universal Product Types", "Snapshot Orders", "Secure Checkout", "Multi-currency"]
  },
  {
    title: "CRM & Client Management",
    icon: <Users className="w-8 h-8 text-pink-400" />,
    description: "Manage your customer relationships, track user logins, and analyze lifetime value (LTV) all from a unified dashboard.",
    features: ["User Tracking", "Role-Based Access", "Client Portals", "Analytics"]
  },
  {
    title: "Content & Blog Module",
    icon: <FileText className="w-8 h-8 text-pink-400" />,
    description: "Publish engaging content to drive traffic. Integrated seamlessly with your custom React frontend for instant updates.",
    features: ["Rich Text Editor", "Media Library", "SEO Metadata", "Scheduled Posts"]
  },
  {
    title: "Automated Invoicing",
    icon: <Settings className="w-8 h-8 text-pink-400" />,
    description: "Generate bills and manage subscriptions effortlessly. Perfect for agencies and service-based businesses.",
    features: ["Recurring Billing", "PDF Generation", "Payment Tracking", "Tax Calculation"]
  },
  {
    title: "Multi-Tenant Architecture",
    icon: <Database className="w-8 h-8 text-pink-400" />,
    description: "The core of KalpTree. Complete data isolation, separate billing, and independent branding for every business under your agency.",
    features: ["Data Isolation", "Agency Hub", "Custom Domains", "SSL Provisioning"]
  }
];

export default function Products({ setView }: { setView: (view: 'home' | 'onboard' | 'portfolio' | 'products') => void }) {
  return (
    <div className="min-h-screen pt-24 pb-20 px-6 relative z-10 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-slate-950 -z-20" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:48px_48px] -z-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent rounded-full blur-3xl -z-10" />

      {/* Subtle Mandala Background */}
      <div className="absolute inset-0 pointer-events-none -z-10 flex items-center justify-center opacity-5 overflow-hidden">
        <motion.div 
          animate={{ rotate: -360 }} 
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
          className="w-[1000px] h-[1000px] rounded-full border border-white/20 flex items-center justify-center"
        >
          <div className="w-[800px] h-[800px] rounded-full border border-white/20 flex items-center justify-center">
            <div className="w-[600px] h-[600px] rounded-full border border-white/20 flex items-center justify-center">
              <div className="w-[400px] h-[400px] rounded-full border border-white/20" />
            </div>
          </div>
          {[...Array(16)].map((_, i) => (
            <div 
              key={i} 
              className="absolute w-[500px] h-[500px] border border-white/20 rounded-full"
              style={{ transform: `rotate(${i * 22.5}deg) translateX(250px)` }}
            />
          ))}
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-6xl font-bold tracking-tight mb-6"
          >
            Branches of <span className="text-pink-400">KalpTree</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-xl text-gray-400 max-w-3xl mx-auto"
          >
            A modular ecosystem designed to scale. Choose the capabilities your business needs, and we'll integrate them into your custom React platform.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group relative overflow-hidden"
            >
              {/* Mandala Background Effect */}
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-fuchsia-500/10 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              <div className="w-16 h-16 rounded-2xl bg-slate-950/50 border border-white/10 flex items-center justify-center mb-6 relative z-10 group-hover:scale-110 transition-transform duration-500">
                {product.icon}
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-4 relative z-10">{product.title}</h3>
              <p className="text-gray-400 mb-8 relative z-10 leading-relaxed">{product.description}</p>
              
              <ul className="space-y-3 relative z-10">
                {product.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 text-center"
        >
          <button 
            onClick={() => setView('onboard')}
            className="px-8 py-4 bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-400 hover:to-blue-400 text-white font-bold rounded-full transition-all hover:scale-105 shadow-[0_0_20px_rgba(236,72,153,0.3)]"
          >
            Build Your Custom Stack
          </button>
        </motion.div>
      </div>
    </div>
  );
}
