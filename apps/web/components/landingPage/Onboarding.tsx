"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ChevronRight, Building2, Mail, Briefcase, Layers, Check } from 'lucide-react';
import { useTheme } from '@/components/providers/theme-provider';

const industryData: Record<string, Record<string, string[]>> = {
  "Real Estate & Property": {
    "Property Listing & Brokerage": ["Property category", "Buy/Rent/Lease", "Residential & Commercial listings", "Pricing & location"],
    "Coworking & Shared Space": ["Desks", "Private cabins", "Dedicated seats", "Managed offices", "Meeting rooms"],
    "Property Development Project": ["New launch projects", "Under-construction properties", "Unit types", "Possession timeline"],
    "Real Estate Investment Product": ["Fractional ownership", "Rental yield assets", "Commercial investments", "ROI projections"],
  },
  "Hospitality & Tourism": {
    "Hotel Room Booking": ["Room type", "Nightly tariff", "Amenities", "Occupancy capacity", "Check-in/Check-out"],
    "Restaurant / Dining": ["Cuisine type", "Menu items", "Table booking", "Dining slots", "Price range"],
    "Event & Banquet Booking": ["Venue type", "Seating capacity", "Event type", "Catering & decor options"],
    "Travel & Tour Package": ["Destination", "Duration", "Itinerary", "Inclusions/Exclusions", "Group size"],
    "Adventure & Activity Experience": ["Activity type", "Skill level", "Duration", "Safety equipment", "Age limits"],
    "Vacation Rental / Homestay": ["Property type", "Guest capacity", "Stay duration", "Amenities", "Host rules"],
  },
  "Healthcare & Medical Services": {
    "Doctor Consultation Service": ["Medical specialization", "Consultation mode", "Appointment slots", "Fee"],
    "Diagnostic Test Package": ["Test category", "Included tests", "Sample type", "Report turnaround time"],
    "Hospital Admission & Treatment Package": ["Treatment type", "Room category", "Length of stay", "Procedures included"],
    "Home Healthcare Service": ["Service type", "Visit frequency", "Caregiver qualification", "Service duration"],
    "Medical Equipment Rental": ["Equipment type", "Rental period", "Usage purpose", "Delivery & installation"],
    "Pharmacy / Medicine Product": ["Medicine category", "Prescription requirement", "Dosage info", "Pack size"],
  },
  "Furniture & Home Furnishings": {
    "Ready-Made Furniture Sales": ["Furniture type", "Material", "Dimensions", "Finish options", "Price range"],
    "Custom Furniture Manufacturing": ["Furniture design", "Material selection", "Custom dimensions", "Lead time"],
    "Modular Furniture Solutions": ["Module type", "Configuration options", "Space size", "Installation scope"],
    "Office & Commercial Furniture Supply": ["Workspace furniture", "Quantity", "Ergonomic features", "Delivery schedule"],
    "Institutional / Bulk Furniture Supply": ["Furniture category", "Bulk quantity", "Standard specs", "Contract pricing"],
  },
  "Apparel and Clothing": {
    "Ready-Made Apparel Sales": ["Clothing category", "Size range", "Fabric type", "Color variants"],
    "Custom Apparel Manufacturing": ["Garment type", "Fabric choice", "Custom sizing", "Production quantity"],
    "Fashion Retail & D2C": ["Product category", "Seasonal collection", "Pricing tier", "Delivery options"],
    "Uniform & Corporate Apparel": ["Uniform type", "Branding customization", "Fabric quality", "Order volume"],
    "Bulk / Wholesale Clothing Supply": ["Apparel category", "MOQ", "Wholesale pricing", "Dispatch timeline"],
  },
  "Beauty, Wellness & Fitness": {
    "Salon & Spa Services": ["Service type", "Duration", "Therapist level", "Service pricing"],
    "Gym & Fitness Center": ["Membership plan", "Training access", "Facility amenities", "Timings"],
    "Personal Training & Coaching": ["Fitness goal", "Session mode", "Trainer experience", "Program duration"],
    "Ayurveda & Alternative Medicine": ["Treatment type", "Therapy duration", "Consultation mode", "Packages"],
    "Wellness Products & Supplements": ["Product category", "Health benefit", "Dosage guidelines", "Pack size"],
    "Beauty & Skincare Retail": ["Product type", "Skin concern", "Brand category", "Usage instructions"],
  },
  "Technology & IT Services": {
    "Software Development Agency": ["Technology stack", "Project type", "Engagement model", "Delivery timeline"],
    "IT Consulting & Managed Services": ["Service scope", "Infrastructure size", "Support model", "SLA terms"],
    "SaaS Product Company": ["Software category", "Subscription plan", "User limits", "Feature set"],
    "AI & Data Solutions Provider": ["Solution type", "Data volume", "Industry use case", "Deployment model"],
    "Cybersecurity Services": ["Security service type", "Risk coverage", "Compliance standards", "Monitoring scope"],
  },
  "Architecture & Interior Design": {
    "Architectural Design & Planning": ["Project type", "Site area", "Design stages", "Regulatory compliance"],
    "Interior Design & Space Planning": ["Space type", "Design style", "Area size", "Material palette"],
    "Turnkey Design & Build Services": ["End-to-end scope", "Budget range", "Execution timeline", "Vendor management"],
    "Landscape Architecture": ["Landscape area", "Design theme", "Plant selection", "Maintenance plan"],
    "Renovation & Remodeling Consultancy": ["Renovation scope", "Property type", "Design intervention", "Cost estimation"],
  },
  "Construction & Infrastructure": {
    "Residential Construction": ["Building type", "Built-up area", "Construction phase", "Material specs"],
    "Commercial Construction": ["Project category", "Floor area", "Compliance standards", "Timeline"],
    "Interior Design & Fit-Out Services": ["Fit-out type", "Space size", "Material finish", "Completion schedule"],
    "Civil & Infrastructure Projects": ["Project type", "Location", "Structural scope", "Government compliance"],
    "Renovation & Remodeling Services": ["Renovation area", "Structural changes", "Material upgrades", "Duration"],
    "MEP & Engineering Services": ["Service category", "System design", "Installation scope", "Maintenance support"],
  }
};

