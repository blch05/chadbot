// Definición de tools para el AI SDK
import { tool } from 'ai';
import { z } from 'zod';

// Tool para buscar libros
export const searchBooksTool = (tool as any)({
  description: `Busca libros en Google Books API por título, autor, tema o palabras clave.
  
  Úsala cuando el usuario:
  - Pida recomendaciones de libros sobre un tema específico
  - Busque libros de un autor en particular
  - Quiera encontrar libros relacionados con un tópico
  - Pregunte sobre libros disponibles en alguna categoría
  
  Ejemplos de uso:
  - "Recomiéndame libros sobre inteligencia artificial"
  - "Busca novelas de Gabriel García Márquez"
  - "Quiero leer sobre historia romana"
  - "¿Qué libros hay sobre psicología?"`,
  
  parameters: z.object({
    query: z.string().describe('Término de búsqueda: título, autor, tema o palabras clave'),
    maxResults: z.number().min(1).max(40).optional().describe('Número máximo de resultados a retornar (1-40, default: 10)'),
    orderBy: z.enum(['relevance', 'newest']).optional().describe('Criterio de ordenamiento: "relevance" (más relevante) o "newest" (más reciente)'),
  }),
  
  execute: async (params: { query: string; maxResults?: number; orderBy?: 'relevance' | 'newest' }) => {
    const { query, maxResults = 10, orderBy = 'relevance' } = params;
    try {
      // Construir URL de nuestra API interna
      const searchParams = new URLSearchParams({
        query,
        maxResults: maxResults.toString(),
        orderBy,
      });

      const apiUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/books/search?${searchParams.toString()}`;

      // Hacer request a nuestra API
      const response = await fetch(apiUrl);

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error || 'Error al buscar libros',
          books: [],
          totalItems: 0,
        };
      }

      const data = await response.json();

      // Formatear respuesta para la IA
      const chatMessage = `He encontrado ${data.books.length} libros para "${query}". Puedes pedirme más detalles de uno usando su número o su ID.`;

      return {
        success: true,
        message: `Encontré ${data.books.length} libros. Cada libro tiene un ID único que puedes usar con getBookDetails para obtener información completa.`,
        chatMessage,
        books: data.books.map((book: any, index: number) => ({
          position: index + 1,
          bookId: book.id,
          id: book.id,
          title: book.title,
          authors: book.authors.join(', '),
          description: book.description?.substring(0, 200) + (book.description?.length > 200 ? '...' : ''),
          thumbnail: book.thumbnail,
          publishedDate: book.publishedDate,
          publisher: book.publisher,
          pageCount: book.pageCount,
          categories: book.categories.join(', '),
          rating: book.averageRating ? `${book.averageRating}/5 (${book.ratingsCount} reseñas)` : 'Sin calificación',
          previewLink: book.previewLink,
        })),
        totalItems: data.totalItems,
        query,
        instruction: 'Si el usuario pide más información sobre un libro específico (por ejemplo, "el primer libro", "el segundo", etc.), usa getBookDetails con el bookId correspondiente.',
      };

    } catch (error) {
      console.error('Error en searchBooksTool:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al buscar libros',
        books: [],
        totalItems: 0,
      };
    }
  },
});

// Tool para obtener detalles completos de un libro específico
export const getBookDetailsTool = (tool as any)({
  description: `ÚSALA CUANDO EL USUARIO PIDA MÁS INFORMACIÓN SOBRE UN LIBRO ESPECÍFICO.
  
  Esta herramienta obtiene la información COMPLETA de un libro usando su Google Books ID (bookId).
  
  Úsala SIEMPRE cuando el usuario diga:
  - "Dame más información sobre el primer libro" → usa el bookId del libro en posición 1
  - "Cuéntame más sobre ese libro" → usa el bookId del último libro mencionado
  - "¿De qué trata el segundo libro?" → usa el bookId del libro en posición 2
  - "Detalles del libro X" → usa el bookId del libro mencionado
  - "¿Cuántas páginas tiene el primero?" → usa el bookId del libro en posición 1
  - "Descripción completa" → usa el bookId del libro mencionado
  
  IMPORTANTE: El bookId se obtiene de los resultados de searchBooks (campo "bookId" o "id").
  
  Esta herramienta devuelve: descripción completa, número de páginas, ISBN, categorías completas, ratings detallados, precio, etc.`,
  
  parameters: z.object({
    bookId: z.string().describe('ID único del libro en Google Books (obtenido de searchBooks)'),
  }),
  
  execute: async (params: { bookId: string }) => {
    const { bookId } = params;
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/books/${bookId}`;

      const response = await fetch(apiUrl);

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error || 'Error al obtener detalles del libro',
          book: null,
        };
      }

      const data = await response.json();
      const book = data.book;

      // Formatear respuesta detallada para la IA
      const chatMessage = `Detalles del libro ${book.title} por ${book.authors?.join(', ') || 'Autor desconocido'}. Tiene ${book.pageCount || 'N/A'} páginas.`;

      return {
        success: true,
        chatMessage,
        book: {
          id: book.id,
          title: book.title,
          subtitle: book.subtitle,
          authors: book.authors,
          publisher: book.publisher,
          publishedDate: book.publishedDate,
          description: book.description,
          isbn: book.isbn,
          pageCount: book.pageCount,
          categories: book.categories,
          language: book.language,
          rating: {
            average: book.averageRating,
            count: book.ratingsCount,
            maturity: book.maturityRating,
          },
          images: book.imageLinks,
          links: {
            preview: book.previewLink,
            info: book.infoLink,
            canonical: book.canonicalVolumeLink,
          },
          saleInfo: book.saleInfo ? {
            available: book.saleInfo.saleability === 'FOR_SALE',
            isEbook: book.saleInfo.isEbook,
            price: book.saleInfo.listPrice,
            buyLink: book.saleInfo.buyLink,
          } : null,
        },
      };

    } catch (error) {
      console.error('Error en getBookDetailsTool:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al obtener detalles del libro',
        book: null,
      };
    }
  },
});

