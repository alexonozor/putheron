import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { FavoriteButtonComponent } from '../favorite-button/favorite-button.component';
import { Business } from '../../services/business.service';

@Component({
  selector: 'app-business-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatChipsModule,
    FavoriteButtonComponent
  ],
  templateUrl: './business-card.component.html',
  styleUrls: ['./business-card.component.scss']
})
export class BusinessCardComponent {
  // Inputs using Angular 20+ signal-based inputs
  business = input.required<Business>();
  ownerName = input<string>('Business Owner');
  ownerAvatar = input<string | null>(null);
  ownerCountry = input<string>('Unknown');
  categoryName = input<string>('Uncategorized');

  // Outputs
  businessClick = output<Business>();
  favoriteClick = output<string>();

  // Country to flag emoji mapping
  private countryFlagMap: { [key: string]: string } = {
    // North America
    'USA': '🇺🇸',
    'United States': '🇺🇸',
    'Canada': '🇨🇦',
    'Mexico': '🇲🇽',
    'Cuba': '🇨🇺',
    'Haiti': '🇭🇹',
    'Dominican Republic': '🇩🇴',
    'Puerto Rico': '🇵🇷',
    'Jamaica': '🇯🇲',
    'Trinidad and Tobago': '🇹🇹',
    'Barbados': '�🇧',
    'Bahamas': '�🇸',
    'Belize': '🇧🇿',
    'Costa Rica': '🇨�',
    'El Salvador': '��',
    'Guatemala': '🇬🇹',
    'Honduras': '��',
    'Nicaragua': '🇳🇮',
    'Panama': '🇵🇦',
    'Grenada': '��',
    'Saint Lucia': '��',
    'Antigua and Barbuda': '🇦🇬',
    'Dominica': '��',
    'Saint Kitts and Nevis': '��',
    'Saint Vincent and the Grenadines': '��',

    // South America
    'Argentina': '🇦🇷',
    'Bolivia': '🇧🇴',
    'Brazil': '🇧🇷',
    'Chile': '🇨🇱',
    'Colombia': '🇨🇴',
    'Ecuador': '🇪🇨',
    'Guyana': '🇬🇾',
    'Paraguay': '🇵🇾',
    'Peru': '🇵🇪',
    'Suriname': '🇸🇷',
    'Uruguay': '🇺🇾',
    'Venezuela': '🇻🇪',
    'French Guiana': '🇬🇫',

    // Europe
    'United Kingdom': '🇬🇧',
    'UK': '🇬🇧',
    'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    'Wales': '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
    'Ireland': '🇮🇪',
    'Northern Ireland': '🇬🇧',
    'France': '🇫🇷',
    'Germany': '🇩🇪',
    'Italy': '🇮🇹',
    'Spain': '🇪🇸',
    'Portugal': '🇵🇹',
    'Netherlands': '🇳🇱',
    'Belgium': '🇧🇪',
    'Switzerland': '🇨🇭',
    'Austria': '�🇹',
    'Sweden': '🇸�🇪',
    'Norway': '�🇴',
    'Denmark': '🇩🇰',
    'Finland': '🇫🇮',
    'Iceland': '🇮🇸',
    'Greece': '🇬🇷',
    'Poland': '🇵🇱',
    'Czech Republic': '�🇨🇿',
    'Hungary': '🇭🇺',
    'Romania': '🇷🇴',
    'Bulgaria': '🇧🇬',
    'Croatia': '🇭🇷',
    'Serbia': '🇷🇸',
    'Slovenia': '🇸🇮',
    'Slovakia': '��',
    'Bosnia and Herzegovina': '🇧🇦',
    'Montenegro': '🇲🇪',
    'North Macedonia': '🇲🇰',
    'Albania': '🇦🇱',
    'Kosovo': '🇽🇰',
    'Estonia': '🇪🇪',
    'Latvia': '🇱🇻',
    'Lithuania': '🇱🇹',
    'Belarus': '�🇾',
    'Moldova': '🇲🇩',
    'Ukraine': '🇺🇦',
    'Russia': '🇷🇺',
    'Georgia': '🇬🇪',
    'Armenia': '🇦🇲',
    'Azerbaijan': '🇦🇿',
    'Cyprus': '🇨🇾',
    'Malta': '🇲🇹',
    'Luxembourg': '🇱🇺',
    'Monaco': '🇲🇨',
    'Andorra': '🇦🇩',
    'San Marino': '🇸🇲',
    'Vatican City': '🇻🇦',
    'Liechtenstein': '��',

    // Asia
    'China': '🇨🇳',
    'Japan': '🇯🇵',
    'South Korea': '🇰🇷',
    'North Korea': '🇰🇵',
    'India': '🇮🇳',
    'Pakistan': '🇵🇰',
    'Bangladesh': '🇧🇩',
    'Sri Lanka': '🇱🇰',
    'Nepal': '🇳🇵',
    'Bhutan': '🇧🇹',
    'Maldives': '🇲🇻',
    'Afghanistan': '🇦🇫',
    'Indonesia': '🇮🇩',
    'Malaysia': '🇲🇾',
    'Singapore': '🇸🇬',
    'Thailand': '🇹🇭',
    'Vietnam': '🇻🇳',
    'Philippines': '🇵🇭',
    'Myanmar': '🇲🇲',
    'Cambodia': '🇰🇭',
    'Laos': '🇱🇦',
    'Brunei': '🇧🇳',
    'East Timor': '🇹🇱',
    'Timor-Leste': '🇹🇱',
    'Mongolia': '�🇳',
    'Taiwan': '🇹�',
    'Hong Kong': '�🇭🇰',
    'Macau': '🇲🇴',
    'Kazakhstan': '🇰🇿',
    'Uzbekistan': '��',
    'Turkmenistan': '🇹🇲',
    'Kyrgyzstan': '�🇬',
    'Tajikistan': '🇹🇯',

    // Middle East
    'Turkey': '🇹🇷',
    'Iran': '��',
    'Iraq': '🇮🇶',
    'Syria': '🇸🇾',
    'Lebanon': '🇱🇧',
    'Jordan': '🇯🇴',
    'Israel': '🇮🇱',
    'Palestine': '🇵🇸',
    'Saudi Arabia': '�🇦',
    'Yemen': '🇾🇪',
    'Oman': '��',
    'UAE': '🇦�🇪',
    'United Arab Emirates': '��🇪',
    'Qatar': '�🇦',
    'Kuwait': '🇰🇼',
    'Bahrain': '�🇭',

    // Africa
    'Egypt': '🇪🇬',
    'Libya': '��',
    'Tunisia': '�🇹🇳',
    'Algeria': '🇩🇿',
    'Morocco': '🇲🇦',
    'Sudan': '��',
    'South Sudan': '🇸🇸',
    'Ethiopia': '��🇹',
    'Eritrea': '�🇷',
    'Djibouti': '🇩🇯',
    'Somalia': '🇸🇴',
    'Kenya': '🇰🇪',
    'Uganda': '🇺🇬',
    'Tanzania': '🇹🇿',
    'Rwanda': '🇷🇼',
    'Burundi': '🇧🇮',
    'South Africa': '��',
    'Namibia': '🇳🇦',
    'Botswana': '🇧🇼',
    'Zimbabwe': '🇿🇼',
    'Zambia': '🇿🇲',
    'Malawi': '��',
    'Mozambique': '🇲🇿',
    'Madagascar': '��',
    'Mauritius': '🇲🇺',
    'Seychelles': '🇸🇨',
    'Comoros': '🇰🇲',
    'Angola': '��',
    'Democratic Republic of Congo': '🇨🇩',
    'Republic of Congo': '🇨🇬',
    'Gabon': '��',
    'Cameroon': '🇨�',
    'Central African Republic': '��',
    'Chad': '��',
    'Nigeria': '🇳🇬',
    'Niger': '🇳�',
    'Benin': '🇧🇯',
    'Togo': '🇹�',
    'Ghana': '�🇭',
    'Ivory Coast': '🇨🇮',
    'Burkina Faso': '🇧🇫',
    'Mali': '��',
    'Senegal': '🇸�',
    'Guinea': '🇬🇳',
    'Guinea-Bissau': '��',
    'Sierra Leone': '��',
    'Liberia': '��',
    'Mauritania': '��',
    'Gambia': '🇬🇲',
    'Cape Verde': '��',
    'Sao Tome and Principe': '��',
    'Equatorial Guinea': '��',
    'Lesotho': '🇱🇸',
    'Eswatini': '🇸🇿',
    'Swaziland': '��',

    // Oceania
    'Australia': '�🇺',
    'New Zealand': '🇳🇿',
    'Papua New Guinea': '��',
    'Fiji': '��',
    'Solomon Islands': '��',
    'Vanuatu': '🇻🇺',
    'Samoa': '🇼🇸',
    'Tonga': '🇹�',
    'Kiribati': '��',
    'Micronesia': '🇫🇲',
    'Marshall Islands': '��',
    'Palau': '�🇼',
    'Nauru': '��',
    'Tuvalu': '��',
  };

