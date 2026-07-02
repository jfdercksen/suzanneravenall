import type { Config } from 'tailwindcss'
import baseConfig from '../../packages/config/tailwind.config'

const config: Config = {
  presets: [baseConfig as unknown as Config],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: ['animate-brain-pulse', 'motion-safe:animate-brain-pulse'],
  plugins: [],
}

export default config
