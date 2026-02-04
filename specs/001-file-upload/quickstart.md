# Quickstart: File Upload for Products and Brands

**Date**: 2025-12-26
**Feature**: 001-file-upload

## Prerequisites

- Node.js 18+
- MySQL 8.x running
- Backend and frontend dependencies installed
- Authentication working (JWT)

## Setup Steps

### 1. Environment Configuration

Add to `bakery-cms-api/.env`:

```env
# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_IMAGE_SIZE=10485760
MAX_VIDEO_SIZE=104857600
```

Create the upload directory:

```bash
mkdir -p bakery-cms-api/uploads
```

### 2. Run Database Migration

```bash
cd bakery-cms-api
yarn workspace @bakery-cms/database migrate
```

This creates:
- `files` table
- `image_file_id` and `video_file_id` columns on `products` table
- `image_file_id` column on `brands` table

### 3. Start Development Servers

**Backend:**
```bash
cd bakery-cms-api
yarn dev
```

**Frontend:**
```bash
cd bakery-cms-web
yarn dev
```

## Quick Verification

### Test File Upload API

```bash
# Upload an image
curl -X POST http://localhost:3000/api/v1/files \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/image.jpg"

# Response:
# {
#   "success": true,
#   "data": {
#     "id": "uuid",
#     "originalName": "image.jpg",
#     "mimeType": "image/jpeg",
#     "size": 12345,
#     "url": "/api/v1/files/uuid/download",
#     "uploadedAt": "2025-12-26T10:00:00Z"
#   }
# }
```

### Test Product Image Upload

```bash
# Upload image for a product
curl -X POST http://localhost:3000/api/v1/products/{productId}/image \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/product-image.jpg"
```

### Test File Download

```bash
# View/download the file
curl http://localhost:3000/api/v1/files/{fileId}/download \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  --output downloaded-file.jpg
```

## Frontend Usage

### FileUpload Component

```tsx
import { FileUpload } from '@/components/shared/FileUpload';

<FileUpload
  accept="image/jpeg,image/png,image/gif,image/webp"
  maxSize={10 * 1024 * 1024}
  value={imageFile}
  onChange={(file) => setImageFile(file)}
  onRemove={() => setImageFile(null)}
/>
```

### ProductForm with Image Upload

```tsx
<Form.Item name="imageFileId" label={t('products.form.image')}>
  <FileUpload
    accept="image/*"
    maxSize={10 * 1024 * 1024}
    value={product?.imageFile}
    onChange={handleImageChange}
  />
</Form.Item>
```

## File Limits

| Type | Max Size | Formats |
|------|----------|---------|
| Image | 10 MB | JPEG, PNG, GIF, WebP |
| Video | 100 MB | MP4, WebM |

## API Endpoints Summary

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/files` | Upload file | Seller+ |
| GET | `/api/v1/files` | List files | Manager+ |
| GET | `/api/v1/files/:id` | Get file metadata | Any |
| DELETE | `/api/v1/files/:id` | Delete file | Manager+ |
| GET | `/api/v1/files/:id/download` | Download file | Any |
| POST | `/api/v1/products/:id/image` | Upload product image | Seller+ |
| DELETE | `/api/v1/products/:id/image` | Remove product image | Seller+ |
| POST | `/api/v1/products/:id/video` | Upload product video | Seller+ |
| DELETE | `/api/v1/products/:id/video` | Remove product video | Seller+ |
| POST | `/api/v1/brands/:id/image` | Upload brand image | Manager+ |
| DELETE | `/api/v1/brands/:id/image` | Remove brand image | Manager+ |

## Troubleshooting

### "File too large" error
- Check file size against limits (10MB images, 100MB videos)
- Verify `MAX_IMAGE_SIZE` / `MAX_VIDEO_SIZE` env vars

### "Invalid file type" error
- Ensure file MIME type matches extension
- Check supported formats in file filter

### "Upload directory not writable"
- Verify `UPLOAD_DIR` exists and has write permissions
- On Linux: `chmod 755 uploads`

### Files not displaying
- Check file was successfully uploaded (check response)
- Verify file exists at `storagePath`
- Check authentication token is valid

## Next Steps

1. Run `/speckit.tasks` to generate implementation tasks
2. Implement backend File module
3. Implement frontend FileUpload component
4. Integrate with ProductForm and BrandForm
5. Run tests and verify functionality
