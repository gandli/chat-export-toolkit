// ==UserScript==
// @name         腾讯元宝导出增强版（批量导出全部会话）
// @namespace    https://github.com/gandli/chat-export-toolkit
// @version      1.1.1
// @description  支持单会话导出 + 批量导出左侧全部会话（LLM Friendly Markdown/JSON）
// @author       gandli
// @match        https://yuanbao.tencent.com/*
// @grant        GM_setClipboard
// @license      MIT
// ==/UserScript==

(() => {
  'use strict';

  const CFG = {
    maxChunkChars: 4000,
    includeThinking: true,
    includeReferences: true,
    dedupeStrict: true,
    buttonRight: 20,
    buttonBottom: 20,
    autoScrollRounds: 40,
    autoScrollDelayMs: 220,
    sidebarLoadRounds: 30,
    sidebarLoadDelayMs: 180,
    perChatWaitMs: 1400,
    betweenChatMs: 500,
    maxChats: 500,
  };

  const SEL = {
    title: ['header h1', 'header h2', '[class*="title"]', 'h1', 'h2'],
    scrollContainers: ['[class*="message-list"]', '[class*="chat-content"]', '[class*="conversation-content"]', 'main', 'body'],
    msgBlocks: ['[data-role="user"]', '[data-role="assistant"]', '[class*="message"]', '[class*="bubble"]', '[class*="item"]'],
    codeBlocks: ['pre code', 'pre'],
    links: ['a[href]'],
    sidebar: ['[class*="conversation-list"]', '[class*="session-list"]', '[class*="chat-list"]', 'aside'],
    sidebarItems: [
      '[class*="conversation-list"] [class*="item"]',
      '[class*="session-list"] [class*="item"]',
      '[class*="chat-list"] [class*="item"]',
      'aside [class*="item"]',
      'aside li',
      'aside a'
    ]
  };

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  function safeName(input = '') {
    return (input || 'untitled').replace(/[\\/:*?"<>|]+/g, '_').replace(/\s+/g, ' ').trim().slice(0, 80) || 'untitled';
  }

  function nowStamp() {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
  }

  function isoWithTZ() {
    const d = new Date();
    const tz = -d.getTimezoneOffset();
    const sign = tz >= 0 ? '+' : '-';
    const h = String(Math.floor(Math.abs(tz) / 60)).padStart(2, '0');
    const m = String(Math.abs(tz) % 60).padStart(2, '0');
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}${sign}${h}:${m}`;
  }

  function firstExisting(selectors, root = document) {
    for (const s of selectors) {
      const el = root.querySelector(s);
      if (el) return el;
    }
    return null;
  }

  function allExisting(selectors, root = document) {
    for (const s of selectors) {
      const list = Array.from(root.querySelectorAll(s));
      if (list.length) return list;
    }
    return [];
  }

  function text(el) { return (el?.innerText || el?.textContent || '').replace(/\r/g, '').trim(); }
  function normalizeText(s = '') { return s.replace(/\u00A0/g, ' ').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim(); }

  const NOISE_LINE_RE = [/^复制$/, /^重试$/, /^展开思考$/, /^收起思考$/, /^赞$/, /^踩$/, /^点赞$/, /^点踩$/, /^分享$/, /^继续$/, /^重新生成$/, /^已复制$/];

  function denoise(raw = '') {
    return normalizeText(normalizeText(raw).split('\n').map(x => x.trim()).filter(Boolean).filter(line => !NOISE_LINE_RE.some(re => re.test(line))).join('\n'));
  }

  function hashLite(str = '') {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    return String(h);
  }

  function chunkText(s, max = CFG.maxChunkChars) {
    if (!s || s.length <= max) return [s];
    const out = [];
    for (let i = 0; i < s.length; i += max) out.push(s.slice(i, i + max));
    return out;
  }

  function pickTitle() {
    const t = firstExisting(SEL.title);
    return normalizeText(text(t)) || 'untitled';
  }

  function detectRole(el, t) {
    const cls = `${el.className || ''}`.toLowerCase();
    const attr = (el.getAttribute('data-role') || '').toLowerCase();
    if (attr.includes('user') || cls.includes('user') || cls.includes('question')) return 'user';
    if (attr.includes('assistant') || cls.includes('assistant') || cls.includes('ai') || cls.includes('answer')) return 'assistant';
    if (/^(复制|重试|展开思考|收起思考|分享)$/.test((t || '').trim())) return 'noise';
    return 'assistant';
  }

  function extractCodeBlocks(el) {
    const arr = [];
    const blocks = allExisting(SEL.codeBlocks, el);
    for (const b of blocks) {
      const code = normalizeText(text(b));
      if (!code) continue;
      const m = (b.className || '').match(/language-([a-zA-Z0-9_+-]+)/);
      arr.push({ lang: m?.[1] || '', code });
    }
    return arr;
  }

  function extractLinks(el) {
    if (!CFG.includeReferences) return [];
    const arr = [];
    for (const a of allExisting(SEL.links, el)) {
      const href = a.getAttribute('href') || '';
      if (!href || href.startsWith('javascript:')) continue;
      arr.push({ label: normalizeText(text(a)) || href, href });
    }
    const seen = new Set();
    return arr.filter(x => (seen.has(`${x.label}|${x.href}`) ? false : (seen.add(`${x.label}|${x.href}`), true)));
  }

  function extractMessages() {
    const blocks = allExisting(SEL.msgBlocks);
    const msgs = [];
    for (const el of blocks) {
      const raw = text(el);
      if (!raw) continue;
      const role = detectRole(el, raw);
      if (role === 'noise') continue;

      const codes = extractCodeBlocks(el);
      const links = extractLinks(el);
      const body = denoise(raw);

      let thinking = '';
      if (CFG.includeThinking) {
        const thinkNodes = allExisting(['[class*="think"]', '[class*="reason"]', '[class*="thought"]'], el);
        if (thinkNodes.length) thinking = denoise(thinkNodes.map(n => text(n)).join('\n'));
      }

      if (!body && !codes.length && !thinking) continue;

      msgs.push({
        role, body, thinking, codes, links,
        hash: hashLite(`${role}|${body}|${thinking}|${JSON.stringify(codes)}|${JSON.stringify(links)}`)
      });
    }

    const seen = new Set();
    return msgs.filter(m => {
      const k = CFG.dedupeStrict ? m.hash : `${m.role}|${m.body}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  function pairTurns(messages) {
    const turns = [];
    let cur = { user: '', assistant: '', thinking: '', codes: [], links: [] };

    const flush = () => {
      const u = normalizeText(cur.user), a = normalizeText(cur.assistant), th = normalizeText(cur.thinking);
      if (!u && !a && !th && !cur.codes.length && !cur.links.length) return;
      turns.push({ user: u, assistant: a, thinking: th, codes: [...cur.codes], links: [...cur.links] });
      cur = { user: '', assistant: '', thinking: '', codes: [], links: [] };
    };

    for (const m of messages) {
      if (m.role === 'user') {
        if (cur.user || cur.assistant) flush();
        cur.user = m.body;
      } else {
        cur.assistant = cur.assistant ? `${cur.assistant}\n\n${m.body}` : m.body;
      }
      if (m.thinking) cur.thinking = cur.thinking ? `${cur.thinking}\n\n${m.thinking}` : m.thinking;
      if (m.codes?.length) cur.codes.push(...m.codes);
      if (m.links?.length) cur.links.push(...m.links);
    }
    flush();
    return turns.filter(t => t.user || t.assistant);
  }

  function buildMD(title, turns) {
    let out = '';
    out += `---\nsource: tencent-yuanbao\nexported_at: ${isoWithTZ()}\nconversation_title: ${title.replace(/\n/g, ' ')}\nlanguage: zh-CN\nformat_version: 1\nturn_count: ${turns.length}\n---\n\n`;
    out += `# 会话：${title}\n\n`;
    turns.forEach((t, i) => {
      out += `## Turn ${i + 1}\n`;
      if (t.user) {
        out += `### User\n`;
        chunkText(t.user).forEach((p, idx) => out += (idx ? `#### Part ${idx + 1}\n` : '') + `${p}\n\n`);
      }
      if (t.assistant) {
        out += `### Assistant\n`;
        chunkText(t.assistant).forEach((p, idx) => out += (idx ? `#### Part ${idx + 1}\n` : '') + `${p}\n\n`);
      }
      if (CFG.includeThinking && t.thinking) {
        out += `### Assistant_Thinking\n`;
        chunkText(t.thinking).forEach((p, idx) => out += (idx ? `#### Part ${idx + 1}\n` : '') + `${p}\n\n`);
      }
      if (t.codes?.length) {
        out += `### Code_Blocks\n`;
        t.codes.forEach((c, k) => {
          out += `#### Code ${k + 1}\n\`\`\`${c.lang || ''}\n${c.code}\n\`\`\`\n\n`;
        });
      }
      if (CFG.includeReferences && t.links?.length) {
        out += `### References\n`;
        t.links.forEach(l => out += `- [${(l.label || l.href).replace(/[[\]]/g, '')}](${l.href})\n`);
        out += `\n`;
      }
    });
    return out.trim() + '\n';
  }

  function buildJSON(title, turns, rawMessages) {
    return {
      source: 'tencent-yuanbao',
      exported_at: isoWithTZ(),
      conversation_title: title,
      language: 'zh-CN',
      format_version: 1,
      turn_count: turns.length,
      turns,
      raw_messages_count: rawMessages.length
    };
  }

  function downloadText(name, content, mime) {
    const blob = new Blob([content], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  }

  function toast(msg) {
    const id = 'yb-export-toast';
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('div');
      el.id = id;
      Object.assign(el.style, {
        position: 'fixed', right: `${CFG.buttonRight}px`, bottom: `${CFG.buttonBottom + 150}px`,
        zIndex: 9999999, background: 'rgba(0,0,0,.78)', color: '#fff',
        padding: '8px 12px', borderRadius: '8px', fontSize: '13px', maxWidth: '360px'
      });
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 1800);
  }

  async function autoScrollTopCurrentChat() {
    const sc = firstExisting(SEL.scrollContainers);
    for (let i = 0; i < CFG.autoScrollRounds; i++) {
      if (sc && sc !== document.body) sc.scrollTop = 0;
      else window.scrollTo({ top: 0, behavior: 'instant' });
      await sleep(CFG.autoScrollDelayMs);
    }
  }

  async function exportCurrentChat(download = true) {
    await autoScrollTopCurrentChat();
    const title = pickTitle();
    const raw = extractMessages();
    const turns = pairTurns(raw);
    if (!turns.length) throw new Error('未提取到会话内容');

    const base = `${nowStamp()}-${safeName(title)}`;
    const md = buildMD(title, turns);
    const json = JSON.stringify(buildJSON(title, turns, raw), null, 2);

    if (download) {
      downloadText(`${base}.md`, md, 'text/markdown;charset=utf-8');
      downloadText(`${base}.json`, json, 'application/json;charset=utf-8');
    } else {
      if (typeof GM_setClipboard === 'function') GM_setClipboard(md, 'text');
      else if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(md);
      else throw new Error('剪贴板权限不可用');
    }

    return { title, turns: turns.length, base };
  }

  function getSidebar() { return firstExisting(SEL.sidebar); }

  function getSidebarItems() {
    const sidebar = getSidebar() || document;
    let items = allExisting(SEL.sidebarItems, sidebar);
    items = items.filter(el => {
      const r = el.getBoundingClientRect();
      const label = text(el);
      return r.width > 0 && r.height > 0 && label.length > 0;
    });
    return items;
  }

  async function expandAllSidebarItems() {
    const sidebar = getSidebar();
    if (!sidebar) return;

    for (let i = 0; i < CFG.sidebarLoadRounds; i++) {
      sidebar.scrollTop += 2000;
      await sleep(CFG.sidebarLoadDelayMs);
    }

    sidebar.scrollTop = 0;
    await sleep(200);
  }

  function keyOfSidebarItem(el) {
    const t = normalizeText(text(el));
    const id = el.getAttribute('data-id') || el.getAttribute('href') || '';
    return hashLite(`${t}|${id}`);
  }

  async function clickSidebarItemByKey(targetKey) {
    const items = getSidebarItems();
    for (const it of items) {
      if (keyOfSidebarItem(it) === targetKey) {
        it.scrollIntoView({ block: 'center' });
        await sleep(120);
        it.click();
        return true;
      }
    }
    return false;
  }

  async function batchExportAll() {
    toast('批量导出启动：加载左侧会话列表...');
    await expandAllSidebarItems();

    const snapshot = getSidebarItems().slice(0, CFG.maxChats).map(el => ({
      key: keyOfSidebarItem(el),
      title: normalizeText(text(el)).slice(0, 120) || 'untitled'
    }));

    const seen = new Set();
    const tasks = snapshot.filter(x => (seen.has(x.key) ? false : (seen.add(x.key), true)));
    if (!tasks.length) {
      toast('未识别到左侧会话列表');
      return;
    }

    toast(`检测到 ${tasks.length} 个会话，开始导出...`);

    const results = [];
    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];
      try {
        const ok = await clickSidebarItemByKey(t.key);
        if (!ok) throw new Error('会话项重定位失败');

        await sleep(CFG.perChatWaitMs);

        const ret = await exportCurrentChat(true);
        results.push({ index: i + 1, ok: true, title: ret.title, turns: ret.turns, file: ret.base });
        toast(`(${i + 1}/${tasks.length}) 已导出：${ret.title}`);
      } catch (e) {
        results.push({ index: i + 1, ok: false, title: t.title, error: e?.message || String(e) });
        toast(`(${i + 1}/${tasks.length}) 失败：${t.title}`);
      }
      await sleep(CFG.betweenChatMs);
    }

    const report = {
      source: 'tencent-yuanbao',
      exported_at: isoWithTZ(),
      total: tasks.length,
      success: results.filter(x => x.ok).length,
      failed: results.filter(x => !x.ok).length,
      results
    };
    downloadText(`${nowStamp()}-batch-export-report.json`, JSON.stringify(report, null, 2), 'application/json;charset=utf-8');

    toast(`批量完成：成功 ${report.success}，失败 ${report.failed}`);
    console.log('[Yuanbao Batch Export Report]', report);
  }

  function makeBtn(id, textLabel, bg, bottomOffset, onClick) {
    if (document.getElementById(id)) return;
    const btn = document.createElement('button');
    btn.id = id;
    btn.textContent = textLabel;
    Object.assign(btn.style, {
      position: 'fixed', right: `${CFG.buttonRight}px`, bottom: `${CFG.buttonBottom + bottomOffset}px`,
      zIndex: 9999999, padding: '9px 12px', border: 'none', borderRadius: '10px',
      background: bg, color: '#fff', fontSize: '13px', cursor: 'pointer',
      boxShadow: '0 3px 10px rgba(0,0,0,.2)', opacity: '.95'
    });
    btn.addEventListener('click', onClick);
    document.body.appendChild(btn);
  }

  function mountUI() {
    makeBtn('yb-export-current', '导出当前 MD+JSON', '#1677ff', 0, async () => {
      try {
        const r = await exportCurrentChat(true);
        toast(`已导出：${r.title}（${r.turns} turns）`);
      } catch (e) {
        toast(`导出失败：${e?.message || e}`);
      }
    });

    makeBtn('yb-export-copy', '复制当前 Markdown', '#10b981', 44, async () => {
      try {
        const r = await exportCurrentChat(false);
        toast(`已复制：${r.title}（${r.turns} turns）`);
      } catch (e) {
        toast(`复制失败：${e?.message || e}`);
      }
    });

    makeBtn('yb-export-batch', '批量导出全部', '#7c3aed', 88, async () => {
      if (!confirm('将自动点击左侧全部会话并下载多个文件，是否继续？')) return;
      await batchExportAll();
    });
  }

  const timer = setInterval(() => {
    if (document.body) {
      clearInterval(timer);
      mountUI();
      toast('导出工具已就绪（含批量导出）');
    }
  }, 400);
})();
