/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    ivory: '#F7F3EC',
                    cream: '#FFF9F2',
                    sand: '#EDE4D8',
                    coral: '#FF6B4A',
                    'coral-deep': '#E8533D',
                    indigo: '#6257E8',
                    mint: '#36BFA6',
                    sky: '#5BA7F7',
                    golden: '#E9B949',
                    lavender: '#A88BEB',
                    plum: '#272331',
                    ink: '#242229',
                }
            },
            fontFamily: {
                sans: ['Geist', 'Inter', 'Satoshi', 'sans-serif'],
                display: ['Cabinet Grotesk', 'Geist Display', 'sans-serif'],
                mono: ['Geist Mono', 'JetBrains Mono', 'monospace'],
            },
            borderRadius: {
                'xl': '14px',
                '2xl': '18px',
                '3xl': '24px',
            },
            boxShadow: {
                'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
                'soft-lg': '0 10px 30px -4px rgba(0, 0, 0, 0.06)',
            }
        },
    },
    plugins: [],
}