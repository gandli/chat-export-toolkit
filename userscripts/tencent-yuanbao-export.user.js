// ==UserScript==
// @name         腾讯元宝导出增强版（批量导出全部会话）
// @namespace    https://github.com/gandli/chat-export-toolkit
// @version      1.2.0
// @description  支持单会话导出 + 批量导出左侧全部会话（LLM Friendly Markdown/JSON），优化样式与 SPA 适配
// @author       gandli
// @match        *://yuanbao.tencent.com/*
// @match        *://*.yuanbao.tencent.com/*
// @grant        GM_setClipboard
// @grant        GM_addStyle
// @run-at       document-end
// @license      MIT
// ==/UserScript==

/**
 * [Yuanbao Export Toolkit]
 * Optimized version following Tampermonkey best practices.
 */

(function () {
  "use strict";

  // --- Configuration ---
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
    perChatWaitMs: 1500,
    betweenChatMs: 600,
    maxChats: 500,
    toolbarAnchorSelector: ".agent-dialogue__tool, .yb-chat__input-tool",
    sidebarSelector: ".yb-nav__content, .yb-recent-conv-list, aside",
  };

  const SEL = {
    title: [
      ".yb-recent-conv-list__item.active .yb-recent-conv-list__item-name",
      "header h1",
      "header h2",
      '[class*="title"]',
      "h1",
    ],
    scrollContainers: [
      '[class*="message-list"]',
      '[class*="chat-content"]',
      '[class*="conversation-content"]',
      "main",
      "body",
    ],
    msgBlocks: [
      '[data-role="user"]',
      '[data-role="assistant"]',
      '[class*="message"]',
      '[class*="bubble"]',
      '[class*="item"]',
    ],
    codeBlocks: ["pre code", "pre"],
    links: ["a[href]"],
    sidebarItems: [
      ".yb-recent-conv-list__item",
      '[class*="conversation-list"] [class*="item"]',
      'aside [class*="item"]',
    ],
  };

  const CSS_STYLES = `
    .yb-export-btn {
      padding: 8px 12px;
      border: none;
      border-radius: 10px;
      color: #fff;
      font-size: 13px;
      cursor: pointer;
      box-shadow: 0 3px 10px rgba(0,0,0,.15);
      transition: all 0.2s ease;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      white-space: nowrap;
    }
    .yb-export-btn:hover { opacity: 1; transform: translateY(-1px); box-shadow: 0 5px 15px rgba(0,0,0,.2); }
    #yb-export-current { background: #1677ff; }
    #yb-export-copy { background: #10b981; }
    #yb-export-batch { background: #7c3aed; }

    #yb-export-host {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin: 8px 0;
      align-items: center;
    }

    .yb-toast {
      position: fixed;
      left: 50%;
      top: 20px;
      transform: translateX(-50%);
      z-index: 10000000;
      background: rgba(0,0,0,.85);
      color: #fff;
      padding: 12px 24px;
      border-radius: 12px;
      font-size: 14px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
      transition: opacity 0.3s ease;
      pointer-events: none;
    }

    .yb-badge {
      position: fixed;
      right: 20px;
      bottom: 180px;
      z-index: 9999999;
      background: #10b981;
      color: #fff;
      padding: 8px 12px;
      border-radius: 8px;
    }
  `;

  // --- Helpers ---
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function safeName(input = "") {
    return (input || "untitled").replace(/[\\/:*?"<>|]+/g, "_").trim().slice(0, 80) || "untitled";
  }

  function nowStamp() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
  }

  function isoWithTZ() {
    return new Date().toISOString();
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

  function text(el) {
    return (el?.innerText || el?.textContent || "").trim();
  }

  function toast(msg, duration = 3000) {
    let el = document.querySelector(".yb-toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "yb-toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = "1";
    if (window._ybT) clearTimeout(window._ybT);
    window._ybT = setTimeout(() => { if (el) el.style.opacity = "0"; }, duration);
  }

  // --- Core Logistics ---
  function extractMessages() {
    const blocks = allExisting(SEL.msgBlocks);
    const msgs = [];
    for (const el of blocks) {
      const raw = text(el);
      if (!raw || /^(复制|重试|展开思考|收起思考|分享|重新生成)$/.test(raw)) continue;

      const cls = el.className.toLowerCase();
      const attr = (el.getAttribute("data-role") || "").toLowerCase();
      let role = (attr.includes("user") || cls.includes("user") || cls.includes("question")) ? "user" : "assistant";

      let thinking = "";
      if (CFG.includeThinking) {
        const tNodes = el.querySelectorAll('[class*="think"], [class*="reason"], [class*="thought"]');
        if (tNodes.length) thinking = Array.from(tNodes).map(n => text(n)).join("\n");
      }

      msgs.push({ role, body: raw, thinking, hash: hashLite(role + raw) });
    }
    const seen = new Set();
    return msgs.filter(m => !seen.has(m.hash) && seen.add(m.hash));
  }

  function hashLite(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return String(h);
  }

  function pairTurns(messages) {
    const turns = [];
    let cur = { user: "", assistant: "", thinking: "" };
    const flush = () => {
      if (cur.user || cur.assistant) turns.push({ ...cur });
      cur = { user: "", assistant: "", thinking: "" };
    };
    for (const m of messages) {
      if (m.role === "user") { if (cur.user || cur.assistant) flush(); cur.user = m.body; }
      else { cur.assistant = (cur.assistant ? cur.assistant + "\n\n" : "") + m.body; }
      if (m.thinking) cur.thinking = (cur.thinking ? cur.thinking + "\n\n" : "") + m.thinking;
    }
    flush();
    return turns;
  }

  function buildMD(title, turns) {
    let out = `# ${title}\n\n`;
    turns.forEach((t, i) => {
      if (t.user) out += `### User\n${t.user}\n\n`;
      if (t.thinking) out += `### Thinking\n${t.thinking}\n\n`;
      if (t.assistant) out += `### Assistant\n${t.assistant}\n\n`;
      out += "---\n\n";
    });
    return out;
  }

  async function download(name, content, type) {
    const b = new Blob([content], { type });
    const url = URL.createObjectURL(b);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  function mountUI() {
    const anchor = document.querySelector(CFG.toolbarAnchorSelector);
    if (!anchor) return;
    if (document.getElementById("yb-export-host")) {
        if (document.getElementById("yb-export-host").parentElement === anchor.parentElement) return;
        document.getElementById("yb-export-host").remove();
    }
    const host = document.createElement("div");
    host.id = "yb-export-host";
    const createBtn = (id, label, action) => {
      const b = document.createElement("button");
      b.id = id; b.className = "yb-export-btn"; b.textContent = label;
      b.onclick = (e) => { e.stopPropagation(); action(); };
      return b;
    };
    const runExport = async (mode) => {
      try {
        toast("正在读取...");
        const title = document.title.replace("- 腾讯元宝", "").trim() || "untitled";
        const msgs = extractMessages();
        const turns = pairTurns(msgs);
        const md = buildMD(title, turns);
        if (mode === "copy") { GM_setClipboard(md); toast("✅ 已复制"); }
        else {
          download(`${safeName(title)}.md`, md, "text/markdown");
          download(`${safeName(title)}.json`, JSON.stringify({ title, turns }, null, 2), "application/json");
          toast("✅ 已导出");
        }
      } catch (e) { toast("❌ 失败: " + e.message); }
    };
    host.appendChild(createBtn("yb-export-current", "导出 MD+JSON", () => runExport("download")));
    host.appendChild(createBtn("yb-export-copy", "复制 MD", () => runExport("copy")));
    host.appendChild(createBtn("yb-export-batch", "批量全部", () => {
        if (confirm("确定开始批量导出吗？")) performBatchExport();
    }));
    anchor.after(host);
  }

  async function performBatchExport() {
    toast("🚀 批量导出开始...");
    const sidebar = firstExisting([CFG.sidebarSelector]);
    if (!sidebar) { toast("❌ 未识别到侧边栏"); return; }
    for (let i = 0; i < CFG.sidebarLoadRounds; i++) { sidebar.scrollTop += 2000; await sleep(CFG.sidebarLoadDelayMs); }
    sidebar.scrollTop = 0; await sleep(500);

    const rawItems = allExisting(SEL.sidebarItems, sidebar);
    const tasks = [];
    const seen = new Set();
    for (const it of rawItems) {
      const titleEl = it.querySelector(".yb-recent-conv-list__item-name") || it;
      const title = (titleEl.getAttribute('data-item-name') || titleEl.innerText || "").trim();
      const cid = it.getAttribute('dt-cid') || it.getAttribute('data-item-id') || hashLite(title);
      if (title && !seen.has(cid)) { tasks.push({ el: it, title, cid }); seen.add(cid); }
    }

    if (!tasks.length) { toast("❌ 未发现会话"); return; }
    const batchData = [];
    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];
      toast(`处理中 (${i+1}/${tasks.length}): ${t.title.slice(0, 10)}...`);
      t.el.click(); await sleep(CFG.perChatWaitMs);
      const msgs = extractMessages();
      const turns = pairTurns(msgs);
      if (turns.length) batchData.push({ title: t.title, turns });
      await sleep(CFG.betweenChatMs);
    }
    const finalMd = batchData.map(d => buildMD(d.title, d.turns)).join("\n\n---\n\n");
    download(`批量导出_${nowStamp()}.md`, finalMd, "text/markdown");
    toast(`✅ 完成: ${batchData.length} 个`);
  }

  function init() {
    GM_addStyle(CSS_STYLES);
    mountUI();
    const obs = new MutationObserver(() => mountUI());
    obs.observe(document.body, { childList: true, subtree: true });
    const b = document.createElement("div"); b.className = "yb-badge"; b.textContent = "已就绪";
    document.body.appendChild(b); setTimeout(() => b.remove(), 2000);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
