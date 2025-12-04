import { NextRequest } from 'next/server';
import { buildApiRoute } from '@/lib/api/middleware';
import { successResponse, errorResponse } from '@/lib/api/route-helpers';
import { requireAuthenticatedUser } from '@/lib/api/auth-utils';

// Türkiye şehir koordinatları
const TURKEY_CITIES: Record<string, { lat: number; lng: number }> = {
  'İstanbul': { lat: 41.0082, lng: 28.9784 },
  'Ankara': { lat: 39.9334, lng: 32.8597 },
  'İzmir': { lat: 38.4237, lng: 27.1428 },
  'Bursa': { lat: 40.1885, lng: 29.0610 },
  'Antalya': { lat: 36.8969, lng: 30.7133 },
  'Adana': { lat: 37.0000, lng: 35.3213 },
  'Konya': { lat: 37.8667, lng: 32.4833 },
  'Gaziantep': { lat: 37.0662, lng: 37.3833 },
  'Şanlıurfa': { lat: 37.1591, lng: 38.7969 },
  'Mersin': { lat: 36.8121, lng: 34.6415 },
  'Diyarbakır': { lat: 37.9144, lng: 40.2306 },
  'Kayseri': { lat: 38.7312, lng: 35.4787 },
  'Eskişehir': { lat: 39.7767, lng: 30.5206 },
  'Samsun': { lat: 41.2867, lng: 36.3300 },
  'Trabzon': { lat: 41.0015, lng: 39.7178 },
  'Erzurum': { lat: 39.9000, lng: 41.2700 },
  'Van': { lat: 38.4891, lng: 43.4089 },
  'Malatya': { lat: 38.3552, lng: 38.3095 },
};

interface MapDataPoint {
  id: string;
  lat: number;
  lng: number;
  name: string;
  city: string;
  district?: string;
  category?: string;
  status?: string;
  address?: string;
  aidAmount?: number;
}

interface RegionStats {
  city: string;
  count: number;
  totalAid: number;
  coordinates: { lat: number; lng: number };
  categories: Record<string, number>;
}

/**
 * GET /api/beneficiaries/map-data
 * Harita için optimize edilmiş veri endpoint'i
 */
