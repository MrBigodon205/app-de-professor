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
                primary: "#137fec",
                "primary-hover": "#0f6ac7",
                "primary-dark": "#2563eb",
                "background-light": "#f6f7f8",
                "background-dark": "#101922",
                "surface-light": "#ffffff",
                "surface-dark": "#1a2632",
                "header-dark": "#111827",
                "input-bg": "#f3f4f6",
                "border-light": "#e7edf3",
                "border-dark": "#2a3b4d",
                "text-main": "#0d141b",
                "text-secondary": "#4c739a",
            },
            fontFamily: {
                display: ["Lexend", "sans-serif"],
                body: ["Noto Sans", "sans-serif"],
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
