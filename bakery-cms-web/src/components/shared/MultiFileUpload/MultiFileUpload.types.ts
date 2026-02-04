import type { FileModel } from '@/types/models/file.model';

/**
 * Product image item for multi-file upload
 */
export interface ProductImageItem {
  id: string;
  fileId: string;
  displayOrder: number;
  isPrimary: boolean;
  file?: FileModel;
  previewUrl?: string;
}

/**
 * Props for the MultiFileUpload component
 */
export interface MultiFileUploadProps {
  /**
   * Product ID for managing images
   */
  productId?: string;

  /**
   * Current images value (array of ProductImageItem)
   */
  value?: ProductImageItem[];

  /**
   * Callback when images change
   */
  onChange?: (images: ProductImageItem[]) => void;

  /**
   * Maximum number of files allowed
   * Default: 10
   */
  maxFiles?: number;

  /**
   * Maximum file size in bytes
   * Default: 10MB
   */
  maxSize?: number;

  /**
   * Whether the upload is disabled
   */
  disabled?: boolean;

  /**
   * Custom class name
   */
  className?: string;
}

/**
 * Internal state for uploading file
 */
export interface UploadingFile {
  uid: string;
  file: File;
  progress: number;
  status: 'uploading' | 'done' | 'error';
  error?: string;
}
