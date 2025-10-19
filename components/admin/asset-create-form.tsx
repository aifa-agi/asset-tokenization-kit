// File: @/components/admin/asset-create-form.tsx
// Описание: Форма для создания нового токена недвижимости
// Шаги: 1) Загрузка изображения, 2) Создание токена в blockchain, 3) Сохранение в БД


'use client'

import { useState } from 'react'

import { useWeb3Status } from '@/providers/web-3-provider'
import { toast } from 'sonner'
import { CreateTokenParams, usePropertyTokenFactory } from '@/lib/hooks/use-property-token-factory'

export function AssetCreateForm() {
  const { address, isConnected } = useWeb3Status()
  const {
    createToken,
    isCreating,
    isConfirmed,
    newTokenAddress,
    txHash,
    error,
    reset,
  } = usePropertyTokenFactory()

  // Состояние формы
  const [formData, setFormData] = useState<CreateTokenParams>({
    name: '',
    symbol: '',
    maxSupply: '',
    pricePerToken: '',
    description: '',
  })

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Обработка изменения полей формы
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Обработка загрузки изображения
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Проверка размера (макс 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Размер изображения не должен превышать 5MB')
      return
    }

    // Проверка типа
    if (!file.type.startsWith('image/')) {
      toast.error('Выберите файл изображения')
      return
    }

    setImageFile(file)

    // Создание preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Обработка отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isConnected || !address) {
      toast.error('Подключите кошелёк')
      return
    }

    // Валидация
    if (!formData.name || !formData.symbol || !formData.maxSupply || !formData.pricePerToken) {
      toast.error('Заполните все обязательные поля')
      return
    }

    try {
      // Шаг 1: Загрузка изображения (если есть)
      let imageUrl: string | null = null

      if (imageFile) {
        toast.loading('Загрузка изображения...', { id: 'image-upload' })

        const uploadFormData = new FormData()
        uploadFormData.append('file', imageFile)

        const uploadRes = await fetch('/api/upload-image', {
          method: 'POST',
          body: uploadFormData,
        })

        if (!uploadRes.ok) {
          throw new Error('Ошибка загрузки изображения')
        }

        const uploadData = await uploadRes.json()
        imageUrl = uploadData.url

        toast.success('Изображение загружено', { id: 'image-upload' })
      }

      // Шаг 2: Создание токена в blockchain
      toast.loading('Создание токена в blockchain...', { id: 'create-token' })

      const hash = await createToken(formData)

      toast.success('Транзакция отправлена', { id: 'create-token' })
      toast.loading('Ожидание подтверждения...', { id: 'confirm' })

      // Ждём подтверждения (через useEffect в хуке)
      // После подтверждения newTokenAddress будет установлен

    } catch (err: any) {
      console.error('Create asset error:', err)
      toast.error(err.message || 'Ошибка создания актива')
      toast.dismiss('image-upload')
      toast.dismiss('create-token')
      toast.dismiss('confirm')
    }
  }

  // Сохранение в БД после подтверждения транзакции
  const saveToDatabase = async () => {
    if (!newTokenAddress) return

    setIsSaving(true)
    toast.loading('Сохранение в базу данных...', { id: 'save-db' })

    try {
      const response = await fetch('/api/assets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractAddress: newTokenAddress,
          name: formData.name,
          symbol: formData.symbol,
          description: formData.description,
          totalTokens: parseInt(formData.maxSupply),
          pricePerToken: parseFloat(formData.pricePerToken),
          imageUrl: imagePreview, // Временно используем preview (потом будет Vercel Blob)
          createdBy: address,
        }),
      })

      if (!response.ok) {
        throw new Error('Ошибка сохранения в БД')
      }

      const asset = await response.json()

      toast.success('Актив успешно создан!', { id: 'save-db' })
      toast.dismiss('confirm')

      // Сброс формы
      setFormData({
        name: '',
        symbol: '',
        maxSupply: '',
        pricePerToken: '',
        description: '',
      })
      setImageFile(null)
      setImagePreview(null)
      reset()

      console.log('✅ Актив создан:', asset)

    } catch (err: any) {
      console.error('Save to DB error:', err)
      toast.error('Ошибка сохранения в БД: ' + err.message, { id: 'save-db' })
    } finally {
      setIsSaving(false)
    }
  }

  // Автосохранение в БД после подтверждения
  if (isConfirmed && newTokenAddress && !isSaving) {
    saveToDatabase()
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Создать новый актив</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Изображение */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Изображение домика
          </label>

          {imagePreview && (
            <div className="mb-4">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-emerald-50 file:text-emerald-700
              hover:file:bg-emerald-100"
          />
          <p className="mt-1 text-xs text-gray-500">
            Рекомендуемый размер: 800x600px, макс 5MB
          </p>
        </div>

        {/* Название */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Название актива *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Домик у моря"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Символ */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Символ токена *
          </label>
          <input
            type="text"
            name="symbol"
            value={formData.symbol}
            onChange={handleChange}
            placeholder="HOUSE1"
            required
            maxLength={10}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 uppercase"
          />
          <p className="mt-1 text-xs text-gray-500">
            Уникальный идентификатор (например HOUSE1, APT2)
          </p>
        </div>

        {/* Количество токенов */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Количество токенов *
          </label>
          <input
            type="number"
            name="maxSupply"
            value={formData.maxSupply}
            onChange={handleChange}
            placeholder="10"
            required
            min="1"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Сколько токенов будет доступно для покупки
          </p>
        </div>

        {/* Цена за токен */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Цена за 1 токен (USDT) *
          </label>
          <input
            type="number"
            name="pricePerToken"
            value={formData.pricePerToken}
            onChange={handleChange}
            placeholder="1.0"
            required
            min="0.01"
            step="0.01"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Стоимость одного токена в USDT
          </p>
        </div>

        {/* Описание */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Описание
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Уютный дом с видом на море..."
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Кнопка отправки */}
        <button
          type="submit"
          disabled={!isConnected || isCreating || isSaving}
          className="w-full py-3 px-6 bg-emerald-600 text-white rounded-md font-semibold
            hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed
            transition-colors"
        >
          {isCreating 
            ? '⏳ Создание токена...'
            : isSaving
            ? '💾 Сохранение...'
            : isConfirmed
            ? '✅ Актив создан!'
            : 'Создать актив'}
        </button>

        {/* Статус транзакции */}
        {txHash && (
          <div className="p-4 bg-blue-50 rounded-md">
            <p className="text-sm font-medium mb-1">Транзакция отправлена</p>
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline break-all"
            >
              {txHash}
            </a>
          </div>
        )}

        {/* Адрес нового токена */}
        {newTokenAddress && (
          <div className="p-4 bg-green-50 rounded-md">
            <p className="text-sm font-medium mb-1">Адрес нового токена</p>
            <a
              href={`https://sepolia.etherscan.io/address/${newTokenAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-green-600 hover:underline break-all"
            >
              {newTokenAddress}
            </a>
          </div>
        )}

        {/* Ошибка */}
        {error && (
          <div className="p-4 bg-red-50 rounded-md">
            <p className="text-sm text-red-800">{error.message}</p>
          </div>
        )}
      </form>
    </div>
  )
}
