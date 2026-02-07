import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#0f172a",
        panel: "#111827",
        subtle: "#1f2937",
        accent: "#38bdf8"
      }
    }
  },
  plugins: []
} satisfies Config;
