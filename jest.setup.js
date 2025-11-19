import '@testing-library/jest-dom'

// Mock environment variables
process.env.JWT_SECRET = 'test-secret-key'
process.env.OPENROUTER_API_KEY = 'test-openrouter-key'
process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000'
process.env.MONGODB_URI = 'mongodb://localhost:27017/test'

// Mock TransformStream for Node environment (needed by AI SDK)
global.TransformStream = class TransformStream {
  readable
  writable
  constructor() {
    this.readable = {}
    this.writable = {}
  }
}

// Mock fetch globally
global.fetch = jest.fn()
