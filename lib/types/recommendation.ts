export interface BookRecommendation {
  id: string;
  bookId: string;
  title: string;
  authors?: string;
  thumbnail?: string;
  description?: string;
  publishedDate?: string;
  publisher?: string;
  pageCount?: number;
  rating?: string;
  previewLink: string;
  clickedAt: Date;
}

export interface RecommendationDocument {
  _id?: any;
  userId: string;
  bookId: string;
  title: string;
  authors?: string;
  thumbnail?: string;
  description?: string;
  publishedDate?: string;
  publisher?: string;
  pageCount?: number;
  rating?: string;
  previewLink: string;
  clickedAt: Date;
}