  onCardClick(): void {
    this.businessClick.emit(this.business());
  }

  onFavoriteClick(event: Event): void {
    event.stopPropagation();
    this.favoriteClick.emit(this.business()._id);
  }

  // Owner-related methods
  getOwnerFullName(): string {
    const business = this.business();
    if (business.owner_id && typeof business.owner_id === 'object') {
      const owner = business.owner_id;
      const firstName = owner.first_name || '';
      const lastName = owner.last_name || '';
      const fullName = `${firstName} ${lastName}`.trim();
      return fullName || 'Business Owner';
    }
    return 'Business Owner';
  }

  getOwnerProfilePicture(): string | null {
    const business = this.business();
    if (business.owner_id && typeof business.owner_id === 'object') {
      const owner = business.owner_id;
      // Check for profile_picture first, then avatar_url
      return owner.profile_picture || owner.avatar_url || null;
    }
    return null;
  }

  getOwnerInitials(): string {
    const business = this.business();
    if (business.owner_id && typeof business.owner_id === 'object') {
      const owner = business.owner_id;
      const firstName = owner.first_name || '';
      const lastName = owner.last_name || '';
      
      if (firstName && lastName) {
        return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
      }
      
      if (firstName) {
        return firstName.substring(0, 2).toUpperCase();
      }
      
      if (lastName) {
        return lastName.substring(0, 2).toUpperCase();
      }
      
      // Fallback to email initials
      if (owner.email) {
        return owner.email.substring(0, 2).toUpperCase();
      }
    }
    
    return 'BO'; // Business Owner
  }

