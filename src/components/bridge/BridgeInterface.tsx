'use client'

import { useState } from 'react'
import { Button } from "@heroui/button"
import { Input } from "@heroui/input"
import { Select, SelectItem } from "@heroui/select"
import { Card, CardBody, CardHeader } from "@heroui/card"
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
    // Bridge functionality is not implemented yet
    alert('Bridge functionality is coming soon! This is a placeholder implementation.')
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
            selectedKeys={fromChain ? [fromChain] : []}
            onSelectionChange={(keys) => setFromChain(Array.from(keys)[0] as string)}
          >
            {SUPPORTED_CHAINS.map((chain) => (
              <SelectItem key={chain.id.toString()}>
                {chain.name}
              </SelectItem>
            ))}
          </Select>

          <Select
            label="To Chain"
            placeholder="Select destination chain"
            selectedKeys={toChain ? [toChain] : []}
            onSelectionChange={(keys) => setToChain(Array.from(keys)[0] as string)}
          >
            {SUPPORTED_CHAINS.map((chain) => (
              <SelectItem key={chain.id.toString()}>
                {chain.name}
              </SelectItem>
            ))}
          </Select>
        </div>

        <Select
          label="Bridge Protocol"
          placeholder="Select bridge"
          selectedKeys={bridgeType ? [bridgeType] : []}
          onSelectionChange={(keys) => setBridgeType(Array.from(keys)[0] as string)}
        >
          {BRIDGE_TYPES.map((bridge) => (
            <SelectItem key={bridge.key}>
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
