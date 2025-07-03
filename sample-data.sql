-- Sample data for PutHerOn platform
-- Run this after the database initialization script

-- Note: You'll need to replace the UUIDs with actual user IDs from your auth.users table
-- These are example profiles and services for testing

-- Sample profiles (these will be created automatically when users sign up)
-- But we can insert some additional profile data

-- Sample services (replace user_id with actual UUIDs from your profiles table)
INSERT INTO public.services (user_id, title, description, category, price, currency, delivery_time, tags, is_featured)
VALUES 
    -- You'll need to replace these UUIDs with actual user IDs
    ('00000000-0000-0000-0000-000000000001', 
     'Professional Logo Design', 
     'I will create a unique and professional logo for your business. Includes 3 concepts, unlimited revisions, and final files in all formats.',
     'Creative Services',
     150.00,
     'USD',
     '3-5 days',
     ARRAY['logo', 'branding', 'design', 'graphics'],
     true),
    
    ('00000000-0000-0000-0000-000000000002',
     'Social Media Marketing Strategy',
     'Complete social media strategy including content calendar, posting schedule, and growth tactics for Instagram, Facebook, and LinkedIn.',
     'Marketing',
     300.00,
     'USD',
     '1 week',
     ARRAY['social media', 'marketing', 'strategy', 'content'],
     true),
    
    ('00000000-0000-0000-0000-000000000003',
     'Personal Finance Consultation',
     'One-on-one financial planning session including budget review, investment advice, and debt management strategies.',
     'Finance',
     200.00,
     'USD',
     '2-3 days',
     ARRAY['finance', 'budgeting', 'investment', 'consultation'],
     false),
    
    ('00000000-0000-0000-0000-000000000004',
     'Custom Website Development',
     'Full-stack web development using modern frameworks. Includes responsive design, SEO optimization, and deployment.',
     'Technology',
     800.00,
     'USD',
     '2-3 weeks',
     ARRAY['web development', 'coding', 'responsive', 'SEO'],
     true),
    
    ('00000000-0000-0000-0000-000000000005',
     'Life Coaching Session',
     'Transform your life with personalized coaching sessions. Focus on goal setting, motivation, and personal growth.',
     'Lifestyle',
     120.00,
     'USD',
     '1-2 days',
     ARRAY['coaching', 'motivation', 'personal growth', 'goals'],
     false);

-- Sample reviews (replace IDs with actual ones from your database)
INSERT INTO public.reviews (order_id, reviewer_id, reviewee_id, service_id, rating, comment, is_public)
VALUES 
    -- You'll need to create actual orders first, then add reviews
    ('00000000-0000-0000-0000-100000000001',
     '00000000-0000-0000-0000-000000000001',
     '00000000-0000-0000-0000-000000000002',
     '00000000-0000-0000-0000-200000000001',
     5,
     'Amazing work! The logo perfectly captures our brand identity. Highly professional and delivered on time.',
     true),
    
    ('00000000-0000-0000-0000-100000000002',
     '00000000-0000-0000-0000-000000000003',
     '00000000-0000-0000-0000-000000000002',
     '00000000-0000-0000-0000-200000000002',
     4,
     'Great social media strategy. Saw immediate improvement in engagement. Minor communication delays but overall excellent.',
     true),
    
    ('00000000-0000-0000-0000-100000000003',
     '00000000-0000-0000-0000-000000000001',
     '00000000-0000-0000-0000-000000000003',
     '00000000-0000-0000-0000-200000000003',
     5,
     'Life-changing financial advice! Clear explanations and actionable steps. Worth every penny.',
     true);

-- Function to update service ratings based on reviews
CREATE OR REPLACE FUNCTION update_service_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.services 
    SET rating = (
        SELECT AVG(rating)::decimal(3,2) 
        FROM public.reviews 
        WHERE service_id = NEW.service_id AND is_public = true
    )
    WHERE id = NEW.service_id;
    
    UPDATE public.profiles
    SET rating = (
        SELECT AVG(r.rating)::decimal(3,2)
        FROM public.reviews r
        JOIN public.services s ON r.service_id = s.id
        WHERE s.user_id = (SELECT user_id FROM public.services WHERE id = NEW.service_id)
        AND r.is_public = true
    ),
    total_reviews = (
        SELECT COUNT(*)
        FROM public.reviews r
        JOIN public.services s ON r.service_id = s.id
        WHERE s.user_id = (SELECT user_id FROM public.services WHERE id = NEW.service_id)
        AND r.is_public = true
    )
    WHERE id = (SELECT user_id FROM public.services WHERE id = NEW.service_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update ratings when reviews are added/updated
CREATE TRIGGER update_ratings_on_review
    AFTER INSERT OR UPDATE ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION update_service_rating();

-- Function to increment order count when order is created
CREATE OR REPLACE FUNCTION increment_order_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.services 
    SET orders_count = orders_count + 1
    WHERE id = NEW.service_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to increment order count
CREATE TRIGGER increment_order_count_trigger
    AFTER INSERT ON public.orders
    FOR EACH ROW EXECUTE FUNCTION increment_order_count();

-- Sample search function
CREATE OR REPLACE FUNCTION search_services(
    search_query TEXT DEFAULT '',
    category_filter TEXT DEFAULT NULL,
    min_price DECIMAL DEFAULT NULL,
    max_price DECIMAL DEFAULT NULL,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    category TEXT,
    price DECIMAL,
    currency TEXT,
    rating DECIMAL,
    user_id UUID,
    full_name TEXT,
    avatar_url TEXT,
    is_verified BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.title,
        s.description,
        s.category,
        s.price,
        s.currency,
        s.rating,
        s.user_id,
        p.full_name,
        p.avatar_url,
        p.is_verified
    FROM public.services s
    JOIN public.profiles p ON s.user_id = p.id
    WHERE s.is_active = true
        AND (search_query = '' OR 
             s.title ILIKE '%' || search_query || '%' OR 
             s.description ILIKE '%' || search_query || '%' OR
             search_query = ANY(s.tags))
        AND (category_filter IS NULL OR s.category = category_filter)
        AND (min_price IS NULL OR s.price >= min_price)
        AND (max_price IS NULL OR s.price <= max_price)
    ORDER BY s.rating DESC, s.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;
