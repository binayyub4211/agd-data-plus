import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          midnight: "#0A0F1E",
          royal: "#1A4FDB",
          cyan: "#00D4FF",
          silver: "#E0E0E0",
          gold: "#F5A623"
        }
      },
    },
  },
  plugins: [],
};
export default config;
