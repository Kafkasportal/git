'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  MapPin,
  Loader2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  List,
  Navigation,
  Users,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

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
  'Elazığ': { lat: 38.6810, lng: 39.2264 },
  'Batman': { lat: 37.8812, lng: 41.1351 },
  'Mardin': { lat: 37.3212, lng: 40.7245 },
  'Kocaeli': { lat: 40.8533, lng: 29.8815 },
  'Sakarya': { lat: 40.7569, lng: 30.3781 },
  'Denizli': { lat: 37.7765, lng: 29.0864 },
  'Manisa': { lat: 38.6191, lng: 27.4289 },
  'Balıkesir': { lat: 39.6484, lng: 27.8826 },
  'Tekirdağ': { lat: 40.9833, lng: 27.5167 },
  'Aydın': { lat: 37.8560, lng: 27.8416 },
  'Muğla': { lat: 37.2153, lng: 28.3636 },
  'Hatay': { lat: 36.4018, lng: 36.3498 },
  'Kahramanmaraş': { lat: 37.5858, lng: 36.9371 },
  'Adıyaman': { lat: 37.7648, lng: 38.2786 },
  'Osmaniye': { lat: 37.0746, lng: 36.2478 },
  'Kilis': { lat: 36.7184, lng: 37.1212 },
  'Siirt': { lat: 37.9333, lng: 41.9500 },
  'Şırnak': { lat: 37.5164, lng: 42.4611 },
  'Hakkari': { lat: 37.5833, lng: 43.7333 },
  'Bitlis': { lat: 38.4000, lng: 42.1167 },
  'Muş': { lat: 38.7432, lng: 41.5064 },
  'Ağrı': { lat: 39.7191, lng: 43.0503 },
  'Iğdır': { lat: 39.9167, lng: 44.0333 },
  'Kars': { lat: 40.6078, lng: 43.0975 },
  'Ardahan': { lat: 41.1105, lng: 42.7022 },
  'Artvin': { lat: 41.1828, lng: 41.8183 },
  'Rize': { lat: 41.0201, lng: 40.5234 },
  'Gümüşhane': { lat: 40.4386, lng: 39.5086 },
  'Bayburt': { lat: 40.2552, lng: 40.2249 },
  'Giresun': { lat: 40.9128, lng: 38.3895 },
  'Ordu': { lat: 40.9839, lng: 37.8764 },
  'Tokat': { lat: 40.3167, lng: 36.5500 },
  'Amasya': { lat: 40.6499, lng: 35.8353 },
  'Çorum': { lat: 40.5506, lng: 34.9556 },
  'Sinop': { lat: 42.0231, lng: 35.1531 },
  'Kastamonu': { lat: 41.3887, lng: 33.7827 },
  'Çankırı': { lat: 40.6013, lng: 33.6134 },
  'Zonguldak': { lat: 41.4564, lng: 31.7987 },
  'Bartın': { lat: 41.6344, lng: 32.3375 },
  'Karabük': { lat: 41.2061, lng: 32.6204 },
  'Bolu': { lat: 40.7392, lng: 31.6089 },
  'Düzce': { lat: 40.8438, lng: 31.1565 },
  'Bilecik': { lat: 40.0567, lng: 30.0665 },
  'Kütahya': { lat: 39.4167, lng: 29.9833 },
  'Afyonkarahisar': { lat: 38.7507, lng: 30.5567 },
  'Uşak': { lat: 38.6823, lng: 29.4082 },
  'Burdur': { lat: 37.7203, lng: 30.2906 },
  'Isparta': { lat: 37.7648, lng: 30.5566 },
  'Karaman': { lat: 37.1759, lng: 33.2287 },
  'Aksaray': { lat: 38.3687, lng: 34.0370 },
  'Niğde': { lat: 37.9667, lng: 34.6833 },
  'Nevşehir': { lat: 38.6939, lng: 34.6857 },
  'Kırşehir': { lat: 39.1425, lng: 34.1709 },
  'Yozgat': { lat: 39.8181, lng: 34.8147 },
  'Sivas': { lat: 39.7477, lng: 37.0179 },
  'Tunceli': { lat: 39.1079, lng: 39.5401 },
  'Bingöl': { lat: 38.8854, lng: 40.4966 },
  'Edirne': { lat: 41.6818, lng: 26.5623 },
  'Kırklareli': { lat: 41.7333, lng: 27.2167 },
  'Çanakkale': { lat: 40.1553, lng: 26.4142 },
};

// Türkiye merkez koordinatları
const TURKEY_CENTER = { lat: 39.0, lng: 35.0 };

interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  name: string;
  city?: string;
  district?: string;
  category?: string;
  status?: string;
  address?: string;
}

interface BeneficiaryMapProps {
  className?: string;
  markers?: MapMarker[];
  onMarkerClick?: (marker: MapMarker) => void;
  height?: string;
  showControls?: boolean;
  showFilters?: boolean;
  initialZoom?: number;
}

