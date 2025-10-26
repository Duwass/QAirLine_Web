// Định nghĩa types cho Offer Service

export interface Offer {
  PostID: number;
  Title: string;
  Content: string;
  PostDate: Date;
  Type: 'promotion' | 'news';
  Timestamp: Date;
}

export interface CreateOfferRequest {
  title: string;
  content: string;
  userID: number;
}

export interface DeleteOfferRequest {
  postID: number;
  UserID: number;
}