import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';
import { Tables } from '../../types/database.types';

interface FeaturedProfile extends Tables<'profiles'> {
  business?: {
    name: string;
    description: string | null;
  };
}

@Component({
  selector: 'featured-women-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './featured-women.component.html',
  styleUrls: ['./featured-women.component.scss']
})
export class FeaturedWomenComponent implements OnInit {
  private supabaseService = inject(SupabaseService);
  
  featuredProfiles = signal<FeaturedProfile[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  async ngOnInit() {
    await this.loadFeaturedProfiles();
  }

  async loadFeaturedProfiles() {
    try {
      this.loading.set(true);
      this.error.set(null);

      // First, let's check if we have any profiles at all
      const { data: allProfiles, error: allProfilesError } = await this.supabaseService.getClient()
        .from('profiles')
        .select('*')
        .limit(5);

      console.log('All profiles:', allProfiles);
      console.log('All profiles error:', allProfilesError);

      // Fetch profiles along with their business information
      // Remove strict filters to see what we get
      const { data, error } = await this.supabaseService.getClient()
        .from('profiles')
        .select(`
          *,
          businesses (
            name,
            description
          )
        `)
        .limit(8);

      console.log('Featured profiles data:', data);
      console.log('Featured profiles error:', error);

      if (error) {
        console.error('Error fetching featured profiles:', error);
        this.error.set('Failed to load featured profiles');
        return;
      }

      if (data) {
        // Transform the data to include business info
        const profiles: FeaturedProfile[] = data.map(profile => ({
          ...profile,
          business: Array.isArray(profile.businesses) && profile.businesses.length > 0 
            ? profile.businesses[0] 
            : undefined
        }));
        
        console.log('Transformed profiles:', profiles);
        this.featuredProfiles.set(profiles);
      }

    } catch (err: any) {
      console.error('Error loading featured profiles:', err);
      this.error.set('Failed to load featured profiles');
    } finally {
      this.loading.set(false);
    }
  }

  getProfileImageUrl(profile: FeaturedProfile): string {
    return profile.avatar_url || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80';
  }

  getBusinessName(profile: FeaturedProfile): string {
    return profile.business?.name || 'Entrepreneur';
  }

  getBusinessDescription(profile: FeaturedProfile): string {
    return profile.business?.description || 'Building amazing solutions and services.';
  }

  onImageError(event: any) {
    event.target.src = 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80';
  }
}