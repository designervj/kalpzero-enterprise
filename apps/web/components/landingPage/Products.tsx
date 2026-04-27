import { motion } from 'framer-motion';
import { ShoppingCart, LayoutTemplate, Users, FileText, Settings, Database } from 'lucide-react';
import { useTheme } from '@/components/providers/theme-provider';

const products = [
  {
    title: "Custom React Storefronts",
    icon: <LayoutTemplate className="w-8 h-8 transition-colors" />,
    description: "Bespoke, blazingly fast frontend experiences built with React and Framer Motion. No generic templates, just pure performance and unique brand identity.",
    features: ["Mobile-First Design", "Smooth Animations", "SEO Optimized", "Global CDN"]
  },
  {
    title: "E-Commerce Engine",
    icon: <ShoppingCart className="w-8 h-8 transition-colors" />,
    description: "A robust backend module to manage products, inventory, and orders. Supports physical goods, digital assets, and service bookings.",
    features: ["Universal Product Types", "Snapshot Orders", "Secure Checkout", "Multi-currency"]
  },
  {
    title: "CRM & Client Management",
    icon: <Users className="w-8 h-8 transition-colors" />,
    description: "Manage your customer relationships, track user logins, and analyze lifetime value (LTV) all from a unified dashboard.",
    features: ["User Tracking", "Role-Based Access", "Client Portals", "Analytics"]
  },
  {
    title: "Content & Blog Module",
    icon: <FileText className="w-8 h-8 transition-colors" />,
    description: "Publish engaging content to drive traffic. Integrated seamlessly with your custom React frontend for instant updates.",
    features: ["Rich Text Editor", "Media Library", "SEO Metadata", "Scheduled Posts"]
  },
  {
    title: "Automated Invoicing",
    icon: <Settings className="w-8 h-8 transition-colors" />,
    description: "Generate bills and manage subscriptions effortlessly. Perfect for agencies and service-based businesses.",
    features: ["Recurring Billing", "PDF Generation", "Payment Tracking", "Tax Calculation"]
  },
  {
    title: "Multi-Tenant Architecture",
    icon: <Database className="w-8 h-8 transition-colors" />,
    description: "The core of KalpTree. Complete data isolation, separate billing, and independent branding for every business under your agency.",
    features: ["Data Isolation", "Agency Hub", "Custom Domains", "SSL Provisioning"]
  }
];

