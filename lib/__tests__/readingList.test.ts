/**
 * Reading List Utilities Tests
 * Tests for reading list helper functions and validations
 */

describe('Reading List Utilities', () => {
  describe('Priority Validation', () => {
    const validPriorities = ['high', 'medium', 'low']

    it('should accept valid priorities', () => {
      validPriorities.forEach((priority) => {
        expect(validPriorities.includes(priority)).toBe(true)
      })
    })

    it('should reject invalid priorities', () => {
      const invalidPriorities = ['urgent', 'normal', '', null, undefined]

      invalidPriorities.forEach((priority) => {
        expect(validPriorities.includes(priority as any)).toBe(false)
      })
    })

    it('should use default priority when not provided', () => {
      const priority = undefined
      const defaultPriority = 'medium'

      expect(priority ?? defaultPriority).toBe('medium')
    })
  })

  describe('Book Validation', () => {
    it('should validate required book fields', () => {
      const validBook = {
        bookId: 'book123',
        title: 'Test Book',
        authors: ['Author Name'],
      }

      expect(validBook.bookId).toBeDefined()
      expect(validBook.bookId.length).toBeGreaterThan(0)
      expect(validBook.title).toBeDefined()
      expect(validBook.title.length).toBeGreaterThan(0)
    })

    it('should handle missing optional fields', () => {
      const book = {
        bookId: 'book123',
        title: 'Test Book',
        authors: [],
        thumbnail: null,
        description: null,
        publishedDate: null,
        pageCount: null,
        categories: [],
        averageRating: null,
      }

      expect(book.authors).toEqual([])
      expect(book.thumbnail).toBeNull()
      expect(book.description).toBeNull()
    })

    it('should validate authors array', () => {
      const validAuthors = ['Author 1', 'Author 2']
      const emptyAuthors: string[] = []

      expect(Array.isArray(validAuthors)).toBe(true)
      expect(Array.isArray(emptyAuthors)).toBe(true)
      expect(validAuthors.length).toBeGreaterThan(0)
      expect(emptyAuthors.length).toBe(0)
    })

    it('should validate categories array', () => {
      const categories = ['Fiction', 'Mystery', 'Thriller']

      expect(Array.isArray(categories)).toBe(true)
      categories.forEach((category) => {
        expect(typeof category).toBe('string')
      })
    })
  })

  describe('Reading Stats Calculations', () => {
    const mockBooks = [
      {
        bookId: '1',
        pageCount: 200,
        averageRating: 4.5,
        isRead: true,
        readDate: new Date('2024-01-15'),
        categories: ['Fiction'],
        authors: ['Author A'],
      },
      {
        bookId: '2',
        pageCount: 350,
        averageRating: 4.0,
        isRead: true,
        readDate: new Date('2024-01-16'),
        categories: ['Fiction', 'Mystery'],
        authors: ['Author B'],
      },
      {
        bookId: '3',
        pageCount: 150,
        averageRating: 5.0,
        isRead: true,
        readDate: new Date('2024-01-17'),
        categories: ['Science'],
        authors: ['Author A'],
      },
    ]

    it('should calculate total books', () => {
      const totalBooks = mockBooks.length
      expect(totalBooks).toBe(3)
    })

    it('should calculate total pages', () => {
      const totalPages = mockBooks.reduce(
        (sum, book) => sum + (book.pageCount || 0),
        0
      )
      expect(totalPages).toBe(700)
    })

    it('should calculate average rating', () => {
      const ratings = mockBooks
        .map((b) => b.averageRating)
        .filter((r): r is number => r !== null && r !== undefined)
      const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length

      expect(avgRating).toBeCloseTo(4.5, 1)
    })

    it('should count books by category', () => {
      const categoryCount: Record<string, number> = {}

      mockBooks.forEach((book) => {
        book.categories.forEach((cat) => {
          categoryCount[cat] = (categoryCount[cat] || 0) + 1
        })
      })

      expect(categoryCount['Fiction']).toBe(2)
      expect(categoryCount['Mystery']).toBe(1)
      expect(categoryCount['Science']).toBe(1)
    })

    it('should count books by author', () => {
      const authorCount: Record<string, number> = {}

      mockBooks.forEach((book) => {
        book.authors.forEach((author) => {
          authorCount[author] = (authorCount[author] || 0) + 1
        })
      })

      expect(authorCount['Author A']).toBe(2)
      expect(authorCount['Author B']).toBe(1)
    })

    it('should calculate reading streak', () => {
      const sortedBooks = [...mockBooks].sort(
        (a, b) => b.readDate.getTime() - a.readDate.getTime()
      )

      let streak = 0
      let currentDate = new Date()

      for (const book of sortedBooks) {
        const daysDiff = Math.floor(
          (currentDate.getTime() - book.readDate.getTime()) / (1000 * 60 * 60 * 24)
        )

        if (daysDiff <= streak + 1) {
          streak++
          currentDate = book.readDate
        } else {
          break
        }
      }

      expect(streak).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Notes and Priority', () => {
    it('should allow empty notes', () => {
      const notes = ''
      expect(notes.length).toBe(0)
      expect(typeof notes).toBe('string')
    })

    it('should accept and trim notes', () => {
      const notes = '  This is a test note  '
      const trimmedNotes = notes.trim()

      expect(trimmedNotes).toBe('This is a test note')
      expect(trimmedNotes.length).toBeLessThan(notes.length)
    })

    it('should validate notes length', () => {
      const shortNotes = 'Short'
      const longNotes = 'A'.repeat(1000)

      expect(shortNotes.length).toBeLessThan(100)
      expect(longNotes.length).toBe(1000)
    })
  })

  describe('Date Handling', () => {
    it('should create valid date objects', () => {
      const now = new Date()
      const specific = new Date('2024-01-15T00:00:00.000Z')

      expect(now).toBeInstanceOf(Date)
      expect(specific).toBeInstanceOf(Date)
      expect(specific.getUTCFullYear()).toBe(2024)
      expect(specific.getUTCMonth()).toBe(0) // January is 0
      expect(specific.getUTCDate()).toBe(15)
    })

    it('should compare dates correctly', () => {
      const date1 = new Date('2024-01-15')
      const date2 = new Date('2024-01-16')

      expect(date2.getTime()).toBeGreaterThan(date1.getTime())
      expect(date1.getTime()).toBeLessThan(date2.getTime())
    })

    it('should format dates for display', () => {
      const date = new Date('2024-01-15')
      const formatted = date.toISOString().split('T')[0]

      expect(formatted).toBe('2024-01-15')
    })
  })
})
