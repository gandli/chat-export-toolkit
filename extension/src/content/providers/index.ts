import type { ExtensionProvider } from './base';
import { ChatGPTExtensionProvider } from './chatgpt';

const providers: ExtensionProvider[] = [new ChatGPTExtensionProvider()];

export function detectProvider(location: Location): ExtensionProvider | null {
  return providers.find((provider) => provider.matches(location)) || null;
}

export function listProviders(): ExtensionProvider[] {
  return providers;
}
