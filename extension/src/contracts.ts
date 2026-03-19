import type { ExportFormat, PlatformType } from '../../src/types';

export interface ExtensionStatus {
  supported: boolean;
  platform: PlatformType | null;
  message: string;
}

export interface DownloadPayload {
  filename: string;
  mimeType: string;
  content: string;
}

export interface ExportResponse {
  ok: boolean;
  status?: ExtensionStatus;
  download?: DownloadPayload;
  error?: string;
}

export interface DownloadResponse {
  ok: boolean;
  downloadId?: number;
  error?: string;
}

export type ExtensionMessage =
  | { type: 'CET_GET_STATUS' }
  | { type: 'CET_EXPORT_CURRENT'; format: Extract<ExportFormat, 'json' | 'markdown'> }
  | { type: 'CET_DOWNLOAD'; payload: DownloadPayload };
