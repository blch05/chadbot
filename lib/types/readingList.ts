export interface ReadingListBook {
  _id?: string;
  userId: string;
  bookId: string;
  title: string;
  authors: string[];
  thumbnail?: string;
  description?: string;
  publishedDate?: string;
  pageCount?: number;
  categories?: string[];
  averageRating?: number;
  addedAt: Date;
  isRead?: boolean;
  userRating?: number;
  userReview?: string;
  dateFinished?: Date;
  priority?: 'high' | 'medium' | 'low';
  notes?: string;
}

export interface ReadingListResponse {
  books: ReadingListBook[];
  total: number;
}

export interface MarkAsReadData {
  bookId: string;
  rating?: number;
  review?: string;
  dateFinished?: Date;
}
