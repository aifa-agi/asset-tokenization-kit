// File: next.config.js
// Отключаем ESLint проверку при build на Vercel

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Отключаем ESLint во время production build
  eslint: {
    // ВАЖНО: Игнорируем ESLint ошибки при build
    ignoreDuringBuilds: true,
  },
  
  // Отключаем TypeScript проверку при build (опционально)
  typescript: {
    // ⚠️ Используйте только если уверены что код работает
    ignoreBuildErrors: false, // Оставьте false для безопасности
  },

  // Остальные настройки
  reactStrictMode: true,
  swcMinify: true,
}

module.exports = nextConfig
