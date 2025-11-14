import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/stories/**/*.{ts,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic color tokens - using direct CSS variable references
        "default": "var(--bg-default)",
        "default-surface": "var(--bg-surface)",
        "text-default": "var(--text-default)",
        "text-muted": "var(--text-muted)",
        "accent-primary": "var(--accent-primary)",
        "accent-secondary": "var(--accent-secondary)",
        "accent-yellow": "var(--accent-yellow)",
        "border-subtle": "var(--border-subtle)",
        "state-success": "var(--state-success)",
        "state-error": "var(--state-error)",
        "state-hover": "var(--state-hover)",
        // Shadcn-compatible colors
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        "card-foreground": "var(--card-foreground)",
        popover: "var(--popover)",
        "popover-foreground": "var(--popover-foreground)",
        primary: "var(--primary)",
        "primary-foreground": "var(--primary-foreground)",
        secondary: "var(--secondary)",
        "secondary-foreground": "var(--secondary-foreground)",
        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",
        accent: "var(--accent)",
        "accent-foreground": "var(--accent-foreground)",
        destructive: "var(--destructive)",
        "destructive-foreground": "var(--destructive-foreground)",
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        // Raw colors for reference
        dark: "#26291D",
        light: "#FDF9F4",
      },
      fontSize: {
        xs: ["12px", { lineHeight: "1.5" }],
        sm: ["14px", { lineHeight: "1.5" }],
        base: ["16px", { lineHeight: "1.5" }],
        lg: ["21px", { lineHeight: "1.4" }],
        xl: ["28px", { lineHeight: "1.3" }],
        "2xl": ["37px", { lineHeight: "1.2" }],
        "3xl": ["50px", { lineHeight: "1.2" }],
        "4xl": ["67px", { lineHeight: "1.1" }],
      },
      fontFamily: {
        sans: ['"PP Neue Montreal"', "system-ui", "-apple-system", "sans-serif"],
        mono: ['"PP Neue Montreal Mono"', '"Courier New"', "monospace"],
      },
      spacing: {
        // Modular spacing system (12, 24, 36, 48, 72, 96, 144px)
        // Extended Tailwind defaults with modular values
        9: "36px", // Modular spacing (36px)
        18: "72px", // Modular spacing for sections (72px)
        36: "144px", // Modular spacing (144px)
        // Grid system spacing
        "grid-margin-mobile": "var(--grid-margin-mobile)",
        "grid-margin-tablet": "var(--grid-margin-tablet)",
        "grid-margin-desktop": "var(--grid-margin-desktop)",
        "grid-gutter-mobile": "var(--grid-gutter-mobile)",
        "grid-gutter-tablet": "var(--grid-gutter-tablet)",
        "grid-gutter-desktop": "var(--grid-gutter-desktop)",
      },
      borderRadius: {
        xs: "2px",
        sm: "4px",
        md: "8px",
        lg: "12px",
        pill: "9999px",
      },
      screens: {
        // Mobile-first breakpoints
        sm: "640px", // Tablet
        md: "768px", // Tablet landscape
        lg: "1024px", // Desktop
        xl: "1280px", // Large desktop
      },
    },
  },
  plugins: [],
};

export default config;

