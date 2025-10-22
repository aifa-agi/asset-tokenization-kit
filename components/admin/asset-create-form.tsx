// File: @/components/admin/asset-create-form.tsx
// Description: Complete form for creating new property tokens
// Features: Image upload, blockchain deployment, DB save, auto-redirect

'use client'

import { useState, useEffect } from 'react'
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

  const [formData, setFormData] = useState<CreateTokenParams>({
    name: '',
    symbol: '',
    maxSupply: '',
    pricePerToken: '',
    description: '',
    imageURI: '',  // ✅ Добавлено
  })

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Размер изображения не должен превышать 5MB')
      return
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Выберите файл изображения')
      return
    }

    setImageFile(file)

    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isConnected || !address) {
      toast.error('Подключите кошелёк')
      return
    }

    if (!formData.name || !formData.symbol || !formData.maxSupply || !formData.pricePerToken) {
      toast.error('Заполните все обязательные поля')
      return
    }

    try {
      let imageUrl: string | null = null

      // Шаг 1: Загрузка изображения
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
        setUploadedImageUrl(imageUrl)

        toast.success('Изображение загружено', { id: 'image-upload' })
      }

      // Шаг 2: Создание токена в blockchain
      toast.loading('Создание токена в blockchain...', { id: 'create-token' })

      // ✅ ИСПРАВЛЕНО: передаём imageURI в hook
      const hash = await createToken({
        ...formData,
        imageURI: imageUrl || '',
      })

      toast.success('Транзакция отправлена', { id: 'create-token' })
      toast.loading('Ожидание подтверждения...', { id: 'confirm' })

    } catch (err: any) {
      console.error('Create asset error:', err)
      toast.error(err.message || 'Ошибка создания актива')
      toast.dismiss('image-upload')
      toast.dismiss('create-token')
      toast.dismiss('confirm')
    }
  }

  // Автосохранение в БД после подтверждения
  useEffect(() => {
    if (isConfirmed && newTokenAddress && !isSaving) {
      saveToDatabase()
    }
  }, [isConfirmed, newTokenAddress])

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
          imageUrl: uploadedImageUrl,
          createdBy: address,
        }),
      })

      if (!response.ok) {
        throw new Error('Ошибка сохранения в БД')
      }

      const asset = await response.json()

      toast.success('Актив успешно создан!', { id: 'save-db' })
      toast.dismiss('confirm')

      console.log('✅ Актив создан:', asset)

      // ✅ ДОБАВЛЕНО: Автоматический редирект через 2 секунды
      setTimeout(() => {
        window.location.href = '/admin'
      }, 2000)

    } catch (err: any) {
      console.error('Save to DB error:', err)
      toast.error('Ошибка сохранения в БД: ' + err.message, { id: 'save-db' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setFormData({
      name: '',
      symbol: '',
      maxSupply: '',
      pricePerToken: '',
      description: '',
      imageURI: '',
    })
    setImageFile(null)
    setImagePreview(null)
    setUploadedImageUrl(null)
    reset()
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Создать новый актив недвижимости
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Изображение */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            🖼️ Изображение объекта недвижимости
          </label>

          {imagePreview ? (
            <div className="mb-4 relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
              />
              <button
                type="button"
                onClick={() => {
                  setImageFile(null)
                  setImagePreview(null)
                  setUploadedImageUrl(null)
                }}
                className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600"
              >
                Удалить
              </button>
            </div>
          ) : (
            <div className="mb-4 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
              <div className="text-4xl mb-2">🏠</div>
              <p className="text-sm text-gray-600 mb-2">
                Нажмите, чтобы выбрать изображение
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG до 5MB
              </p>
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-sm text-gray-700 bg-white border border-gray-300 rounded-md
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-emerald-50 file:text-emerald-700
              hover:file:bg-emerald-100 cursor-pointer"
          />
          <p className="mt-2 text-xs text-gray-500">
            💡 Рекомендуемый размер: 800x600px, макс 5MB
          </p>
        </div>

        {/* Название */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            🏷️ Название объекта <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Например: Домик у моря"
            required
            className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-md 
              focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
              placeholder:text-gray-400"
          />
          <p className="mt-1 text-xs text-gray-500">
            💡 Это название будет видно инвесторам
          </p>
        </div>

        {/* Символ */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            🔖 Символ токена <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="symbol"
            value={formData.symbol}
            onChange={handleChange}
            placeholder="Например: BEACH"
            required
            maxLength={10}
            className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-md 
              focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
              placeholder:text-gray-400 uppercase"
          />
          <p className="mt-1 text-xs text-gray-500">
            💡 Уникальный код (BEACH, MTN, APT1). До 10 символов
          </p>
        </div>

        {/* Количество токенов */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            🎯 Общее количество токенов <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="maxSupply"
            value={formData.maxSupply}
            onChange={handleChange}
            placeholder="Например: 100"
            required
            min="1"
            className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-md 
              focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
              placeholder:text-gray-400"
          />
          <p className="mt-1 text-xs text-gray-500">
            💡 На сколько частей разделить объект (например, 100 токенов = 100 частей)
          </p>
        </div>

        {/* Цена */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            💰 Цена за 1 токен (USDT) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="pricePerToken"
            value={formData.pricePerToken}
            onChange={handleChange}
            placeholder="Например: 1.00"
            required
            min="0.01"
            step="0.01"
            className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-md 
              focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
              placeholder:text-gray-400"
          />
          <p className="mt-1 text-xs text-gray-500">
            💡 Цена одного токена в USDT (стейблкоин = $1)
          </p>
          {formData.maxSupply && formData.pricePerToken && (
            <p className="mt-2 text-sm font-medium text-emerald-600">
              📊 Общая стоимость объекта: {(parseInt(formData.maxSupply) * parseFloat(formData.pricePerToken)).toFixed(2)} USDT
            </p>
          )}
        </div>

        {/* Описание */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            📝 Описание объекта
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Уютный дом с видом на море, 3 спальни, терраса..."
            rows={4}
            className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-300 rounded-md 
              focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
              placeholder:text-gray-400"
          />
          <p className="mt-1 text-xs text-gray-500">
            💡 Опишите преимущества объекта для инвесторов
          </p>
        </div>

        {/* Кнопки */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={!isConnected || isCreating || isSaving}
            className="flex-1 py-4 px-6 bg-emerald-600 text-white text-lg font-semibold rounded-md
              hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed
              transition-all shadow-lg hover:shadow-xl"
          >
            {isCreating 
              ? '⏳ Создание токена...'
              : isSaving
              ? '💾 Сохранение...'
              : isConfirmed
              ? '✅ Готово!'
              : '🚀 Создать актив'}
          </button>

          {(isConfirmed || error) && (
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Сбросить
            </button>
          )}
        </div>

        {/* Предупреждение */}
        {!isConnected && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              ⚠️ Подключите кошелёк MetaMask для создания актива
            </p>
          </div>
        )}

        {/* Статус транзакции */}
        {txHash && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm font-medium text-blue-900 mb-2">
              📡 Транзакция отправлена
            </p>
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

        {/* Адрес токена */}
        {newTokenAddress && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm font-medium text-green-900 mb-2">
              🎉 Токен создан!
            </p>
            <a
              href={`https://sepolia.etherscan.io/address/${newTokenAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-green-600 hover:underline break-all"
            >
              {newTokenAddress}
            </a>
            <p className="text-xs text-green-700 mt-2">
              Перенаправление на страницу активов...
            </p>
          </div>
        )}

        {/* Ошибка */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm font-medium text-red-900 mb-1">❌ Ошибка</p>
            <p className="text-sm text-red-800">{error.message}</p>
          </div>
        )}
      </form>
    </div>
  )
}
