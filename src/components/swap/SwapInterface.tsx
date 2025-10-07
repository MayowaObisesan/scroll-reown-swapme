'use client'

import { useState, useEffect } from 'react'
import { Button } from "@heroui/button"
import { Input } from "@heroui/input"
import { Select, SelectItem } from "@heroui/select"
import { Card, CardBody, CardHeader } from "@heroui/card"
import { Chip } from "@heroui/chip"
import { useAccount, useWriteContract } from 'wagmi'
import SwapService, { SwapQuote } from '../../utils/swapUtils'

const SUPPORTED_TOKENS = [
  { address: '0x0000000000000000000000000000000000000000', symbol: 'ETH' },
  { address: '0xA0b86a33E6441e88C5F2712C3E9b74F5b8b6b8b8', symbol: 'USDC' },
  // Add more tokens
]

const DEX_OPTIONS = [
  { key: '1inch', label: '1inch (Ethereum)' },
  { key: 'baseswap', label: 'BaseSwap (Base)' },
  { key: 'scroll-dex', label: 'Scroll DEX' }
]

export default function SwapInterface() {
  const { address } = useAccount()
  const { writeContract } = useWriteContract()

  const [fromToken, setFromToken] = useState('')
  const [toToken, setToToken] = useState('')
  const [amount, setAmount] = useState('')
  const [slippage, setSlippage] = useState('1')
  const [dex, setDex] = useState('1inch')
  const [quote, setQuote] = useState<SwapQuote | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [priceImpactWarning, setPriceImpactWarning] = useState<{
    level: string
    message: string
  } | null>(null)

  const handleGetQuote = async () => {
    if (!fromToken || !toToken || !amount) return

    setIsLoading(true)
    try {
      let quoteResult: SwapQuote

      switch (dex) {
        case '1inch':
          quoteResult = await SwapService.get1inchQuote(
            fromToken as `0x${string}`,
            toToken as `0x${string}`,
            amount
          )
          break
        case 'baseswap':
          quoteResult = await SwapService.getBaseSwapQuote(
            fromToken as `0x${string}`,
            toToken as `0x${string}`,
            amount
          )
          break
        case 'scroll-dex':
          quoteResult = await SwapService.getScrollDexQuote(
            fromToken as `0x${string}`,
            toToken as `0x${string}`,
            amount
          )
          break
        default:
          throw new Error('Unsupported DEX')
      }

      setQuote(quoteResult)
      setPriceImpactWarning(SwapService.getPriceImpactWarning(quoteResult.priceImpact))
    } catch (error) {
      console.error('Quote failed:', error)
      alert('Failed to get quote')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSwap = async () => {
    if (!address || !quote) return

    setIsLoading(true)
    try {
      let txData: any

      if (dex === '1inch') {
        txData = await SwapService.get1inchSwapTx(
          quote.fromToken,
          quote.toToken,
          quote.amount,
          parseFloat(slippage)
        )
      } else {
        // For other DEXes, would need to construct the transaction
        throw new Error('Direct swap not implemented for this DEX')
      }

      // Execute the swap
      writeContract({
        address: txData.to,
        abi: [], // Would need the DEX router ABI
        functionName: 'execute', // placeholder
        args: [],
        value: BigInt(txData.value)
      })

      alert('Swap transaction submitted!')
    } catch (error) {
      console.error('Swap failed:', error)
      alert('Swap transaction failed')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (amount && fromToken && toToken) {
      handleGetQuote()
    }
  }, [amount, fromToken, toToken, dex])

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <h2 className="text-xl font-bold">Cross-Chain Swap</h2>
      </CardHeader>
      <CardBody className="space-y-4">
        <Select
          label="DEX"
          placeholder="Select DEX"
          selectedKeys={dex ? [dex] : []}
          onSelectionChange={(keys) => setDex(Array.from(keys)[0] as string)}
        >
          {DEX_OPTIONS.map((option) => (
            <SelectItem key={option.key}>
              {option.label}
            </SelectItem>
          ))}
        </Select>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="From Token"
            placeholder="Select token"
            selectedKeys={fromToken ? [fromToken] : []}
            onSelectionChange={(keys) => setFromToken(Array.from(keys)[0] as string)}
          >
            {SUPPORTED_TOKENS.map((token) => (
              <SelectItem key={token.address}>
                {token.symbol}
              </SelectItem>
            ))}
          </Select>

          <Select
            label="To Token"
            placeholder="Select token"
            selectedKeys={toToken ? [toToken] : []}
            onSelectionChange={(keys) => setToToken(Array.from(keys)[0] as string)}
          >
            {SUPPORTED_TOKENS.map((token) => (
              <SelectItem key={token.address}>
                {token.symbol}
              </SelectItem>
            ))}
          </Select>
        </div>

        <Input
          label="Amount"
          placeholder="0.0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          type="number"
        />

        <Input
          label="Slippage Tolerance (%)"
          placeholder="1.0"
          value={slippage}
          onChange={(e) => setSlippage(e.target.value)}
          type="number"
          step="0.1"
        />

        {quote && (
          <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between">
              <span>Expected Output:</span>
              <span>{quote.expectedOutput}</span>
            </div>
            <div className="flex justify-between">
              <span>Price Impact:</span>
              <span>{quote.priceImpact}%</span>
            </div>
            <div className="flex justify-between">
              <span>Fee:</span>
              <span>{quote.fee} ETH</span>
            </div>
            {priceImpactWarning && (
              <Chip
                color={
                  priceImpactWarning.level === 'low' ? 'success' :
                  priceImpactWarning.level === 'medium' ? 'warning' :
                  priceImpactWarning.level === 'high' ? 'danger' : 'danger'
                }
                size="sm"
              >
                {priceImpactWarning.message}
              </Chip>
            )}
          </div>
        )}

        <Button
          onClick={handleSwap}
          disabled={!address || !quote || isLoading || priceImpactWarning?.level === 'critical'}
          color="primary"
          className="w-full"
        >
          {isLoading ? 'Swapping...' : 'Swap Tokens'}
        </Button>
      </CardBody>
    </Card>
  )
}