/**
 * Beneficiary Harita Bileşeni
 * Leaflet tabanlı interaktif harita
 */
export function BeneficiaryMap({
  className,
  markers: externalMarkers,
  onMarkerClick,
  height = '500px',
  showControls = true,
  showFilters = true,
  initialZoom = 6,
}: BeneficiaryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  
  const [isMapReady, setIsMapReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showList, setShowList] = useState(false);

  // Fetch beneficiaries if no external markers provided
  const { data: apiData } = useQuery({
    queryKey: ['beneficiaries-map', selectedCity, selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('limit', '500');
      if (selectedCity !== 'all') params.set('city', selectedCity);
      if (selectedCategory !== 'all') params.set('category', selectedCategory);

      const response = await fetch(`/api/beneficiaries?${params}`);
      if (!response.ok) throw new Error('Veri alınamadı');
      return response.json();
    },
    enabled: !externalMarkers,
    staleTime: 5 * 60 * 1000,
  });

  // Process markers
  const markers: MapMarker[] = externalMarkers || (apiData?.data || []).map((b: Record<string, unknown>) => {
    const city = b.city as string || 'İstanbul';
    const cityCoords = TURKEY_CITIES[city] || TURKEY_CENTER;
    
    // Add some random offset to prevent marker overlap
    const offset = () => (Math.random() - 0.5) * 0.1;
    
    return {
      id: b.$id as string || b.id as string,
      lat: cityCoords.lat + offset(),
      lng: cityCoords.lng + offset(),
      name: `${b.firstName || ''} ${b.lastName || ''}`.trim() || b.name as string || 'İsimsiz',
      city,
      district: b.district as string,
      category: b.category as string,
      status: b.status as string || b.workflowStage as string,
      address: b.address as string,
    };
  });

  // Filter markers
  const filteredMarkers = markers.filter((m) => {
    if (searchQuery && !m.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  // City statistics
  const cityStats = markers.reduce((acc, m) => {
    const city = m.city || 'Bilinmiyor';
    acc[city] = (acc[city] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const initMap = async () => {
      try {
        // Dynamic import Leaflet
        // @ts-expect-error - leaflet types loaded dynamically
        const L = (await import('leaflet')).default;
        // @ts-expect-error - css import
        await import('leaflet/dist/leaflet.css');

        // Fix default icon issue
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        // Create map
        const map = L.map(mapRef.current!, {
          center: [TURKEY_CENTER.lat, TURKEY_CENTER.lng],
          zoom: initialZoom,
          zoomControl: false,
        });

        // Add tile layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 18,
        }).addTo(map);

        // Add zoom control to top-right
        L.control.zoom({ position: 'topright' }).addTo(map);

        // Create markers layer
        const markersLayer = L.layerGroup().addTo(map);

        mapInstanceRef.current = map;
        markersLayerRef.current = markersLayer;
        setIsMapReady(true);
        setIsLoading(false);
      } catch (error) {
        console.error('Map initialization failed:', error);
        setIsLoading(false);
      }
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [initialZoom]);

  // Update markers when data changes
  useEffect(() => {
    if (!isMapReady || !markersLayerRef.current) return;

    const updateMarkers = async () => {
      // @ts-expect-error - leaflet types loaded dynamically
      const L = (await import('leaflet')).default;
      
      // Clear existing markers
      markersLayerRef.current!.clearLayers();

      // Add new markers
      filteredMarkers.forEach((marker) => {
        const icon = L.divIcon({
          className: 'custom-marker',
          html: `
            <div class="relative">
              <div class="absolute -top-8 -left-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
                </svg>
              </div>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 24],
        });

        const leafletMarker = L.marker([marker.lat, marker.lng], { icon })
          .bindPopup(`
            <div class="min-w-[200px]">
              <h3 class="font-semibold text-sm">${marker.name}</h3>
              ${marker.city ? `<p class="text-xs text-gray-600">${marker.city}${marker.district ? `, ${marker.district}` : ''}</p>` : ''}
              ${marker.category ? `<p class="text-xs mt-1"><span class="bg-blue-100 text-blue-700 px-1 rounded">${marker.category.replace(/_/g, ' ')}</span></p>` : ''}
              ${marker.address ? `<p class="text-xs text-gray-500 mt-1 line-clamp-2">${marker.address}</p>` : ''}
            </div>
          `);

        if (onMarkerClick) {
          leafletMarker.on('click', () => onMarkerClick(marker));
        }

        leafletMarker.addTo(markersLayerRef.current!);
      });
    };

    updateMarkers();
  }, [isMapReady, filteredMarkers, onMarkerClick]);

  // Map control functions
  const handleZoomIn = useCallback(() => {
    mapInstanceRef.current?.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    mapInstanceRef.current?.zoomOut();
  }, []);

  const handleFitBounds = useCallback(async () => {
    if (!mapInstanceRef.current || filteredMarkers.length === 0) return;

    // @ts-expect-error - leaflet types loaded dynamically
    const L = (await import('leaflet')).default;
    const bounds = L.latLngBounds(
      filteredMarkers.map((m) => [m.lat, m.lng] as [number, number])
    );
    mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
  }, [filteredMarkers]);

  const handleCenterTurkey = useCallback(() => {
    mapInstanceRef.current?.setView([TURKEY_CENTER.lat, TURKEY_CENTER.lng], initialZoom);
  }, [initialZoom]);

  const handleGoToCity = useCallback(async (city: string) => {
    if (!mapInstanceRef.current || !TURKEY_CITIES[city]) return;
    const coords = TURKEY_CITIES[city];
    mapInstanceRef.current.setView([coords.lat, coords.lng], 10);
  }, []);

  // Get unique categories
  const categories = [...new Set(markers.map((m) => m.category).filter(Boolean))];

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="İsim ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Şehir seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Şehirler</SelectItem>
                  {Object.keys(TURKEY_CITIES).sort().map((city) => (
                    <SelectItem key={city} value={city}>
                      {city} {cityStats[city] ? `(${cityStats[city]})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Kategoriler</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat!}>
                      {cat!.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowList(!showList)}
                title={showList ? 'Haritayı göster' : 'Listeyi göster'}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        <span>{filteredMarkers.length} kayıt gösteriliyor</span>
        {Object.keys(cityStats).length > 0 && (
          <span>• {Object.keys(cityStats).length} farklı şehir</span>
        )}
      </div>

      {/* Map or List View */}
      {showList ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kayıt Listesi</CardTitle>
            <CardDescription>{filteredMarkers.length} kayıt</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredMarkers.map((marker) => (
                <div
                  key={marker.id}
                  className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50 cursor-pointer"
                  onClick={() => {
                    setShowList(false);
                    if (marker.city) handleGoToCity(marker.city);
                    onMarkerClick?.(marker);
                  }}
                >
                  <div>
                    <p className="font-medium text-sm">{marker.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {marker.city}{marker.district ? `, ${marker.district}` : ''}
                    </p>
                  </div>
                  {marker.category && (
                    <Badge variant="secondary" className="text-xs">
                      {marker.category.replace(/_/g, ' ')}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="relative" style={{ height }}>
            {/* Loading overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {/* Map container */}
            <div ref={mapRef} className="w-full h-full z-10" />

            {/* Custom controls */}
            {showControls && isMapReady && (
              <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={handleZoomIn}
                  className="shadow-md"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={handleZoomOut}
                  className="shadow-md"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={handleFitBounds}
                  className="shadow-md"
                  title="Tüm işaretçileri göster"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={handleCenterTurkey}
                  className="shadow-md"
                  title="Türkiye'yi ortala"
                >
                  <Navigation className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Legend */}
            <div className="absolute bottom-4 left-4 z-20 bg-background/90 backdrop-blur-sm rounded-lg p-3 shadow-md">
              <div className="flex items-center gap-2 text-xs">
                <MapPin className="h-4 w-4 text-primary" />
                <span>İhtiyaç Sahibi</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Top Cities */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Şehirlere Göre Dağılım</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(cityStats)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 10)
              .map(([city, count]) => (
                <Badge
                  key={city}
                  variant="outline"
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => {
                    setSelectedCity(city);
                    handleGoToCity(city);
                  }}
                >
                  {city}: {count}
                </Badge>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Type declaration for Leaflet
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-empty-object-type */
declare global {
  namespace L {
    interface Map {
      remove(): void;
      setView(center: [number, number], zoom: number): this;
      zoomIn(): this;
      zoomOut(): this;
      fitBounds(bounds: LatLngBounds, options?: { padding?: [number, number] }): this;
    }
    interface LatLngBounds {}
    function latLngBounds(latlngs: [number, number][]): LatLngBounds;
    function map(element: HTMLElement, options?: object): Map;
    function tileLayer(url: string, options?: object): { addTo(map: Map): void };
    function layerGroup(): LayerGroup;
    function marker(latlng: [number, number], options?: object): Marker;
    function divIcon(options: object): Icon;
    interface LayerGroup {
      addTo(map: Map): this;
      clearLayers(): this;
    }
    interface Marker {
      bindPopup(content: string): this;
      on(event: string, handler: () => void): this;
      addTo(layer: LayerGroup): this;
    }
    interface Icon {}
    namespace Icon {
      class Default {
        static prototype: { _getIconUrl?: unknown };
        static mergeOptions(options: object): void;
      }
    }
    namespace control {
      function zoom(options?: { position?: string }): { addTo(map: Map): void };
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */
/* eslint-enable @typescript-eslint/no-empty-object-type */
