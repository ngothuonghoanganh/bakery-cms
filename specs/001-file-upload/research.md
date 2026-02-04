# Research: File Upload for Products and Brands

**Date**: 2025-12-26
**Feature**: 001-file-upload
**Status**: Complete

## Research Topics

### 1. Multer Configuration for Image/Video Upload

**Decision**: Use disk storage with configurable upload directory

**Rationale**:
- Memory storage (current CSV approach) is unsuitable for large video files (up to 100MB)
- Disk storage allows streaming large files without memory pressure
- Configurable directory enables different paths for development/production
- Multer 2.x is already installed in the project

**Configuration Pattern**:
```typescript
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads/temp';
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const allowedVideoTypes = ['video/mp4', 'video/webm'];
  const allowed = [...allowedImageTypes, ...allowedVideoTypes];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'));
  }
};
```

**Alternatives Considered**:
- Cloud storage (S3, GCS): More complex setup, not required for MVP, can migrate later
- Base64 in database: Not suitable for large files, performance issues
- Memory storage: Memory pressure for large videos

---

### 2. File-Entity Association Pattern

**Decision**: Foreign key columns on Product and Brand models referencing File table

**Rationale**:
- Simple and clear relationship (Product hasOne File for image, hasOne for video)
- Efficient queries with standard Sequelize associations
- Easy to extend (add more file types per entity later)
- Consistent with existing model patterns (OrderItem → Product)

**Implementation Pattern**:
```typescript
// Product model additions
declare imageFileId: string | null;
declare videoFileId: string | null;

ProductModel.belongsTo(FileModel, { as: 'imageFile', foreignKey: 'imageFileId' });
ProductModel.belongsTo(FileModel, { as: 'videoFile', foreignKey: 'videoFileId' });

// Brand model additions
declare imageFileId: string | null;

BrandModel.belongsTo(FileModel, { as: 'imageFile', foreignKey: 'imageFileId' });
```

**Alternatives Considered**:
- Polymorphic association (File references entity): More complex queries, harder to validate
- Junction table: Overkill for single file per entity
- Store file path directly on entity: Loses metadata, harder to manage cleanup

---

### 3. File Serving and Caching Strategy

**Decision**: Express static file serving with Cache-Control headers

**Rationale**:
- Simple setup using Express.static or custom route with sendFile
- Effective caching with proper headers reduces server load
- ETag support for conditional requests
- No need for CDN in MVP phase

**Implementation Pattern**:
```typescript
// Option A: Express static (for public files)
app.use('/files', express.static(uploadDir, {
  maxAge: '7d',
  etag: true,
  lastModified: true,
}));

// Option B: Custom route with authentication (for private files)
router.get('/files/:id', authenticateJWT, async (req, res) => {
  const file = await fileService.getById(req.params.id);
  if (!file) return res.status(404).json({ error: 'File not found' });

  res.set({
    'Content-Type': file.mimeType,
    'Content-Disposition': `inline; filename="${file.originalName}"`,
    'Cache-Control': 'public, max-age=604800', // 7 days
  });

  res.sendFile(file.storagePath);
});
```

**Alternatives Considered**:
- CDN (CloudFront, Cloudflare): Adds complexity, defer to production optimization
- Signed URLs: Not needed for MVP, files are behind authentication
- Streaming response: Standard sendFile is sufficient for file sizes

---

### 4. File Cleanup Strategy

**Decision**: Synchronous cleanup during entity deletion with orphan detection job

**Rationale**:
- Immediate cleanup prevents orphaned files from accumulating
- Simple implementation using Sequelize hooks
- Orphan detection job as safety net for edge cases

**Implementation Pattern**:
```typescript
// In Product service deleteProduct method
const deleteProduct = async (id: string): Promise<Result<void, AppError>> => {
  const product = await productRepository.findById(id);
  if (!product) return err(createNotFoundError('Product not found'));

  // Delete associated files first
  if (product.imageFileId) {
    await fileService.delete(product.imageFileId);
  }
  if (product.videoFileId) {
    await fileService.delete(product.videoFileId);
  }

  // Soft delete product
  await productRepository.delete(id);
  return ok(undefined);
};

// File deletion includes physical file removal
const deleteFile = async (id: string): Promise<Result<void, AppError>> => {
  const file = await fileRepository.findById(id);
  if (!file) return ok(undefined); // Already deleted

  // Remove physical file
  await fs.unlink(file.storagePath).catch(() => {});

  // Hard delete record (no soft delete for files)
  await fileRepository.hardDelete(id);
  return ok(undefined);
};
```

