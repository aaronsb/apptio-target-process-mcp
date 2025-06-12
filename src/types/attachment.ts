/**
 * Type definitions for Target Process Attachment functionality
 */

export interface AttachmentInfo {
  Id: number;
  Name: string;
  Description?: string;
  Date: string;
  MimeType: string;
  Uri: string;
  ThumbnailUri?: string;
  Size: number;
  Owner?: {
    ResourceType: string;
    Id: number;
    FirstName?: string;
    LastName?: string;
  };
  General?: {
    ResourceType: string;
    Id: number;
    Name: string;
  };
  Message?: string;
}

export interface AttachmentDownloadArgs {
  attachmentId: number;
  format?: 'base64' | 'url' | 'info';
}

export interface AttachmentUploadArgs {
  entityType: string;
  entityId: number;
  file: string; // base64 encoded file content
  filename: string;
  description?: string;
  mimeType?: string;
}

export interface AttachmentListArgs {
  entityType: string;
  entityId: number;
  include?: string[];
}

export interface AttachmentDownloadResponse {
  attachmentId: number;
  filename: string;
  mimeType: string;
  size: number;
  data?: string; // base64 encoded (only if format is 'base64')
  downloadUrl?: string; // direct URL (only if format is 'url')
  base64Content?: string; // Alternative name for base64 content
  description?: string;
  uploadDate: string;
  owner?: {
    id: number;
    name: string;
  };
}

export interface AttachmentUploadResponse {
  success: boolean;
  attachmentId?: number;
  message: string;
  attachment?: AttachmentInfo;
  error?: string;
}

export interface AttachmentListResponse {
  entityType: string;
  entityId: number;
  entityName?: string;
  attachments: AttachmentInfo[];
  totalCount: number;
}

// Supported MIME types for uploads (security whitelist)
export const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg',
  'image/png', 
  'image/gif',
  'image/webp',
  'image/svg+xml',
  
  // Documents
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  
  // Archives
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  
  // Code files
  'text/javascript',
  'text/typescript',
  'text/html',
  'text/css',
  'application/json',
  'application/xml',
  'text/xml'
] as const;

export type AllowedMimeType = typeof ALLOWED_MIME_TYPES[number];

// File size limits (in bytes)
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_FILE_SIZE_WARNING = 10 * 1024 * 1024; // 10MB - warn user about large files
