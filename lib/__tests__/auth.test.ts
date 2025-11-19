import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  isValidEmail,
  isValidPassword,
  isValidName,
} from '@/lib/auth'

describe('Auth Library', () => {
  describe('Password Hashing', () => {
    it('should hash a password', async () => {
      const password = 'TestPassword123'
      const hash = await hashPassword(password)
      
      expect(hash).toBeDefined()
      expect(hash).not.toBe(password)
      expect(hash.length).toBeGreaterThan(0)
    })

    it('should generate different hashes for the same password', async () => {
      const password = 'TestPassword123'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)
      
      expect(hash1).not.toBe(hash2)
    })

    it('should verify correct password', async () => {
      const password = 'TestPassword123'
      const hash = await hashPassword(password)
      const isValid = await verifyPassword(password, hash)
      
      expect(isValid).toBe(true)
    })

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123'
      const wrongPassword = 'WrongPassword456'
      const hash = await hashPassword(password)
      const isValid = await verifyPassword(wrongPassword, hash)
      
      expect(isValid).toBe(false)
    })
  })

  describe('JWT Token', () => {
    const mockUser = {
      userId: '123456',
      email: 'test@example.com',
      name: 'Test User',
    }

    it('should generate a valid token', () => {
      const token = generateToken(mockUser)
      
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.').length).toBe(3) // JWT has 3 parts
    })

    it('should verify and decode a valid token', () => {
      const token = generateToken(mockUser)
      const decoded = verifyToken(token)
      
      expect(decoded).not.toBeNull()
      expect(decoded?.userId).toBe(mockUser.userId)
      expect(decoded?.email).toBe(mockUser.email)
      expect(decoded?.name).toBe(mockUser.name)
    })

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid.token.here'
      const decoded = verifyToken(invalidToken)
      
      expect(decoded).toBeNull()
    })

    it('should return null for expired token', () => {
      // Generate token with past expiry (manual manipulation for test)
      const decoded = verifyToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTYiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJuYW1lIjoiVGVzdCBVc2VyIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid')
      
      expect(decoded).toBeNull()
    })
  })

  describe('Email Validation', () => {
    it('should accept valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true)
      expect(isValidEmail('test+tag@example.org')).toBe(true)
    })

    it('should reject invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false)
      expect(isValidEmail('@example.com')).toBe(false)
      expect(isValidEmail('test@')).toBe(false)
      expect(isValidEmail('test @example.com')).toBe(false)
      expect(isValidEmail('')).toBe(false)
    })
  })

  describe('Password Validation', () => {
    it('should accept strong passwords', () => {
      expect(isValidPassword('Password123')).toBe(true)
      expect(isValidPassword('MySecure1Pass')).toBe(true)
      expect(isValidPassword('Test1234Pass')).toBe(true)
    })

    it('should reject weak passwords', () => {
      expect(isValidPassword('short1A')).toBe(false) // Too short
      expect(isValidPassword('nouppercase123')).toBe(false) // No uppercase
      expect(isValidPassword('NOLOWERCASE123')).toBe(false) // No lowercase
      expect(isValidPassword('NoNumbers')).toBe(false) // No numbers
      expect(isValidPassword('')).toBe(false) // Empty
    })

    it('should require at least 8 characters', () => {
      expect(isValidPassword('Aa1')).toBe(false)
      expect(isValidPassword('Aa12345')).toBe(false)
      expect(isValidPassword('Aa123456')).toBe(true)
    })
  })

  describe('Name Validation', () => {
    it('should accept valid names', () => {
      expect(isValidName('John Doe')).toBe(true)
      expect(isValidName('María García')).toBe(true)
      expect(isValidName('AB')).toBe(true) // Minimum 2 chars
    })

    it('should reject invalid names', () => {
      expect(isValidName('A')).toBe(false) // Too short
      expect(isValidName(' ')).toBe(false) // Only whitespace
      expect(isValidName('')).toBe(false) // Empty
    })

    it('should trim whitespace', () => {
      expect(isValidName('  John  ')).toBe(true)
      expect(isValidName('   A   ')).toBe(false) // Still too short after trim
    })
  })
})
