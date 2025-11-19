import { useState, useEffect, useCallback } from 'react';
import { ReadingListBook } from '@/lib/types/readingList';

export function useReadingList() {
  const [books, setBooks] = useState<ReadingListBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookIdsInList, setBookIdsInList] = useState<Set<string>>(new Set());

  // Cargar lista de lectura
  const loadReadingList = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/reading-list');
      
      if (response.ok) {
        const data = await response.json();
        setBooks(data.books);
        setBookIdsInList(new Set(data.books.map((b: ReadingListBook) => b.bookId)));
      }
    } catch (error) {
      console.error('Error al cargar lista de lectura:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Agregar libro a la lista
  const addToReadingList = useCallback(async (book: {
    bookId: string;
    title: string;
    authors?: string[];
    thumbnail?: string;
    description?: string;
    publishedDate?: string;
    pageCount?: number;
    categories?: string[];
    averageRating?: number;
    priority?: 'high' | 'medium' | 'low';
    notes?: string;
  }) => {
    try {
      const response = await fetch('/api/reading-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(book),
      });

      if (response.ok) {
        const data = await response.json();
        setBooks(prev => [data.book, ...prev]);
        setBookIdsInList(prev => new Set([...prev, book.bookId]));
        return { success: true, message: data.message };
      } else {
        const error = await response.json();
        return { success: false, error: error.error };
      }
    } catch (error) {
      console.error('Error al agregar libro:', error);
      return { success: false, error: 'Error al agregar libro' };
    }
  }, []);

  // Eliminar libro de la lista
  const removeFromReadingList = useCallback(async (bookId: string) => {
    try {
      const response = await fetch(`/api/reading-list?bookId=${bookId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setBooks(prev => prev.filter(b => b.bookId !== bookId));
        setBookIdsInList(prev => {
          const newSet = new Set(prev);
          newSet.delete(bookId);
          return newSet;
        });
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.error };
      }
    } catch (error) {
      console.error('Error al eliminar libro:', error);
      return { success: false, error: 'Error al eliminar libro' };
    }
  }, []);

  // Verificar si un libro está en la lista
  const isInReadingList = useCallback((bookId: string) => {
    return bookIdsInList.has(bookId);
  }, [bookIdsInList]);

  // Marcar libro como leído
  const markAsRead = useCallback(async (data: {
    bookId: string;
    rating?: number;
    review?: string;
    dateFinished?: Date;
  }) => {
    try {
      const response = await fetch('/api/reading-list', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        // Actualizar el libro en el estado local
        setBooks(prev => prev.map(book => 
          book.bookId === data.bookId 
            ? { ...book, ...result.data }
            : book
        ));
        return { success: true, message: result.message };
      } else {
        const error = await response.json();
        return { success: false, error: error.error };
      }
    } catch (error) {
      console.error('Error al marcar libro como leído:', error);
      return { success: false, error: 'Error al marcar libro como leído' };
    }
  }, []);

  useEffect(() => {
    loadReadingList();
  }, [loadReadingList]);

  return {
    books,
    loading,
    addToReadingList,
    removeFromReadingList,
    isInReadingList,
    markAsRead,
    refreshList: loadReadingList,
  };
}
