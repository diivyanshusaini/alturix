export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { ivory: '#F5F2E9', ink: '#171717', sun: '#F2D34F', paper: '#EDE9DC' },
      fontFamily: {
        display: ['"Righteous"', 'sans-serif'],
        grotesk: ['"Space Grotesk"', 'sans-serif'],
        serif: ['"Righteous"', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      keyframes: {
        rise: { '0%': { transform: 'translateY(110%) rotate(6deg)', opacity: '0' }, '100%': { transform: 'none', opacity: '1' } },
        fade: { from: { opacity: '0', transform: 'translateY(14px)' }, to: { opacity: '1', transform: 'none' } },
        spin360: { to: { transform: 'rotate(360deg)' } },
        floaty: { '0%,100%': { transform: 'translateY(0) rotate(-4deg)' }, '50%': { transform: 'translateY(-14px) rotate(4deg)' } },
        subtleFloat: { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-8px)' } },
        ambientDrift: {
          '0%,100%': { transform: 'translate3d(0px, 0px, 0) scale(1)' },
          '50%': { transform: 'translate3d(28px, -22px, 0) scale(1.08)' },
        },
        ambientDriftSlow: {
          '0%,100%': { transform: 'translate3d(0px, 0px, 0) scale(1)' },
          '50%': { transform: 'translate3d(-32px, 24px, 0) scale(1.1)' },
        },
        particleFloat: {
          '0%,100%': { transform: 'translateY(0px)', opacity: '0.2' },
          '50%': { transform: 'translateY(-22px)', opacity: '0.65' },
        },
        marq: { to: { transform: 'translateX(-50%)' } },
        blink: { '50%': { opacity: '0' } },
      },
      animation: {
        rise: 'rise 1s cubic-bezier(.2,.8,.2,1) both',
        fade: 'fade .7s ease both',
        spin360: 'spin360 18s linear infinite',
        floaty: 'floaty 6s ease-in-out infinite',
        subtleFloat: 'subtleFloat 7s ease-in-out infinite',
        ambientDrift: 'ambientDrift 14s ease-in-out infinite',
        ambientDriftSlow: 'ambientDriftSlow 18s ease-in-out infinite',
        particleFloat: 'particleFloat 10s ease-in-out infinite',
        marq: 'marq 32s linear infinite',
      },
    },
  },
  plugins: [],
};
