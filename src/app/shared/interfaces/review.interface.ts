export interface Review {
  _id: string;
  user_id: {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  business_id: {
    _id: string;
    name: string;
    logo_url?: string;
  };
  project_id: {
    _id: string;
    title: string;
    completed_at?: Date;
  };
  rating: number;
  review_text?: string;
  service_quality?: number;
  communication?: number;
  timeliness?: number;
  value_for_money?: number;
  is_verified: boolean;
  is_flagged: boolean;
  flagged_reason?: string;
  verified_at?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReviewRequest {
  project_id: string;
  rating: number;
  review_text?: string;
  service_quality?: number;
  communication?: number;
  timeliness?: number;
  value_for_money?: number;
}

export interface ReviewStats {
  average_rating: number;
  total_reviews: number;
  rating_breakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  detailed_ratings: {
    service_quality: number;
    communication: number;
    timeliness: number;
    value_for_money: number;
  };
}

export interface CompletedProjectForReview {
  _id: string;
  title: string;
  description?: string;
  business_id: {
    _id: string;
    name: string;
    logo_url?: string;
  };
  completed_at?: Date;
  offered_price: number;
}
