// File: @/app/page.tsx
// Описание: Главная страница (Landing)
// Содержит: Hero, Features, How it works, CTA


'use client'

import Link from 'next/link'
import { Navigation } from '@/components/shared/navigation'
import { useWeb3Status } from '@/providers/web-3-provider'

export default function HomePage() {
  const { isConnected } = useWeb3Status()

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50">
     
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Токенизация недвижимости
            <br />
            <span className="text-emerald-600">нового поколения</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Инвестируйте в недвижимость с помощью blockchain технологий.
            Покупайте доли в реальных активах за считанные секунды.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/investor"
              className="px-8 py-4 bg-emerald-600 text-white font-semibold rounded-lg
                hover:bg-emerald-700 transition-colors shadow-lg"
            >
              🚀 Начать инвестировать
            </Link>

            <Link
              href="/admin"
              className="px-8 py-4 bg-white text-emerald-600 font-semibold rounded-lg
                border-2 border-emerald-600 hover:bg-emerald-50 transition-colors"
            >
              ⚙️ Создать актив
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-white rounded-lg shadow-md">
              <div className="text-3xl font-bold text-emerald-600 mb-2">$1</div>
              <div className="text-gray-600">Минимальная инвестиция</div>
            </div>

            <div className="p-6 bg-white rounded-lg shadow-md">
              <div className="text-3xl font-bold text-emerald-600 mb-2">24/7</div>
              <div className="text-gray-600">Торговля активами</div>
            </div>

            <div className="p-6 bg-white rounded-lg shadow-md">
              <div className="text-3xl font-bold text-emerald-600 mb-2">100%</div>
              <div className="text-gray-600">Прозрачность сделок</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">
            Почему выбирают нас?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold mb-3">Безопасность</h3>
              <p className="text-gray-600">
                Все транзакции защищены технологией blockchain.
                Смарт-контракты проверены и аудированы.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold mb-3">Скорость</h3>
              <p className="text-gray-600">
                Мгновенные сделки без посредников.
                Покупайте и продавайте токены за секунды.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">💎</div>
              <h3 className="text-xl font-semibold mb-3">Доступность</h3>
              <p className="text-gray-600">
                Инвестируйте с любой суммой.
                Дробное владение недвижимостью для всех.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-3">Прозрачность</h3>
              <p className="text-gray-600">
                Вся история транзакций доступна в blockchain.
                Полная прозрачность владения активами.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">🌍</div>
              <h3 className="text-xl font-semibold mb-3">Глобальность</h3>
              <p className="text-gray-600">
                Инвестируйте из любой точки мира.
                Нет границ для ваших инвестиций.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-3">Простота</h3>
              <p className="text-gray-600">
                Интуитивный интерфейс.
                Покупка токенов проще, чем онлайн-шопинг.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">
            Как это работает?
          </h2>

          <div className="space-y-8">
            {/* Step 1 */}
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Подключите кошелёк</h3>
                <p className="text-gray-600">
                  Используйте MetaMask или другой Web3 кошелёк для подключения к платформе.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Выберите актив</h3>
                <p className="text-gray-600">
                  Изучите каталог доступных объектов недвижимости и выберите подходящий.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Купите токены</h3>
                <p className="text-gray-600">
                  Укажите количество токенов и подтвердите транзакцию в кошельке.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-xl">
                4
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Получайте доход</h3>
                <p className="text-gray-600">
                  Владейте долей в недвижимости и получайте прибыль от аренды или продажи.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-emerald-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-6">
            Готовы начать инвестировать?
          </h2>
          
          <p className="text-xl mb-10 opacity-90">
            Присоединяйтесь к новому поколению инвесторов в недвижимость
          </p>

          <Link
            href={isConnected ? '/investor' : '/investor'}
            className="inline-block px-8 py-4 bg-white text-emerald-600 font-semibold rounded-lg
              hover:bg-gray-100 transition-colors shadow-lg"
          >
            🚀 Начать прямо сейчас
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-4">
            <span className="text-2xl">🏘️</span>
            <span className="ml-2 font-bold">Property Token</span>
          </div>
          
          <p className="text-gray-400 text-sm mb-4">
            Платформа токенизации недвижимости на базе blockchain
          </p>

          <div className="flex justify-center gap-6 text-sm text-gray-400">
            <a href="https://sepolia.etherscan.io" target="_blank" rel="noopener noreferrer" className="hover:text-white">
              Etherscan
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">
              GitHub
            </a>
            <a href="/api/health" target="_blank" className="hover:text-white">
              Status
            </a>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-800 text-xs text-gray-500">
            © 2025 Property Token. Built with Next.js & Blockchain.
          </div>
        </div>
      </footer>
    </div>
  )
}
