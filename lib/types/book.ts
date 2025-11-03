// Tipos para la búsqueda de libros con Google Books API

export interface Book {
  id: string;
  title: string;
  authors: string[];
  description?: string;
  thumbnail?: string;
  publishedDate?: string;
  publisher?: string;
  pageCount?: number;
  categories?: string[];
  averageRating?: number;
  ratingsCount?: number;
  language?: string;
  previewLink?: string;
  infoLink?: string;
}

export interface BookSearchParams {
  query: string;
  maxResults?: number;
  orderBy?: 'relevance' | 'newest';
  startIndex?: number;
}

export interface BookSearchResponse {
  books: Book[];
  totalItems: number;
}
