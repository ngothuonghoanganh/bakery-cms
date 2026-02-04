import React, { useState, useCallback, useEffect } from 'react';
import { Upload, Button, message, Progress, Image, Spin } from 'antd';
import {
  DeleteOutlined,
  LoadingOutlined,
  PictureOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import type { RcFile } from 'antd/es/upload';
import type { FileUploadProps, FileUploadState } from './FileUpload.types';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  ALLOWED_VIDEO_MIME_TYPES,
  ALLOWED_MIME_TYPES,
  isImageMimeType,
  isVideoMimeType,
  formatFileSize,
} from '@/types/models/file.model';
import { fileService } from '@/services/file.service';
import { useTranslation } from 'react-i18next';
import styles from './FileUpload.module.css';

/**
 * Default max file sizes
 */
const DEFAULT_IMAGE_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_VIDEO_MAX_SIZE = 100 * 1024 * 1024; // 100MB

/**
 * FileUpload component
 * Handles file upload with preview, validation, and progress
 */
export const FileUpload: React.FC<FileUploadProps> = ({
  value,
  onChange,
  accept = 'image',
  maxSize,
  disabled = false,
  placeholder,
  showPreview = true,
  className,
  onUploadSuccess,
  onRemove,
}) => {
  const { t } = useTranslation();
  const [state, setState] = useState<FileUploadState>({
    uploading: false,
    progress: 0,
    file: null,
    error: null,
    previewUrl: null,
  });

  // Determine accepted MIME types based on accept prop
  const acceptedMimeTypes = useCallback(() => {
    switch (accept) {
      case 'image':
        return ALLOWED_IMAGE_MIME_TYPES.join(',');
      case 'video':
        return ALLOWED_VIDEO_MIME_TYPES.join(',');
      case 'all':
        return ALLOWED_MIME_TYPES.join(',');
      default:
        return ALLOWED_IMAGE_MIME_TYPES.join(',');
    }
  }, [accept]);

  // Determine max file size
  const getMaxSize = useCallback(() => {
    if (maxSize) return maxSize;
    return accept === 'video' ? DEFAULT_VIDEO_MAX_SIZE : DEFAULT_IMAGE_MAX_SIZE;
  }, [accept, maxSize]);

  // Load existing file when value changes
  useEffect(() => {
    if (value && !state.file) {
      // Value is a file ID, construct the preview URL
      const previewUrl = fileService.getDownloadUrl(value);
      setState(prev => ({ ...prev, previewUrl }));
    } else if (!value) {
      setState(prev => ({ ...prev, file: null, previewUrl: null }));
    }
  }, [value, state.file]);

  // Validate file before upload
  const beforeUpload = useCallback(
    (file: RcFile): boolean => {
      // Check MIME type
      const isValidType =
        accept === 'image'
          ? isImageMimeType(file.type)
          : accept === 'video'
            ? isVideoMimeType(file.type)
            : isImageMimeType(file.type) || isVideoMimeType(file.type);

      if (!isValidType) {
        message.error(t('files.invalidType', 'Invalid file type'));
        return false;
      }

      // Check file size
      const maxFileSize = getMaxSize();
      if (file.size > maxFileSize) {
        message.error(
          t('files.tooLarge', 'File is too large. Maximum size: {{size}}', {
            size: formatFileSize(maxFileSize),
          })
        );
        return false;
      }

      return true;
    },
    [accept, getMaxSize, t]
  );

  // Handle custom upload
  const customUpload = useCallback(
    async (options: any) => {
      const { file, onSuccess, onError } = options;

      setState(prev => ({
        ...prev,
        uploading: true,
        progress: 0,
        error: null,
      }));

      try {
        // Simulate progress (actual progress would come from axios)
        const progressInterval = setInterval(() => {
          setState(prev => {
            if (prev.progress >= 90) {
              clearInterval(progressInterval);
              return prev;
            }
            return { ...prev, progress: prev.progress + 10 };
          });
        }, 100);

        const result = await fileService.upload(file);

        clearInterval(progressInterval);

        if (result.success) {
          const uploadedFile = result.data;
          // Use the url from uploaded file (static path) and convert to full URL
          const previewUrl = fileService.getDownloadUrl(uploadedFile.url);
          setState(prev => ({
            ...prev,
            uploading: false,
            progress: 100,
            file: uploadedFile,
            previewUrl,
          }));

          onChange?.(uploadedFile.id);
          onUploadSuccess?.(uploadedFile);
          onSuccess?.(uploadedFile);
          message.success(t('files.uploadSuccess', 'File uploaded successfully'));
        } else {
          throw new Error(result.error.message);
        }
      } catch (error: any) {
        setState(prev => ({
          ...prev,
          uploading: false,
          progress: 0,
          error: error.message || t('files.uploadError', 'Upload failed'),
        }));
        onError?.(error);
        message.error(error.message || t('files.uploadError', 'Upload failed'));
      }
    },
    [onChange, onUploadSuccess, t]
  );

  // Handle file removal
  const handleRemove = useCallback(() => {
    setState({
      uploading: false,
      progress: 0,
      file: null,
      error: null,
      previewUrl: null,
    });
    onChange?.(undefined);
    onRemove?.();
  }, [onChange, onRemove]);

  // Get placeholder text
  const getPlaceholder = useCallback(() => {
    if (placeholder) return placeholder;
    switch (accept) {
      case 'image':
        return t('files.uploadImage', 'Click or drag image to upload');
      case 'video':
        return t('files.uploadVideo', 'Click or drag video to upload');
      case 'all':
        return t('files.uploadFile', 'Click or drag file to upload');
      default:
        return t('files.uploadImage', 'Click or drag image to upload');
    }
  }, [accept, placeholder, t]);

  // Get icon based on accept type
  const getIcon = useCallback(() => {
    switch (accept) {
      case 'video':
        return <VideoCameraOutlined />;
      case 'image':
      default:
        return <PictureOutlined />;
    }
  }, [accept]);

  const uploadProps: UploadProps = {
    name: 'file',
    accept: acceptedMimeTypes(),
    beforeUpload,
    customRequest: customUpload,
    showUploadList: false,
    disabled: disabled || state.uploading,
  };

  // Render preview
  const renderPreview = () => {
    if (!showPreview || !state.previewUrl) return null;

    const isVideo = state.file?.mimeType
      ? isVideoMimeType(state.file.mimeType)
      : state.previewUrl?.includes('video');

    return (
      <div className={styles.preview}>
        {isVideo ? (
          <video
            src={state.previewUrl}
            controls
            className={styles.videoPreview}
          />
        ) : (
          <Image
            src={state.previewUrl}
            alt="Preview"
            className={styles.imagePreview}
            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgesA...="
          />
        )}
        {!disabled && (
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={handleRemove}
            className={styles.removeButton}
          >
            {t('common.remove', 'Remove')}
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className={`${styles.fileUpload} ${className || ''}`}>
      {state.previewUrl ? (
        renderPreview()
      ) : (
        <Upload.Dragger {...uploadProps} className={styles.dragger}>
          {state.uploading ? (
            <div className={styles.uploading}>
              <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
              <Progress percent={state.progress} size="small" />
              <p>{t('files.uploading', 'Uploading...')}</p>
            </div>
          ) : (
            <div className={styles.uploadContent}>
              <p className={styles.uploadIcon}>{getIcon()}</p>
              <p className={styles.uploadText}>{getPlaceholder()}</p>
              <p className={styles.uploadHint}>
                {t('files.maxSize', 'Max size: {{size}}', {
                  size: formatFileSize(getMaxSize()),
                })}
              </p>
            </div>
          )}
        </Upload.Dragger>
      )}
      {state.error && <p className={styles.error}>{state.error}</p>}
    </div>
  );
};

export default FileUpload;
