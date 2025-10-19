// File: @/app/architect/deploy/page.tsx
// ИСПРАВЛЕННАЯ ВЕРСИЯ - добавлен args параметр


'use client'

import { useState, useEffect } from 'react'
import { useWeb3Status } from '@/providers/web-3-provider'
import { useDeployContract, usePublicClient } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  Rocket,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'

interface CompiledContract {
  name: string
  abi: any[]
  bytecode: string
}

type DeployStatus = 'idle' | 'loading' | 'deploying' | 'confirming' | 'success' | 'error'

export default function ArchitectDeployPage() {
  const { address, isConnected, chainId, switchToSepolia } = useWeb3Status()
  const publicClient = usePublicClient()

  const [contracts, setContracts] = useState<CompiledContract[]>([])
  const [loadingContracts, setLoadingContracts] = useState(true)
  const [deployStatus, setDeployStatus] = useState<DeployStatus>('idle')
  const [currentContract, setCurrentContract] = useState<string | null>(null)
  const [deployedAddresses, setDeployedAddresses] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  // Загрузка скомпилированных контрактов из GitHub
  useEffect(() => {
    loadCompiledContracts()
  }, [])

  const loadCompiledContracts = async () => {
    try {
      setLoadingContracts(true)

      // Загружаем список контрактов
      const contractNames = ['PropertyTokenFactory', 'MockUSDT']
      const loadedContracts: CompiledContract[] = []

      for (const name of contractNames) {
        try {
          const response = await fetch(`/api/contracts/compiled/${name}`)

          if (response.ok) {
            const contract = await response.json()
            loadedContracts.push(contract)
          }
        } catch (e) {
          console.warn(`Failed to load ${name}`)
        }
      }

      setContracts(loadedContracts)
      console.log('✅ Loaded contracts:', loadedContracts.length)

    } catch (err: any) {
      console.error('Failed to load contracts:', err)
      toast.error('Failed to load compiled contracts')
    } finally {
      setLoadingContracts(false)
    }
  }

  // Deploy контракта через wagmi
  const { deployContractAsync } = useDeployContract()

  const deployContract = async (contract: CompiledContract) => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet')
      return
    }

    if (chainId !== sepolia.id) {
      toast.error('Please switch to Sepolia network', {
        action: {
          label: 'Switch',
          onClick: () => switchToSepolia(),
        },
      })
      return
    }

    setCurrentContract(contract.name)
    setDeployStatus('deploying')
    setError(null)

    const toastId = toast.loading(`Deploying ${contract.name}...`)

    try {
      console.log(`🚀 Deploying ${contract.name}...`)

      // ✅ ИСПРАВЛЕНО: Добавлен args параметр (пустой массив если нет конструктора)
      const hash = await deployContractAsync({
        abi: contract.abi,
        bytecode: contract.bytecode as `0x${string}`,
        args: [], // ✅ Обязательный параметр для wagmi v2
      })

      console.log(`📤 Transaction sent: ${hash}`)

      toast.success('Transaction sent!', { id: toastId })
      toast.loading('Waiting for confirmation...', { id: 'confirm' })

      setDeployStatus('confirming')

      // Ждём подтверждения
      const receipt = await publicClient?.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      })

      if (!receipt) {
        throw new Error('Receipt not found')
      }

      const contractAddress = receipt.contractAddress

      if (!contractAddress) {
        throw new Error('Contract address not found in receipt')
      }

      console.log(`✅ ${contract.name} deployed: ${contractAddress}`)

      // Сохраняем адрес
      setDeployedAddresses(prev => ({
        ...prev,
        [contract.name]: contractAddress,
      }))

      toast.success(`${contract.name} deployed successfully!`, { id: 'confirm' })

      setDeployStatus('success')

      // Сохраняем адрес в .env через API
      await saveContractAddress(contract.name, contractAddress)

    } catch (err: any) {
      console.error(`❌ Deploy error:`, err)

      let errorMessage = err.message || 'Deployment failed'

      if (err.message?.includes('User rejected')) {
        errorMessage = 'Transaction rejected by user'
      } else if (err.message?.includes('insufficient')) {
        errorMessage = 'Insufficient funds for gas'
      }

      setError(errorMessage)
      setDeployStatus('error')
      toast.error(errorMessage, { id: toastId })
      toast.dismiss('confirm')
    }
  }

  // Сохранение адреса в .env через API
  const saveContractAddress = async (contractName: string, address: string) => {
    try {
      const response = await fetch('/api/contracts/save-address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractName, address }),
      })

      if (!response.ok) {
        console.warn('Failed to save address to GitHub')
      } else {
        console.log('✅ Address saved to GitHub')
      }
    } catch (err) {
      console.warn('Failed to save address:', err)
    }
  }

  // Deploy всех контрактов по очереди
  const deployAll = async () => {
    for (const contract of contracts) {
      if (!deployedAddresses[contract.name]) {
        await deployContract(contract)

        // Пауза между деплоями
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
  }

  // Проверка готовности
  const allDeployed = contracts.every(c => deployedAddresses[c.name])

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          🚀 Deploy Contracts
        </h1>
        <p className="text-gray-600 mt-2">
          Deploy smart contracts to Sepolia testnet via MetaMask
        </p>
      </div>

      {/* Network Check */}
      {isConnected && chainId !== sepolia.id && (
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div className="flex-1">
                <p className="font-medium text-orange-900">Wrong Network</p>
                <p className="text-sm text-orange-700">
                  Please switch to Sepolia testnet
                </p>
              </div>
              <Button onClick={switchToSepolia} variant="outline" size="sm">
                Switch Network
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contracts List */}
      {loadingContracts ? (
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading compiled contracts...</span>
            </div>
          </CardContent>
        </Card>
      ) : contracts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No compiled contracts found</p>
            <Button onClick={() => window.location.href = '/architect/upload'}>
              Upload Contracts
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {contracts.map((contract, index) => {
            const isDeployed = !!deployedAddresses[contract.name]
            const isCurrent = currentContract === contract.name

            return (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {contract.name}
                        {isDeployed && (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                      </CardTitle>
                      <CardDescription>
                        {isDeployed
                          ? 'Deployed successfully'
                          : 'Ready to deploy'}
                      </CardDescription>
                    </div>

                    {!isDeployed && (
                      <Button
                        onClick={() => deployContract(contract)}
                        disabled={
                          !isConnected ||
                          chainId !== sepolia.id ||
                          deployStatus === 'deploying' ||
                          deployStatus === 'confirming'
                        }
                      >
                        {isCurrent && deployStatus === 'deploying' ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Deploying...
                          </>
                        ) : isCurrent && deployStatus === 'confirming' ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Confirming...
                          </>
                        ) : (
                          <>
                            <Rocket className="h-4 w-4 mr-2" />
                            Deploy
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardHeader>

                {isDeployed && (
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">Address:</span>
                      <code className="bg-gray-100 px-2 py-1 rounded font-mono text-xs">
                        {deployedAddresses[contract.name]}
                      </code>
                      <a
                        href={`https://sepolia.etherscan.io/address/${deployedAddresses[contract.name]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Deploy All Button */}
      {contracts.length > 0 && !allDeployed && (
        <Button
          onClick={deployAll}
          disabled={
            !isConnected ||
            chainId !== sepolia.id ||
            deployStatus === 'deploying' ||
            deployStatus === 'confirming'
          }
          className="w-full"
          size="lg"
        >
          Deploy All Contracts
        </Button>
      )}

      {/* Success Message */}
      {allDeployed && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-medium text-green-900">
                  All contracts deployed successfully!
                </p>
                <p className="text-sm text-green-700">
                  Contract addresses saved to environment variables
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
