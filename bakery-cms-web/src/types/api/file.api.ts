/**
 * API response types for File endpoints
 * These types represent the data structure returned by the backend API
 */

export type FileAPIResponse = {
  readonly id: string;
  readonly originalName: string;
  readonly mimeType: string;
  readonly size: number;
  readonly url: string;
  readonly uploadedAt: string;
  readonly uploadedBy: string;
};

export type PaginatedFilesAPIResponse = {
  readonly data: readonly FileAPIResponse[];
  readonly pagination: {
    readonly total: number;
    readonly page: number;
    readonly limit: number;
    readonly totalPages: number;
  };
};

export type FileFiltersRequest = {
  readonly mimeType?: string;
  readonly uploadedBy?: string;
  readonly page?: number;
  readonly limit?: number;
};