**Alternatives Considered**:
- Soft delete files: Wastes storage, complicates cleanup
- Background job only: Risk of orphans between entity delete and job run
- Reference counting: Overkill for 1:1 relationships

---

### 5. Frontend Upload Component Pattern

**Decision**: Ant Design Upload component with custom request handler

**Rationale**:
- Ant Design Upload provides drag-and-drop, preview, progress out of the box
- Custom request handler integrates with existing Axios client and auth
- Consistent with existing form patterns in the codebase
- Built-in validation support for file type and size

**Implementation Pattern**:
```typescript
const FileUpload: React.FC<FileUploadProps> = ({
  accept, maxSize, value, onChange, onRemove
}) => {
  const { t } = useTranslation();

  const customRequest = async ({ file, onSuccess, onError, onProgress }) => {
    try {
      const result = await fileService.upload(file, (percent) => {
        onProgress({ percent });
      });

      if (result.isOk()) {
        onChange(result.value);
        onSuccess(result.value);
      } else {
        onError(new Error(result.error.message));
      }
    } catch (error) {
      onError(error);
    }
  };

  return (
    <Upload
      accept={accept}
      maxCount={1}
      customRequest={customRequest}
      beforeUpload={(file) => validateFile(file, maxSize)}
      listType="picture-card"
      onRemove={onRemove}
    >
      {!value && <UploadButton />}
    </Upload>
  );
};
```

**Alternatives Considered**:
- React Dropzone: Additional dependency, Ant Design already provides similar
- Custom implementation: More work, less features
- Direct form upload: No progress tracking, poor UX

---

### 6. File Metadata Storage

**Decision**: Store essential metadata in File table, derive computed properties

**Rationale**:
- Store: id, originalName, storagePath, mimeType, size, uploadedAt, uploadedBy
- Derive: file extension from originalName, file type from mimeType
- Minimal storage with maximum utility
- Enable filtering/searching by metadata

**Schema**:
```typescript
type File = {
  id: string;              // UUID
  originalName: string;    // Original filename
  storagePath: string;     // Path on disk
  mimeType: string;        // MIME type (image/jpeg, video/mp4)
  size: number;            // File size in bytes
  uploadedAt: Date;        // Upload timestamp
  uploadedBy: string;      // User ID who uploaded
};

// Computed (not stored)
const getFileExtension = (file: File): string =>
  path.extname(file.originalName).toLowerCase();

const getFileCategory = (file: File): 'image' | 'video' =>
  file.mimeType.startsWith('image/') ? 'image' : 'video';
```

**Alternatives Considered**:
- Store thumbnails: Adds complexity, defer to optimization phase
- Store checksums: Good for integrity but not required for MVP
- Store dimensions: Requires image processing library, defer

---

### 7. Security Considerations

**Decision**: Validate on both client and server, sanitize filenames, restrict access

**Rationale**:
- Defense in depth: client validation for UX, server validation for security
- Filename sanitization prevents path traversal attacks
- Authentication required for all file operations
- Files stored outside web root to prevent direct access

**Implementation Pattern**:
```typescript
// Server-side validation in Multer fileFilter
const validateFile = (req, file, cb) => {
  // Check MIME type
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Invalid file type'));
  }

  // Check extension matches MIME type
  const ext = path.extname(file.originalname).toLowerCase();
  const expectedExts = mimeToExtension[file.mimetype];
  if (!expectedExts.includes(ext)) {
    return cb(new Error('File extension does not match content type'));
  }

  cb(null, true);
};

// Filename sanitization
const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/\.\./g, '_')
    .slice(0, 255);
};

// Path construction (never use user input directly)
const getStoragePath = (fileId: string, ext: string): string => {
  const baseDir = process.env.UPLOAD_DIR || './uploads';
  return path.join(baseDir, `${fileId}${ext}`);
};
```

**Alternatives Considered**:
- Virus scanning: Good practice, defer to production hardening
- Content verification: Opening file to verify contents, adds latency
- Signed upload URLs: Overkill for internal tool

---

## Summary

All technical decisions align with:
- Existing codebase patterns (factory functions, Result type, layered architecture)
- Constitution requirements (functional programming, TypeScript strict, testing)
- MVP scope (local storage, essential features, security basics)

No unresolved clarifications remain. Ready for Phase 1 design artifacts.
