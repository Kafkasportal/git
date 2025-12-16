/**
 * Address Service - Turkish cities and districts lookup
 * Database of Turkish cities and their districts
 */

export interface District {
  name: string;
  neighborhoods?: string[];
}

export interface CityData {
  name: string;
  districts: District[];
}

// Major Turkish cities with their districts
const TURKISH_CITIES: Record<string, CityData> = {
  ISTANBUL: {
    name: 'İstanbul',
    districts: [
      { name: 'Açıkköy' },
      { name: 'Adalar' },
      { name: 'Avcılar' },
      { name: 'Bağcıköy' },
      { name: 'Bahçelievler' },
      { name: 'Bakırköy' },
      { name: 'Başakşehir' },
      { name: 'Bayrampaşa' },
      { name: 'Beşiktaş' },
      { name: 'Beykoz' },
      { name: 'Beyoğlu' },
      { name: 'Büyükçekmece' },
      { name: 'Çatalca' },
      { name: 'Çekmeköy' },
      { name: 'Eminönü' },
      { name: 'Esenler' },
      { name: 'Esenyurt' },
      { name: 'Eyüpsultan' },
      { name: 'Fatih' },
      { name: 'Gaziosmanpaşa' },
      { name: 'Güngören' },
      { name: 'Güzel Istanbul' },
      { name: 'Kadıköy' },
      { name: 'Kağıthane' },
      { name: 'Kartal' },
      { name: 'Küçükçekmece' },
      { name: 'Maltepe' },
      { name: 'Pendik' },
      { name: 'Sarıyer' },
      { name: 'Silivri' },
      { name: 'Şile' },
      { name: 'Şişli' },
      { name: 'Taksim' },
      { name: 'Tuzla' },
      { name: 'Ümraniye' },
      { name: 'Üsküdar' },
      { name: 'Zeytinburnu' },
    ],
  },
  ANKARA: {
    name: 'Ankara',
    districts: [
      { name: 'Akyurt' },
      { name: 'Altındağ' },
      { name: 'Ayaş' },
      { name: 'Bala' },
      { name: 'Beypazarı' },
      { name: 'Çamlıdere' },
      { name: 'Çankaya' },
      { name: 'Çubuk' },
      { name: 'Elmadağ' },
      { name: 'Evren' },
      { name: 'Gölbaşı' },
      { name: 'Güdül' },
      { name: 'Haymana' },
      { name: 'Kahramankazan' },
      { name: 'Kalecik' },
      { name: 'Keçiören' },
      { name: 'Kızılcahamam' },
      { name: 'Mamak' },
      { name: 'Nallıhan' },
      { name: 'Polatlı' },
      { name: 'Pursaklar' },
      { name: 'Şentepe' },
      { name: 'Sincan' },
      { name: 'Yenimahalle' },
    ],
  },
  IZMIR: {
    name: 'İzmir',
    districts: [
      { name: 'Alsancak' },
      { name: 'Balçova' },
      { name: 'Bayındır' },
      { name: 'Bayraklı' },
      { name: 'Bergama' },
      { name: 'Bornova' },
      { name: 'Burlalı' },
      { name: 'Çeşme' },
      { name: 'Çiğli' },
      { name: 'Dikili' },
      { name: 'Foça' },
      { name: 'Gaziemir' },
      { name: 'Güzelbahçe' },
      { name: 'Karabağlar' },
      { name: 'Karaburun' },
      { name: 'Karşıyaka' },
      { name: 'Kemalpasa' },
      { name: 'Kiraz' },
      { name: 'Kınıklı' },
      { name: 'Konak' },
      { name: 'Menderes' },
      { name: 'Menemen' },
      { name: 'Nalbur' },
      { name: 'Ödemiş' },
      { name: 'Seferihisar' },
      { name: 'Selçuk' },
      { name: 'Tire' },
      { name: 'Torbalı' },
      { name: 'Urla' },
    ],
  },
  GAZIANTEP: {
    name: 'Gaziantep',
    districts: [
      { name: 'Araban' },
      { name: 'Şahinbey' },
      { name: 'Şehitkamil' },
      { name: 'İslahiye' },
      { name: 'Karkamış' },
      { name: 'Nurdağı' },
      { name: 'Nizip' },
      { name: 'Oğuzeli' },
      { name: 'Yavuzeli' },
    ],
  },
  HATAY: {
    name: 'Hatay',
    districts: [
      { name: 'Antakya' },
      { name: 'Arsuz' },
      { name: 'Dörtyol' },
      { name: 'Erzin' },
      { name: 'Hassa' },
      { name: 'İskenderun' },
      { name: 'Kırıkhan' },
      { name: 'Köseköy' },
      { name: 'Payas' },
      { name: 'Reyhaniye' },
      { name: 'Samandağ' },
      { name: 'Sarısaçlı' },
      { name: 'Yayladağı' },
    ],
  },
  SHANLIURFA: {
    name: 'Şanlıurfa',
    districts: [
      { name: 'Akçakale' },
      { name: 'Birecik' },
      { name: 'Bozova' },
      { name: 'Ceylanpınar' },
      { name: 'Eyyübiye' },
      { name: 'Haliliye' },
      { name: 'Karaali' },
      { name: 'Kayserili' },
      { name: 'Merkez' },
      { name: 'Siverek' },
      { name: 'Suruç' },
      { name: 'Viranşehir' },
    ],
  },
};

/**
 * Get all cities
 */
export function getCities(): Array<{ value: string; label: string }> {
  return Object.values(TURKISH_CITIES).map((city) => ({
    value: city.name,
    label: city.name,
  }));
}

/**
 * Get districts for a given city
 */
export function getDistrictsByCity(city: string): string[] {
  const cityData = Object.values(TURKISH_CITIES).find((c) => c.name === city);
  if (!cityData) return [];
  return cityData.districts.map((d) => d.name);
}

/**
 * Filter districts by search term
 */
export function filterDistricts(city: string, searchTerm: string): string[] {
  const districts = getDistrictsByCity(city);
  if (!searchTerm) return districts;
  const term = searchTerm.toLowerCase();
  return districts.filter((d) => d.toLowerCase().includes(term));
}

/**
 * Get neighborhoods for a district (placeholder - can be extended)
 */
export function getNeighborhoodsByDistrict(_city: string, _district: string): string[] {
  // For now, return empty array
  // This can be extended with more detailed neighborhood data
  const commonNeighborhoods = [
    'Merkez Mahallesi',
    'Yeni Mahallesi',
    'Eski Mahallesi',
    'Cumhuriyet Mahallesi',
    'İstiklal Mahallesi',
    'Aydın Mahallesi',
    'Şehir Merkezi',
  ];
  return commonNeighborhoods;
}
