/**
 * Exporters Module Exports
 */

import { JSONExporter } from './json';
import { MarkdownExporter } from './markdown';
import { DocxExporter } from './docx';
import { ZIPExporter } from './zip';
import type { IExporter } from '../core';

export { BaseExporter } from './base';
export { JSONExporter } from './json';
export { MarkdownExporter } from './markdown';
export { DocxExporter } from './docx';
export { ZIPExporter } from './zip';

// TODO: 后续添加其他格式导出器
// - HTMLExporter
// - PDFExporter
// - TextExporter
// - CSVExporter

/**
 * 导出器注册表
 */
export const exporterRegistry = new Map<string, new () => IExporter>();

// 注册默认导出器
exporterRegistry.set('json', JSONExporter as unknown as new () => IExporter);
exporterRegistry.set('markdown', MarkdownExporter as unknown as new () => IExporter);
exporterRegistry.set('docx', DocxExporter as unknown as new () => IExporter);
exporterRegistry.set('zip', ZIPExporter as unknown as new () => IExporter);

/**
 * 注册导出器
 */
export function registerExporter(format: string, exporterClass: new () => IExporter): void {
  exporterRegistry.set(format, exporterClass);
  console.log(`[ExporterRegistry] Registered exporter for ${format}`);
}

/**
 * 获取导出器
 */
export function getExporter(format: string): IExporter | null {
  const ExporterClass = exporterRegistry.get(format);
  if (!ExporterClass) {
    console.warn(`[ExporterRegistry] No exporter found for ${format}`);
    return null;
  }
  return new ExporterClass();
}
