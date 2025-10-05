import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import TokenBalances from '../index'
import { mockUseAccount, mockUseChainId } from '../../../test/mocks/wagmi'

// Mock the wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: mockUseAccount,
  useChainId: mockUseChainId,
}))

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