export default function Onboarding({ setView }: { setView: (view: 'home' | 'onboard') => void }) {
  const [step, setStep] = useState(1);
  const { themeMode } = useTheme();
  const totalSteps = 4;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    industry: '',
    businessType: '',
    attributes: [] as string[]
  });

  const nextStep = () => setStep(s => Math.min(s + 1, totalSteps + 1));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleAttributeToggle = (attr: string) => {
    setFormData(prev => ({
      ...prev,
      attributes: prev.attributes.includes(attr) 
        ? prev.attributes.filter(a => a !== attr)
        : [...prev.attributes, attr]
    }));
  };

  const currentBusinessTypes = formData.industry ? Object.keys(industryData[formData.industry]) : [];
  const currentAttributes = formData.industry && formData.businessType ? industryData[formData.industry][formData.businessType] : [];

  return (
    <div className={`min-h-screen pt-32 pb-12 px-6 relative z-10 flex flex-col lg:flex-row max-w-7xl mx-auto gap-12 overflow-hidden transition-colors duration-500 ${
      themeMode === 'light' ? 'bg-white' : 'bg-slate-950'
    }`}>
      {/* Background Effects */}
      <div className={`absolute inset-0 -z-20 transition-colors duration-500  ${
        themeMode === 'light' ? 'bg-slate-50' : 'bg-slate-950'
      }`} />
      
      <div className={`absolute inset-0 -z-10 transition-opacity duration-500 ${
        themeMode === 'light' 
          ? 'bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.05)_0%,_transparent_70%)]' 
          : 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950'
      }`} />
      
      <div className={`absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-[120px] -z-10 transition-colors duration-500 ${
        themeMode === 'light' ? 'bg-indigo-500/5' : 'bg-fuchsia-600/10'
      }`} />
      <div className={`absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full blur-[120px] -z-10 transition-colors duration-500 ${
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
          <div className={`w-[900px] h-[900px] rounded-full border flex items-center justify-center ${
            themeMode === 'light' ? 'border-indigo-500' : 'border-white/20'
          }`}>
            <div className={`w-[600px] h-[600px] rounded-full border flex items-center justify-center ${
              themeMode === 'light' ? 'border-indigo-500' : 'border-white/20'
            }`}>
              <div className={`w-[300px] h-[300px] rounded-full border ${
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

      {/* Left Side: The Growing Tech Tree Visualization */}
      <div className={`lg:w-1/2 flex flex-col items-center justify-center relative min-h-[450px] lg:min-h-[650px] rounded-[3rem] border p-12 overflow-hidden transition-all duration-700 ${
        themeMode === 'light' 
          ? 'bg-slate-50 border-slate-200 shadow-2xl shadow-indigo-500/10' 
          : 'bg-slate-900/50 border-white/10'
      }`}>
        {/* Decorative Grid Pattern for Light Mode */}
        {themeMode === 'light' && (
          <div className="absolute inset-0 opacity-[0.4] [mask-image:radial-gradient(ellipse_at_center,black_70%,transparent_100%)]" 
               style={{ backgroundImage: 'radial-gradient(#6366f1 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
        )}

        <div className={`absolute inset-0 -z-10 transition-opacity duration-500 ${
          themeMode === 'light' 
            ? 'bg-[radial-gradient(ellipse_at_top_left,_rgba(99,102,241,0.08)_0%,_transparent_70%)]' 
            : 'bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-pink-900/20 via-transparent to-blue-900/20'
        }`} />
        
        <div className="absolute top-12 left-12 right-12 z-10">
          <motion.h3 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-3xl md:text-4xl font-black tracking-tighter leading-none transition-colors ${
              themeMode === 'light' ? 'text-slate-900' : 'text-white/80'
            }`}
          >
            Growing Your <br />
            <span className={`text-transparent bg-clip-text transition-all ${
              themeMode === 'light' ? 'bg-gradient-to-r from-indigo-600 to-blue-600' : 'bg-gradient-to-r from-pink-400 to-blue-400'
            }`}>Kalp Vriksha</span>
          </motion.h3>
          <p className={`mt-4 text-lg font-medium transition-colors ${
            themeMode === 'light' ? 'text-slate-500' : 'text-white/40'
          }`}>
            Watch your digital ecosystem take root as you provide your details.
          </p>
        </div>

        <div className="relative w-full h-full max-w-[340px] max-h-[440px] mt-24 flex items-center justify-center">
          <svg viewBox="0 0 200 400" className={`w-full h-full overflow-visible transition-all ${
            themeMode === 'light' ? 'drop-shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'drop-shadow-[0_0_20px_rgba(236,72,153,0.3)]'
          }`}>
            {/* Roots (Step 1) */}
            <motion.path 
              d="M100,380 L100,300 M100,380 L70,400 M100,380 L130,400" 
              stroke={themeMode === 'light' ? "#4f46e5" : "#ec4899"} strokeWidth="5" fill="none" strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }} 
              animate={{ pathLength: step >= 1 ? 1 : 0, opacity: step >= 1 ? 1 : 0 }} 
              transition={{ duration: 1, ease: "easeInOut" }}
            />
            {/* Trunk (Step 2) */}
            <motion.path 
              d="M100,300 L100,150" 
              stroke={themeMode === 'light' ? "#6366f1" : "#d946ef"} strokeWidth="7" fill="none" strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }} 
              animate={{ pathLength: step >= 2 ? 1 : 0, opacity: step >= 2 ? 1 : 0 }} 
              transition={{ duration: 1, ease: "easeInOut", delay: 0.2 }}
            />
            {/* Branches (Step 3) */}
            <motion.path 
              d="M100,220 Q50,180 30,100 M100,180 Q150,140 170,80 M100,150 L100,40" 
              stroke={themeMode === 'light' ? "#818cf8" : "#8b5cf6"} strokeWidth="5" fill="none" strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }} 
              animate={{ pathLength: step >= 3 ? 1 : 0, opacity: step >= 3 ? 1 : 0 }} 
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.4 }}
            />
            {/* Leaves/Fruits (Step 4) */}
            <motion.path 
              d="M30,100 Q10,80 30,60 Q50,80 30,100 M170,80 Q190,60 170,40 Q150,60 170,80 M100,40 Q80,20 100,0 Q120,20 100,40" 
              stroke={themeMode === 'light' ? "#3b82f6" : "#3b82f6"} strokeWidth="4" fill="none" strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }} 
              animate={{ pathLength: step >= 4 ? 1 : 0, opacity: step >= 4 ? 1 : 0 }} 
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.6 }}
            />
            
            {/* Glowing Nodes */}
            <motion.circle cx="100" cy="300" r="8" fill={themeMode === 'light' ? "#4f46e5" : "#fff"} 
              initial={{ scale: 0 }} animate={{ scale: step >= 1 ? 1 : 0 }} transition={{ delay: 1 }} 
              className={themeMode === 'light' ? 'drop-shadow-[0_0_12px_rgba(79,70,229,0.6)]' : 'drop-shadow-[0_0_12px_#fff]'}
            />
            <motion.circle cx="100" cy="150" r="8" fill={themeMode === 'light' ? "#6366f1" : "#fff"} 
              initial={{ scale: 0 }} animate={{ scale: step >= 2 ? 1 : 0 }} transition={{ delay: 1.2 }} 
              className={themeMode === 'light' ? 'drop-shadow-[0_0_12px_rgba(99,102,241,0.6)]' : 'drop-shadow-[0_0_12px_#fff]'}
            />
            <motion.circle cx="30" cy="100" r="10" fill={themeMode === 'light' ? "#4f46e5" : "#d946ef"} 
              initial={{ scale: 0 }} animate={{ scale: step >= 3 ? 1 : 0 }} transition={{ delay: 1.5 }} 
              className={themeMode === 'light' ? 'drop-shadow-[0_0_18px_rgba(79,70,229,0.6)]' : 'drop-shadow-[0_0_18px_#d946ef]'}
            />
            <motion.circle cx="170" cy="80" r="10" fill={themeMode === 'light' ? "#818cf8" : "#8b5cf6"} 
              initial={{ scale: 0 }} animate={{ scale: step >= 3 ? 1 : 0 }} transition={{ delay: 1.7 }} 
              className={themeMode === 'light' ? 'drop-shadow-[0_0_18px_rgba(129,140,248,0.6)]' : 'drop-shadow-[0_0_18px_#8b5cf6]'}
            />
            <motion.circle cx="100" cy="40" r="12" fill="#3b82f6" 
              initial={{ scale: 0 }} animate={{ scale: step >= 4 ? 1 : 0 }} transition={{ delay: 1.9 }} 
              className="drop-shadow-[0_0_25px_#3b82f6]"
            />
          </svg>
        </div>
      </div>

      {/* Right Side: Lead Gen Form */}
      <div className="lg:w-1/2 flex flex-col justify-center">
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <span className={`text-sm font-bold uppercase tracking-widest transition-colors ${
              themeMode === 'light' ? 'text-indigo-600' : 'text-pink-400'
            }`}>Step {Math.min(step, totalSteps)} of {totalSteps}</span>
            <span className={`text-sm font-bold transition-colors ${
              themeMode === 'light' ? 'text-slate-400' : 'text-gray-500'
            }`}>{Math.round((Math.min(step, totalSteps) / totalSteps) * 100)}% Completed</span>
          </div>
          <div className={`h-2.5 w-full rounded-full overflow-hidden transition-colors ${
            themeMode === 'light' ? 'bg-slate-100' : 'bg-white/10'
          }`}>
            <motion.div 
              className={`h-full transition-all ${
                themeMode === 'light' ? 'bg-indigo-600' : 'bg-gradient-to-r from-pink-500 to-blue-500'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${(Math.min(step, totalSteps) / totalSteps) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        <div className="relative min-h-[450px]">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className={`p-4 rounded-2xl transition-colors ${
                    themeMode === 'light' ? 'bg-indigo-50' : 'bg-fuchsia-500/10'
                  }`}><Mail className={`w-8 h-8 ${themeMode === 'light' ? 'text-indigo-600' : 'text-pink-400'}`} /></div>
                  <h2 className={`text-3xl md:text-5xl font-black tracking-tighter transition-colors ${
                    themeMode === 'light' ? 'text-slate-900' : 'text-white'
                  }`}>Plant the Roots</h2>
                </div>
                <p className={`text-lg transition-colors ${
                  themeMode === 'light' ? 'text-slate-600' : 'text-gray-400'
                }`}>Tell us who you are so we can lay the foundation.</p>
                
                <div className="space-y-6">
                  <div>
                    <label className={`block text-sm font-bold uppercase tracking-widest mb-3 transition-colors ${
                      themeMode === 'light' ? 'text-slate-500' : 'text-gray-300'
                    }`}>Full Name</label>
                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={`w-full border rounded-2xl px-6 py-4 transition-all focus:outline-none focus:ring-2 ${
                      themeMode === 'light' 
                        ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500/20' 
                        : 'bg-white/5 border-white/10 text-white focus:border-fuchsia-500 focus:ring-fuchsia-500/20'
                    }`} placeholder="John Doe" />
                  </div>
                  <div>
                    <label className={`block text-sm font-bold uppercase tracking-widest mb-3 transition-colors ${
                      themeMode === 'light' ? 'text-slate-500' : 'text-gray-300'
                    }`}>Work Email</label>
                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className={`w-full border rounded-2xl px-6 py-4 transition-all focus:outline-none focus:ring-2 ${
                      themeMode === 'light' 
                        ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500/20' 
                        : 'bg-white/5 border-white/10 text-white focus:border-fuchsia-500 focus:ring-fuchsia-500/20'
                    }`} placeholder="john@company.com" />
                  </div>
                  <div>
                    <label className={`block text-sm font-bold uppercase tracking-widest mb-3 transition-colors ${
                      themeMode === 'light' ? 'text-slate-500' : 'text-gray-300'
                    }`}>Company Name</label>
                    <input type="text" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} className={`w-full border rounded-2xl px-6 py-4 transition-all focus:outline-none focus:ring-2 ${
                      themeMode === 'light' 
                        ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500 focus:ring-indigo-500/20' 
                        : 'bg-white/5 border-white/10 text-white focus:border-fuchsia-500 focus:ring-fuchsia-500/20'
                    }`} placeholder="e.g. Acme Corp" />
                  </div>
                </div>
                
                <button 
                  onClick={nextStep} 
                  disabled={!formData.name || !formData.email || !formData.company}
                  className={`mt-10 w-full py-5 font-bold rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl ${
                    themeMode === 'light'
                      ? 'bg-indigo-600 text-white shadow-indigo-500/25 hover:bg-indigo-700'
                      : 'bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-400 hover:to-blue-400 text-white shadow-fuchsia-500/30'
                  } disabled:opacity-50`}
                >
                  Continue <ChevronRight className="w-5 h-5" />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className={`p-4 rounded-2xl transition-colors ${
                    themeMode === 'light' ? 'bg-indigo-50' : 'bg-fuchsia-500/10'
                  }`}><Building2 className={`w-8 h-8 ${themeMode === 'light' ? 'text-indigo-600' : 'text-pink-400'}`} /></div>
                  <h2 className={`text-3xl md:text-5xl font-black tracking-tighter transition-colors ${
                    themeMode === 'light' ? 'text-slate-900' : 'text-white'
                  }`}>Grow the Trunk</h2>
                </div>
                <p className={`text-lg transition-colors ${
                  themeMode === 'light' ? 'text-slate-600' : 'text-gray-400'
                }`}>Select your industry to help us tailor the ecosystem.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[320px] overflow-y-auto pr-3 custom-scrollbar">
                  {Object.keys(industryData).map((industry) => (
                    <label key={industry} className={`flex items-center p-5 border rounded-[1.25rem] cursor-pointer transition-all ${
                      themeMode === 'light'
                        ? 'border-slate-200 bg-white hover:bg-slate-50 has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50'
                        : 'border-white/10 bg-white/5 hover:bg-white/10 has-[:checked]:border-fuchsia-500 has-[:checked]:bg-fuchsia-500/10'
                    }`}>
                      <input 
                        type="radio" 
                        name="industry" 
                        value={industry}
                        checked={formData.industry === industry}
                        onChange={(e) => setFormData({...formData, industry: e.target.value, businessType: '', attributes: []})}
                        className="hidden" 
                      />
                      <span className={`text-sm font-bold transition-colors ${
                        themeMode === 'light' && formData.industry === industry ? 'text-indigo-600' : ''
                      }`}>{industry}</span>
                    </label>
                  ))}
                </div>
                
                <div className="flex gap-4 mt-10">
                  <button onClick={prevStep} className={`w-1/3 py-5 font-bold rounded-2xl transition-all ${
                    themeMode === 'light' ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-white/5 text-white hover:bg-white/10'
                  }`}>Back</button>
                  <button 
                    onClick={nextStep} 
                    disabled={!formData.industry}
                    className={`w-2/3 py-5 font-bold rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl ${
                      themeMode === 'light'
                        ? 'bg-indigo-600 text-white shadow-indigo-500/25 hover:bg-indigo-700'
                        : 'bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-400 hover:to-blue-400 text-white shadow-fuchsia-500/30'
                    } disabled:opacity-50`}
                  >
                    Continue <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className={`p-4 rounded-2xl transition-colors ${
                    themeMode === 'light' ? 'bg-indigo-50' : 'bg-fuchsia-500/10'
                  }`}><Briefcase className={`w-8 h-8 ${themeMode === 'light' ? 'text-indigo-600' : 'text-pink-400'}`} /></div>
                  <h2 className={`text-3xl md:text-5xl font-black tracking-tighter transition-colors ${
                    themeMode === 'light' ? 'text-slate-900' : 'text-white'
                  }`}>Branch Out</h2>
                </div>
                <p className={`text-lg transition-colors ${
                  themeMode === 'light' ? 'text-slate-600' : 'text-gray-400'
                }`}>What specific type of business are you running in {formData.industry}?</p>
                
                <div className="grid grid-cols-1 gap-4 max-h-[320px] overflow-y-auto pr-3 custom-scrollbar">
                  {currentBusinessTypes.map((type) => (
                    <label key={type} className={`flex items-center p-5 border rounded-[1.25rem] cursor-pointer transition-all ${
                      themeMode === 'light'
                        ? 'border-slate-200 bg-white hover:bg-slate-50 has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50'
                        : 'border-white/10 bg-white/5 hover:bg-white/10 has-[:checked]:border-fuchsia-500 has-[:checked]:bg-fuchsia-500/10'
                    }`}>
                      <input 
                        type="radio" 
                        name="businessType" 
                        value={type}
                        checked={formData.businessType === type}
                        onChange={(e) => setFormData({...formData, businessType: e.target.value, attributes: []})}
                        className="hidden" 
                      />
                      <span className={`text-sm font-bold transition-colors ${
                        themeMode === 'light' && formData.businessType === type ? 'text-indigo-600' : ''
                      }`}>{type}</span>
                    </label>
                  ))}
                </div>
                
                <div className="flex gap-4 mt-10">
                  <button onClick={prevStep} className={`w-1/3 py-5 font-bold rounded-2xl transition-all ${
                    themeMode === 'light' ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-white/5 text-white hover:bg-white/10'
                  }`}>Back</button>
                  <button 
                    onClick={nextStep} 
                    disabled={!formData.businessType}
                    className={`w-2/3 py-5 font-bold rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl ${
                      themeMode === 'light'
                        ? 'bg-indigo-600 text-white shadow-indigo-500/25 hover:bg-indigo-700'
                        : 'bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-400 hover:to-blue-400 text-white shadow-fuchsia-500/30'
                    } disabled:opacity-50`}
                  >
                    Continue <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div 
                key="step4"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className={`p-4 rounded-2xl transition-colors ${
                    themeMode === 'light' ? 'bg-indigo-50' : 'bg-fuchsia-500/10'
                  }`}><Layers className={`w-8 h-8 ${themeMode === 'light' ? 'text-indigo-600' : 'text-pink-400'}`} /></div>
                  <h2 className={`text-3xl md:text-5xl font-black tracking-tighter transition-colors ${
                    themeMode === 'light' ? 'text-slate-900' : 'text-white'
                  }`}>Bear Fruit</h2>
                </div>
                <p className={`text-lg transition-colors ${
                  themeMode === 'light' ? 'text-slate-600' : 'text-gray-400'
                }`}>Select the key attributes you need to manage for your {formData.businessType}.</p>
                
                <div className="flex flex-wrap gap-3 max-h-[320px] overflow-y-auto pr-3 custom-scrollbar">
                  {currentAttributes.map((attr) => {
                    const isSelected = formData.attributes.includes(attr);
                    return (
                      <button
                        key={attr}
                        onClick={() => handleAttributeToggle(attr)}
                        className={`px-6 py-3 rounded-full text-sm font-bold border transition-all flex items-center gap-3
                          ${isSelected 
                            ? (themeMode === 'light' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-fuchsia-500 bg-fuchsia-500/20 text-white') 
                            : (themeMode === 'light' ? 'border-slate-200 bg-white text-slate-600 hover:border-indigo-400' : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white')
                          }`}
                      >
                        {isSelected && <Check className="w-4 h-4" />}
                        {attr}
                      </button>
                    );
                  })}
                </div>
                
                <div className="flex gap-4 mt-10">
                  <button onClick={prevStep} className={`w-1/3 py-5 font-bold rounded-2xl transition-all ${
                    themeMode === 'light' ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-white/5 text-white hover:bg-white/10'
                  }`}>Back</button>
                  <button 
                    onClick={nextStep} 
                    disabled={formData.attributes.length === 0}
                    className={`w-2/3 py-5 font-bold rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl ${
                      themeMode === 'light'
                        ? 'bg-indigo-600 text-white shadow-indigo-500/25 hover:bg-indigo-700'
                        : 'bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-400 hover:to-blue-400 text-white shadow-fuchsia-500/30'
                    } disabled:opacity-50`}
                  >
                    Submit Request
                  </button>
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div 
                key="step5"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center text-center h-full py-12"
              >
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-8 transition-colors ${
                  themeMode === 'light' ? 'bg-indigo-50' : 'bg-fuchsia-500/20'
                }`}>
                  <CheckCircle2 className={`w-12 h-12 ${themeMode === 'light' ? 'text-indigo-600' : 'text-pink-400'}`} />
                </div>
                <h2 className={`text-4xl font-black tracking-tighter mb-6 transition-colors ${
                  themeMode === 'light' ? 'text-slate-900' : 'text-white'
                }`}>Seed Planted!</h2>
                <p className={`text-lg mb-10 max-w-md transition-colors ${
                  themeMode === 'light' ? 'text-slate-600' : 'text-gray-400'
                }`}>
                  Thank you, {formData.name.split(' ')[0]}. Our team will review your requirements for {formData.company} and reach out shortly to begin developing your custom React platform.
                </p>
                <button onClick={() => setView('home')} className={`px-10 py-4 font-bold rounded-full transition-all ${
                  themeMode === 'light' ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-500/25' : 'bg-white/10 hover:bg-white/20 text-white'
                }`}>
                  Return Home
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
