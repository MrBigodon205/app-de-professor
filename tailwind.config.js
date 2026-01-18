/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./contexts/**/*.{js,ts,jsx,tsx}",
        "./hooks/**/*.{js,ts,jsx,tsx}",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./*.{js,ts,jsx,tsx}"
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: "#06b6d4", // Neon Cyan
                "primary-hover": "#0891b2",
                "primary-dark": "#0e7490",
                secondary: "#8b5cf6", // Electric Violet
                "background-light": "#f8fafc",
                "background-dark": "#020617", // Deep Space (Slate 950+)
                "surface-light": "#ffffff",
                "surface-dark": "#0f172a", // Slate 900
                "header-dark": "#020617",
                "input-bg": "#f1f5f9",
                "border-light": "#e2e8f0",
                "border-dark": "#1e293b",
                "text-main": "#0f172a",
                "text-secondary": "#64748b",
            },
            fontFamily: {
                display: ["Outfit", "sans-serif"],
                body: ["Outfit", "sans-serif"],
                mono: ["Space Grotesk", "monospace"],
            },
            boxShadow: {
                soft: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
            },
            animation: {
                'bounce-slow': 'bounce 3s infinite',
            }
        },
    },
    plugins: [],
}
