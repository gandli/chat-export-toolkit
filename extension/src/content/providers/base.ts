import type { Conversation } from '../../../../src/types';
import type { ProviderStatus } from '../../shared/export-model';

export interface ExtensionProvider {
  readonly id: string;
  readonly displayName: string;
  readonly hosts: string[];

  matches(location: Location): boolean;
  getStatus(): Promise<ProviderStatus>;
  collectCurrentConversation(): Promise<Conversation>;
}
