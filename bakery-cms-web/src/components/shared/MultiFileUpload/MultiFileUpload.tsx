import React, { useState, useCallback, useRef } from 'react';
import { Upload, Button, message, Progress, Image, Tooltip } from 'antd';
import {
  DeleteOutlined,
  PlusOutlined,
  StarOutlined,
  EyeOutlined,
  HolderOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import type { RcFile } from 'antd/es/upload';
import type {
  MultiFileUploadProps,
  ProductImageItem,
  UploadingFile,
} from './MultiFileUpload.types';
import {
  ALLOWED_IMAGE_MIME_TYPES,
  isImageMimeType,
  formatFileSize,
} from '@/types/models/file.model';
import { fileService } from '@/services/file.service';
import { useTranslation } from 'react-i18next';
import styles from './MultiFileUpload.module.css';

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_MAX_FILES = 10;

export const MultiFileUpload: React.FC<MultiFileUploadProps> = ({
  value = [],
  onChange,
  maxFiles = DEFAULT_MAX_FILES,
  maxSize = DEFAULT_MAX_SIZE,
  disabled = false,
  className,
}) => {
  const { t } = useTranslation();
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const canUploadMore = value.length + uploadingFiles.length < maxFiles;

  // Validate file before upload
  const beforeUpload = useCallback(
    (file: RcFile): boolean => {
      if (!isImageMimeType(file.type)) {
        message.error(t('files.invalidType', 'Invalid file type'));
        return false;
      }

      if (file.size > maxSize) {
        message.error(
          t('files.tooLarge', 'File is too large. Maximum size: {{size}}', {
            size: formatFileSize(maxSize),
          })
        );
        return false;
      }

      if (!canUploadMore) {
        message.error(
          t('files.maxFilesReached', 'Maximum {{count}} files allowed', {
            count: maxFiles,
          })
        );
        return false;
      }

      return true;
    },
    [maxSize, maxFiles, canUploadMore, t]
  );

  // Handle custom upload
  const customUpload = useCallback(
    async (options: any) => {
      const { file, onSuccess, onError } = options;
      const uid = `upload-${Date.now()}`;

      setUploadingFiles(prev => [
        ...prev,
        { uid, file, progress: 0, status: 'uploading' },
      ]);

      try {
        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadingFiles(prev =>
            prev.map(f =>
              f.uid === uid && f.progress < 90
                ? { ...f, progress: f.progress + 10 }
                : f
            )
          );
        }, 100);

        const result = await fileService.upload(file);

        clearInterval(progressInterval);

        if (result.success) {
          const uploadedFile = result.data;
          const previewUrl = fileService.getStaticUrl(uploadedFile.url);

          // Create new image item
          const newImage: ProductImageItem = {
            id: `temp-${Date.now()}`,
            fileId: uploadedFile.id,
            displayOrder: value.length,
            isPrimary: value.length === 0, // First image is primary
            file: uploadedFile,
            previewUrl,
          };

          setUploadingFiles(prev => prev.filter(f => f.uid !== uid));
          onChange?.([...value, newImage]);
          onSuccess?.(uploadedFile);
          message.success(t('files.uploadSuccess', 'File uploaded successfully'));
        } else {
          throw new Error(result.error.message);
        }
      } catch (error: any) {
        setUploadingFiles(prev =>
          prev.map(f =>
            f.uid === uid
              ? { ...f, status: 'error', error: error.message }
              : f
          )
        );
        onError?.(error);
        message.error(error.message || t('files.uploadError', 'Upload failed'));

        // Remove failed upload after delay
        setTimeout(() => {
          setUploadingFiles(prev => prev.filter(f => f.uid !== uid));
        }, 3000);
      }
    },
    [value, onChange, t]
  );

  // Handle delete image
  const handleDelete = useCallback(
    (index: number) => {
      const newImages = value.filter((_, i) => i !== index);

      // If deleted was primary and there are remaining images, set first as primary
      if (value[index]?.isPrimary && newImages.length > 0) {
        newImages[0] = { ...newImages[0], isPrimary: true };
      }

      // Update display order
      const reorderedImages = newImages.map((img, i) => ({
        ...img,
        displayOrder: i,
      }));

      onChange?.(reorderedImages);
    },
    [value, onChange]
  );

  // Handle set primary
  const handleSetPrimary = useCallback(
    (index: number) => {
      const newImages = value.map((img, i) => ({
        ...img,
        isPrimary: i === index,
      }));
      onChange?.(newImages);
    },
    [value, onChange]
  );

  // Handle preview
  const handlePreview = useCallback((url: string) => {
    setPreviewUrl(url);
    setPreviewVisible(true);
  }, []);

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };

  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
  };

  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) {
      dragItem.current = null;
      dragOverItem.current = null;
      return;
    }

    const newImages = [...value];
    const draggedItem = newImages[dragItem.current];
    newImages.splice(dragItem.current, 1);
    newImages.splice(dragOverItem.current, 0, draggedItem);

    // Update display order
    const reorderedImages = newImages.map((img, i) => ({
      ...img,
      displayOrder: i,
    }));

    onChange?.(reorderedImages);
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const uploadProps: UploadProps = {
    name: 'file',
    accept: ALLOWED_IMAGE_MIME_TYPES.join(','),
    beforeUpload,
    customRequest: customUpload,
    showUploadList: false,
    disabled: disabled || !canUploadMore,
    multiple: true,
  };

  // Get preview URL for an image
  const getImagePreviewUrl = (image: ProductImageItem): string => {
    if (image.previewUrl) return image.previewUrl;
    if (image.file?.url) return fileService.getStaticUrl(image.file.url);
    if (image.file?.id) return fileService.getDownloadUrl(image.file.id);
    if (image.fileId) return fileService.getDownloadUrl(image.fileId);
    return '';
  };

  return (
    <div className={`${styles.multiFileUpload} ${className || ''}`}>
      <div className={styles.imageGrid}>
        {/* Existing images */}
        {value.map((image, index) => (
          <div
            key={image.id || image.fileId}
            className={`${styles.imageItem} ${image.isPrimary ? styles.primary : ''}`}
            draggable={!disabled}
            onDragStart={() => handleDragStart(index)}
            onDragEnter={() => handleDragEnter(index)}
            onDragEnd={handleDragEnd}
            onDragOver={e => e.preventDefault()}
          >
            <Image
              src={getImagePreviewUrl(image)}
              alt={`Image ${index + 1}`}
              className={styles.imagePreview}
            />

            {image.isPrimary && (
              <span className={styles.primaryBadge}>
                {t('files.primary', 'Primary')}
              </span>
            )}

            <div className={styles.imageOverlay}>
              <div className={styles.overlayActions}>
                <Tooltip title={t('common.preview', 'Preview')}>
                  <Button
                    type="text"
                    icon={<EyeOutlined />}
                    onClick={() => handlePreview(getImagePreviewUrl(image))}
                    style={{ color: 'white' }}
                  />
                </Tooltip>

                {!image.isPrimary && !disabled && (
                  <Tooltip title={t('files.setAsPrimary', 'Set as primary')}>
                    <Button
                      type="text"
                      icon={<StarOutlined />}
                      onClick={() => handleSetPrimary(index)}
                      style={{ color: 'white' }}
                    />
                  </Tooltip>
                )}

                {!disabled && (
                  <Tooltip title={t('common.delete', 'Delete')}>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDelete(index)}
                      style={{ color: '#ff4d4f' }}
                    />
                  </Tooltip>
                )}
              </div>

              {!disabled && (
                <HolderOutlined
                  style={{ color: 'white', marginTop: 8, fontSize: 16 }}
                />
              )}
            </div>
          </div>
        ))}

        {/* Uploading files */}
        {uploadingFiles.map(file => (
          <div key={file.uid} className={styles.uploadingItem}>
            <Progress type="circle" percent={file.progress} size={60} />
          </div>
        ))}

        {/* Upload button */}
        {canUploadMore && !disabled && (
          <Upload {...uploadProps}>
            <div className={styles.uploadButton}>
              <PlusOutlined className={styles.uploadIcon} />
              <span className={styles.uploadText}>
                {t('files.upload', 'Upload')}
              </span>
            </div>
          </Upload>
        )}
      </div>

      <p className={styles.hint}>
        {t('files.multiUploadHint', '{{current}}/{{max}} images. Drag to reorder. Max size: {{size}}', {
          current: value.length,
          max: maxFiles,
          size: formatFileSize(maxSize),
        })}
      </p>

      {/* Preview modal */}
      <Image
        style={{ display: 'none' }}
        preview={{
          visible: previewVisible,
          src: previewUrl,
          onVisibleChange: visible => setPreviewVisible(visible),
        }}
      />
    </div>
  );
};

export default MultiFileUpload;
