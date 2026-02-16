/**
 * Geographic data for shipping zones
 * Countries and US states with ISO codes
 */

export interface CountryOption {
  code: string;
  name: string;
}

export interface StateOption {
  code: string;
  name: string;
  country: string;
}

// austraila,canada,us,uk

// Top countries for e-commerce
export const COUNTRIES: CountryOption[] = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'IE', name: 'Ireland' },
  { code: 'AT', name: 'Austria' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'GR', name: 'Greece' },
  { code: 'PL', name: 'Poland' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'HU', name: 'Hungary' },
  { code: 'RO', name: 'Romania' },
  { code: 'JP', name: 'Japan' },
  { code: 'CN', name: 'China' },
  { code: 'KR', name: 'South Korea' },
  { code: 'SG', name: 'Singapore' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'IN', name: 'India' },
  { code: 'MX', name: 'Mexico' },
  { code: 'BR', name: 'Brazil' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'IL', name: 'Israel' },
  { code: 'TR', name: 'Turkey' },
  { code: 'TH', name: 'Thailand' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'PH', name: 'Philippines' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'VN', name: 'Vietnam' },
];

// US States and Territories
export const US_STATES: StateOption[] = [
  { code: 'AL', name: 'Alabama', country: 'US' },
  { code: 'AK', name: 'Alaska', country: 'US' },
  { code: 'AZ', name: 'Arizona', country: 'US' },
  { code: 'AR', name: 'Arkansas', country: 'US' },
  { code: 'CA', name: 'California', country: 'US' },
  { code: 'CO', name: 'Colorado', country: 'US' },
  { code: 'CT', name: 'Connecticut', country: 'US' },
  { code: 'DE', name: 'Delaware', country: 'US' },
  { code: 'FL', name: 'Florida', country: 'US' },
  { code: 'GA', name: 'Georgia', country: 'US' },
  { code: 'HI', name: 'Hawaii', country: 'US' },
  { code: 'ID', name: 'Idaho', country: 'US' },
  { code: 'IL', name: 'Illinois', country: 'US' },
  { code: 'IN', name: 'Indiana', country: 'US' },
  { code: 'IA', name: 'Iowa', country: 'US' },
  { code: 'KS', name: 'Kansas', country: 'US' },
  { code: 'KY', name: 'Kentucky', country: 'US' },
  { code: 'LA', name: 'Louisiana', country: 'US' },
  { code: 'ME', name: 'Maine', country: 'US' },
  { code: 'MD', name: 'Maryland', country: 'US' },
  { code: 'MA', name: 'Massachusetts', country: 'US' },
  { code: 'MI', name: 'Michigan', country: 'US' },
  { code: 'MN', name: 'Minnesota', country: 'US' },
  { code: 'MS', name: 'Mississippi', country: 'US' },
  { code: 'MO', name: 'Missouri', country: 'US' },
  { code: 'MT', name: 'Montana', country: 'US' },
  { code: 'NE', name: 'Nebraska', country: 'US' },
  { code: 'NV', name: 'Nevada', country: 'US' },
  { code: 'NH', name: 'New Hampshire', country: 'US' },
  { code: 'NJ', name: 'New Jersey', country: 'US' },
  { code: 'NM', name: 'New Mexico', country: 'US' },
  { code: 'NY', name: 'New York', country: 'US' },
  { code: 'NC', name: 'North Carolina', country: 'US' },
  { code: 'ND', name: 'North Dakota', country: 'US' },
  { code: 'OH', name: 'Ohio', country: 'US' },
  { code: 'OK', name: 'Oklahoma', country: 'US' },
  { code: 'OR', name: 'Oregon', country: 'US' },
  { code: 'PA', name: 'Pennsylvania', country: 'US' },
  { code: 'RI', name: 'Rhode Island', country: 'US' },
  { code: 'SC', name: 'South Carolina', country: 'US' },
  { code: 'SD', name: 'South Dakota', country: 'US' },
  { code: 'TN', name: 'Tennessee', country: 'US' },
  { code: 'TX', name: 'Texas', country: 'US' },
  { code: 'UT', name: 'Utah', country: 'US' },
  { code: 'VT', name: 'Vermont', country: 'US' },
  { code: 'VA', name: 'Virginia', country: 'US' },
  { code: 'WA', name: 'Washington', country: 'US' },
  { code: 'WV', name: 'West Virginia', country: 'US' },
  { code: 'WI', name: 'Wisconsin', country: 'US' },
  { code: 'WY', name: 'Wyoming', country: 'US' },
  { code: 'DC', name: 'District of Columbia', country: 'US' },
  { code: 'PR', name: 'Puerto Rico', country: 'US' },
  { code: 'VI', name: 'Virgin Islands', country: 'US' },
  { code: 'GU', name: 'Guam', country: 'US' },
];

// Canadian Provinces
export const CANADIAN_PROVINCES: StateOption[] = [
  { code: 'AB', name: 'Alberta', country: 'CA' },
  { code: 'BC', name: 'British Columbia', country: 'CA' },
  { code: 'MB', name: 'Manitoba', country: 'CA' },
  { code: 'NB', name: 'New Brunswick', country: 'CA' },
  { code: 'NL', name: 'Newfoundland and Labrador', country: 'CA' },
  { code: 'NT', name: 'Northwest Territories', country: 'CA' },
  { code: 'NS', name: 'Nova Scotia', country: 'CA' },
  { code: 'NU', name: 'Nunavut', country: 'CA' },
  { code: 'ON', name: 'Ontario', country: 'CA' },
  { code: 'PE', name: 'Prince Edward Island', country: 'CA' },
  { code: 'QC', name: 'Quebec', country: 'CA' },
  { code: 'SK', name: 'Saskatchewan', country: 'CA' },
  { code: 'YT', name: 'Yukon', country: 'CA' },
];

// All states combined
export const ALL_STATES: StateOption[] = [
  ...US_STATES,
  ...CANADIAN_PROVINCES,
];

/**
 * Get country name from ISO code
 */
export function getCountryName(code: string): string {
  const country = COUNTRIES.find(c => c.code === code);
  return country ? country.name : code;
}

/**
 * Get state name from code
 */
export function getStateName(code: string): string {
  const state = ALL_STATES.find(s => s.code === code);
  return state ? state.name : code;
}

/**
 * Get states for a specific country
 */
export function getStatesForCountry(countryCode: string): StateOption[] {
  return ALL_STATES.filter(s => s.country === countryCode);
}