  getOwnerAvatarColor(): string {
    // Material Design color palette
    const colors = [
      '#F44336', // Red 500
      '#E91E63', // Pink 500
      '#9C27B0', // Purple 500
      '#673AB7', // Deep Purple 500
      '#3F51B5', // Indigo 500
      '#2196F3', // Blue 500
      '#03A9F4', // Light Blue 500
      '#00BCD4', // Cyan 500
      '#009688', // Teal 500
      '#4CAF50', // Green 500
      '#8BC34A', // Light Green 500
      '#FF9800', // Orange 500
      '#FF5722', // Deep Orange 500
      '#795548', // Brown 500
      '#607D8B', // Blue Grey 500
    ];

    // Use owner ID to generate consistent color for same owner
    const business = this.business();
    if (business.owner_id && typeof business.owner_id === 'object') {
      const ownerId = business.owner_id._id || '';
      // Simple hash function to get consistent index
      let hash = 0;
      for (let i = 0; i < ownerId.length; i++) {
        hash = ownerId.charCodeAt(i) + ((hash << 5) - hash);
      }
      const index = Math.abs(hash) % colors.length;
      return colors[index];
    }
    
    return colors[0]; // Default to red
  }

  getOwnerCountryFlag(): string | null {
    const business = this.business();
    if (business.owner_id && typeof business.owner_id === 'object') {
      const owner = business.owner_id;
      if (owner.country_of_origin) {
        return this.countryFlagMap[owner.country_of_origin] || null;
      }
    }
    return null;
  }

  getOwnerCountryName(): string {
    const business = this.business();
    if (business.owner_id && typeof business.owner_id === 'object') {
      const owner = business.owner_id;
      return owner.country_of_origin || '';
    }
    return '';
  }

  getDefaultBanner(): string {
    return 'bg-gradient-to-br from-green-400 to-blue-500';
  }

  hasRating(): boolean {
    const business = this.business();
    return business.rating != null && business.rating > 0;
  }

  getRatingDisplay(): string {
    return this.business().rating?.toFixed(1) || '0.0';
  }

  getReviewCount(): number {
    return this.business().review_count || 0;
  }

  getReviewText(): string {
    const count = this.getReviewCount();
    return count === 1 ? 'review' : 'reviews';
  }

  getVisibleTags(): string[] {
    const tags = this.business().tags;
    if (!tags) return [];
    return tags.slice(0, 2);
  }

  getExtraTagsCount(): number {
    const tags = this.business().tags;
    if (!tags) return 0;
    return Math.max(0, tags.length - 2);
  }

  hasExtraTags(): boolean {
    return this.getExtraTagsCount() > 0;
  }

  getBusinessDescription(): string {
    const business = this.business();
    return business.short_description || business.description || 'Professional service provider';
  }

  getBusinessLocation(): string | null {
    const business = this.business();
    if (business.city && business.state) {
      return `${business.city}, ${business.state}`;
    }
    return null;
  }

  hasViewCount(): boolean {
    return (this.business().view_count || 0) > 0;
  }

  getBusinessInitials(): string {
    const name = this.business().name || 'B';
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getCategoryInitials(): string {
    const category = this.categoryName() || 'SC';
    const words = category.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return category.substring(0, 2).toUpperCase();
  }

  getStartingPrice(): number | null {
    const business = this.business();
    
    // Check if servicesData exists and has items
    if (!business.servicesData || business.servicesData.length === 0) {
      return null;
    }

    // Filter services that have a price
    const servicesWithPrices = business.servicesData.filter(service => 
      service.price !== undefined && 
      service.price !== null && 
      service.price > 0
    );

    // If no services have prices, return null
    if (servicesWithPrices.length === 0) {
      return null;
    }

    // Return the minimum price
    return Math.min(...servicesWithPrices.map(service => service.price!));
  }

  hasStartingPrice(): boolean {
    return this.getStartingPrice() !== null;
  }
}
