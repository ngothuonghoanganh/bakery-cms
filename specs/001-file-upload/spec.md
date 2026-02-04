# Feature Specification: File Upload for Products and Brands

**Feature Branch**: `001-file-upload`
**Created**: 2025-12-26
**Status**: Draft
**Input**: User description: "Create feature upload image and video - BE: create API to upload and view file, set file id to image for product and stock item brand, storage file to temp directory - FE: in product and stock item brand add-on file, implement upload flow"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Upload Product Image (Priority: P1)

As a seller or manager, I want to upload an image for a product so that customers can see what the product looks like when browsing the catalog.

**Why this priority**: Product images are essential for customer purchasing decisions. Without visual representation, products are less appealing and sales may suffer. This is the core value proposition of the feature.

**Independent Test**: Can be fully tested by creating/updating a product with an image upload and verifying the image displays correctly on the product listing and detail pages.

**Acceptance Scenarios**:

1. **Given** I am on the product creation/edit form, **When** I select an image file from my device, **Then** I see a preview of the selected image before saving
2. **Given** I have selected a valid image file, **When** I save the product, **Then** the image is uploaded and associated with the product
3. **Given** a product has an image, **When** I view the product list or detail page, **Then** the product image is displayed correctly
4. **Given** a product has an existing image, **When** I upload a new image, **Then** the new image replaces the old one

---

### User Story 2 - Upload Brand Logo/Image (Priority: P2)

As a manager, I want to upload an image/logo for a brand so that I can visually identify brands in the stock management system.

**Why this priority**: Brand images help with quick visual identification when managing stock items, improving operational efficiency. Less critical than product images since brands are internal-facing.

**Independent Test**: Can be fully tested by creating/updating a brand with an image upload and verifying the image displays in the brand list and when viewing stock items associated with that brand.

**Acceptance Scenarios**:

1. **Given** I am on the brand creation/edit form, **When** I select an image file, **Then** I see a preview of the selected image
2. **Given** I have selected a valid image file, **When** I save the brand, **Then** the image is uploaded and associated with the brand
3. **Given** a brand has an image, **When** I view the brand list or stock items list, **Then** the brand image is visible

---

### User Story 3 - View Uploaded Files (Priority: P3)

As a user with appropriate permissions, I want to view uploaded images and videos through a dedicated file endpoint so that files are served efficiently and consistently.

**Why this priority**: Viewing files is a dependency of the previous stories but is technically simpler. The upload functionality is more critical to implement first.

**Independent Test**: Can be fully tested by uploading a file and accessing it through the file viewing endpoint to verify correct display.

**Acceptance Scenarios**:

1. **Given** a file has been uploaded, **When** I request the file using its identifier, **Then** the file is displayed correctly in my browser
2. **Given** a file does not exist, **When** I request it, **Then** I receive an appropriate error message
3. **Given** an image file is requested, **When** it is served, **Then** appropriate caching headers are included for performance

---

### User Story 4 - Upload Product Video (Priority: P4)

As a seller or manager, I want to upload a video for a product so that customers can see the product in action or get a better understanding of its features.

**Why this priority**: Videos provide enhanced product presentation but are less essential than images. Many products may not need videos, making this a nice-to-have enhancement.

**Independent Test**: Can be fully tested by uploading a video file for a product and verifying it plays correctly on the product detail page.

**Acceptance Scenarios**:

1. **Given** I am on the product form, **When** I select a video file, **Then** I see an indication that the video is selected (thumbnail or filename)
2. **Given** I have selected a valid video file, **When** I save the product, **Then** the video is uploaded and associated with the product
3. **Given** a product has a video, **When** I view the product detail page, **Then** I can play the video

---

### Edge Cases

- What happens when the user uploads a file that exceeds the maximum size limit?
  - System displays a clear error message with the maximum allowed size
- What happens when the user uploads an unsupported file format?
  - System rejects the upload with a message listing supported formats
- What happens when the upload fails mid-way due to network issues?
  - Upload is cancelled and user is notified to retry; no partial files are stored
- What happens when a product/brand is deleted that has associated files?
  - Associated files are cleaned up to prevent orphaned files in storage
- What happens when a user tries to view a file they don't have permission to access?
  - System returns a "not found" response (to avoid revealing file existence)
- What happens if two users upload files with the same filename?
  - System generates unique identifiers for each file regardless of original name

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow authenticated users to upload image files (JPEG, PNG, GIF, WebP formats)
- **FR-002**: System MUST allow authenticated users to upload video files (MP4, WebM formats)
- **FR-003**: System MUST validate file type before accepting upload
- **FR-004**: System MUST enforce maximum file size limits (10MB for images, 100MB for videos)
- **FR-005**: System MUST generate unique identifiers for each uploaded file
- **FR-006**: System MUST store uploaded files in a temporary storage directory
- **FR-007**: System MUST provide an endpoint to retrieve uploaded files by their identifier
- **FR-008**: System MUST allow associating a file with a product record
- **FR-009**: System MUST allow associating a file with a brand record
- **FR-010**: System MUST return the file path/URL when retrieving product or brand data (via join with file record)
- **FR-011**: System MUST show file preview in the product form before saving
- **FR-012**: System MUST show file preview in the brand form before saving
- **FR-013**: System MUST allow replacing an existing file with a new upload
- **FR-014**: System MUST clean up old files when they are replaced
- **FR-015**: System MUST restrict file upload actions to users with Seller role or higher for products
- **FR-016**: System MUST restrict file upload actions to users with Manager role or higher for brands
- **FR-017**: System MUST store file metadata (original filename, MIME type, size, upload timestamp)
- **FR-018**: System MUST serve files with appropriate content-type headers
- **FR-019**: System MUST include caching headers when serving static files

### Key Entities

- **File**: Represents an uploaded file with metadata
  - Identifier (unique)
  - Original filename
  - Storage path
  - MIME type
  - File size
  - Entity type (product/brand)
  - Entity ID (reference to product or brand)
  - Upload timestamp
  - Uploaded by (user reference)

- **Product** (existing entity - modification required)
  - Add: File reference for product image
  - Add: File reference for product video (optional)

- **Brand** (existing entity - modification required)
  - Add: File reference for brand image

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete a file upload in under 30 seconds for files up to 10MB on a standard connection
- **SC-002**: Uploaded images display correctly on product and brand pages within 2 seconds of page load
- **SC-003**: 100% of invalid file types are rejected before upload completes
- **SC-004**: 100% of oversized files are rejected with a clear error message
- **SC-005**: File retrieval endpoint responds in under 500ms for cached files
- **SC-006**: All uploaded files are accessible after upload and persist across system restarts
- **SC-007**: 95% of users can successfully upload a file on their first attempt (intuitive UI)
- **SC-008**: Zero orphaned files remain in storage after entity deletion

## Assumptions

- Files will be stored on the local filesystem in a designated temporary directory (not cloud storage)
- The existing authentication and authorization system will be used for access control
- File cleanup for orphaned files will be handled synchronously during entity deletion
- No image processing (resizing, compression) is required for MVP; files are stored as-is
- Video files will be served directly without transcoding
- The system uses existing Multer middleware for file handling (already in dependencies)
- Files are private by default; only authenticated users can access them
- A single image per product (for MVP) and single image per brand is sufficient
- A single video per product is sufficient for MVP
