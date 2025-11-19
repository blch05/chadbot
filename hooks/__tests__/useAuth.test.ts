import { renderHook, waitFor, act } from '@testing-library/react'
import { useAuth } from '@/hooks/useAuth'

// Mock fetch
global.fetch = jest.fn()

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('checkSession', () => {
    it('should set authenticated user when session is valid', async () => {
      const mockUser = {
        userId: '123',
        email: 'test@example.com',
        name: 'Test User',
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: true, user: mockUser }),
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.user).toEqual(mockUser)
    })

    it('should set unauthenticated when session is invalid', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        json: async () => ({ success: false }),
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeNull()
    })

    it('should handle session check errors', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      )

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeNull()
    })
  })

  describe('login', () => {
    it('should login successfully', async () => {
      const mockUser = {
        userId: '123',
        email: 'test@example.com',
        name: 'Test User',
      }

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({ success: false }), // Initial session check
        })
        .mockResolvedValueOnce({
          json: async () => ({ success: true, user: mockUser }), // Login
        })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let response: any
      await act(async () => {
        response = await result.current.login({
          email: 'test@example.com',
          password: 'password123',
        })
      })

      expect(response.success).toBe(true)
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.user).toEqual(mockUser)
    })

    it('should handle login failure', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({ success: false }), // Session check
        })
        .mockResolvedValueOnce({
          json: async () => ({
            success: false,
            message: 'Invalid credentials',
          }),
        })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const response = await result.current.login({
        email: 'test@example.com',
        password: 'wrong',
      })

      expect(response.success).toBe(false)
      expect(response.message).toBe('Invalid credentials')
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('should handle login network errors', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({ success: false }),
        })
        .mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const response = await result.current.login({
        email: 'test@example.com',
        password: 'password',
      })

      expect(response.success).toBe(false)
      expect(response.message).toBe('Error de conexión')
    })
  })

  describe('register', () => {
    it('should register successfully', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({ success: false }), // Session check
        })
        .mockResolvedValueOnce({
          json: async () => ({
            success: true,
            message: 'User registered',
          }),
        })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const response = await result.current.register({
        name: 'New User',
        email: 'new@example.com',
        password: 'Password123',
      })

      expect(response.success).toBe(true)
      expect(response.message).toBe('User registered')
    })

    it('should handle registration errors', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({ success: false }),
        })
        .mockResolvedValueOnce({
          json: async () => ({
            success: false,
            message: 'Email already exists',
          }),
        })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const response = await result.current.register({
        name: 'Test',
        email: 'existing@example.com',
        password: 'Password123',
      })

      expect(response.success).toBe(false)
      expect(response.message).toBe('Email already exists')
    })
  })

  describe('logout', () => {
    it('should logout successfully', async () => {
      const mockUser = {
        userId: '123',
        email: 'test@example.com',
        name: 'Test User',
      }

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({ success: true, user: mockUser }), // Session check
        })
        .mockResolvedValueOnce({}) // Logout

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
        expect(result.current.isAuthenticated).toBe(true)
      })

      await act(async () => {
        await result.current.logout()
      })

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeNull()
    })

    it('should handle logout errors gracefully', async () => {
      const mockUser = {
        userId: '123',
        email: 'test@example.com',
        name: 'Test User',
      }

      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({ success: true, user: mockUser }),
        })
        .mockRejectedValueOnce(new Error('Logout failed'))

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
      })

      // Logout call should not throw even if API fails
      await act(async () => {
        await result.current.logout()
      })

      // When logout fails, state remains unchanged (user still authenticated)
      // This is the actual behavior of the hook - it only clears state on successful logout
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.user).toEqual(mockUser)
    })
  })
})
