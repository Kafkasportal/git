/**
 * Beneficiary Duplicate Detection Module
 * TC Kimlik No, isim ve adres benzerliği ile mükerrer kayıt kontrolü
 */

import { Query } from 'appwrite';
import { getDatabases } from '@/lib/appwrite/api/base';
import { appwriteConfig } from '@/lib/appwrite/config';
import logger from '@/lib/logger';

// Simple in-memory cache for TC and phone duplicate checks (5 minute TTL)
interface CacheEntry {
  result: { exists: boolean; existingId?: string; existingName?: string };
  timestamp: number;
}

const duplicateCheckCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Clear expired cache entries
 */
function clearExpiredCache() {
  const now = Date.now();
  for (const [key, entry] of duplicateCheckCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      duplicateCheckCache.delete(key);
    }
  }
}

/**
 * Get cached result if available and not expired
 */
function getCachedResult(cacheKey: string): CacheEntry['result'] | null {
  const entry = duplicateCheckCache.get(cacheKey);
  if (!entry) return null;

  const now = Date.now();
  if (now - entry.timestamp > CACHE_TTL_MS) {
    duplicateCheckCache.delete(cacheKey);
    return null;
  }

  return entry.result;
}

/**
 * Set cache entry
 */
function setCachedResult(cacheKey: string, result: CacheEntry['result']) {
  // Periodically clear expired entries
  if (duplicateCheckCache.size > 100) {
    clearExpiredCache();
  }

  duplicateCheckCache.set(cacheKey, {
    result,
    timestamp: Date.now(),
  });
}

export interface DuplicateCheckInput {
  tc_no?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  excludeId?: string; // Güncelleme sırasında mevcut kaydı hariç tut
}

export interface DuplicateMatch {
  id: string;
  name: string;
  tc_no?: string;
  phone?: string;
  address?: string;
  matchType: 'exact_tc' | 'exact_phone' | 'similar_name' | 'similar_address';
  matchScore: number; // 0-100 arası benzerlik skoru
  createdAt?: string;
}

export interface DuplicateCheckResult {
  hasDuplicates: boolean;
  matches: DuplicateMatch[];
  warnings: string[];
}

/**
 * Levenshtein mesafesi hesaplama (string benzerliği)
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]) + 1;
      }
    }
  }

  return dp[m][n];
}

/**
 * String benzerlik skoru hesaplama (0-100)
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;

  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 100;

  const maxLength = Math.max(s1.length, s2.length);
  if (maxLength === 0) return 100;

  const distance = levenshteinDistance(s1, s2);
  return Math.round((1 - distance / maxLength) * 100);
}

/**
 * Türkçe karakter normalizasyonu
 */
function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/İ/g, 'i')
    .replace(/Ğ/g, 'g')
    .replace(/Ü/g, 'u')
    .replace(/Ş/g, 's')
    .replace(/Ö/g, 'o')
    .replace(/Ç/g, 'c')
    .trim();
}

/**
 * İsim benzerliği kontrolü
 */
function checkNameSimilarity(
  firstName1: string,
  lastName1: string,
  firstName2: string,
  lastName2: string
): number {
  const fullName1 = normalizeText(`${firstName1} ${lastName1}`);
  const fullName2 = normalizeText(`${firstName2} ${lastName2}`);

  // Tam eşleşme
  if (fullName1 === fullName2) return 100;

  // Parçalı eşleşme kontrolü
  const firstNameSim = calculateSimilarity(
    normalizeText(firstName1),
    normalizeText(firstName2)
  );
  const lastNameSim = calculateSimilarity(
    normalizeText(lastName1),
    normalizeText(lastName2)
  );

  // Ağırlıklı ortalama (soyad daha önemli)
  return Math.round(firstNameSim * 0.4 + lastNameSim * 0.6);
}

/**
 * Telefon numarası normalizasyonu
 */
function normalizePhone(phone: string): string {
  if (!phone) return '';
  return phone.replace(/[\s\-\(\)\+]/g, '').replace(/^0/, '');
}

/**
 * Ana mükerrer kontrol fonksiyonu
 */
