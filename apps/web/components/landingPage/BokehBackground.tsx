import { motion } from 'motion/react';

function seededRandom(seed: number) {
  const value = Math.sin(seed * 9999) * 10000;
  return value - Math.floor(value);
}

function range(seed: number, min: number, max: number) {
  return min + seededRandom(seed) * (max - min);
}

const bokehCircles = Array.from({ length: 6 }, (_, i) => {
  const index = i + 1;
  return {
    background: index % 2 === 0 ? '#ec4899' : '#3b82f6',
    width: Math.round(range(index * 10 + 1, 200, 600)),
    height: Math.round(range(index * 10 + 2, 200, 600)),
    top: `${Math.round(range(index * 10 + 3, 0, 100))}%`,
    left: `${Math.round(range(index * 10 + 4, 0, 100))}%`,
    x: [0, Math.round(range(index * 10 + 5, -100, 100)), 0],
    y: [0, Math.round(range(index * 10 + 6, -100, 100)), 0],
    duration: range(index * 10 + 7, 10, 20),
  };
});

const lightLines = Array.from({ length: 20 }, (_, i) => {
  const index = i + 1;
  return {
    top: `${Math.round(range(index * 10 + 8, 0, 100))}%`,
    duration: range(index * 10 + 9, 1, 3),
    delay: range(index * 10 + 10, 0, 2),
  };
});

import { useTheme } from '@/components/providers/theme-provider';

export default function BokehBackground() {
  const { themeMode } = useTheme();

  return (
    <div className={`fixed inset-0 z-0 overflow-hidden pointer-events-none transition-colors duration-500 ${
      themeMode === 'light' ? 'bg-[#fcfdff]' : 'bg-slate-950'
    }`}>
      <div className={`absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] transition-opacity duration-500 ${
        themeMode === 'light' 
          ? 'from-indigo-100/40 via-[#fcfdff] to-[#fcfdff] opacity-100' 
          : 'from-indigo-900/20 via-slate-950 to-slate-950 opacity-100'
      }`} />
      
      {/* Animated Bokeh Circles */}
      {bokehCircles.map((circle, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full filter blur-[100px] transition-all duration-500 ${
            themeMode === 'light' 
              ? 'mix-blend-multiply opacity-15' 
              : 'mix-blend-screen opacity-30'
          }`}
          style={{
            background: circle.background,
            width: circle.width,
            height: circle.height,
            top: circle.top,
            left: circle.left,
          }}
          animate={{
            x: circle.x,
            y: circle.y,
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: circle.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
      
      {/* Light Speed Lines (Subtle) */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${themeMode === 'light' ? 'opacity-10' : 'opacity-20'}`}>
         {lightLines.map((line, i) => (
            <motion.div
              key={`line-${i}`}
              className={`absolute h-[1px] bg-gradient-to-r from-transparent to-transparent ${
                themeMode === 'light' ? 'via-indigo-500' : 'via-fuchsia-500'
              }`}
              style={{
                top: line.top,
                left: '-100%',
                width: '200px',
              }}
              animate={{
                left: ['-10%', '110%'],
              }}
              transition={{
                duration: line.duration,
                repeat: Infinity,
                ease: "linear",
                delay: line.delay,
              }}
            />
         ))}
      </div>
    </div>
  );
}
