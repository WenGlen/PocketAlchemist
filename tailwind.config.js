/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          muted: 'var(--color-primary-muted)',
          hover: 'var(--color-primary-hover)',
          '25': 'var(--color-primary-25)',
          '50': 'var(--color-primary-50)',
          '75': 'var(--color-primary-75)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          muted: 'var(--color-secondary-muted)',
          hover: 'var(--color-secondary-hover)',
          '25': 'var(--color-secondary-25)',
          '50': 'var(--color-secondary-50)',
          '75': 'var(--color-secondary-75)',
        },
        background: {
          DEFAULT: 'var(--color-bg)',
          '25': 'var(--color-bg-25)',
          '50': 'var(--color-bg-50)',
          '75': 'var(--color-bg-75)',
        },
        panel: {
          DEFAULT: 'var(--color-panel)',
          hover: 'var(--color-panel-hover)',
          muted: 'var(--color-panel-muted)',
          '25': 'var(--color-panel-25)',
          '50': 'var(--color-panel-50)',
          '75': 'var(--color-panel-75)',
        },
        card: {
          DEFAULT: 'var(--color-card)',
          hover: 'var(--color-card-hover)',
          muted: 'var(--color-card-muted)',
          '25': 'var(--color-card-25)',
          '50': 'var(--color-card-50)',
          '75': 'var(--color-card-75)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          '25': 'var(--color-border-25)',
          '50': 'var(--color-border-50)',
          '75': 'var(--color-border-75)',
        },
        placeholder: 'var(--color-placeholder)',
        btn: {
          DEFAULT: 'var(--color-btn)',
          text: 'var(--color-btn-text)',
          'text-invert': 'var(--color-btn-text-invert)',
          hover: 'var(--color-btn-hover)',
          focus: 'var(--color-btn-focus)',
        },
        'btn-muted': {
          DEFAULT: 'var(--color-btn-muted)',
          text: 'var(--color-btn-muted-text)',
          'text-invert': 'var(--color-btn-muted-text-invert)',
          hover: 'var(--color-btn-muted-hover)',
          focus: 'var(--color-btn-muted-focus)',
        },
        'btn-emphasized': {
          DEFAULT: 'var(--color-btn-emphasized)',
          text: 'var(--color-btn-emphasized-text)',
          'text-invert': 'var(--color-btn-emphasized-text-invert)',
          hover: 'var(--color-btn-emphasized-hover)',
          focus: 'var(--color-btn-emphasized-focus)',
        },
        textDefaultColor: 'var(--color-text-default)',
        muted: 'var(--color-text-muted)',
        sub: 'var(--color-text-sub)',
        emphasized: 'var(--color-text-emphasized)',
        textPrimary: {
          DEFAULT: 'var(--color-text-primary)',
          muted: 'var(--color-text-primary-muted)',
          strong: 'var(--color-text-primary-strong)',
          hover: 'var(--color-text-primary-hover)',
          '25': 'var(--color-text-primary-25)',
          '50': 'var(--color-text-primary-50)',
          '75': 'var(--color-text-primary-75)',
        },
        textSecondary: {
          DEFAULT: 'var(--color-text-secondary)',
          muted: 'var(--color-text-secondary-muted)',
          strong: 'var(--color-text-secondary-strong)',
          hover: 'var(--color-text-secondary-hover)',
          '25': 'var(--color-text-secondary-25)',
          '50': 'var(--color-text-secondary-50)',
          '75': 'var(--color-text-secondary-75)',
        },
      },
      textColor: {
        default: 'var(--color-text-default)',
        muted: 'var(--color-text-muted)',
        sub: 'var(--color-text-sub)',
        emphasized: 'var(--color-text-emphasized)',
        placeholder: 'var(--color-text-placeholder)',
        error: 'var(--color-text-error)',
        success: 'var(--color-text-success)',
      },
    },
  },
  plugins: [
    function ({ addVariant }) {
      addVariant('mobile', '@media (max-width: 768px) { & }');
      addVariant('tablet', '@media (max-width: 1280px) { & }');
    },
  ],
};

