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
    width: range(index * 10 + 1, 200, 600),
    height: range(index * 10 + 2, 200, 600),
    top: `${range(index * 10 + 3, 0, 100)}%`,
    left: `${range(index * 10 + 4, 0, 100)}%`,
    x: [0, range(index * 10 + 5, -100, 100), 0],
    y: [0, range(index * 10 + 6, -100, 100), 0],
    duration: range(index * 10 + 7, 10, 20),
  };
});

const lightLines = Array.from({ length: 20 }, (_, i) => {
  const index = i + 1;
  return {
    top: `${range(index * 10 + 8, 0, 100)}%`,
    duration: range(index * 10 + 9, 1, 3),
    delay: range(index * 10 + 10, 0, 2),
  };
});

export default function BokehBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950" />
      
      {/* Animated Bokeh Circles */}
      {bokehCircles.map((circle, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full mix-blend-screen filter blur-[100px] opacity-30"
          style={{
            background: circle.background, // Pink and Blue colors
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
      <div className="absolute inset-0 opacity-20">
         {lightLines.map((line, i) => (
            <motion.div
              key={`line-${i}`}
              className="absolute h-[1px] bg-gradient-to-r from-transparent via-fuchsia-500 to-transparent"
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
