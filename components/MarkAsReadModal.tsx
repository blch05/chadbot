'use client';

import { useState, useEffect } from 'react';
import { ReadingListBook } from '@/lib/types/readingList';

interface MarkAsReadModalProps {
  book: ReadingListBook;
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead: (data: {
    bookId: string;
    rating?: number;
    review?: string;
    dateFinished?: Date;
  }) => Promise<{ success: boolean; message?: string; error?: string }>;
}

export function MarkAsReadModal({ book, isOpen, onClose, onMarkAsRead }: MarkAsReadModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [review, setReview] = useState('');
  const [dateFinished, setDateFinished] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredStar, setHoveredStar] = useState<number>(0);

  // Prefill fields when modal opens or book changes (so user can edit existing review)
  useState(() => {});
  // useEffect to initialize form values from book
  useEffect(() => {
    if (!isOpen) return;
    // Prefill rating, review and dateFinished if available on book
    setRating(book.userRating ?? 0);
    setReview(book.userReview ?? '');
    if (book.dateFinished) {
      try {
        const d = new Date(book.dateFinished);
        if (!isNaN(d.getTime())) {
          setDateFinished(d.toISOString().split('T')[0]);
        }
      } catch (e) {
        // ignore
      }
    }
  }, [book, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data: any = {
        bookId: book.bookId,
        dateFinished: new Date(dateFinished),
      };

      if (rating > 0) {
        data.rating = rating;
      }

      if (review.trim()) {
        data.review = review.trim();
      }

      const result = await onMarkAsRead(data);

      if (result.success) {
        onClose();
        // Resetear el formulario
        setRating(0);
        setReview('');
        setDateFinished(new Date().toISOString().split('T')[0]);
      } else {
        alert(result.error || 'Error al marcar como leído');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al marcar como leído');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-[#616f55] to-[#4d5a44] rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border-2 border-[#4d5a44]/50">
        {/* Header */}
        <div className="sticky top-0 bg-[#251711] px-6 py-4 border-b border-white/20 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">Marcar como Leído</h3>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-white/80 hover:text-white transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Book Info */}
        <div className="px-6 py-4 border-b border-white/20">
          <div className="flex gap-3">
            {book.thumbnail ? (
              <img
                src={book.thumbnail.replace('http:', 'https:')}
                alt={book.title}
                className="w-16 h-24 object-cover rounded shadow-lg border-2 border-white/30"
              />
            ) : (
              <div className="w-16 h-24 bg-white/20 backdrop-blur-sm rounded shadow-lg flex items-center justify-center border-2 border-white/30">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            )}
            <div className="flex-1">
              <h4 className="font-bold text-white text-sm line-clamp-2">{book.title}</h4>
              {book.authors && book.authors.length > 0 && (
                <p className="text-xs text-white/80 mt-1">{book.authors.join(', ')}</p>
              )}
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Calificación (opcional)
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="transition-transform hover:scale-110"
                >
                  <svg
                    className="w-8 h-8"
                    fill={(hoveredStar || rating) >= star ? '#fbbf24' : 'none'}
                    stroke={(hoveredStar || rating) >= star ? '#fbbf24' : '#ffffff'}
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                  </svg>
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-xs text-white/70 mt-1">{rating} de 5 estrellas</p>
            )}
          </div>

          {/* Date Finished */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Fecha de finalización
            </label>
            <input
              type="date"
              value={dateFinished}
              onChange={(e) => setDateFinished(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>

          {/* Review */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Reseña personal (opcional)
            </label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="¿Qué te pareció este libro? Comparte tu opinión..."
              rows={4}
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 resize-none"
            />
            <p className="text-xs text-white/60 mt-1">
              {review.length} caracteres
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-white/10 backdrop-blur-sm text-white rounded-lg font-medium hover:bg-white/20 transition-colors disabled:opacity-50 border border-white/20"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-white text-[#4d5a44] rounded-lg font-medium hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Guardando...
                </>
              ) : (
                <>
                  ✓ Marcar como Leído
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
