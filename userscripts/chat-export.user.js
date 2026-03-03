// ==UserScript==
// @name         Chat Export Toolkit
// @namespace    https://github.com/gandli/chat-export-toolkit
// @version      0.5.0
// @description  Export/copy current Yuanbao conversation and export all conversations as ZIP (MD/JSON/DOCX)
// @author       gandli
// @match        *://yuanbao.tencent.com/*
// @match        *://*.yuanbao.tencent.com/*
// @require      https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js
// @grant        none
// @run-at       document-start
// @license      MIT
// ==/UserScript==

(function () {
  'use strict';

  const YUANBAO_DETAIL_RE = /\/api\/user\/agent\/conversation\/v1\/detail\b/;
  const YUANBAO_LIST_RE = /\/api\/user\/agent\/conversation\/v1\/(?:list|page|list_page)\b/;

  const state = {
    current: null,
    captured: new Map(),
    listHints: new Map(),
    ui: {
      busy: false,
      panelOpen: false,
      progress: { show: false, text: '', percent: 0 },
    },
  };

  const Utils = {
    nowStamp() {
      const d = new Date();
      const offset = d.getTimezoneOffset() * 60 * 1000;
      return new Date(d.getTime() - offset)
        .toISOString()
        .slice(0, 19)
        .replace('T', '_')
        .replace(/:/g, '-');
    },

    formatTimestamp(ts) {
      if (!ts) return '';
      try {
        const n = typeof ts === 'string' ? Number.parseInt(ts, 10) : ts;
        const d = new Date(typeof n === 'number' && n < 1e12 ? n * 1000 : n);
        return Number.isNaN(d.getTime()) ? '' : d.toLocaleString();
      } catch {
        return '';
      }
    },

    sanitizeFilename(name) {
      return String(name || 'export').replace(/[\/\\?%*:|"<>]/g, '-').trim();
    },

    download(content, mime, filename) {
      const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 500);
    },

    async copyText(text) {
      const val = String(text || '');
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(val);
        return;
      }
      const ta = document.createElement('textarea');
      ta.value = val;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    },

    xmlEscape(text) {
      return String(text)
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    },

    adjustHeaderLevels(text, increaseBy = 1) {
      if (!text) return '';
      return String(text).replace(/^(#+)(\s*)(.*?)\s*$/gm, (_m, hashes, _space, content) => {
        return '#'.repeat(hashes.length + increaseBy) + ' ' + String(content).trim();
      });
    },

    extractConversationId(url) {
      try {
        const u = new URL(url, window.location.href);
        return (
          u.searchParams.get('conversationId') ||
          u.searchParams.get('conversation_id') ||
          u.searchParams.get('id') ||
          ''
        );
      } catch {
        const m = String(url).match(/[?&](?:conversationId|conversation_id|id)=([^&]+)/);
        return m ? decodeURIComponent(m[1]) : '';
      }
    },
  };

  function mdToDocxParagraphs(markdown) {
    const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n');
    const out = [];
    let inCode = false;

    const p = (text, style = '') => {
      const s = style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : '';
      return `<w:p>${s}<w:r><w:t xml:space="preserve">${Utils.xmlEscape(text)}</w:t></w:r></w:p>`;
    };

    for (const raw of lines) {
      const line = raw ?? '';

      if (/^```/.test(line.trim())) {
        inCode = !inCode;
        continue;
      }

      if (inCode) {
        out.push(p(line, 'CodeBlock'));
        continue;
      }

      const h = line.match(/^(#{1,6})\s+(.*)$/);
      if (h) {
        const level = Math.min(3, h[1].length);
        out.push(p(h[2], `Heading${level}`));
        continue;
      }

      const bullet = line.match(/^\s*[-*]\s+(.*)$/);
      if (bullet) {
        out.push(p(`• ${bullet[1]}`, 'Normal'));
        continue;
      }

      const quote = line.match(/^>\s?(.*)$/);
      if (quote) {
        out.push(p(`❝ ${quote[1]}`, 'Quote'));
        continue;
      }

      if (!line.trim()) {
        out.push('<w:p/>');
        continue;
      }

      out.push(p(line, 'Normal'));
    }

    return out;
  }

  async function buildDocxBlob(markdownText) {
    if (typeof JSZip === 'undefined') throw new Error('JSZip missing');

    const paragraphs = mdToDocxParagraphs(markdownText);

    const documentXml =
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">` +
      `<w:body>` +
      paragraphs.join('') +
      `<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr>` +
      `</w:body></w:document>`;

    const stylesXml =
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">` +
      `<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>` +
      `<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:qFormat/><w:rPr><w:b/><w:sz w:val="40"/></w:rPr></w:style>` +
      `<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:qFormat/><w:rPr><w:b/><w:sz w:val="32"/></w:rPr></w:style>` +
      `<w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:qFormat/><w:rPr><w:b/><w:sz w:val="28"/></w:rPr></w:style>` +
      `<w:style w:type="paragraph" w:styleId="CodeBlock"><w:name w:val="Code Block"/><w:basedOn w:val="Normal"/><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:sz w:val="20"/></w:rPr></w:style>` +
      `<w:style w:type="paragraph" w:styleId="Quote"><w:name w:val="Quote"/><w:basedOn w:val="Normal"/><w:pPr><w:ind w:left="420"/></w:pPr><w:rPr><w:i/></w:rPr></w:style>` +
      `</w:styles>`;

    const contentTypesXml =
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
      `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
      `<Default Extension="xml" ContentType="application/xml"/>` +
      `<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>` +
      `<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>` +
      `</Types>`;

    const relsXml =
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>` +
      `</Relationships>`;

    const docRelsXml =
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
      `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      `<Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
      `</Relationships>`;

    const zip = new JSZip();
    zip.file('[Content_Types].xml', contentTypesXml);
    zip.folder('_rels').file('.rels', relsXml);
    const word = zip.folder('word');
    word.file('document.xml', documentXml);
    word.file('styles.xml', stylesXml);
    word.folder('_rels').file('document.xml.rels', docRelsXml);

    return zip.generateAsync({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
  }

  function yuanbaoToMarkdown(data) {
    const title = data?.sessionTitle || data?.title || 'Yuanbao Chat';
    const out = [];
    out.push(`# ${title}`);
    out.push('');
    out.push(`> Exported at: ${new Date().toLocaleString()}`);
    out.push('');

    const convs = Array.isArray(data?.convs) ? [...data.convs] : [];
    convs.sort((a, b) => (a?.index || 0) - (b?.index || 0));

    for (const turn of convs) {
      const speaker = String(turn?.speaker || '').toLowerCase();
      const role = speaker === 'ai' ? 'Assistant' : speaker === 'user' || speaker === 'human' ? 'User' : speaker || 'Unknown';
      const idx = turn?.index != null ? ` (Turn ${turn.index})` : '';
      const ts = Utils.formatTimestamp(turn?.createTime);

      out.push(`## ${role}${idx}`);
      if (ts) out.push(`*${ts}*`);
      out.push('');

      const blocks = [];
      const speeches = Array.isArray(turn?.speechesV2) ? turn.speechesV2 : [];
      for (const speech of speeches) {
        const content = Array.isArray(speech?.content) ? speech.content : [];
        for (const block of content) {
          if (block?.type === 'text') blocks.push(Utils.adjustHeaderLevels(block?.msg || '', 1));
          else if (block?.type === 'think') {
            const t = block?.title ? `> [Think] ${block.title}` : `> [Think]`;
            const body = String(block?.content || '').replace(/\n/g, '\n> ');
            blocks.push(`${t}\n> ${body}`);
          } else if (block?.msg) blocks.push(String(block.msg));
          else blocks.push('`[Unsupported block]`');
        }
      }

      const body = blocks.join('\n\n').trim();
      out.push(body || '_No content_');
      out.push('');
      out.push('---');
      out.push('');
    }

    return out.join('\n').trim() + '\n';
  }

  function getFilename(scope, format, title) {
    const safeTitle = Utils.sanitizeFilename(title || 'Yuanbao');
    const prefix = scope === 'all' ? 'ALL_' : 'CURRENT_';
    return `${prefix}Yuanbao_${safeTitle}_${Utils.nowStamp()}.${format}`;
  }

  async function fetchJson(url, options = {}) {
    const res = await fetch(url, {
      credentials: 'include',
      ...options,
      headers: { Accept: 'application/json, text/plain, */*', ...(options.headers || {}) },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  function pickArray(obj, candidates) {
    for (const key of candidates) {
      const val = obj?.[key];
      if (Array.isArray(val)) return val;
    }
    return [];
  }

  function getConvId(item) {
    return (
      item?.conversationId ||
      item?.conversation_id ||
      item?.convId ||
      item?.conversationUuid ||
      item?.sessionId ||
      item?.chatId ||
      item?.id ||
      ''
    );
  }

  function getConvTitle(item) {
    return item?.title || item?.sessionTitle || item?.name || item?.conversationTitle || item?.summary || 'Yuanbao Chat';
  }

  function setBusy(v) {
    state.ui.busy = !!v;
    const panel = document.getElementById('cet-panel');
    if (panel) panel.classList.toggle('is-busy', state.ui.busy);
    updateUiState();
  }

  function setProgress(show, text = '', percent = 0) {
    state.ui.progress = { show, text, percent: Math.max(0, Math.min(100, percent || 0)) };
    const box = document.getElementById('cet-progress');
    const label = document.getElementById('cet-progress-text');
    const bar = document.getElementById('cet-progress-bar');
    if (!box || !label || !bar) return;
    box.style.display = show ? 'block' : 'none';
    label.textContent = text || '';
    bar.style.width = `${state.ui.progress.percent}%`;
  }

  function showToast(text) {
    const el = document.getElementById('cet-toast');
    if (!el) return;
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => el.classList.remove('show'), 1500);
  }

  function updateUiState() {
    const count = state.captured.size;
    const status = document.getElementById('cet-status');
    if (status) {
      status.textContent = state.current ? `已就绪 · 已缓存 ${count} 个会话` : `等待对话数据 · 已缓存 ${count} 个会话`;
    }

    const badge = document.getElementById('cet-fab-badge');
    if (badge) badge.textContent = String(count);

    const hasCurrent = !!state.current;
    const disable = (id, cond) => {
      const el = document.getElementById(id);
      if (el) el.disabled = cond || state.ui.busy;
    };
    disable('cet-current-save-md', !hasCurrent);
    disable('cet-current-save-json', !hasCurrent);
    disable('cet-current-save-docx', !hasCurrent);
    disable('cet-current-copy-md', !hasCurrent);
    disable('cet-current-copy-json', !hasCurrent);
    disable('cet-all-md', false);
    disable('cet-all-json', false);
    disable('cet-all-docx', false);
  }

  function collectConversationMetasFromJson(node, out, seen) {
    if (!node || typeof node !== 'object') return;

    if (Array.isArray(node)) {
      for (const x of node) collectConversationMetasFromJson(x, out, seen);
      return;
    }

    const maybeId = String(getConvId(node) || '').trim();
    if (maybeId && !seen.has(maybeId)) {
      seen.add(maybeId);
      out.push({ id: maybeId, title: getConvTitle(node) });
    }

    for (const v of Object.values(node)) {
      if (v && typeof v === 'object') collectConversationMetasFromJson(v, out, seen);
    }
  }

  function collectConversationMetasFromDom(out, seen) {
    const nodes = document.querySelectorAll('a[href*="/chat/"]');
    for (const a of nodes) {
      const href = a.getAttribute('href') || '';
      const m = href.match(/\/chat\/([^/?#]+)/);
      if (!m) continue;
      const id = decodeURIComponent(m[1]);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      const text = (a.textContent || '').trim();
      out.push({ id, title: text || 'Yuanbao Chat' });
    }
  }

  async function fetchAllConversationMetas() {
    const all = [];
    const seen = new Set();

    const baseCandidates = [
      '/api/user/agent/conversation/v1/list',
      '/api/user/agent/conversation/v1/page',
      '/api/user/agent/conversation/v1/list_page',
    ];

    for (const base of baseCandidates) {
      let hit = false;
      for (let page = 1; page <= 120; page += 1) {
        const getCandidates = [
          `${base}?page=${page}&pageSize=50`,
          `${base}?pageNum=${page}&pageSize=50`,
          `${base}?offset=${(page - 1) * 50}&limit=50`,
          `${base}?cursor=${encodeURIComponent(String(page))}&size=50`,
        ];

        const postCandidates = [
          { page, pageSize: 50 },
          { pageNum: page, pageSize: 50 },
          { offset: (page - 1) * 50, limit: 50 },
          { cursor: String(page), size: 50 },
        ];

        let before = all.length;

        for (const u of getCandidates) {
          try {
            const json = await fetchJson(u);
            collectConversationMetasFromJson(json, all, seen);
            hit = true;
            if (all.length > before) break;
          } catch {
            // next
          }
        }

        if (all.length === before) {
          for (const body of postCandidates) {
            try {
              const json = await fetchJson(base, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
              });
              collectConversationMetasFromJson(json, all, seen);
              hit = true;
              if (all.length > before) break;
            } catch {
              // next
            }
          }
        }

        if (all.length === before && page > 1) break;
        if (all.length === before && page === 1 && !hit) break;
      }

      if (all.length > 0) break;
    }

    // list intercept cache
    state.listHints.forEach((title, id) => {
      if (seen.has(id)) return;
      seen.add(id);
      all.push({ id, title });
    });

    // current captured cache
    state.captured.forEach((rec) => {
      if (seen.has(rec.id)) return;
      seen.add(rec.id);
      all.push({ id: rec.id, title: rec.title });
    });

    // DOM fallback for /chat page links
    collectConversationMetasFromDom(all, seen);

    return all;
  }

  async function fetchConversationDetailById(id) {
    const bodyCandidates = [
      { conversationId: id },
      { conversation_id: id },
      { sessionId: id },
      { chatId: id },
      { id },
    ];
    for (const body of bodyCandidates) {
      try {
        const json = await fetchJson('/api/user/agent/conversation/v1/detail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (Array.isArray(json?.convs)) return json;
        if (Array.isArray(json?.data?.convs)) return json.data;
        if (Array.isArray(json?.result?.convs)) return json.result;
      } catch {
        // try next shape
      }
    }

    const getCandidates = [
      `/api/user/agent/conversation/v1/detail?conversationId=${encodeURIComponent(id)}`,
      `/api/user/agent/conversation/v1/detail?conversation_id=${encodeURIComponent(id)}`,
      `/api/user/agent/conversation/v1/detail?sessionId=${encodeURIComponent(id)}`,
      `/api/user/agent/conversation/v1/detail?chatId=${encodeURIComponent(id)}`,
      `/api/user/agent/conversation/v1/detail?id=${encodeURIComponent(id)}`,
      `/api/user/agent/conversation/v1/detail/${encodeURIComponent(id)}`,
    ];

    for (const u of getCandidates) {
      try {
        const json = await fetchJson(u);
        if (Array.isArray(json?.convs)) return json;
        if (Array.isArray(json?.data?.convs)) return json.data;
        if (Array.isArray(json?.result?.convs)) return json.result;
      } catch {
        // next
      }
    }

    throw new Error(`无法获取会话详情: ${id}`);
  }

  async function ensureAllConversationsLoaded(onProgress) {
    const metas = await fetchAllConversationMetas();
    if (!metas.length) throw new Error('未发现任何会话（请先在左侧会话列表滚动加载更多）');

    let loaded = 0;
    const failed = [];

    for (let i = 0; i < metas.length; i += 1) {
      const meta = metas[i];
      const percent = Math.round(((i + 1) / metas.length) * 100);
      onProgress?.(`拉取会话 ${i + 1}/${metas.length}`, percent);

      if (state.captured.has(meta.id)) {
        loaded += 1;
        continue;
      }

      try {
        const detail = await fetchConversationDetailById(meta.id);
        const title = detail?.sessionTitle || detail?.title || meta.title || 'Yuanbao Chat';
        const md = yuanbaoToMarkdown(detail);
        state.captured.set(meta.id, {
          id: meta.id,
          title,
          md,
          jsonText: JSON.stringify(detail),
          capturedAt: new Date().toISOString(),
        });
        loaded += 1;
      } catch {
        failed.push(meta.id);
      }
      updateUiState();
    }

    if (!loaded) throw new Error('会话读取失败（可能需要重新登录）');
    return { total: metas.length, loaded, failed };
  }

  function buildAllConversationsDocMarkdown(list) {
    return list
      .map((c, idx) => {
        const cleaned = String(c.md || '')
          .replace(/^#\s+.*?\n+/m, '')
          .trim();
        return `# ${idx + 1}. ${c.title}\n\n${cleaned}`;
      })
      .join('\n\n---\n\n');
  }

  async function exportAll(format) {
    try {
      setBusy(true);

      // 如果缓存为空，先拉取
      if (state.captured.size === 0) {
        setProgress(true, '正在读取全部会话...', 2);
        await ensureAllConversationsLoaded((text, percent) => setProgress(true, text, percent));
      }

      const allList = Array.from(state.captured.values());
      const stats = { total: allList.length, loaded: allList.length, failed: [] };

      // ZIP 打包导出
      await exportAsZip(allList, format, stats);

      setProgress(true, '导出完成', 100);
      showToast(`全部对话 ${format.toUpperCase()} ZIP 已导出（${allList.length} 个会话）`);
      setTimeout(() => setProgress(false), 600);
    } catch (err) {
      setProgress(false);
      alert(`批量导出失败：${err?.message || err}`);
    } finally {
      setBusy(false);
    }
  }

  async function exportAsZip(allList, format, stats) {
    if (typeof JSZip === 'undefined') {
      throw new Error('JSZip 库未加载');
    }
    
    setProgress(true, format === 'docx' ? '正在生成 DOCX 并打包...' : '正在打包 ZIP...', 85);
    const zip = new JSZip();
    const folder = zip.folder('yuanbao-conversations');
    
    for (let i = 0; i < allList.length; i++) {
      const c = allList[i];
      const safeTitle = Utils.sanitizeFilename(c.title || `conversation-${i + 1}`);
      const filename = `${String(i + 1).padStart(3, '0')}_${safeTitle}`;
      
      // 更新进度
      const progressPercent = 85 + Math.round(((i + 1) / allList.length) * 10);
      setProgress(true, `正在处理 ${i + 1}/${allList.length}...`, progressPercent);
      
      if (format === 'md') {
        folder.file(`${filename}.md`, c.md);
      } else if (format === 'json') {
        folder.file(`${filename}.json`, c.jsonText);
      } else if (format === 'docx') {
        // 生成 DOCX blob
        const docText = `# ${c.title}\n\n> 导出时间: ${new Date().toLocaleString()}\n\n${String(c.md || '').replace(/^#\s+.*?\n+/m, '').trim()}`;
        const docxBlob = await buildDocxBlob(docText);
        const docxArrayBuffer = await docxBlob.arrayBuffer();
        folder.file(`${filename}.docx`, docxArrayBuffer);
      }
    }
    
    // 添加索引文件
    if (format === 'docx') {
      const indexContent = buildIndexDocx(allList, stats);
      const indexBlob = await buildDocxBlob(indexContent);
      const indexArrayBuffer = await indexBlob.arrayBuffer();
      folder.file('_index.docx', indexArrayBuffer);
    } else if (format === 'json') {
      const indexContent = JSON.stringify({
        exportedAt: new Date().toISOString(),
        total: allList.length,
        loaded: stats?.loaded,
        failed: stats?.failed?.length || 0,
        conversations: allList.map((c, i) => ({
          index: i + 1,
          id: c.id,
          title: c.title,
          filename: `${String(i + 1).padStart(3, '0')}_${Utils.sanitizeFilename(c.title || `conversation-${i + 1}`)}.json`
        }))
      }, null, 2);
      folder.file('_index.json', indexContent);
    } else {
      const indexContent = buildIndexMarkdown(allList, stats);
      folder.file('_index.md', indexContent);
    }
    
    setProgress(true, '正在生成 ZIP...', 97);
    const zipBlob = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });
    Utils.download(zipBlob, 'application/zip', `ALL_Yuanbao_Conversations_${format.toUpperCase()}_${Utils.nowStamp()}.zip`);
  }

  function buildIndexMarkdown(allList, stats) {
    const out = [];
    out.push('# 元宝会话导出索引');
    out.push('');
    out.push(`> 导出时间: ${new Date().toLocaleString()}`);
    out.push(`> 会话总数: ${allList.length}`);
    if (stats && stats.failed && stats.failed.length > 0) {
      out.push(`> 成功: ${stats.loaded}, 失败: ${stats.failed.length}`);
    }
    out.push('');
    out.push('## 会话列表');
    out.push('');
    
    for (let i = 0; i < allList.length; i++) {
      const c = allList[i];
      const safeTitle = Utils.sanitizeFilename(c.title || `conversation-${i + 1}`);
      out.push(`${i + 1}. [${c.title || '未命名会话'}](./${String(i + 1).padStart(3, '0')}_${safeTitle}.md)`);
    }
    
    out.push('');
    out.push('---');
    out.push('*由 Chat Export Toolkit 导出*');
    return out.join('\n');
  }

  function buildIndexDocx(allList, stats) {
    const out = [];
    out.push('# 元宝会话导出索引');
    out.push('');
    out.push(`导出时间: ${new Date().toLocaleString()}`);
    out.push(`会话总数: ${allList.length}`);
    if (stats && stats.failed && stats.failed.length > 0) {
      out.push(`成功: ${stats.loaded}, 失败: ${stats.failed.length}`);
    }
    out.push('');
    out.push('## 会话列表');
    out.push('');
    
    for (let i = 0; i < allList.length; i++) {
      const c = allList[i];
      out.push(`${i + 1}. ${c.title || '未命名会话'}`);
    }
    
    out.push('');
    out.push('---');
    out.push('由 Chat Export Toolkit 导出');
    return out.join('\n');
  }

  function ensureUi() {
    if (document.getElementById('cet-fab')) return;

    const style = document.createElement('style');
    style.textContent = `
      :root {
        --cet-green-primary: #01B259;
        --cet-green-hover: #4BC979;
        --cet-green-bg: #F5FBF5;
        --cet-black: #191919;
        --cet-gray-border: #F3F3F3;
        --cet-gray-text: #BABABA;
        --cet-white: #FFFFFF;
        --cet-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
        --cet-shadow-hover: 0 8px 32px rgba(0, 0, 0, 0.12);
        --cet-radius: 12px;
      }

      /* 浮动按钮 - 更加精致的品牌感 */
      #cet-fab {
        position: fixed; right: 24px; bottom: 24px; z-index: 999999;
        height: 44px; min-width: 90px; border-radius: 22px; border: 1px solid var(--cet-gray-border);
        background: var(--cet-white);
        color: var(--cet-black); font-size: 14px; font-weight: 600; cursor: pointer; padding: 0 18px;
        box-shadow: var(--cet-shadow);
        display: flex; align-items: center; justify-content: center;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;
      }
      #cet-fab:hover {
        box-shadow: var(--cet-shadow-hover);
        transform: translateY(-2px);
        border-color: var(--cet-green-hover);
      }
      #cet-fab-badge {
        display: inline-block; margin-left: 8px; min-width: 18px; height: 18px; line-height: 18px; border-radius: 9px;
        font-size: 11px; text-align: center; background: var(--cet-green-primary); color: #fff; padding: 0 5px;
        font-weight: 700;
        box-shadow: 0 2px 4px rgba(1, 178, 89, 0.2);
      }

      /* 主面板 - 高级卡片感 */
      #cet-panel {
        position: fixed; right: 24px; bottom: 84px; z-index: 1000000;
        width: 300px; border-radius: 16px; color: var(--cet-black);
        background: var(--cet-white);
        border: 1px solid var(--cet-gray-border); box-shadow: var(--cet-shadow-hover);
        padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;
        display: none;
        transform-origin: right bottom;
        animation: cet-pop-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      @keyframes cet-pop-in {
        from { transform: scale(0.9); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      #cet-panel.open { display: block; }
      #cet-title { font-weight: 700; font-size: 16px; margin-bottom: 6px; color: var(--cet-black); letter-spacing: -0.2px; }
      #cet-status { font-size: 12px; color: var(--cet-gray-text); margin-bottom: 16px; font-weight: 400; }

      /* 进度条 - 动态交互感 */
      #cet-progress { display: none; margin-bottom: 16px; background: var(--cet-green-bg); padding: 12px; border-radius: 10px; }
      #cet-progress-text { font-size: 12px; color: var(--cet-green-primary); margin-bottom: 8px; font-weight: 600; }
      #cet-progress-track { width: 100%; height: 6px; border-radius: 3px; background: #E8F5EE; overflow: hidden; }
      #cet-progress-bar { width: 0%; height: 100%; background: var(--cet-green-primary); transition: width 0.3s ease; }

      /* 分组 */
      .cet-group { margin-bottom: 20px; }
      .cet-group:last-child { margin-bottom: 0; }
      .cet-label { font-size: 12px; color: var(--cet-gray-text); margin-bottom: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; }

      /* 分段控制器 - 软胶囊风格 */
      .cet-segmented {
        display: flex; background: var(--cet-gray-border); border-radius: 10px; padding: 4px; margin-bottom: 12px;
      }
      .cet-segmented-btn {
        flex: 1; border: none; border-radius: 7px; padding: 8px; background: transparent;
        color: #777; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.25s ease;
        font-family: inherit;
      }
      .cet-segmented-btn:hover:not(.active):not(:disabled) { color: var(--cet-black); }
      .cet-segmented-btn.active { background: var(--cet-white); color: var(--cet-green-primary); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04); }
      .cet-segmented-btn:disabled { opacity: 0.4; cursor: not-allowed; }

      /* 操作按钮 - 品牌调色整合 */
      .cet-actions { display: flex; gap: 10px; }
      .cet-action-btn {
        flex: 1; border: 1px solid var(--cet-gray-border); border-radius: 10px;
        padding: 10px 12px; background: var(--cet-white); color: var(--cet-black); cursor: pointer;
        font-size: 13px; font-weight: 600; transition: all 0.2s ease;
        font-family: inherit;
        display: flex; align-items: center; justify-content: center;
      }
      .cet-action-btn:hover:not(:disabled) { 
        background: var(--cet-green-bg); 
        border-color: var(--cet-green-hover); 
        color: var(--cet-green-primary);
        transform: translateY(-1px);
      }
      .cet-action-btn:active:not(:disabled) { transform: translateY(0); }
      .cet-action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      .cet-action-btn.primary {
        background: var(--cet-green-primary);
        border-color: var(--cet-green-primary);
        color: var(--cet-white);
        box-shadow: 0 4px 12px rgba(1, 178, 89, 0.2);
      }
      .cet-action-btn.primary:hover:not(:disabled) {
        background: var(--cet-green-hover);
        border-color: var(--cet-green-hover);
        color: var(--cet-white);
        box-shadow: 0 6px 16px rgba(1, 178, 89, 0.3);
      }
      #cet-panel.is-busy .cet-action-btn { opacity: 0.5; pointer-events: none; }

      /* Toast 提示 - 磨砂玻璃质感 */
      #cet-toast {
        position: fixed; left: 50%; bottom: 100px; z-index: 1000001; color: var(--cet-white);
        background: rgba(25, 25, 25, 0.85);
        border-radius: 20px;
        padding: 8px 16px; font-size: 13px; font-weight: 500;
        opacity: 0; transform: translate(-50%, 12px); transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1); pointer-events: none;
        backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        max-width: 80%; text-align: center;
      }
      #cet-toast.show { opacity: 1; transform: translate(-50%, 0); }
    `.trim();
    document.documentElement.appendChild(style);

    const fab = document.createElement('button');
    fab.id = 'cet-fab';
    fab.innerHTML = `导出 <span id="cet-fab-badge">0</span>`;
    document.body.appendChild(fab);

    const panel = document.createElement('div');
    panel.id = 'cet-panel';
    panel.innerHTML = `
      <div id="cet-title">Chat Export Toolkit</div>
      <div id="cet-status">等待对话数据 · 已缓存 0 个会话</div>
      <div id="cet-progress">
        <div id="cet-progress-text">准备中...</div>
        <div id="cet-progress-track"><div id="cet-progress-bar"></div></div>
      </div>
      
      <!-- 当前会话 -->
      <div class="cet-group">
        <div class="cet-label">当前会话</div>
        <div class="cet-segmented" id="cet-current-format">
          <button class="cet-segmented-btn active" data-format="md">Markdown</button>
          <button class="cet-segmented-btn" data-format="json">JSON</button>
          <button class="cet-segmented-btn" data-format="docx">DOCX</button>
        </div>
        <div class="cet-actions">
          <button class="cet-action-btn" id="cet-current-copy">复制</button>
          <button class="cet-action-btn primary" id="cet-current-save">保存</button>
        </div>
      </div>
      
      <!-- 全部会话 -->
      <div class="cet-group">
        <div class="cet-label">全部会话 · 导出为 ZIP</div>
        <div class="cet-segmented" id="cet-all-format">
          <button class="cet-segmented-btn active" data-format="md">Markdown</button>
          <button class="cet-segmented-btn" data-format="json">JSON</button>
          <button class="cet-segmented-btn" data-format="docx">DOCX</button>
        </div>
        <div class="cet-actions">
          <button class="cet-action-btn export" id="cet-all-export" style="width:100%;">导出 ZIP</button>
        </div>
      </div>
    `.trim();
    document.body.appendChild(panel);

    const toast = document.createElement('div');
    toast.id = 'cet-toast';
    document.body.appendChild(toast);

    fab.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      state.ui.panelOpen = !state.ui.panelOpen;
      panel.classList.toggle('open', state.ui.panelOpen);
    });

    document.addEventListener('click', (e) => {
      if (!state.ui.panelOpen) return;
      const t = e.target;
      if (panel.contains(t) || fab.contains(t)) return;
      state.ui.panelOpen = false;
      panel.classList.remove('open');
    });

    // 状态管理
    const uiState = {
      currentFormat: 'md',
      allFormat: 'md'
    };

    // 分段控制器切换
    const setupSegmented = (containerId, stateKey) => {
      const container = document.getElementById(containerId);
      if (!container) return;
      const buttons = container.querySelectorAll('.cet-segmented-btn');
      buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          buttons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          uiState[stateKey] = btn.dataset.format;
        });
      });
    };

    setupSegmented('cet-current-format', 'currentFormat');
    setupSegmented('cet-all-format', 'allFormat');

    const on = (id, fn) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', (e) => (e.preventDefault(), e.stopPropagation(), fn()));
    };

    // 当前会话 - 复制
    on('cet-current-copy', async () => {
      if (!state.current) return;
      const format = uiState.currentFormat;
      try {
        if (format === 'md') {
          await Utils.copyText(state.current.md);
          showToast('当前会话 MD 已复制');
        } else if (format === 'json') {
          await Utils.copyText(state.current.jsonText);
          showToast('当前会话 JSON 已复制');
        } else if (format === 'docx') {
          showToast('DOCX 不支持复制');
        }
      } catch (err) {
        alert(`复制失败: ${err?.message || err}`);
      }
    });

    // 当前会话 - 保存
    on('cet-current-save', async () => {
      if (!state.current) return;
      const format = uiState.currentFormat;
      
      if (format === 'md') {
        Utils.download(state.current.md, 'text/markdown', getFilename('current', 'md', state.current.title));
        showToast('当前会话 MD 已保存');
      } else if (format === 'json') {
        Utils.download(state.current.jsonText, 'application/json', getFilename('current', 'json', state.current.title));
        showToast('当前会话 JSON 已保存');
      } else if (format === 'docx') {
        try {
          setBusy(true);
          setProgress(true, '正在生成 DOCX...', 95);
          const docText = `# ${state.current.title}\n\n> 导出时间: ${new Date().toLocaleString()}\n\n${String(state.current.md || '').replace(/^#\s+.*?\n+/m, '').trim()}`;
          const blob = await buildDocxBlob(docText);
          Utils.download(blob, blob.type, getFilename('current', 'docx', state.current.title));
          setProgress(true, '保存完成', 100);
          showToast('当前会话 DOCX 已保存');
          setTimeout(() => setProgress(false), 500);
        } catch (err) {
          setProgress(false);
          alert(`DOCX 保存失败: ${err?.message || err}`);
        } finally {
          setBusy(false);
        }
      }
    });

    // 全部会话 - ZIP 导出
    on('cet-all-export', () => exportAll(uiState.allFormat));

    updateUiState();
  }

  function onReady(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  }

  function handleConversationListResponse(text) {
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      return;
    }

    const tmp = [];
    const seen = new Set();
    collectConversationMetasFromJson(json, tmp, seen);
    for (const row of tmp) {
      state.listHints.set(row.id, row.title);
    }
  }

  function handleYuanbaoResponse(text, url) {
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      return;
    }

    if (!json || !Array.isArray(json.convs)) return;

    const idFromUrl = Utils.extractConversationId(url);
    const title = json.sessionTitle || json.title || 'Yuanbao Chat';
    const id = idFromUrl || `${Utils.sanitizeFilename(title)}_${Utils.nowStamp()}`;

    state.listHints.set(id, title);
    state.current = {
      id,
      title,
      md: yuanbaoToMarkdown(json),
      jsonText: text,
      capturedAt: new Date().toISOString(),
    };
    state.captured.set(id, state.current);
    updateUiState();
  }

  function installInterceptors() {
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (...args) {
      this.addEventListener(
        'load',
        () => {
          try {
            const url = this.responseURL || '';
            if (YUANBAO_DETAIL_RE.test(url)) {
              handleYuanbaoResponse(this.responseText, url);
              return;
            }
            if (YUANBAO_LIST_RE.test(url)) handleConversationListResponse(this.responseText);
          } catch {
            // ignore
          }
        },
        { once: true }
      );
      return originalOpen.apply(this, args);
    };

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const res = await originalFetch(...args);
      try {
        const url = args[0] instanceof Request ? args[0].url : String(args[0] || '');
        if (YUANBAO_DETAIL_RE.test(url)) {
          res
            .clone()
            .text()
            .then((t) => handleYuanbaoResponse(t, url))
            .catch(() => {});
        } else if (YUANBAO_LIST_RE.test(url)) {
          res
            .clone()
            .text()
            .then((t) => handleConversationListResponse(t))
            .catch(() => {});
        }
      } catch {
        // ignore
      }
      return res;
    };
  }

  let autoFetchStarted = false;

  async function startAutoFetch() {
    if (autoFetchStarted) return;
    autoFetchStarted = true;

    // 延迟 3 秒启动，等待页面初始化
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 静默拉取所有对话并缓存
    try {
      const metas = await fetchAllConversationMetas();
      if (!metas.length) return;

      let loaded = 0;
      for (let i = 0; i < metas.length; i += 1) {
        const meta = metas[i];
        if (state.captured.has(meta.id)) {
          loaded += 1;
          continue;
        }

        try {
          const detail = await fetchConversationDetailById(meta.id);
          const title = detail?.sessionTitle || detail?.title || meta.title || 'Yuanbao Chat';
          const md = yuanbaoToMarkdown(detail);
          state.captured.set(meta.id, {
            id: meta.id,
            title,
            md,
            jsonText: JSON.stringify(detail),
            capturedAt: new Date().toISOString(),
          });
          loaded += 1;
        } catch {
          // 静默失败
        }
        updateUiState();

        // 每 5 个会话暂停 100ms，避免请求过快
        if ((i + 1) % 5 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } catch {
      // 静默失败
    }
  }

  function init() {
    installInterceptors();
    onReady(() => {
      ensureUi();
      // 页面加载后自动开始后台拉取
      startAutoFetch();
    });
  }

  init();
})();
