import { Injectable } from '@angular/core';

export interface USCity {
  name: string;
  state: string;
  stateCode: string;
}

// A subset of major US cities mapped to their states
const US_CITIES: USCity[] = [
  // Alabama
  { name: 'Birmingham', state: 'Alabama', stateCode: 'AL' },
  { name: 'Montgomery', state: 'Alabama', stateCode: 'AL' },
  { name: 'Mobile', state: 'Alabama', stateCode: 'AL' },
  
  // Alaska
  { name: 'Anchorage', state: 'Alaska', stateCode: 'AK' },
  { name: 'Fairbanks', state: 'Alaska', stateCode: 'AK' },
  { name: 'Juneau', state: 'Alaska', stateCode: 'AK' },
  
  // Arizona
  { name: 'Phoenix', state: 'Arizona', stateCode: 'AZ' },
  { name: 'Tucson', state: 'Arizona', stateCode: 'AZ' },
  { name: 'Mesa', state: 'Arizona', stateCode: 'AZ' },
  { name: 'Chandler', state: 'Arizona', stateCode: 'AZ' },
  { name: 'Scottsdale', state: 'Arizona', stateCode: 'AZ' },
  
  // Arkansas
  { name: 'Little Rock', state: 'Arkansas', stateCode: 'AR' },
  { name: 'Fort Smith', state: 'Arkansas', stateCode: 'AR' },
  { name: 'Fayetteville', state: 'Arkansas', stateCode: 'AR' },
  
  // California
  { name: 'Los Angeles', state: 'California', stateCode: 'CA' },
  { name: 'San Francisco', state: 'California', stateCode: 'CA' },
  { name: 'San Diego', state: 'California', stateCode: 'CA' },
  { name: 'San Jose', state: 'California', stateCode: 'CA' },
  { name: 'Sacramento', state: 'California', stateCode: 'CA' },
  { name: 'Oakland', state: 'California', stateCode: 'CA' },
  { name: 'Fresno', state: 'California', stateCode: 'CA' },
  { name: 'Long Beach', state: 'California', stateCode: 'CA' },
  
  // Colorado
  { name: 'Denver', state: 'Colorado', stateCode: 'CO' },
  { name: 'Colorado Springs', state: 'Colorado', stateCode: 'CO' },
  { name: 'Aurora', state: 'Colorado', stateCode: 'CO' },
  
  // Connecticut
  { name: 'Hartford', state: 'Connecticut', stateCode: 'CT' },
  { name: 'Bridgeport', state: 'Connecticut', stateCode: 'CT' },
  { name: 'New Haven', state: 'Connecticut', stateCode: 'CT' },
  
  // Delaware
  { name: 'Wilmington', state: 'Delaware', stateCode: 'DE' },
  { name: 'Dover', state: 'Delaware', stateCode: 'DE' },
  
  // Florida
  { name: 'Miami', state: 'Florida', stateCode: 'FL' },
  { name: 'Tampa', state: 'Florida', stateCode: 'FL' },
  { name: 'Orlando', state: 'Florida', stateCode: 'FL' },
  { name: 'Jacksonville', state: 'Florida', stateCode: 'FL' },
  { name: 'Fort Lauderdale', state: 'Florida', stateCode: 'FL' },
  { name: 'Tallahassee', state: 'Florida', stateCode: 'FL' },
  
  // Georgia
  { name: 'Atlanta', state: 'Georgia', stateCode: 'GA' },
  { name: 'Augusta', state: 'Georgia', stateCode: 'GA' },
  { name: 'Savannah', state: 'Georgia', stateCode: 'GA' },
  { name: 'Columbus', state: 'Georgia', stateCode: 'GA' },
  
  // Hawaii
  { name: 'Honolulu', state: 'Hawaii', stateCode: 'HI' },
  { name: 'Pearl City', state: 'Hawaii', stateCode: 'HI' },
  { name: 'Hilo', state: 'Hawaii', stateCode: 'HI' },
  
  // Idaho
  { name: 'Boise', state: 'Idaho', stateCode: 'ID' },
  { name: 'Meridian', state: 'Idaho', stateCode: 'ID' },
  { name: 'Nampa', state: 'Idaho', stateCode: 'ID' },
  
  // Illinois
  { name: 'Chicago', state: 'Illinois', stateCode: 'IL' },
  { name: 'Aurora', state: 'Illinois', stateCode: 'IL' },
  { name: 'Rockford', state: 'Illinois', stateCode: 'IL' },
  { name: 'Joliet', state: 'Illinois', stateCode: 'IL' },
  { name: 'Springfield', state: 'Illinois', stateCode: 'IL' },
  
  // Indiana
  { name: 'Indianapolis', state: 'Indiana', stateCode: 'IN' },
  { name: 'Fort Wayne', state: 'Indiana', stateCode: 'IN' },
  { name: 'Evansville', state: 'Indiana', stateCode: 'IN' },
  
  // Iowa
  { name: 'Des Moines', state: 'Iowa', stateCode: 'IA' },
  { name: 'Cedar Rapids', state: 'Iowa', stateCode: 'IA' },
  { name: 'Davenport', state: 'Iowa', stateCode: 'IA' },
  
  // Kansas
  { name: 'Wichita', state: 'Kansas', stateCode: 'KS' },
  { name: 'Overland Park', state: 'Kansas', stateCode: 'KS' },
  { name: 'Kansas City', state: 'Kansas', stateCode: 'KS' },
  { name: 'Topeka', state: 'Kansas', stateCode: 'KS' },
  
  // Kentucky
  { name: 'Louisville', state: 'Kentucky', stateCode: 'KY' },
  { name: 'Lexington', state: 'Kentucky', stateCode: 'KY' },
  { name: 'Frankfort', state: 'Kentucky', stateCode: 'KY' },
  
  // Louisiana
  { name: 'New Orleans', state: 'Louisiana', stateCode: 'LA' },
  { name: 'Baton Rouge', state: 'Louisiana', stateCode: 'LA' },
  { name: 'Shreveport', state: 'Louisiana', stateCode: 'LA' },
  
  // Maine
  { name: 'Portland', state: 'Maine', stateCode: 'ME' },
  { name: 'Lewiston', state: 'Maine', stateCode: 'ME' },
  { name: 'Bangor', state: 'Maine', stateCode: 'ME' },
  { name: 'Augusta', state: 'Maine', stateCode: 'ME' },
  
  // Maryland
  { name: 'Baltimore', state: 'Maryland', stateCode: 'MD' },
  { name: 'Frederick', state: 'Maryland', stateCode: 'MD' },
  { name: 'Rockville', state: 'Maryland', stateCode: 'MD' },
  { name: 'Annapolis', state: 'Maryland', stateCode: 'MD' },
  
  // Massachusetts
  { name: 'Boston', state: 'Massachusetts', stateCode: 'MA' },
  { name: 'Worcester', state: 'Massachusetts', stateCode: 'MA' },
  { name: 'Springfield', state: 'Massachusetts', stateCode: 'MA' },
  { name: 'Cambridge', state: 'Massachusetts', stateCode: 'MA' },
  
  // Michigan
  { name: 'Detroit', state: 'Michigan', stateCode: 'MI' },
  { name: 'Grand Rapids', state: 'Michigan', stateCode: 'MI' },
  { name: 'Warren', state: 'Michigan', stateCode: 'MI' },
  { name: 'Sterling Heights', state: 'Michigan', stateCode: 'MI' },
  { name: 'Lansing', state: 'Michigan', stateCode: 'MI' },
  
  // Minnesota
  { name: 'Minneapolis', state: 'Minnesota', stateCode: 'MN' },
  { name: 'Saint Paul', state: 'Minnesota', stateCode: 'MN' },
  { name: 'Rochester', state: 'Minnesota', stateCode: 'MN' },
  
  // Mississippi
  { name: 'Jackson', state: 'Mississippi', stateCode: 'MS' },
  { name: 'Gulfport', state: 'Mississippi', stateCode: 'MS' },
  { name: 'Southaven', state: 'Mississippi', stateCode: 'MS' },
  
  // Missouri
  { name: 'Kansas City', state: 'Missouri', stateCode: 'MO' },
  { name: 'Saint Louis', state: 'Missouri', stateCode: 'MO' },
  { name: 'Springfield', state: 'Missouri', stateCode: 'MO' },
  { name: 'Jefferson City', state: 'Missouri', stateCode: 'MO' },
  
  // Montana
  { name: 'Billings', state: 'Montana', stateCode: 'MT' },
  { name: 'Missoula', state: 'Montana', stateCode: 'MT' },
  { name: 'Great Falls', state: 'Montana', stateCode: 'MT' },
  { name: 'Helena', state: 'Montana', stateCode: 'MT' },
  
  // Nebraska
  { name: 'Omaha', state: 'Nebraska', stateCode: 'NE' },
  { name: 'Lincoln', state: 'Nebraska', stateCode: 'NE' },
  { name: 'Bellevue', state: 'Nebraska', stateCode: 'NE' },
  
  // Nevada
  { name: 'Las Vegas', state: 'Nevada', stateCode: 'NV' },
  { name: 'Henderson', state: 'Nevada', stateCode: 'NV' },
  { name: 'Reno', state: 'Nevada', stateCode: 'NV' },
  { name: 'Carson City', state: 'Nevada', stateCode: 'NV' },
  
  // New Hampshire
  { name: 'Manchester', state: 'New Hampshire', stateCode: 'NH' },
  { name: 'Nashua', state: 'New Hampshire', stateCode: 'NH' },
  { name: 'Concord', state: 'New Hampshire', stateCode: 'NH' },
  
  // New Jersey
  { name: 'Newark', state: 'New Jersey', stateCode: 'NJ' },
  { name: 'Jersey City', state: 'New Jersey', stateCode: 'NJ' },
  { name: 'Paterson', state: 'New Jersey', stateCode: 'NJ' },
  { name: 'Trenton', state: 'New Jersey', stateCode: 'NJ' },
  
  // New Mexico
  { name: 'Albuquerque', state: 'New Mexico', stateCode: 'NM' },
  { name: 'Las Cruces', state: 'New Mexico', stateCode: 'NM' },
  { name: 'Rio Rancho', state: 'New Mexico', stateCode: 'NM' },
  { name: 'Santa Fe', state: 'New Mexico', stateCode: 'NM' },
  
  // New York
  { name: 'New York City', state: 'New York', stateCode: 'NY' },
  { name: 'Buffalo', state: 'New York', stateCode: 'NY' },
  { name: 'Rochester', state: 'New York', stateCode: 'NY' },
  { name: 'Yonkers', state: 'New York', stateCode: 'NY' },
  { name: 'Syracuse', state: 'New York', stateCode: 'NY' },
  { name: 'Albany', state: 'New York', stateCode: 'NY' },
  
  // North Carolina
  { name: 'Charlotte', state: 'North Carolina', stateCode: 'NC' },
  { name: 'Raleigh', state: 'North Carolina', stateCode: 'NC' },
  { name: 'Greensboro', state: 'North Carolina', stateCode: 'NC' },
  { name: 'Durham', state: 'North Carolina', stateCode: 'NC' },
  { name: 'Winston-Salem', state: 'North Carolina', stateCode: 'NC' },
  
  // North Dakota
  { name: 'Fargo', state: 'North Dakota', stateCode: 'ND' },
  { name: 'Bismarck', state: 'North Dakota', stateCode: 'ND' },
  { name: 'Grand Forks', state: 'North Dakota', stateCode: 'ND' },
  
  // Ohio
  { name: 'Columbus', state: 'Ohio', stateCode: 'OH' },
  { name: 'Cleveland', state: 'Ohio', stateCode: 'OH' },
  { name: 'Cincinnati', state: 'Ohio', stateCode: 'OH' },
  { name: 'Toledo', state: 'Ohio', stateCode: 'OH' },
  { name: 'Akron', state: 'Ohio', stateCode: 'OH' },
  
  // Oklahoma
  { name: 'Oklahoma City', state: 'Oklahoma', stateCode: 'OK' },
  { name: 'Tulsa', state: 'Oklahoma', stateCode: 'OK' },
  { name: 'Norman', state: 'Oklahoma', stateCode: 'OK' },
  
  // Oregon
  { name: 'Portland', state: 'Oregon', stateCode: 'OR' },
  { name: 'Salem', state: 'Oregon', stateCode: 'OR' },
  { name: 'Eugene', state: 'Oregon', stateCode: 'OR' },
  
  // Pennsylvania
  { name: 'Philadelphia', state: 'Pennsylvania', stateCode: 'PA' },
  { name: 'Pittsburgh', state: 'Pennsylvania', stateCode: 'PA' },
  { name: 'Allentown', state: 'Pennsylvania', stateCode: 'PA' },
  { name: 'Erie', state: 'Pennsylvania', stateCode: 'PA' },
  { name: 'Harrisburg', state: 'Pennsylvania', stateCode: 'PA' },
  
  // Rhode Island
  { name: 'Providence', state: 'Rhode Island', stateCode: 'RI' },
  { name: 'Warwick', state: 'Rhode Island', stateCode: 'RI' },
  { name: 'Cranston', state: 'Rhode Island', stateCode: 'RI' },
  
  // South Carolina
  { name: 'Charleston', state: 'South Carolina', stateCode: 'SC' },
  { name: 'Columbia', state: 'South Carolina', stateCode: 'SC' },
  { name: 'North Charleston', state: 'South Carolina', stateCode: 'SC' },
  
  // South Dakota
  { name: 'Sioux Falls', state: 'South Dakota', stateCode: 'SD' },
  { name: 'Rapid City', state: 'South Dakota', stateCode: 'SD' },
  { name: 'Pierre', state: 'South Dakota', stateCode: 'SD' },
  
  // Tennessee
  { name: 'Nashville', state: 'Tennessee', stateCode: 'TN' },
  { name: 'Memphis', state: 'Tennessee', stateCode: 'TN' },
  { name: 'Knoxville', state: 'Tennessee', stateCode: 'TN' },
  { name: 'Chattanooga', state: 'Tennessee', stateCode: 'TN' },
  
  // Texas
  { name: 'Houston', state: 'Texas', stateCode: 'TX' },
  { name: 'San Antonio', state: 'Texas', stateCode: 'TX' },
  { name: 'Dallas', state: 'Texas', stateCode: 'TX' },
  { name: 'Austin', state: 'Texas', stateCode: 'TX' },
  { name: 'Fort Worth', state: 'Texas', stateCode: 'TX' },
  { name: 'El Paso', state: 'Texas', stateCode: 'TX' },
  
  // Utah
  { name: 'Salt Lake City', state: 'Utah', stateCode: 'UT' },
  { name: 'West Valley City', state: 'Utah', stateCode: 'UT' },
  { name: 'Provo', state: 'Utah', stateCode: 'UT' },
  
  // Vermont
  { name: 'Burlington', state: 'Vermont', stateCode: 'VT' },
  { name: 'South Burlington', state: 'Vermont', stateCode: 'VT' },
  { name: 'Rutland', state: 'Vermont', stateCode: 'VT' },
  { name: 'Montpelier', state: 'Vermont', stateCode: 'VT' },
  
  // Virginia
  { name: 'Virginia Beach', state: 'Virginia', stateCode: 'VA' },
  { name: 'Norfolk', state: 'Virginia', stateCode: 'VA' },
  { name: 'Chesapeake', state: 'Virginia', stateCode: 'VA' },
  { name: 'Richmond', state: 'Virginia', stateCode: 'VA' },
  { name: 'Newport News', state: 'Virginia', stateCode: 'VA' },
  
  // Washington
  { name: 'Seattle', state: 'Washington', stateCode: 'WA' },
  { name: 'Spokane', state: 'Washington', stateCode: 'WA' },
  { name: 'Tacoma', state: 'Washington', stateCode: 'WA' },
  { name: 'Vancouver', state: 'Washington', stateCode: 'WA' },
  { name: 'Olympia', state: 'Washington', stateCode: 'WA' },
  
  // West Virginia
  { name: 'Charleston', state: 'West Virginia', stateCode: 'WV' },
  { name: 'Huntington', state: 'West Virginia', stateCode: 'WV' },
  { name: 'Morgantown', state: 'West Virginia', stateCode: 'WV' },
  
  // Wisconsin
  { name: 'Milwaukee', state: 'Wisconsin', stateCode: 'WI' },
  { name: 'Madison', state: 'Wisconsin', stateCode: 'WI' },
  { name: 'Green Bay', state: 'Wisconsin', stateCode: 'WI' },
  
  // Wyoming
  { name: 'Cheyenne', state: 'Wyoming', stateCode: 'WY' },
  { name: 'Casper', state: 'Wyoming', stateCode: 'WY' },
  { name: 'Laramie', state: 'Wyoming', stateCode: 'WY' },
  
  // District of Columbia
  { name: 'Washington', state: 'District of Columbia', stateCode: 'DC' }
];

@Injectable({
  providedIn: 'root'
})
export class USCitiesService {
  
  getCities(): USCity[] {
    return US_CITIES;
  }
  
  searchCities(query: string): USCity[] {
    if (!query || query.length < 2) {
      return [];
    }
    
    const searchTerm = query.toLowerCase();
    return US_CITIES.filter(city => 
      city.name.toLowerCase().includes(searchTerm)
    ).slice(0, 10); // Limit to 10 results
  }
  
  getStateByCity(cityName: string): USCity | null {
    return US_CITIES.find(city => 
      city.name.toLowerCase() === cityName.toLowerCase()
    ) || null;
  }

  getCitiesByState(stateCode: string): USCity[] {
    return US_CITIES.filter(city => 
      city.stateCode === stateCode
    ).sort((a, b) => a.name.localeCompare(b.name));
  }
}
