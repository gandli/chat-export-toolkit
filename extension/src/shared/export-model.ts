import type { Conversation, ExportFormat, Message } from '../../../src/types';

export type ExtensionConversation = Conversation;
export type ExtensionMessage = Message;
export type ExtensionExportFormat = Extract<ExportFormat, 'json' | 'markdown'>;

export interface ProviderStatus {
  providerId: string;
  displayName: string;
  supported: boolean;
  detail: string;
}

export interface ExportRequest {
  type: 'cet:export-current';
  format: ExtensionExportFormat;
}

export interface StatusRequest {
  type: 'cet:get-status';
}

export interface DownloadPayload {
  filename: string;
  mimeType: string;
  content: string;
}

export interface DownloadRequest {
  type: 'cet:download';
  payload: DownloadPayload;
}

export interface ExportResponse {
  ok: boolean;
  provider?: ProviderStatus;
  conversation?: Pick<ExtensionConversation, 'id' | 'title'>;
  error?: string;
}

export interface StatusResponse {
  ok: boolean;
  provider: ProviderStatus;
}

export interface DownloadResponse {
  ok: boolean;
  downloadId?: number;
  error?: string;
}

export type ExtensionMessageRequest = ExportRequest | StatusRequest | DownloadRequest;
