export interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  storageQuota: string;
  storageUsed: string;
}

export interface FolderItem {
  id: string;
  ownerId: string;
  ownerEmail?: string;
  ownerName?: string;
  parentId: string | null;
  name: string;
  path: string;
  isTrash: boolean;
  isStarred?: boolean;
  isShared?: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FileVersion {
  id: string;
  fileId: string;
  versionNumber: number;
  storageObjectId: string;
  size: string;
  checksum: string;
  createdAt: string;
}

export interface FileItem {
  id: string;
  ownerId: string;
  ownerEmail?: string;
  ownerName?: string;
  parentId: string | null;
  parentPath?: string;
  name: string;
  mimeType: string;
  size: string;
  originalSize?: string;
  checksum: string;
  isTrash: boolean;
  isStarred?: boolean;
  isShared?: boolean;
  deletedAt?: string;
  permission?: 'VIEWER' | 'EDITOR';
  shareId?: string;
  shareToken?: string;
  isSharedWithMe?: boolean;
  createdAt: string;
  updatedAt: string;
  versions?: FileVersion[];
}

export interface StorageLocation {
  id: string;
  name: string;
  provider: 'R2' | 'MINIO' | 'S3';
  endpoint?: string;
  bucket?: string;
  region?: string;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'DRAINING';
  capacity: string;
  used: string;
  priority: number;
  isDefault: boolean;
}

export interface ShareLink {
  id: string;
  fileId?: string;
  folderId?: string;
  token: string;
  permission: 'VIEWER' | 'EDITOR';
  visibility: 'PUBLIC' | 'RESTRICTED';
  expiresAt?: string;
  createdAt: string;
  revokedAt?: string;
  file?: FileItem;
  members?: Array<{ id: string; email: string; permission: string }>;
}

export interface FileEventPayload {
  eventId: string;
  sequence: number;
  userId: string;
  eventType: string;
  entityType: 'file' | 'folder';
  entityId: string;
  payload: any;
  timestamp: string;
}

export interface WorkspaceABACPermissions {
  canDownload: boolean;
  canUpload: boolean;
  canEdit: boolean;
  canMove: boolean;
  canDelete: boolean;
  canShare: boolean;
  canManagePermissions: boolean;
  [key: string]: boolean | undefined;
}

export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER' | 'CUSTOM';

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId?: string | null;
  email: string;
  role: WorkspaceRole;
  permissions: WorkspaceABACPermissions;
  canDownload?: boolean;
  canUpload?: boolean;
  canEdit?: boolean;
  canMove?: boolean;
  canDelete?: boolean;
  canShare?: boolean;
  canManagePermissions?: boolean;
  status: 'ACTIVE' | 'PENDING';
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface Workspace {
  id: string;
  name: string;
  description?: string | null;
  ownerId: string;
  storageQuota: string;
  storageUsed: string;
  createdAt: string;
  updatedAt: string;
  isOwner?: boolean;
  role?: WorkspaceRole;
  permissions?: WorkspaceABACPermissions;
  memberCount?: number;
  fileCount?: number;
  folderCount?: number;
  owner?: {
    id: string;
    name: string;
    email: string;
  };
  members?: WorkspaceMember[];
}

export interface WorkspaceLimitInfo {
  ownedCount: number;
  maxWorkspaces: number;
  storageQuota: string;
  planName: string;
}

export interface PhotoItem {
  id: string;
  name: string;
  mimeType: string;
  size: string;
  isStarred: boolean;
  isTrash: boolean;
  createdAt: string;
  updatedAt: string;
  parentId: string | null;
  ownerId: string;
  isVideo: boolean;
  isImage: boolean;
  previewUrl: string;
  downloadUrl: string;
}

export interface PhotoAlbum {
  id: string;
  userId: string;
  workspaceId: string | null;
  name: string;
  description: string;
  coverFileId: string | null;
  coverUrl: string | null;
  fileIds: string[];
  itemCount: number;
  createdAt: string;
  updatedAt: string;
  files?: PhotoItem[];
}

export interface TimelineGroup {
  label: string;
  date?: string;
  count: number;
  items: PhotoItem[];
}
