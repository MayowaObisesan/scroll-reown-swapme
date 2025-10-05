import { Address } from 'viem'

// 1inch API configuration
const ONE_INCH_API_BASE = 'https://api.1inch.io/v5.2'

// DEX Contract addresses (examples)
const UNISWAP_V3_ROUTER = '0xE592427A0AEce92De3Edee1F18E0157C05861564' as Address
const BASESWAP_ROUTER = '0x327Df1E6de05895d2ab08513aaDD9313fE505d86' as Address

export interface SwapQuote {
  fromToken: Address
  toToken: Address
  amount: string
  expectedOutput: string
  priceImpact: string
  fee: string
  path: Address[]
}

export interface SwapTransaction {
  to: Address
  data: string
  value: string
  gasLimit: string
}

export class SwapService {
  // 1inch integration for Ethereum
  static async get1inchQuote(
    fromToken: Address,
    toToken: Address,
    amount: string,
    fromChain: number = 1 // Ethereum
  ): Promise<SwapQuote> {
    const url = `${ONE_INCH_API_BASE}/${fromChain}/quote?fromTokenAddress=${fromToken}&toTokenAddress=${toToken}&amount=${amount}`

    const response = await fetch(url)
    const data = await response.json()

    return {
      fromToken,
      toToken,
      amount,
      expectedOutput: data.toTokenAmount,
      priceImpact: data.estimatedPriceImpact,
      fee: data.estimatedGas,
      path: data.protocols[0][0].map((p: any) => p.toTokenAddress)
    }
  }

  static async get1inchSwapTx(
    fromToken: Address,
    toToken: Address,
    amount: string,
    slippage: number = 1, // 1%
    fromChain: number = 1
  ): Promise<SwapTransaction> {
    const url = `${ONE_INCH_API_BASE}/${fromChain}/swap?fromTokenAddress=${fromToken}&toTokenAddress=${toToken}&amount=${amount}&fromAddress=${'0x0000000000000000000000000000000000000000'}&slippage=${slippage}`

    const response = await fetch(url)
    const data = await response.json()

    return {
      to: data.tx.to,
      data: data.tx.data,
      value: data.tx.value,
      gasLimit: data.tx.gas
    }
  }

  // BaseSwap integration for Base network
  static async getBaseSwapQuote(
    fromToken: Address,
    toToken: Address,
    amount: string
  ): Promise<SwapQuote> {
    // Simplified - in reality would call BaseSwap API or contract
    return {
      fromToken,
      toToken,
      amount,
      expectedOutput: amount, // placeholder
      priceImpact: '0.5',
      fee: '0.0001',
      path: [fromToken, toToken]
    }
  }

  // Scroll DEX integration (assuming Uniswap V3 on Scroll)
  static async getScrollDexQuote(
    fromToken: Address,
    toToken: Address,
    amount: string
  ): Promise<SwapQuote> {
    // Similar to BaseSwap, would integrate with Scroll's DEX
    return {
      fromToken,
      toToken,
      amount,
      expectedOutput: amount, // placeholder
      priceImpact: '0.3',
      fee: '0.00005',
      path: [fromToken, toToken]
    }
  }

  // Multi-hop routing for complex swaps
  static async findBestRoute(
    fromToken: Address,
    toToken: Address,
    amount: string,
    fromChain: number,
    toChain?: number
  ): Promise<{
    route: SwapQuote[]
    totalOutput: string
    totalFee: string
    bridges?: any[]
  }> {
    // If same chain, find best DEX route
    if (!toChain || fromChain === toChain) {
      const quotes = await Promise.all([
        this.get1inchQuote(fromToken, toToken, amount, fromChain),
        // Add other DEX quotes
      ])

      const bestQuote = quotes.reduce((best, current) =>
        parseFloat(current.expectedOutput) > parseFloat(best.expectedOutput) ? current : best
      )

      return {
        route: [bestQuote],
        totalOutput: bestQuote.expectedOutput,
        totalFee: bestQuote.fee
      }
    }

    // Cross-chain routing (simplified)
    // 1. Swap on source chain
    // 2. Bridge to destination
    // 3. Swap on destination chain

    const sourceSwap = await this.get1inchQuote(fromToken, toToken, amount, fromChain)
    const bridgeFee = '0.001' // placeholder
    const destSwap = await this.getBaseSwapQuote(toToken, toToken, sourceSwap.expectedOutput)

    return {
      route: [sourceSwap, destSwap],
      totalOutput: destSwap.expectedOutput,
      totalFee: (parseFloat(sourceSwap.fee) + parseFloat(bridgeFee) + parseFloat(destSwap.fee)).toString(),
      bridges: [] // would include bridge details
    }
  }

  // Slippage protection
  static calculateSlippageProtection(
    expectedOutput: string,
    slippageTolerance: number = 1 // 1%
  ): string {
    const slippageAmount = (parseFloat(expectedOutput) * slippageTolerance) / 100
    return (parseFloat(expectedOutput) - slippageAmount).toString()
  }

  // Price impact warning
  static getPriceImpactWarning(priceImpact: string): {
    level: 'low' | 'medium' | 'high' | 'critical'
    message: string
  } {
    const impact = parseFloat(priceImpact)

    if (impact < 1) {
      return { level: 'low', message: 'Low price impact' }
    } else if (impact < 3) {
      return { level: 'medium', message: 'Moderate price impact' }
    } else if (impact < 5) {
      return { level: 'high', message: 'High price impact - consider smaller trade' }
    } else {
      return { level: 'critical', message: 'Critical price impact - trade not recommended' }
    }
  }
}

export default SwapService