export async function checkDuplicates(
  input: DuplicateCheckInput
): Promise<DuplicateCheckResult> {
  const result: DuplicateCheckResult = {
    hasDuplicates: false,
    matches: [],
    warnings: [],
  };

  try {
    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.beneficiaries;

    // 1. TC Kimlik No ile tam eşleşme kontrolü
    if (input.tc_no) {
      const queries = [Query.equal('tc_no', input.tc_no), Query.limit(5)];
      
      if (input.excludeId) {
        queries.push(Query.notEqual('$id', input.excludeId));
      }

      const tcMatches = await databases.listDocuments(
        appwriteConfig.databaseId,
        collectionId,
        queries
      );

      for (const doc of tcMatches.documents) {
        result.matches.push({
          id: doc.$id,
          name: `${doc.firstName || ''} ${doc.lastName || ''}`.trim() || doc.name || 'İsimsiz',
          tc_no: doc.tc_no,
          phone: doc.phone,
          address: doc.address,
          matchType: 'exact_tc',
          matchScore: 100,
          createdAt: doc.$createdAt,
        });
      }
    }

    // 2. Telefon numarası ile tam eşleşme kontrolü
    if (input.phone) {
      const normalizedPhone = normalizePhone(input.phone);

      // Optimize: Use indexed query instead of fetching all and filtering
      const phoneQueries = [
        Query.equal('phone', input.phone),
        Query.limit(5)
      ];

      if (input.excludeId) {
        phoneQueries.push(Query.notEqual('$id', input.excludeId));
      }

      try {
        const phoneMatches = await databases.listDocuments(
          appwriteConfig.databaseId,
          collectionId,
          phoneQueries
        );

        for (const doc of phoneMatches.documents) {
          // TC ile zaten eşleşti mi kontrol et
          if (result.matches.some((m) => m.id === doc.$id)) continue;

          result.matches.push({
            id: doc.$id,
            name: `${doc.firstName || ''} ${doc.lastName || ''}`.trim() || doc.name || 'İsimsiz',
            tc_no: doc.tc_no,
            phone: doc.phone,
            address: doc.address,
            matchType: 'exact_phone',
            matchScore: 95,
            createdAt: doc.$createdAt,
          });
        }
      } catch (error) {
        // If indexed query fails, fallback to normalized phone search
        logger.warn('Phone exact match query failed, trying fallback', { error });

        const fallbackQueries = [Query.limit(50)];
        if (input.excludeId) {
          fallbackQueries.push(Query.notEqual('$id', input.excludeId));
        }

        const fallbackMatches = await databases.listDocuments(
          appwriteConfig.databaseId,
          collectionId,
          fallbackQueries
        );

        for (const doc of fallbackMatches.documents) {
          if (result.matches.some((m) => m.id === doc.$id)) continue;

          const docPhone = normalizePhone(doc.phone || '');
          if (docPhone && docPhone === normalizedPhone) {
            result.matches.push({
              id: doc.$id,
              name: `${doc.firstName || ''} ${doc.lastName || ''}`.trim() || doc.name || 'İsimsiz',
              tc_no: doc.tc_no,
              phone: doc.phone,
              address: doc.address,
              matchType: 'exact_phone',
              matchScore: 95,
              createdAt: doc.$createdAt,
            });
          }
        }
      }
    }

    // 3. İsim benzerliği kontrolü (fuzzy search)
    if (input.firstName && input.lastName) {
      // Son eklenen kayıtları al ve benzerlik kontrolü yap
      const nameQueries = [
        Query.orderDesc('$createdAt'),
        Query.limit(100),
      ];

      if (input.excludeId) {
        nameQueries.push(Query.notEqual('$id', input.excludeId));
      }

      const recentDocs = await databases.listDocuments(
        appwriteConfig.databaseId,
        collectionId,
        nameQueries
      );

      for (const doc of recentDocs.documents) {
        // Zaten eşleşti mi kontrol et
        if (result.matches.some((m) => m.id === doc.$id)) continue;

        const docFirstName = doc.firstName || doc.name?.split(' ')[0] || '';
        const docLastName = doc.lastName || doc.name?.split(' ').slice(1).join(' ') || '';

        const nameSimilarity = checkNameSimilarity(
          input.firstName,
          input.lastName,
          docFirstName,
          docLastName
        );

        // %80 üzeri benzerlik varsa uyar
        if (nameSimilarity >= 80) {
          result.matches.push({
            id: doc.$id,
            name: `${docFirstName} ${docLastName}`.trim() || doc.name || 'İsimsiz',
            tc_no: doc.tc_no,
            phone: doc.phone,
            address: doc.address,
            matchType: 'similar_name',
            matchScore: nameSimilarity,
            createdAt: doc.$createdAt,
          });
        }
      }
    }

    // 4. Adres benzerliği kontrolü
    if (input.address && input.address.length > 20) {
      const addressQueries = [
        Query.orderDesc('$createdAt'),
        Query.limit(50),
      ];

      if (input.excludeId) {
        addressQueries.push(Query.notEqual('$id', input.excludeId));
      }

      const addressDocs = await databases.listDocuments(
        appwriteConfig.databaseId,
        collectionId,
        addressQueries
      );

      for (const doc of addressDocs.documents) {
        // Zaten eşleşti mi kontrol et
        if (result.matches.some((m) => m.id === doc.$id)) continue;

        if (doc.address) {
          const addressSimilarity = calculateSimilarity(
            normalizeText(input.address),
            normalizeText(doc.address)
          );

          // %85 üzeri benzerlik varsa uyar
          if (addressSimilarity >= 85) {
            result.matches.push({
              id: doc.$id,
              name: `${doc.firstName || ''} ${doc.lastName || ''}`.trim() || doc.name || 'İsimsiz',
              tc_no: doc.tc_no,
              phone: doc.phone,
              address: doc.address,
              matchType: 'similar_address',
              matchScore: addressSimilarity,
              createdAt: doc.$createdAt,
            });
          }
        }
      }
    }

    // Sonuçları skorlarına göre sırala
    result.matches.sort((a, b) => b.matchScore - a.matchScore);

    // En fazla 10 eşleşme göster
    result.matches = result.matches.slice(0, 10);

    // Uyarıları oluştur
    result.hasDuplicates = result.matches.length > 0;

    if (result.matches.some((m) => m.matchType === 'exact_tc')) {
      result.warnings.push('Bu TC Kimlik No ile kayıtlı kişi bulundu!');
    }
    if (result.matches.some((m) => m.matchType === 'exact_phone')) {
      result.warnings.push('Bu telefon numarası ile kayıtlı kişi bulundu!');
    }
    if (result.matches.some((m) => m.matchType === 'similar_name')) {
      result.warnings.push('Benzer isimde kayıt bulundu.');
    }
    if (result.matches.some((m) => m.matchType === 'similar_address')) {
      result.warnings.push('Benzer adreste kayıt bulundu.');
    }

    logger.info('Duplicate check completed', {
      input: { ...input, tc_no: input.tc_no ? '***' : undefined },
      matchCount: result.matches.length,
    });

    return result;
  } catch (error) {
    logger.error('Duplicate check failed', { error });
    throw error;
  }
}

