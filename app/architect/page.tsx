// File: @/app/architect/page.tsx
// Описание: Главная страница режима Архитектора (панель управления)

'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, Rocket, Settings } from 'lucide-react'

export default function ArchitectDashboardPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Заголовок */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          🏗️ Панель Архитектора
        </h1>
        <p className="text-gray-600 mt-2">
          Настройка и развертывание смарт-контрактов для платформы токенизации
        </p>
      </div>

      {/* Карточки статуса */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Шаг 1 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Upload className="h-5 w-5 text-blue-600" />
              Шаг 1: Загрузка
            </CardTitle>
            <CardDescription>
              Загрузить Solidity контракты
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/architect/upload">
              <Button className="w-full">
                Загрузить контракты
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Шаг 2 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="h-5 w-5 text-orange-600" />
              Шаг 2: Компиляция
            </CardTitle>
            <CardDescription>
              Автоматически через Tenderly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" disabled className="w-full">
              Автоматическая компиляция
            </Button>
          </CardContent>
        </Card>

        {/* Шаг 3 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Rocket className="h-5 w-5 text-green-600" />
              Шаг 3: Развертывание
            </CardTitle>
            <CardDescription>
              Деплой в Sepolia testnet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/architect/deploy">
              <Button variant="outline" className="w-full">
                Развернуть контракты
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Инструкции */}
      <Card>
        <CardHeader>
          <CardTitle>Краткое руководство</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </span>
              <div>
                <p className="font-medium">Загрузите ваши Solidity контракты</p>
                <p className="text-sm text-gray-600">
                  PropertyToken.sol, PropertyTokenFactory.sol и MockUSDT.sol
                </p>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </span>
              <div>
                <p className="font-medium">Автоматическая компиляция</p>
                <p className="text-sm text-gray-600">
                  Контракты компилируются через Tenderly API автоматически
                </p>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </span>
              <div>
                <p className="font-medium">Развертывание в Sepolia</p>
                <p className="text-sm text-gray-600">
                  Используйте MetaMask для развертывания контрактов в Sepolia testnet
                </p>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                4
              </span>
              <div>
                <p className="font-medium">Сохранение адресов контрактов</p>
                <p className="text-sm text-gray-600">
                  Адреса автоматически сохраняются в переменные окружения
                </p>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
