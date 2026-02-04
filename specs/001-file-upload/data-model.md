# Data Model: File Upload for Products and Brands

**Date**: 2025-12-26
**Feature**: 001-file-upload

## Entity Definitions

### File (NEW)

Represents an uploaded file with metadata.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, NOT NULL, DEFAULT UUIDV4 | Unique identifier |
| originalName | STRING(255) | NOT NULL | Original filename as uploaded |
| storagePath | STRING(500) | NOT NULL, UNIQUE | Full path to file on disk |
| mimeType | STRING(100) | NOT NULL | MIME type (e.g., image/jpeg, video/mp4) |
| size | BIGINT | NOT NULL | File size in bytes |
| uploadedBy | UUID | NOT NULL, FK → users.id | User who uploaded the file |
| createdAt | DATETIME | NOT NULL, AUTO | Upload timestamp |
| updatedAt | DATETIME | NOT NULL, AUTO | Last modification timestamp |

**Indexes**:
- `idx_files_uploaded_by` on `uploaded_by`
- `idx_files_mime_type` on `mime_type`
- `idx_files_created_at` on `created_at`

**Notes**:
- No soft delete (deleted_at) - files are hard deleted to free storage
- storagePath is unique to prevent duplicate storage references
- mimeType used for serving files with correct Content-Type

---

### Product (MODIFIED)

Add file associations for product image and video.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| ... | ... | ... | (existing fields unchanged) |
| imageFileId | UUID | NULLABLE, FK → files.id | Product image reference |
| videoFileId | UUID | NULLABLE, FK → files.id | Product video reference |

**New Indexes**:
- `idx_products_image_file_id` on `image_file_id`
- `idx_products_video_file_id` on `video_file_id`

**New Associations**:
```
Product.belongsTo(File, { as: 'imageFile', foreignKey: 'imageFileId' })
Product.belongsTo(File, { as: 'videoFile', foreignKey: 'videoFileId' })
```

---

### Brand (MODIFIED)

Add file association for brand image/logo.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| ... | ... | ... | (existing fields unchanged) |
| imageFileId | UUID | NULLABLE, FK → files.id | Brand image/logo reference |

**New Indexes**:
- `idx_brands_image_file_id` on `image_file_id`

**New Associations**:
```
Brand.belongsTo(File, { as: 'imageFile', foreignKey: 'imageFileId' })
```

---

## Enums

### FileCategory (NEW)

```typescript
enum FileCategory {
  IMAGE = 'image',
  VIDEO = 'video',
}
```

**Values**:
- `IMAGE`: Image files (JPEG, PNG, GIF, WebP)
- `VIDEO`: Video files (MP4, WebM)

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                            files                                 │
├─────────────────────────────────────────────────────────────────┤
│ id (PK)           │ UUID                                        │
│ original_name     │ VARCHAR(255)                                │
│ storage_path      │ VARCHAR(500) UNIQUE                         │
│ mime_type         │ VARCHAR(100)                                │
│ size              │ BIGINT                                      │
│ uploaded_by (FK)  │ UUID → users.id                             │
│ created_at        │ DATETIME                                    │
│ updated_at        │ DATETIME                                    │
└─────────────────────────────────────────────────────────────────┘
          ▲                              ▲
          │                              │
          │ 0..1                         │ 0..1
          │                              │
