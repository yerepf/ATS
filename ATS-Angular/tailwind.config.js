/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts,css}",
    "./src/**/*.component.{html,ts,css}",
  ],
  important: true,
  theme: {
    extend: {
      colors: {
        'custom-red': '#C44536',
      },
      fontFamily: {
        'roboto': ['Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
  safelist: [
    'bg-white',
    'text-gray-800',
    'text-red-600',
    'text-blue-600',
    'text-green-600',
    'bg-gray-100',
    'hover:bg-gray-100',
    'hover:scale-105',
    'active:scale-95',
    'transform',
    'transition-transform',
    'duration-200',
    'shadow-md',
    'shadow-lg',
    'rounded-lg',
    'p-4',
    'p-6',
    'mb-6',
    'mt-8',
    'flex',
    'justify-center',
    'items-center',
    'cursor-pointer',
    'grid',
    'grid-cols-2',
    'sm:grid-cols-3',
    'gap-4',
    'py-4',
    'text-center',
    'text-2xl',
    'font-bold',
    'container',
    'mx-auto',
    'mb-6',
    'header',
    'main',
    'article',
    'section'
  ]
} 