# Database Setup Guide for PutHerOn

## Overview
This guide will help you set up your Supabase database for the PutHerOn Angular application. The database includes tables for user profiles, services, orders, reviews, messages, and categories.

## Prerequisites
- Supabase project created (which you already have)
- Access to Supabase SQL Editor
- Angular application with Supabase integration

## Database Schema
Your database includes the following tables:
- `profiles` - User profile information (extends auth.users)
- `services` - Service listings created by users
- `orders` - Purchase orders between buyers and sellers
- `reviews` - Reviews and ratings for services
- `messages` - Communication between buyers and sellers
- `categories` - Service categories

## Setup Instructions

### 1. Initialize Database Schema
1. Open your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the content from `database-init.sql`
4. Run the script to create all tables, policies, and functions

### 2. Add Sample Data (Optional)
1. In the SQL Editor, copy and paste the content from `sample-data.sql`
2. **Important**: Replace the placeholder UUIDs with actual user IDs from your `auth.users` table
3. Run the script to populate with sample data

### 3. Storage Buckets
The initialization script creates three storage buckets:
- `avatars` (public) - User profile pictures
- `services` (public) - Service images
- `attachments` (private) - Message attachments

### 4. Row Level Security (RLS)
All tables have RLS enabled with appropriate policies:
- Users can only access their own data
- Public data (like services and reviews) is viewable by everyone
- Authenticated users can perform appropriate actions

## TypeScript Integration

### Generated Types
The `database.types.ts` file contains TypeScript interfaces for all database tables. These provide type safety and better development experience.

### Services Created
- `SupabaseService` - Core Supabase client wrapper
- `UserService` - User profile management with signals
- `ServicesService` - Service marketplace functionality
- `OrdersService` - Order and messaging management
- `AuthService` - Authentication with user profile integration

## Key Features

### Real-time Subscriptions
```typescript
// Subscribe to order updates
ordersService.subscribeToOrderUpdates(orderId, (payload) => {
  console.log('Order updated:', payload);
});

// Subscribe to new messages
ordersService.subscribeToMessages(orderId, (payload) => {
  console.log('New message:', payload);
});
```

### Signal-based State Management
All services use Angular 19 signals for reactive state management:
```typescript
// Access user profile
const profile = userService.currentProfile();
const isLoading = userService.loading();

// Access services
const services = servicesService.services();
const featuredServices = servicesService.featuredServices();
```

### File Upload Support
```typescript
// Upload avatar
await userService.uploadAvatar(file, userId);

// Upload service images
const imageUrls = await servicesService.uploadServiceImages(files, serviceId);
```

## Testing Your Setup

### 1. Test Authentication
```typescript
// Sign up
const result = await authService.signUp('test@example.com', 'password', 'Test User');

// Sign in
const result = await authService.signIn('test@example.com', 'password');
```

### 2. Test Profile Management
```typescript
// Load profile
await userService.loadUserProfile(userId);

// Update profile
await userService.updateProfile({
  full_name: 'Updated Name',
  bio: 'My bio'
});
```

### 3. Test Service Management
```typescript
// Load services
await servicesService.loadServices();

// Create service
await servicesService.createService({
  user_id: userId,
  title: 'My Service',
  description: 'Service description',
  category: 'Technology',
  price: 100
});
```

## Environment Configuration
Make sure your environment files have the correct Supabase configuration:

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  supabase: {
    url: 'https://your-project.supabase.co',
    key: 'your-anon-key'
  }
};
```

## Next Steps

1. **Run the database initialization script** in your Supabase SQL Editor
2. **Test the authentication flow** in your Angular application
3. **Create your first service** to test the complete flow
4. **Set up real-time subscriptions** for live updates
5. **Customize the schema** based on your specific needs

## Troubleshooting

### Common Issues
1. **RLS Policy Errors**: Make sure you're authenticated when testing
2. **Type Errors**: Ensure all imports are correct in your TypeScript files
3. **Missing Tables**: Run the initialization script completely
4. **Storage Errors**: Check that storage buckets are created and policies are set

### Useful SQL Queries
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check RLS policies
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- View storage buckets
SELECT * FROM storage.buckets;
```

## Support
If you encounter any issues:
1. Check the Supabase logs in your dashboard
2. Verify your RLS policies are correct
3. Ensure your environment variables are set properly
4. Check the browser console for detailed error messages
