import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import TokenBalances from '../index'
import '../../../test/mocks/wagmi'
import { mockUseAccount, mockUseChainId } from '../../../test/mocks/wagmi'

describe('TokenBalances', () => {
  it('renders loading state when wallet is connected', () => {
    mockUseAccount.mockReturnValue({
      address: '0x123',
      isConnected: true,
    })
    mockUseChainId.mockReturnValue(534351) // Scroll Sepolia

    render(<TokenBalances />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders connect wallet message when not connected', () => {
    mockUseAccount.mockReturnValue({
      address: undefined,
      isConnected: false,
    })
    mockUseChainId.mockReturnValue(534351)

    render(<TokenBalances />)

    expect(screen.getByText('Connect your wallet to see your tokens')).toBeInTheDocument()
  })
})
