import type { FileModel } from '@/types/models/file.model';

/**
 * Props for the FileUpload component
 */
export interface FileUploadProps {
  /**
   * Current file value (file ID or URL)
   */
  value?: string;

  /**
   * Callback when file changes
   */
  onChange?: (fileId: string | undefined) => void;

  /**
   * Accepted file types
   * Default: 'image' - accepts image files
   * 'video' - accepts video files
   * 'all' - accepts both image and video files
   */
  accept?: 'image' | 'video' | 'all';

  /**
   * Maximum file size in bytes
   * Default: 10MB for images, 100MB for videos
   */
  maxSize?: number;

  /**
   * Whether the upload is disabled
   */
  disabled?: boolean;

  /**
   * Custom placeholder text
   */
  placeholder?: string;

  /**
   * Show preview of uploaded file
   */
  showPreview?: boolean;

  /**
   * Custom class name
   */
  className?: string;

  /**
   * Callback when file is successfully uploaded
   */
  onUploadSuccess?: (file: FileModel) => void;

  /**
   * Callback when file is removed
   */
  onRemove?: () => void;
}

/**
 * Internal state for the FileUpload component
 */
export interface FileUploadState {
  uploading: boolean;
  progress: number;
  file: FileModel | null;
  error: string | null;
  previewUrl: string | null;
}