┌─────────┴───────────┐      ┌──────────┴──────────┐
│     products        │      │       brands        │
├─────────────────────┤      ├─────────────────────┤
│ ...existing...      │      │ ...existing...      │
│ image_file_id (FK)  │      │ image_file_id (FK)  │
│ video_file_id (FK)  │      └─────────────────────┘
└─────────────────────┘
```

---

## Validation Rules

### File Upload Validation

| Rule | Constraint | Error Message |
|------|------------|---------------|
| File required | file !== null | "File is required" |
| Image size limit | size <= 10MB | "Image file must be less than 10MB" |
| Video size limit | size <= 100MB | "Video file must be less than 100MB" |
| Image type | mimeType in [image/jpeg, image/png, image/gif, image/webp] | "Invalid image format. Allowed: JPEG, PNG, GIF, WebP" |
| Video type | mimeType in [video/mp4, video/webm] | "Invalid video format. Allowed: MP4, WebM" |
| Extension match | extension matches mimeType | "File extension does not match content type" |

### File Name Validation

| Rule | Constraint | Error Message |
|------|------------|---------------|
| Max length | originalName.length <= 255 | "Filename too long" |
| Valid characters | /^[a-zA-Z0-9._-]+$/ after sanitization | "Invalid filename characters" |

---

## State Transitions

Files do not have state transitions. They are either:
- **Existing**: File record exists and physical file is on disk
- **Deleted**: File record and physical file are both removed (hard delete)

Product/Brand image associations:
- **Unset → Set**: Upload new file, associate with entity
- **Set → Updated**: Upload new file, delete old file, associate new with entity
- **Set → Unset**: Delete file, clear association (set to NULL)

---

## Migration Strategy

### Migration: Create Files Table

```sql
CREATE TABLE files (
  id CHAR(36) PRIMARY KEY,
  original_name VARCHAR(255) NOT NULL,
  storage_path VARCHAR(500) NOT NULL UNIQUE,
  mime_type VARCHAR(100) NOT NULL,
  size BIGINT NOT NULL,
  uploaded_by CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_files_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id),
  INDEX idx_files_uploaded_by (uploaded_by),
  INDEX idx_files_mime_type (mime_type),
  INDEX idx_files_created_at (created_at)
);
```

### Migration: Add File Columns to Products

```sql
ALTER TABLE products
  ADD COLUMN image_file_id CHAR(36) NULL,
  ADD COLUMN video_file_id CHAR(36) NULL,
  ADD CONSTRAINT fk_products_image_file FOREIGN KEY (image_file_id) REFERENCES files(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_products_video_file FOREIGN KEY (video_file_id) REFERENCES files(id) ON DELETE SET NULL,
  ADD INDEX idx_products_image_file_id (image_file_id),
  ADD INDEX idx_products_video_file_id (video_file_id);
```

### Migration: Add File Column to Brands

```sql
ALTER TABLE brands
  ADD COLUMN image_file_id CHAR(36) NULL,
  ADD CONSTRAINT fk_brands_image_file FOREIGN KEY (image_file_id) REFERENCES files(id) ON DELETE SET NULL,
  ADD INDEX idx_brands_image_file_id (image_file_id);
```

### Migration: Remove Legacy imageUrl from Products

```sql
-- Run after data migration (if needed)
ALTER TABLE products DROP COLUMN image_url;
```

---

## Data Migration Notes

The existing `products.imageUrl` column contains URL strings. Migration options:

1. **Keep both columns during transition**: Allow imageUrl for backwards compatibility, prefer imageFileId when present
2. **One-time migration**: Download existing images from URLs, upload to file system, create File records
3. **Ignore legacy data**: Set imageUrl to NULL and start fresh with new upload system

**Recommended**: Option 1 for MVP - keep imageUrl as fallback, new uploads use File system. Clean up in future iteration.

---

## Query Patterns

### Get Product with Image

```typescript
const product = await ProductModel.findByPk(id, {
  include: [
    { model: FileModel, as: 'imageFile', attributes: ['id', 'storagePath', 'mimeType'] },
    { model: FileModel, as: 'videoFile', attributes: ['id', 'storagePath', 'mimeType'] },
  ],
});
```

### Get Brand with Image

```typescript
const brand = await BrandModel.findByPk(id, {
  include: [
    { model: FileModel, as: 'imageFile', attributes: ['id', 'storagePath', 'mimeType'] },
  ],
});
```

### Delete File and Update Entity

```typescript
// Delete old file if replacing
if (product.imageFileId) {
  await FileModel.destroy({ where: { id: product.imageFileId } });
  await fs.unlink(oldFile.storagePath);
}

// Update with new file reference
await product.update({ imageFileId: newFileId });
```
