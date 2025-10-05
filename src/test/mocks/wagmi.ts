import { vi } from 'vitest'

// Mock wagmi hooks
export const mockUseAccount = vi.fn()
export const mockUseChainId = vi.fn()
export const mockUseConnect = vi.fn()
export const mockUseDisconnect = vi.fn()

vi.mock('wagmi', () => ({
  useAccount: mockUseAccount,
  useChainId: mockUseChainId,
  useConnect: mockUseConnect,
  useDisconnect: mockUseDisconnect,
}))
