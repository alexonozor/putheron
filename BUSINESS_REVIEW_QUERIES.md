# Custom Business Review Queries

## 1. Get Business Reviews Query

```sql
-- Get all reviews for a specific business with reviewer details
SELECT 
    br.id,
    br.rating,
    br.review_text,
    br.service_quality,
    br.communication,
    br.timeliness,
    br.value,
    br.created_at,
    br.user_id,
    br.user_business_project_id,
    ubp.project_title,
    ubp.completion_date as project_completion_date,
    p.full_name as reviewer_name,
    p.avatar_url as reviewer_avatar
FROM business_reviews br
JOIN user_business_projects ubp ON br.user_business_project_id = ubp.id
JOIN profiles p ON br.user_id = p.id
WHERE br.business_id = $1
ORDER BY br.created_at DESC;
```

## 2. Get Business Review Stats Query

```sql
-- Get comprehensive review statistics for a business
WITH review_stats AS (
    SELECT 
        business_id,
        COUNT(*) as total_reviews,
        AVG(rating) as avg_rating,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star_count,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star_count,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star_count,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star_count,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star_count,
        AVG(service_quality) as avg_service_quality,
        AVG(communication) as avg_communication,
        AVG(timeliness) as avg_timeliness,
        AVG(value) as avg_value
    FROM business_reviews
    WHERE business_id = $1
    GROUP BY business_id
),
business_info AS (
    SELECT 
        id as business_id,
        name as business_name,
        average_rating,
        review_count
    FROM businesses
    WHERE id = $1
)
SELECT 
    bi.business_id,
    bi.business_name,
    COALESCE(rs.avg_rating, bi.average_rating, 0) as average_rating,
    COALESCE(rs.total_reviews, bi.review_count, 0) as review_count,
    COALESCE(rs.five_star_count, 0) as five_star_count,
    COALESCE(rs.four_star_count, 0) as four_star_count,
    COALESCE(rs.three_star_count, 0) as three_star_count,
    COALESCE(rs.two_star_count, 0) as two_star_count,
    COALESCE(rs.one_star_count, 0) as one_star_count,
    COALESCE(rs.avg_service_quality, 0) as avg_service_quality,
    COALESCE(rs.avg_communication, 0) as avg_communication,
    COALESCE(rs.avg_timeliness, 0) as avg_timeliness,
    COALESCE(rs.avg_value, 0) as avg_value
FROM business_info bi
LEFT JOIN review_stats rs ON bi.business_id = rs.business_id;
```

## 3. Combined Query for Reviews and Stats

```sql
-- Get both reviews and basic stats in one query
WITH business_reviews_with_details AS (
    SELECT 
        br.id,
        br.rating,
        br.review_text,
        br.service_quality,
        br.communication,
        br.timeliness,
        br.value,
        br.created_at,
        br.user_id,
        br.user_business_project_id,
        ubp.project_title,
        ubp.completion_date as project_completion_date,
        p.full_name as reviewer_name,
        p.avatar_url as reviewer_avatar
    FROM business_reviews br
    JOIN user_business_projects ubp ON br.user_business_project_id = ubp.id
    JOIN profiles p ON br.user_id = p.id
    WHERE br.business_id = $1
    ORDER BY br.created_at DESC
),
review_summary AS (
    SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as avg_rating,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star_count,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star_count,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star_count,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star_count,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star_count,
        AVG(service_quality) as avg_service_quality,
        AVG(communication) as avg_communication,
        AVG(timeliness) as avg_timeliness,
        AVG(value) as avg_value
    FROM business_reviews
    WHERE business_id = $1
)
SELECT 
    -- Business info
    b.id as business_id,
    b.name as business_name,
    -- Review summary
    COALESCE(rs.avg_rating, b.average_rating, 0) as average_rating,
    COALESCE(rs.total_reviews, b.review_count, 0) as review_count,
    COALESCE(rs.five_star_count, 0) as five_star_count,
    COALESCE(rs.four_star_count, 0) as four_star_count,
    COALESCE(rs.three_star_count, 0) as three_star_count,
    COALESCE(rs.two_star_count, 0) as two_star_count,
    COALESCE(rs.one_star_count, 0) as one_star_count,
    COALESCE(rs.avg_service_quality, 0) as avg_service_quality,
    COALESCE(rs.avg_communication, 0) as avg_communication,
    COALESCE(rs.avg_timeliness, 0) as avg_timeliness,
    COALESCE(rs.avg_value, 0) as avg_value,
    -- Reviews as JSON array
    COALESCE(
        (SELECT json_agg(
            json_build_object(
                'id', id,
                'rating', rating,
                'review_text', review_text,
                'service_quality', service_quality,
                'communication', communication,
                'timeliness', timeliness,
                'value', value,
                'created_at', created_at,
                'reviewer_name', reviewer_name,
                'reviewer_avatar', reviewer_avatar,
                'project_title', project_title,
                'project_completion_date', project_completion_date
            )
        ) FROM business_reviews_with_details),
        '[]'::json
    ) as reviews
FROM businesses b
LEFT JOIN review_summary rs ON true
WHERE b.id = $1;
```

## 4. TypeScript Service Implementation

The TypeScript service now implements these queries using Supabase client:

### Individual Methods:
- `getBusinessReviews(businessId: number)`: Fetches reviews with user profiles
- `getBusinessReviewStats(businessId: number)`: Calculates comprehensive stats
- `getBusinessReviewsAndStats(businessId: number)`: Combined efficient query

### Key Features:
- **Efficient querying**: Minimizes database calls
- **Profile resolution**: Fetches reviewer names and avatars
- **Statistical analysis**: Calculates rating breakdowns and averages
- **Null safety**: Handles missing data gracefully
- **Error handling**: Comprehensive error management

### Usage Example:
```typescript
// Get both reviews and stats efficiently
const { reviews, stats } = await reviewsService.getBusinessReviewsAndStats(businessId);

// Individual methods
const reviews = await reviewsService.getBusinessReviews(businessId);
const stats = await reviewsService.getBusinessReviewStats(businessId);
```

These queries replace the need for edge functions and provide direct database access with proper relationships and comprehensive data retrieval.
