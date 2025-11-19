import { searchBooksTool, getBookDetailsTool } from '@/lib/ai/tools'

// Mock fetch
global.fetch = jest.fn()

describe('AI Tools', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000'
  })

  describe('searchBooksTool', () => {
    it('should have correct description and parameters', () => {
      expect(searchBooksTool.description).toBeDefined()
      expect(searchBooksTool.parameters).toBeDefined()
    })

    it('should search books successfully', async () => {
      const mockResponse = {
        success: true,
        books: [
          {
            id: 'book1',
            title: 'Test Book',
            authors: ['Author Name'],
            description: 'Test description',
            thumbnail: 'http://example.com/thumb.jpg',
            publishedDate: '2024',
            publisher: 'Test Publisher',
            pageCount: 200,
            categories: ['Fiction'],
            averageRating: 4.5,
            ratingsCount: 100,
            previewLink: 'http://example.com/preview',
          },
        ],
        totalItems: 1,
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await searchBooksTool.execute({
        query: 'test query',
        maxResults: 10,
        orderBy: 'relevance',
      })

      expect(result.success).toBe(true)
      expect(result.books).toHaveLength(1)
      expect(result.books[0].title).toBe('Test Book')
      expect(result.books[0].position).toBe(1)
      expect(result.chatMessage).toContain('1 libros')
    })

    it('should handle API errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'API Error' }),
      })

      const result = await searchBooksTool.execute({
        query: 'test query',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('API Error')
      expect(result.books).toEqual([])
    })

    it('should use default parameters', async () => {
      const mockResponse = {
        success: true,
        books: [],
        totalItems: 0,
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await searchBooksTool.execute({
        query: 'test',
      })

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('maxResults=10')
      )
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('orderBy=relevance')
      )
    })

    it('should handle network errors', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      )

      const result = await searchBooksTool.execute({
        query: 'test query',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })
  })

  describe('getBookDetailsTool', () => {
    it('should have correct description and parameters', () => {
      expect(getBookDetailsTool.description).toBeDefined()
      expect(getBookDetailsTool.parameters).toBeDefined()
    })

    it('should fetch book details successfully', async () => {
      const mockBook = {
        id: 'book1',
        title: 'Detailed Book',
        subtitle: 'A Subtitle',
        authors: ['Author One', 'Author Two'],
        publisher: 'Test Publisher',
        publishedDate: '2024-01-01',
        description: 'Long detailed description',
        isbn: [
          { type: 'ISBN_10', identifier: '1234567890' },
          { type: 'ISBN_13', identifier: '1234567890123' },
        ],
        pageCount: 350,
        categories: ['Fiction', 'Mystery'],
        language: 'en',
        averageRating: 4.7,
        ratingsCount: 250,
        maturityRating: 'NOT_MATURE',
        imageLinks: {
          thumbnail: 'http://example.com/thumb.jpg',
          small: 'http://example.com/small.jpg',
        },
        previewLink: 'http://example.com/preview',
        infoLink: 'http://example.com/info',
        canonicalVolumeLink: 'http://example.com/canonical',
        saleInfo: {
          saleability: 'FOR_SALE',
          isEbook: true,
          listPrice: { amount: 9.99, currencyCode: 'USD' },
          buyLink: 'http://example.com/buy',
        },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, book: mockBook }),
      })

      const result = await getBookDetailsTool.execute({ bookId: 'book1' })

      expect(result.success).toBe(true)
      expect(result.book).toBeDefined()
      expect(result.book.title).toBe('Detailed Book')
      expect(result.book.authors).toEqual(['Author One', 'Author Two'])
      expect(result.chatMessage).toContain('Detailed Book')
    })

    it('should handle book not found', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Book not found' }),
      })

      const result = await getBookDetailsTool.execute({ bookId: 'invalid' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Book not found')
      expect(result.book).toBeNull()
    })

    it('should handle network errors', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Connection failed')
      )

      const result = await getBookDetailsTool.execute({ bookId: 'book1' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Connection failed')
    })
  })
})
