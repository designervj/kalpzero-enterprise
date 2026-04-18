"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, ChevronRight, Building2, Mail, Briefcase, Layers, Check } from 'lucide-react';

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
    <div className="min-h-screen pt-24 pb-12 px-6 relative z-10 flex flex-col lg:flex-row max-w-7xl mx-auto gap-12 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-slate-950 -z-20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 -z-10" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-fuchsia-600/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] -z-10" />

      {/* Subtle Mandala Background */}
      <div className="absolute inset-0 pointer-events-none -z-10 flex items-center justify-center opacity-5 overflow-hidden">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
          className="w-[1200px] h-[1200px] rounded-full border border-white/20 flex items-center justify-center"
        >
          <div className="w-[900px] h-[900px] rounded-full border border-white/20 flex items-center justify-center">
            <div className="w-[600px] h-[600px] rounded-full border border-white/20 flex items-center justify-center">
              <div className="w-[300px] h-[300px] rounded-full border border-white/20" />
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

      {/* Left Side: The Growing Tech Tree Visualization */}
      <div className="lg:w-1/2 flex flex-col items-center justify-center relative min-h-[400px] lg:min-h-[600px] bg-slate-900/50 rounded-3xl border border-white/10 p-8 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-pink-900/20 via-transparent to-blue-900/20" />
        
        <h3 className="absolute top-8 left-8 text-2xl font-bold text-white/80">
          Growing Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-blue-400">Kalp Vriksha</span>
        </h3>

        <div className="relative w-full h-full max-w-[300px] max-h-[400px] mt-12">
          <svg viewBox="0 0 200 400" className="w-full h-full drop-shadow-[0_0_15px_rgba(236,72,153,0.3)] overflow-visible">
            {/* Roots (Step 1) */}
            <motion.path 
              d="M100,380 L100,300 M100,380 L70,400 M100,380 L130,400" 
              stroke="#ec4899" strokeWidth="4" fill="none" strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }} 
              animate={{ pathLength: step >= 1 ? 1 : 0, opacity: step >= 1 ? 1 : 0 }} 
              transition={{ duration: 1, ease: "easeInOut" }}
            />
            {/* Trunk (Step 2) */}
            <motion.path 
              d="M100,300 L100,150" 
              stroke="#d946ef" strokeWidth="6" fill="none" strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }} 
              animate={{ pathLength: step >= 2 ? 1 : 0, opacity: step >= 2 ? 1 : 0 }} 
              transition={{ duration: 1, ease: "easeInOut", delay: 0.2 }}
            />
            {/* Branches (Step 3) */}
            <motion.path 
              d="M100,220 Q50,180 30,100 M100,180 Q150,140 170,80 M100,150 L100,40" 
              stroke="#8b5cf6" strokeWidth="4" fill="none" strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }} 
              animate={{ pathLength: step >= 3 ? 1 : 0, opacity: step >= 3 ? 1 : 0 }} 
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.4 }}
            />
            {/* Leaves/Fruits (Step 4) */}
            <motion.path 
              d="M30,100 Q10,80 30,60 Q50,80 30,100 M170,80 Q190,60 170,40 Q150,60 170,80 M100,40 Q80,20 100,0 Q120,20 100,40" 
              stroke="#3b82f6" strokeWidth="3" fill="none" strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }} 
              animate={{ pathLength: step >= 4 ? 1 : 0, opacity: step >= 4 ? 1 : 0 }} 
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.6 }}
            />
            
            {/* Glowing Nodes */}
            <motion.circle cx="100" cy="300" r="6" fill="#fff" 
              initial={{ scale: 0 }} animate={{ scale: step >= 1 ? 1 : 0 }} transition={{ delay: 1 }} 
              className="drop-shadow-[0_0_10px_#fff]"
            />
            <motion.circle cx="100" cy="150" r="6" fill="#fff" 
              initial={{ scale: 0 }} animate={{ scale: step >= 2 ? 1 : 0 }} transition={{ delay: 1.2 }} 
              className="drop-shadow-[0_0_10px_#fff]"
            />
            <motion.circle cx="30" cy="100" r="8" fill="#d946ef" 
              initial={{ scale: 0 }} animate={{ scale: step >= 3 ? 1 : 0 }} transition={{ delay: 1.5 }} 
              className="drop-shadow-[0_0_15px_#d946ef]"
            />
            <motion.circle cx="170" cy="80" r="8" fill="#8b5cf6" 
              initial={{ scale: 0 }} animate={{ scale: step >= 3 ? 1 : 0 }} transition={{ delay: 1.7 }} 
              className="drop-shadow-[0_0_15px_#8b5cf6]"
            />
            <motion.circle cx="100" cy="40" r="10" fill="#3b82f6" 
              initial={{ scale: 0 }} animate={{ scale: step >= 4 ? 1 : 0 }} transition={{ delay: 1.9 }} 
              className="drop-shadow-[0_0_20px_#3b82f6]"
            />
          </svg>
        </div>
      </div>

      {/* Right Side: Lead Gen Form */}
      <div className="lg:w-1/2 flex flex-col justify-center">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-pink-400">Step {Math.min(step, totalSteps)} of {totalSteps}</span>
            <span className="text-sm text-gray-500">{Math.round((Math.min(step, totalSteps) / totalSteps) * 100)}% Completed</span>
          </div>
          <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-pink-500 to-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${(Math.min(step, totalSteps) / totalSteps) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        <div className="relative min-h-[400px]">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-fuchsia-500/10 rounded-xl"><Mail className="w-6 h-6 text-pink-400" /></div>
                  <h2 className="text-3xl font-bold">Plant the Roots</h2>
                </div>
                <p className="text-gray-400 mb-8">Tell us who you are so we can lay the foundation.</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                    <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-fuchsia-500 transition-colors" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Work Email</label>
                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-fuchsia-500 transition-colors" placeholder="john@company.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Company Name</label>
                    <input type="text" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-fuchsia-500 transition-colors" placeholder="e.g. Acme Corp" />
                  </div>
                </div>
                
                <button 
                  onClick={nextStep} 
                  disabled={!formData.name || !formData.email || !formData.company}
                  className="mt-8 w-full py-4 bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-400 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  Continue <ChevronRight className="w-5 h-5" />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-fuchsia-500/10 rounded-xl"><Building2 className="w-6 h-6 text-pink-400" /></div>
                  <h2 className="text-3xl font-bold">Grow the Trunk</h2>
                </div>
                <p className="text-gray-400 mb-8">Select your industry to help us tailor the ecosystem.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {Object.keys(industryData).map((industry) => (
                    <label key={industry} className="flex items-center p-4 border border-white/10 rounded-xl cursor-pointer hover:bg-white/5 transition-colors has-[:checked]:border-fuchsia-500 has-[:checked]:bg-fuchsia-500/10">
                      <input 
                        type="radio" 
                        name="industry" 
                        value={industry}
                        checked={formData.industry === industry}
                        onChange={(e) => setFormData({...formData, industry: e.target.value, businessType: '', attributes: []})}
                        className="hidden" 
                      />
                      <span className="text-sm font-medium">{industry}</span>
                    </label>
                  ))}
                </div>
                
                <div className="flex gap-4 mt-8">
                  <button onClick={prevStep} className="w-1/3 py-4 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-colors">Back</button>
                  <button 
                    onClick={nextStep} 
                    disabled={!formData.industry}
                    className="w-2/3 py-4 bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-400 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
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
                className="space-y-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-fuchsia-500/10 rounded-xl"><Briefcase className="w-6 h-6 text-pink-400" /></div>
                  <h2 className="text-3xl font-bold">Branch Out</h2>
                </div>
                <p className="text-gray-400 mb-8">What specific type of business are you running in {formData.industry}?</p>
                
                <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {currentBusinessTypes.map((type) => (
                    <label key={type} className="flex items-center p-4 border border-white/10 rounded-xl cursor-pointer hover:bg-white/5 transition-colors has-[:checked]:border-fuchsia-500 has-[:checked]:bg-fuchsia-500/10">
                      <input 
                        type="radio" 
                        name="businessType" 
                        value={type}
                        checked={formData.businessType === type}
                        onChange={(e) => setFormData({...formData, businessType: e.target.value, attributes: []})}
                        className="hidden" 
                      />
                      <span className="text-sm font-medium">{type}</span>
                    </label>
                  ))}
                </div>
                
                <div className="flex gap-4 mt-8">
                  <button onClick={prevStep} className="w-1/3 py-4 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-colors">Back</button>
                  <button 
                    onClick={nextStep} 
                    disabled={!formData.businessType}
                    className="w-2/3 py-4 bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-400 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
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
                className="space-y-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-fuchsia-500/10 rounded-xl"><Layers className="w-6 h-6 text-pink-400" /></div>
                  <h2 className="text-3xl font-bold">Bear Fruit</h2>
                </div>
                <p className="text-gray-400 mb-8">Select the key attributes you need to manage for your {formData.businessType}.</p>
                
                <div className="flex flex-wrap gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {currentAttributes.map((attr) => {
                    const isSelected = formData.attributes.includes(attr);
                    return (
                      <button
                        key={attr}
                        onClick={() => handleAttributeToggle(attr)}
                        className={`px-4 py-2 rounded-full text-sm font-medium border transition-all flex items-center gap-2
                          ${isSelected 
                            ? 'border-fuchsia-500 bg-fuchsia-500/20 text-white' 
                            : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                          }`}
                      >
                        {isSelected && <Check className="w-4 h-4" />}
                        {attr}
                      </button>
                    );
                  })}
                </div>
                
                <div className="flex gap-4 mt-8">
                  <button onClick={prevStep} className="w-1/3 py-4 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-colors">Back</button>
                  <button 
                    onClick={nextStep} 
                    disabled={formData.attributes.length === 0}
                    className="w-2/3 py-4 bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-400 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
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
                <div className="w-20 h-20 bg-fuchsia-500/20 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-10 h-10 text-pink-400" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Seed Planted!</h2>
                <p className="text-gray-400 mb-8 max-w-md">
                  Thank you, {formData.name.split(' ')[0]}. Our team will review your requirements for {formData.company} and reach out shortly to begin developing your custom React platform.
                </p>
                <button onClick={() => setView('home')} className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
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
