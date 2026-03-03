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
    toolbarAnchorSelector: ".agent-dialogue__tool",
    // XPath for fallback UI anchor
    toolbarAnchorXPath:
      '//*[@id="app"]/div/div[5]/div/div/div[1]/div/div[1]/div/div[4]',
    sidebarSelector: 'aside, [class*="conversation-list"]',
  };

  const SEL = {
    title: [
      'header h1',
      'header h2',
      '[class*="title"]',
      '[class*="chat-title"]',
      '[class*="conversation-title"]',
      '.dialogue-title',
      '.chat-header h1',
      'h1',
      'h2',
    ],
    scrollContainers: [
      '[class*="message-list"]',
      '[class*="chat-content"]',
      '[class*="conversation-content"]',
      '[class*="scroll"]',
      "main",
      "body",
    ],
    msgBlocks: [
      '[data-role="user"]',
      '[data-role="assistant"]',
      '[class*="message"]',
      '[class*="bubble"]',
      '[class*="item"]',
      '[class*="user-message"]',
      '[class*="assistant-message"]',
    ],
    codeBlocks: ["pre code", "pre"],
    links: ["a[href]"],
    sidebar: [
      "aside",
      '[class*="sidebar"]',
      '[class*="conversation-list"]',
      '[class*="session-list"]',
      '[class*="chat-list"]',
      '[role="navigation"]',
    ],
    sidebarItems: [
      '[class*="conversation-item"]',
      '[class*="session-item"]',
      '[class*="chat-item"]',
      '[class*="conversation-list"] [class*="item"]',
      '[class*="session-list"] [class*="item"]',
      '[class*="chat-list"] [class*="item"]',
      'aside [class*="item"]',
      'aside li',
      'aside a',
      '[class*="list-item"]',
      '[role="listitem"]',
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
      box-shadow: 0 3px 10px rgba(0,0,0,.2);
      opacity: .95;
      transition: all 0.2s ease;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .yb-export-btn:hover {
      opacity: 1;
      transform: translateY(-1px);
    }
    .yb-export-btn:active {
      transform: translateY(0);
    }
    #yb-export-current { background: #1677ff; }
    #yb-export-copy { background: #10b981; }
    #yb-export-batch { background: #7c3aed; }

    #yb-export-host {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;
    }

    #yb-export-host.fixed {
      position: fixed;
      right: ${CFG.buttonRight}px;
      bottom: ${CFG.buttonBottom}px;
      z-index: 9999999;
      flex-direction: column;
      align-items: flex-end;
    }

    .yb-toast {
      position: fixed;
      right: ${CFG.buttonRight}px;
      bottom: ${CFG.buttonBottom + 150}px;
      z-index: 10000000;
      background: rgba(0,0,0,.8);
      color: #fff;
      padding: 10px 16px;
      border-radius: 8px;
      font-size: 14px;
      max-width: 360px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      pointer-events: none;
      transition: opacity 0.3s ease;
    }

    .yb-badge {
      position: fixed;
      right: ${CFG.buttonRight}px;
      bottom: ${CFG.buttonBottom + 194}px;
      z-index: 9999999;
      background: #10b981;
      color: #fff;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 13px;
      box-shadow: 0 3px 10px rgba(0,0,0,.2);
    }
  `;

  // --- Helpers ---
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function safeName(input = "") {
    return (
      (input || "untitled")
        .replace(/[\\/:*?"<>|]+/g, "_")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 80) || "untitled"
    );
  }

  function nowStamp() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
  }

  function isoWithTZ() {
    const d = new Date();
    const tz = -d.getTimezoneOffset();
    const sign = tz >= 0 ? "+" : "-";
    const padding = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${padding(d.getMonth() + 1)}-${padding(d.getDate())}T${padding(d.getHours())}:${padding(d.getMinutes())}:${padding(d.getSeconds())}${sign}${padding(Math.floor(Math.abs(tz) / 60))}:${padding(Math.abs(tz) % 60)}`;
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
    return (el?.innerText || el?.textContent || "").replace(/\r/g, "").trim();
  }
  function normalizeText(s = "") {
    return s
      .replace(/\u00A0/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  const NOISE_RE = [
    /^复制$/,
    /^重试$/,
    /^展开思考$/,
    /^收起思考$/,
    /^赞$/,
    /^踩$/,
    /^点赞$/,
    /^点踩$/,
    /^分享$/,
    /^继续$/,
    /^重新生成$/,
    /^已复制$/,
  ];

  function denoise(raw = "") {
    return normalizeText(
      normalizeText(raw)
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean)
        .filter((line) => !NOISE_RE.some((re) => re.test(line)))
        .join("\n"),
    );
  }

  function hashLite(str = "") {
    let h = 0;
    for (let i = 0; i < str.length; i++)
      h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    return String(h);
  }

  function toast(msg, duration = 2000) {
    let el = document.querySelector(".yb-toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "yb-toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = "1";
    setTimeout(() => {
      if (el) el.style.opacity = "0";
    }, duration);
  }

  // --- Core Logistics ---
  function extractMessages() {
    const blocks = allExisting(SEL.msgBlocks);
    const msgs = [];
    for (const el of blocks) {
      const raw = text(el);
      if (!raw) continue;

      const cls = `${el.className || ""}`.toLowerCase();
      const attr = (el.getAttribute("data-role") || "").toLowerCase();
      let role = "assistant";
      if (
        attr.includes("user") ||
        cls.includes("user") ||
        cls.includes("question")
      )
        role = "user";
      else if (/^(复制|重试|展开思考|收起思考|分享)$/.test(raw.trim()))
        continue;

      const codes = Array.from(allExisting(SEL.codeBlocks, el))
        .map((b) => {
          const lang =
            (b.className || "").match(/language-([a-zA-Z0-9_+-]+)/)?.[1] || "";
          return { lang, code: normalizeText(text(b)) };
        })
        .filter((c) => c.code);

      const links = CFG.includeReferences
        ? Array.from(allExisting(SEL.links, el))
            .map((a) => ({
              label: normalizeText(text(a)) || a.getAttribute("href"),
              href: a.getAttribute("href") || "",
            }))
            .filter((l) => l.href && !l.href.startsWith("javascript:"))
        : [];

      let thinking = "";
      if (CFG.includeThinking) {
        const thinkNodes = allExisting(
          ['[class*="think"]', '[class*="reason"]', '[class*="thought"]'],
          el,
        );
        if (thinkNodes.length)
          thinking = denoise(thinkNodes.map((n) => text(n)).join("\n"));
      }

      const body = denoise(raw);
      if (!body && !codes.length && !thinking) continue;

      msgs.push({
        role,
        body,
        thinking,
        codes,
        links,
        hash: hashLite(
          `${role}|${body}|${thinking}|${JSON.stringify(codes)}|${JSON.stringify(links)}`,
        ),
      });
    }

    const seen = new Set();
    return msgs.filter((m) => {
      const k = CFG.dedupeStrict ? m.hash : `${m.role}|${m.body}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  function pairTurns(messages) {
    const turns = [];
    let cur = { user: "", assistant: "", thinking: "", codes: [], links: [] };
    const flush = () => {
      if (cur.user || cur.assistant || cur.thinking || cur.codes.length) {
        turns.push({
          ...cur,
          user: normalizeText(cur.user),
          assistant: normalizeText(cur.assistant),
          thinking: normalizeText(cur.thinking),
        });
      }
      cur = { user: "", assistant: "", thinking: "", codes: [], links: [] };
    };

    for (const m of messages) {
      if (m.role === "user") {
        if (cur.user || cur.assistant) flush();
        cur.user = m.body;
      } else {
        cur.assistant = cur.assistant
          ? `${cur.assistant}\n\n${m.body}`
          : m.body;
      }
      if (m.thinking)
        cur.thinking = cur.thinking
          ? `${cur.thinking}\n\n${m.thinking}`
          : m.thinking;
      if (m.codes?.length) cur.codes.push(...m.codes);
      if (m.links?.length) cur.links.push(...m.links);
    }
    flush();
    return turns;
  }

  function buildMD(title, turns) {
    let out = `---\nsource: tencent-yuanbao\nexported_at: ${isoWithTZ()}\ntitle: ${title.replace(/\n/g, " ")}\n---\n\n# ${title}\n\n`;
    turns.forEach((t, i) => {
      out += `## Turn ${i + 1}\n`;
      if (t.user) out += `### User\n${t.user}\n\n`;
      if (t.assistant) out += `### Assistant\n${t.assistant}\n\n`;
      if (t.thinking && CFG.includeThinking)
        out += `### Thinking\n${t.thinking}\n\n`;
      if (t.codes?.length) {
        out += `### Code Blocks\n`;
        t.codes.forEach(
          (c, idx) =>
            (out += `#### Code ${idx + 1}\n\`\`\`${c.lang}\n${c.code}\n\`\`\`\n\n`),
        );
      }
      if (t.links?.length && CFG.includeReferences) {
        out += `### References\n`;
        const seen = new Set();
        t.links.forEach((l) => {
          if (!seen.has(l.href)) {
            out += `- [${l.label}](${l.href})\n`;
            seen.add(l.href);
          }
        });
        out += `\n`;
      }
    });
    return out.trim() + "\n";
  }

  async function download(name, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  // --- UI Injection ---
  function mountUI() {
    if (document.getElementById("yb-export-host")) return;

    const host = document.createElement("div");
    host.id = "yb-export-host";

    const createBtn = (id, label, action) => {
      const b = document.createElement("button");
      b.id = id;
      b.className = "yb-export-btn";
      b.textContent = label;
      b.onclick = action;
      return b;
    };

    const runExport = async (mode) => {
      try {
        toast("正在提取会话...");
        // Auto scroll to top to ensure DOM loading
        const sc = firstExisting(SEL.scrollContainers);
        if (sc) sc.scrollTop = 0;
        await sleep(500);

        const title =
          normalizeText(firstExisting(SEL.title)?.innerText) || "untitled";
        const raw = extractMessages();
        const turns = pairTurns(raw);

        if (!turns.length) throw new Error("未检测到对话内容");

        const md = buildMD(title, turns);
        if (mode === "copy") {
          GM_setClipboard(md);
          toast("✅ Markdown 已复制到剪贴板");
        } else {
          const base = `${nowStamp()}-${safeName(title)}`;
          download(`${base}.md`, md, "text/markdown");
          download(
            `${base}.json`,
            JSON.stringify({ title, turns, exported_at: isoWithTZ() }, null, 2),
            "application/json",
          );
          toast("✅ 导出完成");
        }
      } catch (e) {
        toast(`❌ 错误: ${e.message}`);
      }
    };

    host.appendChild(
      createBtn("yb-export-current", "导出 MD+JSON", () =>
        runExport("download"),
      ),
    );
    host.appendChild(
      createBtn("yb-export-copy", "复制 MD", () => runExport("copy")),
    );

    // Batch export button
    host.appendChild(
      createBtn("yb-export-batch", "批量全部", async () => {
        if (
          !confirm(
            "批量导出将遍历侧边栏所有会话并生成合集，可能需要较长时间，是否继续？",
          )
        )
          return;
        await performBatchExport();
      }),
    );

    const anchor = document.querySelector(CFG.toolbarAnchorSelector);
    if (anchor) {
      anchor.after(host);
    } else {
      host.classList.add("fixed");
      document.body.appendChild(host);
    }
  }

  async function performBatchExport() {
    toast("🚀 批量导出启动...");
    const sidebar = firstExisting([CFG.sidebarSelector]);
    if (!sidebar) {
      toast("❌ 未找到侧边栏");
      return;
    }

    // Expand sidebar items
    for (let i = 0; i < CFG.sidebarLoadRounds; i++) {
      sidebar.scrollTop += 2000;
      await sleep(CFG.sidebarLoadDelayMs);
    }
    sidebar.scrollTop = 0;
    await sleep(500);

    const items = allExisting(SEL.sidebarItems, sidebar).filter(
      (el) => el.innerText.length > 1,
    );
    const tasks = [];
    const seen = new Set();
    for (const it of items) {
      const txt = normalizeText(it.innerText);
      if (txt && !seen.has(txt)) {
        tasks.push({ el: it, title: txt });
        seen.add(txt);
      }
    }

    if (tasks.length === 0) {
      toast("❌ 未识别到侧边栏会话");
      return;
    }

    toast(`共探测到 ${tasks.length} 个会话，开始处理...`);
    const results = [];
    const batchData = [];

    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];
      try {
        toast(
          `正在处理 (${i + 1}/${tasks.length}): ${t.title.slice(0, 15)}...`,
        );
        t.el.scrollIntoView({ block: "center" });
        t.el.click();
        await sleep(CFG.perChatWaitMs);

        const sc = firstExisting(SEL.scrollContainers);
        if (sc) sc.scrollTop = 0;
        await sleep(500);

        const raw = extractMessages();
        const turns = pairTurns(raw);
        if (turns.length) {
          batchData.push({ title: t.title, turns });
          results.push(`- [OK] ${t.title}`);
        }
      } catch (e) {
        results.push(`- [FAIL] ${t.title}: ${e.message}`);
      }
      await sleep(CFG.betweenChatMs);
    }

    let finalMd = `# 腾讯元宝批量导出报告 (${nowStamp()})\n\n`;
    batchData.forEach((d) => {
      finalMd += `\n---\n\n` + buildMD(d.title, d.turns);
    });
    finalMd += `\n\n---\n## 导出日志\n${results.join("\n")}`;

    download(`${nowStamp()}-yuanbao-batch.md`, finalMd, "text/markdown");
    toast(`✅ 批量导出完成，成功 ${batchData.length}/${tasks.length}`);
  }

  // --- Init ---
  function init() {
    GM_addStyle(CSS_STYLES);

    // Observer to handle SPA navigation or dynamic UI loading
    const observer = new MutationObserver(() => {
      mountUI();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Initial mount
    mountUI();

    // Welcome badge
    const badge = document.createElement("div");
    badge.className = "yb-badge";
    badge.textContent = "✅ 元宝导出助手已就绪";
    document.body.appendChild(badge);
    setTimeout(() => badge.remove(), 3000);
  }

  // Run when ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
