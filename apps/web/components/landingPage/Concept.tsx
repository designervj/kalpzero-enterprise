import { motion } from 'motion/react';

export default function Concept() {
  return (
    <section id="concept" className="relative z-10 py-32 px-6 bg-slate-950/40 backdrop-blur-xl border-y border-white/5 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-slate-950 -z-20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-fuchsia-900/10 via-transparent to-transparent rounded-full blur-3xl -z-10" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
              The Digital <span className="text-pink-400">Kalp Vriksha</span>
            </h2>
            <p className="text-gray-400 text-lg mb-6 leading-relaxed">
              In mythology, the Kalp Vriksha is a divine wish-fulfilling tree. KalpTree embodies this concept for the digital age—a platform of infinite growth where you can design your business, not just a website.
            </p>
            <p className="text-gray-400 text-lg leading-relaxed">
              It's a "Brains" kind of solution. We empower Agencies to scale from Freelancer to Enterprise by providing a platform where they can resell technology, standardize services, and automate delivery.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="relative aspect-square rounded-full flex items-center justify-center"
          >
            {/* Mandala Art Background */}
            <div className="absolute inset-0 flex items-center justify-center">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={`mandala-layer-${i}`}
                  className="absolute rounded-full border border-fuchsia-500/20 mix-blend-screen"
                  style={{
                    width: `${(i + 1) * 12}%`,
                    height: `${(i + 1) * 12}%`,
                    borderStyle: i % 2 === 0 ? 'solid' : 'dashed',
                  }}
                  animate={{
                    rotate: i % 2 === 0 ? 360 : -360,
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    rotate: { duration: 40 + i * 10, repeat: Infinity, ease: "linear" },
                    scale: { duration: 4 + i, repeat: Infinity, ease: "easeInOut" }
                  }}
                >
                  {/* Petals/Nodes on the rings */}
                  {[...Array(6)].map((_, j) => (
                    <div
                      key={`node-${i}-${j}`}
                      className="absolute w-2 h-2 rounded-full"
                      style={{
                        background: i % 2 === 0 ? '#ec4899' : '#3b82f6',
                        top: '50%',
                        left: '50%',
                        transform: `translate(-50%, -50%) rotate(${j * 60}deg) translateY(-${(i + 1) * 6}vw)`,
                        boxShadow: `0 0 10px ${i % 2 === 0 ? '#ec4899' : '#3b82f6'}`,
                        opacity: 0.5 + (i * 0.05)
                      }}
                    />
                  ))}
                </motion.div>
              ))}
            </div>

            {/* Core Glow */}
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-fuchsia-500/20 via-transparent to-transparent animate-pulse" />
            
            {/* Center Logo / Generated Tree */}
            <motion.img 
              src="/img/digital_kalp_vriksha.png" 
              alt="The Digital Kalp Vriksha" 
              className="w-40 h-40 md:w-56 md:h-56 z-10 rounded-full object-cover border-2 border-fuchsia-500/30 drop-shadow-[0_0_40px_rgba(236,72,153,0.8)]"
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