/**
 * Hızlı TC Kimlik kontrolü (with caching)
 */
export async function checkTcNoDuplicate(
  tcNo: string,
  excludeId?: string
): Promise<{ exists: boolean; existingId?: string; existingName?: string }> {
  try {
    // Check cache first
    const cacheKey = `tc:${tcNo}:${excludeId || 'none'}`;
    const cached = getCachedResult(cacheKey);
    if (cached) {
      logger.debug('TC duplicate check: cache hit', { tcNo: '***' });
      return cached;
    }

    const databases = getDatabases();
    const collectionId = appwriteConfig.collections.beneficiaries;

    const queries = [Query.equal('tc_no', tcNo), Query.limit(1)];
    if (excludeId) {
      queries.push(Query.notEqual('$id', excludeId));
    }

    const result = await databases.listDocuments(
      appwriteConfig.databaseId,
      collectionId,
      queries
    );

    let finalResult: { exists: boolean; existingId?: string; existingName?: string };

    if (result.documents.length > 0) {
      const doc = result.documents[0];
      finalResult = {
        exists: true,
        existingId: doc.$id,
        existingName: `${doc.firstName || ''} ${doc.lastName || ''}`.trim() || doc.name,
      };
    } else {
      finalResult = { exists: false };
    }

    // Cache the result
    setCachedResult(cacheKey, finalResult);

    return finalResult;
  } catch (error) {
    logger.error('TC No duplicate check failed', { error });
    return { exists: false };
  }
}

/**
 * Clear duplicate check cache (useful after creating/updating beneficiaries)
 */
export function clearDuplicateCheckCache() {
  duplicateCheckCache.clear();
  logger.debug('Duplicate check cache cleared');
}
