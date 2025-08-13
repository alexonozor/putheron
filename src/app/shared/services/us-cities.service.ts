import { Injectable } from '@angular/core';

export interface USCity {
  name: string;
  state: string;
  stateCode: string;
  county?: string;
  population?: number;
}

// Import comprehensive cities data
import { US_CITIES_BY_STATE, ALL_US_CITIES } from '../data/us-cities-comprehensive';

@Injectable({
  providedIn: 'root'
})
export class USCitiesService {
  
  getCities(): USCity[] {
    return ALL_US_CITIES;
  }
  
  searchCities(query: string): USCity[] {
    if (!query || query.length < 2) {
      return [];
    }
    
    const searchTerm = query.toLowerCase();
    return ALL_US_CITIES.filter(city => 
      city.name.toLowerCase().includes(searchTerm)
    ).slice(0, 15); // Limit to 15 results for better performance
  }
  
  getStateByCity(cityName: string): USCity | null {
    return ALL_US_CITIES.find(city => 
      city.name.toLowerCase() === cityName.toLowerCase()
    ) || null;
  }

  getCitiesByState(stateCode: string): USCity[] {
    const cities = US_CITIES_BY_STATE[stateCode] || [];
    return cities.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Get popular cities by state (top 10 by population)
  getPopularCitiesByState(stateCode: string): USCity[] {
    const cities = this.getCitiesByState(stateCode);
    return cities
      .filter(city => city.population)
      .sort((a, b) => (b.population || 0) - (a.population || 0))
      .slice(0, 10);
  }

  // Get all cities in a state with populations above a threshold
  getCitiesByStateWithMinPopulation(stateCode: string, minPopulation: number = 10000): USCity[] {
    const cities = this.getCitiesByState(stateCode);
    return cities.filter(city => (city.population || 0) >= minPopulation);
  }
}
