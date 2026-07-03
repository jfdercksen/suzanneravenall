'use client'

import { motion } from 'framer-motion'

const BLUE = '#1719F4'
const CYAN = '#06B6D4'

// Satellite brain centres, arranged in an arc to the right of the central brain
const SATELLITES = [
  { x: 420, y: 100 },
  { x: 480, y: 200 },
  { x: 420, y: 300 },
]

// Lightning bolts from the central brain's right edge to each satellite.
// mid points keep the travelling spark roughly on the curve.
const BOLTS = [
  { d: 'M245,160 C290,140 330,120 370,100', start: { x: 245, y: 160 }, mid: { x: 310, y: 130 }, end: { x: 370, y: 100 } },
  { d: 'M248,200 C300,200 340,200 440,200', start: { x: 248, y: 200 }, mid: { x: 340, y: 200 }, end: { x: 440, y: 200 } },
  { d: 'M245,240 C290,260 330,280 370,300', start: { x: 245, y: 240 }, mid: { x: 310, y: 270 }, end: { x: 370, y: 300 } },
]

// Fixed delays/durations — no Math.random, keeps SSR and client renders identical
const PARTICLES = [
  { x: 80, y: 60, fill: BLUE, duration: 2.4, delay: 0 },
  { x: 320, y: 50, fill: CYAN, duration: 3.1, delay: 0.3 },
  { x: 540, y: 70, fill: BLUE, duration: 2.8, delay: 0.7 },
  { x: 60, y: 330, fill: CYAN, duration: 3.4, delay: 1.1 },
  { x: 300, y: 360, fill: BLUE, duration: 2.6, delay: 1.5 },
  { x: 520, y: 350, fill: CYAN, duration: 3.0, delay: 0.2 },
  { x: 350, y: 160, fill: BLUE, duration: 2.2, delay: 0.9 },
  { x: 340, y: 250, fill: CYAN, duration: 3.6, delay: 1.3 },
  { x: 150, y: 40, fill: CYAN, duration: 2.9, delay: 0.5 },
  { x: 560, y: 250, fill: BLUE, duration: 2.5, delay: 1.7 },
]

function brainPaths(stroke: string, outerWidth: number, foldWidth: number) {
  return (
    <>
      {/* Left hemisphere outer */}
      <path
        d="M0-80 C-40-80 -70-55 -70-20 C-70 15 -55 45 -30 60 C-15 68 0 70 0 70"
        stroke={stroke}
        strokeWidth={outerWidth}
        fill="none"
        strokeLinecap="round"
      />
      {/* Right hemisphere outer */}
      <path
        d="M0-80 C40-80 70-55 70-20 C70 15 55 45 30 60 C15 68 0 70 0 70"
        stroke={stroke}
        strokeWidth={outerWidth}
        fill="none"
        strokeLinecap="round"
      />
      {/* Centre divide */}
      <path
        d="M0-80 L0 70"
        stroke={BLUE}
        strokeWidth={outerWidth * 0.66}
        strokeDasharray="4 3"
        strokeLinecap="round"
        opacity="0.6"
      />
      {/* Left folds */}
      <path d="M-55-30 C-45-40 -30-30 -35-15" stroke={CYAN} strokeWidth={foldWidth} strokeLinecap="round" fill="none" />
      <path d="M-60 10 C-48 0 -32 10 -38 25" stroke={CYAN} strokeWidth={foldWidth} strokeLinecap="round" fill="none" />
      <path d="M-45 40 C-35 32 -20 38 -25 52" stroke={CYAN} strokeWidth={foldWidth * 0.8} strokeLinecap="round" fill="none" />
      {/* Right folds */}
      <path d="M55-30 C45-40 30-30 35-15" stroke={CYAN} strokeWidth={foldWidth} strokeLinecap="round" fill="none" />
      <path d="M60 10 C48 0 32 10 38 25" stroke={CYAN} strokeWidth={foldWidth} strokeLinecap="round" fill="none" />
      <path d="M45 40 C35 32 20 38 25 52" stroke={CYAN} strokeWidth={foldWidth * 0.8} strokeLinecap="round" fill="none" />
      {/* Neural nodes on centre line */}
      <circle cx="0" cy="-40" r="4" fill={BLUE} />
      <circle cx="0" cy="0" r="4" fill={BLUE} />
      <circle cx="0" cy="40" r="4" fill={BLUE} />
    </>
  )
}

export default function PatternDiagnosticIllustration() {
  return (
    <svg
      viewBox="0 0 600 400"
      className="w-full h-auto max-w-[600px]"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="pdhBrainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={BLUE} />
          <stop offset="100%" stopColor={CYAN} />
        </linearGradient>
        <linearGradient id="pdhBoltGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={BLUE} />
          <stop offset="100%" stopColor={CYAN} stopOpacity="0.3" />
        </linearGradient>
        <radialGradient id="pdhCentralGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={BLUE} stopOpacity="0.8" />
          <stop offset="100%" stopColor={BLUE} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="pdhSatelliteGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={CYAN} stopOpacity="0.6" />
          <stop offset="100%" stopColor={CYAN} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Floating background particles */}
      {PARTICLES.map((p, i) => (
        <motion.circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="2"
          fill={p.fill}
          animate={{ opacity: [0, 0.8, 0], y: [-5, 5, -5] }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: p.delay,
          }}
        />
      ))}

      {/* Pulsing glow backdrop behind central brain */}
      <motion.ellipse
        cx="180"
        cy="200"
        rx="100"
        ry="90"
        fill="url(#pdhCentralGlow)"
        animate={{ opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Lightning bolts + travelling sparks */}
      {BOLTS.map((bolt, i) => (
        <g key={i}>
          <motion.path
            d={bolt.d}
            stroke="url(#pdhBoltGradient)"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: [0, 1, 0.7] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.5,
            }}
          />
          <motion.circle
            r="3"
            fill={CYAN}
            initial={{ opacity: 0 }}
            animate={{
              cx: [bolt.start.x, bolt.mid.x, bolt.end.x],
              cy: [bolt.start.y, bolt.mid.y, bolt.end.y],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.5,
            }}
          />
        </g>
      ))}

      {/* Central large brain */}
      <g transform="translate(180 200)">{brainPaths('url(#pdhBrainGradient)', 3, 2.5)}</g>

      {/* Satellite brains */}
      {SATELLITES.map((s, i) => (
        <g key={i}>
          <motion.ellipse
            cx={s.x}
            cy={s.y}
            rx="38"
            ry="34"
            fill="url(#pdhSatelliteGlow)"
            animate={{ opacity: [0.15, 0.35, 0.15] }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.4,
            }}
          />
          <g transform={`translate(${s.x} ${s.y})`}>
            <motion.g
              animate={{ opacity: [0.6, 1, 0.6], scale: [0.98, 1.02, 0.98] }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.4,
              }}
            >
              {/* strokeWidth 4.5 inside scale(0.45) ≈ 2px rendered — thinner than central */}
              <g transform="scale(0.45)">{brainPaths(CYAN, 4.5, 4)}</g>
            </motion.g>
          </g>
        </g>
      ))}
    </svg>
  )
}