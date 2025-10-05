'use client'

import { useState } from 'react'
import { Button } from '@nextui-org/button'
import { Input } from '@nextui-org/input'
import { Select, SelectItem } from '@nextui-org/select'
import { Card, CardBody, CardHeader } from '@nextui-org/card'
import { useAccount, useWriteContract } from 'wagmi'
import { parseEther } from 'viem'
import BridgeService from '../../utils/bridgeUtils'

const SUPPORTED_CHAINS = [
  { id: 1, name: 'Ethereum' },
  { id: 534352, name: 'Scroll' },
  { id: 8453, name: 'Base' }
]

const BRIDGE_TYPES = [
  { key: 'scroll', label: 'Scroll Bridge' },
  { key: 'base', label: 'Base Bridge' },
  { key: 'hop', label: 'Hop Protocol' },
  { key: 'across', label: 'Across Protocol' }
]

export default function BridgeInterface() {
  const { address } = useAccount()
  const { writeContract } = useWriteContract()

  const [fromChain, setFromChain] = useState('')
  const [toChain, setToChain] = useState('')
  const [amount, setAmount] = useState('')
  const [tokenAddress, setTokenAddress] = useState('')
  const [bridgeType, setBridgeType] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [estimatedFee, setEstimatedFee] = useState<string>('')

  const handleEstimateFee = async () => {
    if (!amount || !tokenAddress || !fromChain || !toChain || !bridgeType) return

    try {
      const fee = await BridgeService.estimateBridgeFee(
        amount,
        tokenAddress as `0x${string}`,
        parseInt(fromChain),
        parseInt(toChain),
        bridgeType as any
      )
      setEstimatedFee(fee)
    } catch (error) {
      console.error('Fee estimation failed:', error)
    }
  }

  const handleBridge = async () => {
    if (!address || !amount || !tokenAddress || !fromChain || !toChain || !bridgeType) return

    setIsLoading(true)
    try {
      let txHash: string

      switch (bridgeType) {
        case 'scroll':
          txHash = await BridgeService.bridgeToScroll(
            amount,
            tokenAddress as `0x${string}`,
            parseInt(fromChain),
            parseInt(toChain)
          )
          break
        case 'base':
          txHash = await BridgeService.bridgeToBase(
            amount,
            tokenAddress as `0x${string}`,
            parseInt(fromChain),
            parseInt(toChain)
          )
          break
        case 'hop':
          txHash = await BridgeService.bridgeViaHop(
            amount,
            tokenAddress as `0x${string}`,
            parseInt(fromChain),
            parseInt(toChain)
          )
          break
        case 'across':
          txHash = await BridgeService.bridgeViaAcross(
            amount,
            tokenAddress as `0x${string}`,
            parseInt(fromChain),
            parseInt(toChain)
          )
          break
        default:
          throw new Error('Unsupported bridge type')
      }

      // Store transaction for tracking
      const transaction: any = {
        id: txHash,
        fromChain: parseInt(fromChain),
        toChain: parseInt(toChain),
        amount,
        token: tokenAddress,
        user: address,
        status: 'pending',
        txHash,
        timestamp: Date.now()
      }

      console.log('Bridge transaction initiated:', transaction)
      alert(`Bridge transaction submitted! Hash: ${txHash}`)
    } catch (error) {
      console.error('Bridge failed:', error)
      alert('Bridge transaction failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <h2 className="text-xl font-bold">Cross-Chain Bridge</h2>
      </CardHeader>
      <CardBody className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="From Chain"
            placeholder="Select source chain"
            value={fromChain}
            onChange={(e) => setFromChain(e.target.value)}
          >
            {SUPPORTED_CHAINS.map((chain) => (
              <SelectItem key={chain.id.toString()} value={chain.id.toString()}>
                {chain.name}
              </SelectItem>
            ))}
          </Select>

          <Select
            label="To Chain"
            placeholder="Select destination chain"
            value={toChain}
            onChange={(e) => setToChain(e.target.value)}
          >
            {SUPPORTED_CHAINS.map((chain) => (
              <SelectItem key={chain.id.toString()} value={chain.id.toString()}>
                {chain.name}
              </SelectItem>
            ))}
          </Select>
        </div>

        <Select
          label="Bridge Protocol"
          placeholder="Select bridge"
          value={bridgeType}
          onChange={(e) => setBridgeType(e.target.value)}
        >
          {BRIDGE_TYPES.map((bridge) => (
            <SelectItem key={bridge.key} value={bridge.key}>
              {bridge.label}
            </SelectItem>
          ))}
        </Select>

        <Input
          label="Token Address"
          placeholder="0x..."
          value={tokenAddress}
          onChange={(e) => setTokenAddress(e.target.value)}
        />

        <Input
          label="Amount"
          placeholder="0.0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          type="number"
        />

        {estimatedFee && (
          <div className="text-sm text-gray-600">
            Estimated Fee: {estimatedFee} ETH
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleEstimateFee}
            disabled={!amount || !tokenAddress || !fromChain || !toChain || !bridgeType}
          >
            Estimate Fee
          </Button>

          <Button
            onClick={handleBridge}
            disabled={!address || !amount || !tokenAddress || !fromChain || !toChain || !bridgeType || isLoading}
            color="primary"
          >
            {isLoading ? 'Bridging...' : 'Bridge Tokens'}
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}
