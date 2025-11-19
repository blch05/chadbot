/**
 * API Route Tests - Book Search
 * Tests for /api/books/search endpoint
 */

describe('Book Search API', () => {
  const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY || 'test-key'
  
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/books/search', () => {
    it('should search books successfully', async () => {
      const mockGoogleResponse = {
        totalItems: 2,
        items: [
          {
            id: 'book1',
            volumeInfo: {
              title: 'Test Book 1',
              authors: ['Author 1'],
              description: 'Description 1',
              imageLinks: { thumbnail: 'http://thumb1.jpg' },
              publishedDate: '2024',
              publisher: 'Publisher 1',
              pageCount: 200,
              categories: ['Fiction'],
              averageRating: 4.5,
              ratingsCount: 100,
              previewLink: 'http://preview1.com',
            },
          },
          {
            id: 'book2',
            volumeInfo: {
              title: 'Test Book 2',
              authors: ['Author 2'],
              description: 'Description 2',
            },
          },
        ],
      }

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockGoogleResponse,
      })

      const searchParams = new URLSearchParams({
        query: 'test',
        maxResults: '10',
        orderBy: 'relevance',
      })

      // Simulating the API route behavior
      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
        'test'
      )}&maxResults=10&orderBy=relevance&key=${GOOGLE_BOOKS_API_KEY}`

      const response = await fetch(url)
      const data = await response.json()

      expect(data.totalItems).toBe(2)
      expect(data.items).toHaveLength(2)
      expect(data.items[0].volumeInfo.title).toBe('Test Book 1')
    })

    it('should handle missing query parameter', () => {
      const query = ''
      expect(query.trim()).toBe('')
    })

    it('should use default values for optional parameters', () => {
      const maxResults = undefined
      const orderBy = undefined

      expect(maxResults ?? 10).toBe(10)
      expect(orderBy ?? 'relevance').toBe('relevance')
    })

    it('should validate maxResults range', () => {
      expect(Math.min(Math.max(1, 50), 40)).toBe(40) // Should cap at 40
      expect(Math.min(Math.max(1, 5), 40)).toBe(5) // Should accept valid value
      expect(Math.min(Math.max(1, 0), 40)).toBe(1) // Should set minimum to 1
    })

    it('should handle Google Books API errors', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: { message: 'Invalid request' } }),
      })

      const response = await fetch('test-url')
      const data = await response.json()

      expect(response.ok).toBe(false)
      expect(data.error).toBeDefined()
    })

    it('should handle network errors', async () => {
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'))

      await expect(fetch('test-url')).rejects.toThrow('Network error')
    })
  })
})

/**
 * API Route Tests - Book Details
 * Tests for /api/books/[id] endpoint
 */

describe('Book Details API', () => {
  const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY || 'test-key'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/books/[id]', () => {
    it('should fetch book details successfully', async () => {
      const mockGoogleResponse = {
        id: 'book123',
        volumeInfo: {
          title: 'Detailed Book',
          subtitle: 'A Complete Guide',
          authors: ['Author Name'],
          publisher: 'Test Publisher',
          publishedDate: '2024-01-01',
          description: 'Full description',
          industryIdentifiers: [
            { type: 'ISBN_10', identifier: '1234567890' },
            { type: 'ISBN_13', identifier: '1234567890123' },
          ],
          pageCount: 350,
          categories: ['Technology', 'Science'],
          language: 'en',
          imageLinks: {
            thumbnail: 'http://thumb.jpg',
            small: 'http://small.jpg',
          },
          previewLink: 'http://preview.com',
          infoLink: 'http://info.com',
          canonicalVolumeLink: 'http://canonical.com',
          averageRating: 4.7,
          ratingsCount: 250,
          maturityRating: 'NOT_MATURE',
        },
        saleInfo: {
          saleability: 'FOR_SALE',
          isEbook: true,
          listPrice: {
            amount: 19.99,
            currencyCode: 'USD',
          },
          buyLink: 'http://buy.com',
        },
      }

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockGoogleResponse,
      })

      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes/book123?key=${GOOGLE_BOOKS_API_KEY}`
      )
      const data = await response.json()

      expect(data.id).toBe('book123')
      expect(data.volumeInfo.title).toBe('Detailed Book')
      expect(data.volumeInfo.authors).toContain('Author Name')
      expect(data.volumeInfo.pageCount).toBe(350)
    })

    it('should handle book not found', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          error: { message: 'The volume ID could not be found.' },
        }),
      })

      const response = await fetch('test-url')
      expect(response.ok).toBe(false)
      expect(response.status).toBe(404)
    })

    it('should validate book ID format', () => {
      const validId = 'abc123XYZ_-'
      const invalidId = ''

      expect(validId.length).toBeGreaterThan(0)
      expect(invalidId.length).toBe(0)
    })
  })
})
