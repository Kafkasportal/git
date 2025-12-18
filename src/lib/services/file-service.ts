/**
 * File Service - Handle document and photo uploads
 */

export interface FileUploadResponse {
  success: boolean;
  fileId?: string;
  fileName?: string;
  url?: string;
  error?: string;
}

export interface FileValidationOptions {
  maxSizeInMB?: number;
  allowedTypes?: string[];
}

// Default validation options
const DEFAULT_VALIDATION: FileValidationOptions = {
  maxSizeInMB: 10,
  allowedTypes: ['image/jpeg', 'image/png', 'application/pdf', 'image/webp'],
};

/**
 * Validate file before upload
 */
export function validateFile(file: File, options: FileValidationOptions = {}): { valid: boolean; error?: string } {
  const config = { ...DEFAULT_VALIDATION, ...options };

  // Check file size
  if (config.maxSizeInMB) {
    const maxSizeInBytes = config.maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      return {
        valid: false,
        error: `Dosya boyutu ${config.maxSizeInMB}MB'den büyük olamaz. Dosya boyutu: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
      };
    }
  }

  // Check file type
  if (config.allowedTypes && config.allowedTypes.length > 0) {
    if (!config.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `İzin verilen dosya türleri: ${config.allowedTypes.map((t) => t.split('/')[1]).join(', ')}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Upload file to backend
 */
export async function uploadFile(file: File, purpose: 'profile' | 'document' | 'identification'): Promise<FileUploadResponse> {
  try {
    // Validate file first
    const validation = validateFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Create FormData
    const formData = new FormData();
    formData.append('file', file);
    formData.append('purpose', purpose);

    // Upload to backend
    const response = await fetch('/api/files/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `Dosya yükleme başarısız: ${response.statusText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      fileId: data.fileId,
      fileName: data.fileName,
      url: data.url,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
    return {
      success: false,
      error: `Dosya yükleme hatası: ${errorMessage}`,
    };
  }
}

/**
 * Delete uploaded file
 */
export async function deleteFile(fileId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`/api/files/${fileId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || 'Dosya silme başarısız',
      };
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
    return {
      success: false,
      error: `Dosya silme hatası: ${errorMessage}`,
    };
  }
}

/**
 * Convert file to base64 for preview
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Get file type icon
 */
export function getFileIcon(fileName: string): 'file-pdf' | 'file-image' | 'file' {
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (['pdf'].includes(extension || '')) return 'file-pdf';
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension || '')) return 'file-image';
  return 'file';
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100  } ${  sizes[i]}`;
}
