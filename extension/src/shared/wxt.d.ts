export {};

declare global {
  interface WxtContentScriptDefinition {
    matches: string[];
    runAt?: 'document_start' | 'document_end' | 'document_idle';
    main(): void;
  }

  function defineContentScript(definition: WxtContentScriptDefinition): WxtContentScriptDefinition;
  function defineBackground(callback: () => void): void;
}

declare module 'wxt' {
  export function defineConfig(config: Record<string, unknown>): Record<string, unknown>;
}