export const GET = buildApiRoute({
  requireModule: 'yardim',
  allowedMethods: ['GET'],
  rateLimit: { maxRequests: 50, windowMs: 60000 },
})(async (request: NextRequest) => {
  try {
    await requireAuthenticatedUser();

    const searchParams = request.nextUrl.searchParams;
    const city = searchParams.get('city');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const groupBy = searchParams.get('groupBy') || 'individual'; // 'individual' | 'city' | 'region'
    const limit = parseInt(searchParams.get('limit') || '500', 10);

    // Bu örnekte mock veri kullanıyoruz
    // Gerçek implementasyonda Appwrite'dan veri çekilir
    const mockBeneficiaries = generateMockMapData(100);

    // Filter data
    let filtered = mockBeneficiaries;
    
    if (city) {
      filtered = filtered.filter(b => b.city === city);
    }
    if (category) {
      filtered = filtered.filter(b => b.category === category);
    }
    if (status) {
      filtered = filtered.filter(b => b.status === status);
    }

    // Limit results
    filtered = filtered.slice(0, limit);

    // Group by city if requested
    if (groupBy === 'city') {
      const regionStats = calculateRegionStats(filtered);
      return successResponse({
        type: 'grouped',
        data: regionStats,
        total: filtered.length,
        cities: Object.keys(regionStats).length,
      });
    }

    // Calculate summary stats
    const stats = {
      total: filtered.length,
      byCity: calculateCityDistribution(filtered),
      byCategory: calculateCategoryDistribution(filtered),
      byStatus: calculateStatusDistribution(filtered),
      bounds: calculateBounds(filtered),
    };

    return successResponse({
      type: 'individual',
      data: filtered,
      stats,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Harita verisi alınamadı';
    return errorResponse(message, 500);
  }
});

/**
 * Mock veri oluştur (gerçek implementasyonda Appwrite'dan çekilir)
 */
function generateMockMapData(count: number): MapDataPoint[] {
  const cities = Object.keys(TURKEY_CITIES);
  const categories = ['gida', 'kira', 'saglik', 'egitim', 'giyim', 'diger'];
  const statuses = ['aktif', 'beklemede', 'tamamlandi', 'iptal'];
  const firstNames = ['Ahmet', 'Mehmet', 'Fatma', 'Ayşe', 'Ali', 'Mustafa', 'Zeynep', 'Emine', 'Hasan', 'Hüseyin'];
  const lastNames = ['Yılmaz', 'Kaya', 'Demir', 'Çelik', 'Şahin', 'Yıldız', 'Erdoğan', 'Öztürk', 'Aydın', 'Arslan'];

  return Array.from({ length: count }, (_, i) => {
    const city = cities[Math.floor(Math.random() * cities.length)];
    const coords = TURKEY_CITIES[city];
    
    // Add random offset within city bounds
    const latOffset = (Math.random() - 0.5) * 0.2;
    const lngOffset = (Math.random() - 0.5) * 0.2;

    return {
      id: `ben_${i + 1}`,
      lat: coords.lat + latOffset,
      lng: coords.lng + lngOffset,
      name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
      city,
      district: `${city} Merkez`,
      category: categories[Math.floor(Math.random() * categories.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      address: `${city} ili, Merkez ilçesi`,
      aidAmount: Math.floor(Math.random() * 5000) + 500,
    };
  });
}

/**
 * Bölge istatistiklerini hesapla
 */
function calculateRegionStats(data: MapDataPoint[]): Record<string, RegionStats> {
  const stats: Record<string, RegionStats> = {};

  for (const point of data) {
    if (!stats[point.city]) {
      const coords = TURKEY_CITIES[point.city] || { lat: 39, lng: 35 };
      stats[point.city] = {
        city: point.city,
        count: 0,
        totalAid: 0,
        coordinates: coords,
        categories: {},
      };
    }

    stats[point.city].count++;
    stats[point.city].totalAid += point.aidAmount || 0;
    
    if (point.category) {
      stats[point.city].categories[point.category] = 
        (stats[point.city].categories[point.category] || 0) + 1;
    }
  }

  return stats;
}

/**
 * Şehir dağılımını hesapla
 */
function calculateCityDistribution(data: MapDataPoint[]): Record<string, number> {
  return data.reduce((acc, point) => {
    acc[point.city] = (acc[point.city] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

/**
 * Kategori dağılımını hesapla
 */
function calculateCategoryDistribution(data: MapDataPoint[]): Record<string, number> {
  return data.reduce((acc, point) => {
    if (point.category) {
      acc[point.category] = (acc[point.category] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
}

/**
 * Durum dağılımını hesapla
 */
function calculateStatusDistribution(data: MapDataPoint[]): Record<string, number> {
  return data.reduce((acc, point) => {
    if (point.status) {
      acc[point.status] = (acc[point.status] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
}

/**
 * Harita sınırlarını hesapla
 */
function calculateBounds(data: MapDataPoint[]): {
  north: number;
  south: number;
  east: number;
  west: number;
} | null {
  if (data.length === 0) return null;

  let north = -90, south = 90, east = -180, west = 180;

  for (const point of data) {
    if (point.lat > north) north = point.lat;
    if (point.lat < south) south = point.lat;
    if (point.lng > east) east = point.lng;
    if (point.lng < west) west = point.lng;
  }

  return { north, south, east, west };
}

/**
 * POST /api/beneficiaries/map-data
 * Toplu konum güncelleme
 */
export const POST = buildApiRoute({
  requireModule: 'yardim',
  allowedMethods: ['POST'],
  rateLimit: { maxRequests: 10, windowMs: 60000 },
})(async (request: NextRequest) => {
  try {
    await requireAuthenticatedUser();

    const body = await request.json();
    const { action, data } = body;

    if (action === 'geocode') {
      // Adres -> koordinat dönüşümü
      const { address, city } = data;
      
      // Basit geocoding: şehir koordinatlarını döndür
      const coords = TURKEY_CITIES[city];
      if (!coords) {
        return errorResponse('Şehir bulunamadı', 404);
      }

      // Add slight randomness for unique addresses
      const lat = coords.lat + (Math.random() - 0.5) * 0.1;
      const lng = coords.lng + (Math.random() - 0.5) * 0.1;

      return successResponse({
        lat,
        lng,
        city,
        address,
        confidence: 0.8,
      });
    }

    if (action === 'cluster') {
      // Marker clustering hesaplama
      const { markers, zoom } = data;
      const clustered = clusterMarkers(markers, zoom);
      return successResponse({ clusters: clustered });
    }

    return errorResponse('Geçersiz aksiyon', 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'İşlem başarısız';
    return errorResponse(message, 500);
  }
});

/**
 * Marker clustering algoritması
 */
function clusterMarkers(
  markers: MapDataPoint[],
  zoom: number
): Array<{ center: { lat: number; lng: number }; count: number; markers: string[] }> {
  // Simple grid-based clustering
  const gridSize = 1 / Math.pow(2, zoom - 4); // Adjust grid size based on zoom
  const clusters: Map<string, { lat: number; lng: number; count: number; markers: string[] }> = new Map();

  for (const marker of markers) {
    const gridX = Math.floor(marker.lng / gridSize);
    const gridY = Math.floor(marker.lat / gridSize);
    const key = `${gridX},${gridY}`;

    if (!clusters.has(key)) {
      clusters.set(key, {
        lat: marker.lat,
        lng: marker.lng,
        count: 0,
        markers: [],
      });
    }

    const cluster = clusters.get(key)!;
    cluster.count++;
    cluster.markers.push(marker.id);
    
    // Update center to average
    cluster.lat = (cluster.lat * (cluster.count - 1) + marker.lat) / cluster.count;
    cluster.lng = (cluster.lng * (cluster.count - 1) + marker.lng) / cluster.count;
  }

  return Array.from(clusters.values()).map(c => ({
    center: { lat: c.lat, lng: c.lng },
    count: c.count,
    markers: c.markers,
  }));
}