export default function Products({ setView }: { setView: (view: 'home' | 'onboard' | 'portfolio' | 'products') => void }) {
  const { themeMode } = useTheme();

  return (
    <div className={`min-h-screen pt-24 pb-20 px-6 relative z-10 overflow-hidden transition-colors duration-500 ${
      themeMode === 'light' ? 'bg-white' : 'bg-slate-950'
    }`}>
      {/* Background Effects */}
      <div className={`absolute inset-0 -z-20 transition-colors duration-500 ${
        themeMode === 'light' ? 'bg-slate-50' : 'bg-slate-950'
      }`} />
      
      <div className={`absolute inset-0 -z-10 transition-opacity duration-500 ${
        themeMode === 'light' 
          ? 'bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:48px_48px]' 
          : 'bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:48px_48px]'
      }`} />
      
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-3xl -z-10 transition-colors duration-500 ${
        themeMode === 'light' 
          ? 'bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.05)_0%,_transparent_70%)]' 
          : 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent'
      }`} />

      {/* Subtle Mandala Background */}
      <div className={`absolute inset-0 pointer-events-none -z-10 flex items-center justify-center overflow-hidden transition-opacity duration-500 ${
        themeMode === 'light' ? 'opacity-[0.03]' : 'opacity-5'
      }`}>
        <motion.div 
          animate={{ rotate: -360 }} 
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
          className={`w-[1000px] h-[1000px] rounded-full border flex items-center justify-center ${
            themeMode === 'light' ? 'border-indigo-500' : 'border-white/20'
          }`}
        >
          <div className={`w-[800px] h-[800px] rounded-full border flex items-center justify-center ${
            themeMode === 'light' ? 'border-indigo-500' : 'border-white/20'
          }`}>
            <div className={`w-[600px] h-[600px] rounded-full border flex items-center justify-center ${
              themeMode === 'light' ? 'border-indigo-500' : 'border-white/20'
            }`}>
              <div className={`w-[400px] h-[400px] rounded-full border ${
                themeMode === 'light' ? 'border-indigo-500' : 'border-white/20'
              }`} />
            </div>
          </div>
          {[...Array(16)].map((_, i) => (
            <div 
              key={i} 
              className={`absolute w-[500px] h-[500px] border rounded-full ${
                themeMode === 'light' ? 'border-indigo-500' : 'border-white/20'
              }`}
              style={{ transform: `rotate(${i * 22.5}deg) translateX(250px)` }}
            />
          ))}
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-24">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className={`text-4xl md:text-7xl font-black tracking-tighter mb-8 transition-colors ${
              themeMode === 'light' ? 'text-slate-900' : 'text-white'
            }`}
          >
            Branches of <span className={themeMode === 'light' ? 'text-indigo-600' : 'text-pink-400'}>KalpTree</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className={`text-xl max-w-3xl mx-auto leading-relaxed transition-colors ${
              themeMode === 'light' ? 'text-slate-600' : 'text-gray-400'
            }`}
          >
            A modular ecosystem designed to scale. Choose the capabilities your business needs, and we'll integrate them into your custom React platform.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          {products.map((product, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`p-10 rounded-[2.5rem] border transition-all group relative overflow-hidden ${
                themeMode === 'light' 
                  ? 'bg-white border-slate-200 hover:border-indigo-400 hover:shadow-2xl hover:shadow-indigo-500/10' 
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              {/* Mandala Background Effect */}
              <div className={`absolute -right-20 -top-20 w-64 h-64 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 ${
                themeMode === 'light' ? 'bg-indigo-500/5' : 'bg-fuchsia-500/10'
              }`} />
              
              <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center mb-8 relative z-10 group-hover:scale-110 transition-transform duration-500 ${
                themeMode === 'light' ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-950/50 border-white/10'
              }`}>
                {/* Clone the icon and inject theme colors */}
                {Object.assign({}, product.icon, {
                  props: { 
                    ...product.icon.props, 
                    className: `${product.icon.props.className} ${themeMode === 'light' ? 'text-indigo-600' : 'text-pink-400'}` 
                  }
                })}
              </div>
              
              <h3 className={`text-2xl font-bold mb-4 relative z-10 transition-colors ${
                themeMode === 'light' ? 'text-slate-900' : 'text-white'
              }`}>{product.title}</h3>
              <p className={`mb-8 relative z-10 leading-relaxed transition-colors ${
                themeMode === 'light' ? 'text-slate-700' : 'text-gray-400'
              }`}>{product.description}</p>
              
              <ul className="space-y-4 relative z-10">
                {product.features.map((feature, idx) => (
                  <li key={idx} className={`flex items-center gap-3 text-sm font-bold transition-colors ${
                    themeMode === 'light' ? 'text-slate-600' : 'text-gray-300'
                  }`}>
                    <div className={`w-2 h-2 rounded-full transition-colors ${
                      themeMode === 'light' ? 'bg-indigo-500' : 'bg-fuchsia-500'
                    }`} />
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
          className="mt-24 text-center"
        >
          <button 
            onClick={() => setView('onboard')}
            className={`px-10 py-5 font-bold rounded-full transition-all hover:scale-105 shadow-xl ${
              themeMode === 'light'
                ? 'bg-indigo-600 text-white shadow-indigo-500/25 hover:bg-indigo-700'
                : 'bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-400 hover:to-blue-400 text-white shadow-fuchsia-500/30'
            }`}
          >
            Build Your Custom Stack
          </button>
        </motion.div>
      </div>
    </div>
  );
}
