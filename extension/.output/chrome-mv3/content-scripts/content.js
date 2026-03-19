var content=(function(){function e(e){return e}var t=class{async exportAll(e,t){console.log(`[${this.format}] Exporting ${e.length} conversations`);let n=0,r=0,i;for(let a of e)try{let e=await this.exportConversation(a,t);e.success?(n++,r+=e.stats?.messageCount||0):i=e.error}catch(e){i=e instanceof Error?e.message:String(e),console.error(`[${this.format}] Failed to export conversation:`,e)}return{success:n===e.length,stats:{messageCount:r,conversationCount:n},error:i}}generateFilename(e,t){return`${(e.title||`conversation`).replace(/[^a-z0-9]/gi,`_`).substring(0,50)}_${new Date(e.updatedAt).toISOString().split(`T`)[0]}.${t}`}createBlob(e,t=`text/plain`){return typeof Blob>`u`?null:new Blob([e],{type:t})}triggerDownload(e,t){if(!e||typeof URL>`u`||typeof document>`u`)return;let n=URL.createObjectURL(e),r=document.createElement(`a`);r.href=n,r.download=t,document.body.appendChild(r),r.click(),document.body.removeChild(r),URL.revokeObjectURL(n)}async ensureDir(e){console.log(`[Exporter] ensureDir (stub): ${e}`)}async writeFile(e){console.log(`[Exporter] writeFile (stub)`)}},n=class extends t{format=`json`;async exportConversation(e,t){try{let n=t.includeMetadata?e:{id:e.id,title:e.title,messages:e.messages,createdAt:e.createdAt,updatedAt:e.updatedAt},r=JSON.stringify(n,null,2),i=t.filename||this.generateFilename(e,`json`),a=this.createBlob(r,`application/json`);return this.triggerDownload(a,i),a||console.log(`[JSONExporter] Generated: ${i} (${r.length} bytes)`),{success:!0,outputPath:i,stats:{messageCount:e.messages.length,conversationCount:1}}}catch(e){return{success:!1,error:e instanceof Error?e.message:String(e),stats:{messageCount:0,conversationCount:0}}}}},r=class extends t{format=`markdown`;async exportConversation(e,t){try{let n=this.generateMarkdown(e,t),r=t.filename||this.generateFilename(e,`md`),i=this.createBlob(n,`text/markdown`);return this.triggerDownload(i,r),i||console.log(`[MarkdownExporter] Generated: ${r} (${n.length} bytes)`),{success:!0,outputPath:r,stats:{messageCount:e.messages.length,conversationCount:1}}}catch(e){return{success:!1,error:e instanceof Error?e.message:String(e),stats:{messageCount:0,conversationCount:0}}}}generateMarkdown(e,t){return(t.formatVersion||`v2`)===`v1`?this.generateMarkdownV1(e,t):this.generateMarkdownV2(e,t)}generateMarkdownV1(e,t){let n=[];n.push(`# ${e.title||`对话导出`}`),n.push(``),n.push(`> Exported at: ${this.formatTimestampV1(Date.now())}`),n.push(``);for(let r=0;r<e.messages.length;r++){let i=e.messages[r],a=this.formatMessageV1(i,r,t);n.push(...a)}return n.join(`
`)+`
`}generateMarkdownV2(e,t){let n=[];n.push(`# ${e.title||`对话导出`}`),n.push(``),t.includeMetadata&&(n.push(`## 元数据`),n.push(``),n.push(`- **ID**: ${e.id}`),n.push(`- **创建时间**: ${this.formatTimestamp(e.createdAt)}`),n.push(`- **更新时间**: ${this.formatTimestamp(e.updatedAt)}`),n.push(`- **消息数**: ${e.messages.length}`),e.metadata?.platform&&n.push(`- **平台**: ${e.metadata.platform}`),n.push(``),n.push(`---`),n.push(``)),n.push(`## 对话内容`),n.push(``);for(let r=0;r<e.messages.length;r++){let i=e.messages[r],a=this.formatMessage(i,r+1,t);n.push(...a)}return t.includeMetadata&&(n.push(`---`),n.push(``),n.push(`*导出时间：${this.formatTimestamp(Date.now())}*`),n.push(`*由 Chat Export Toolkit V2 生成*`)),n.join(`
`)}formatMessage(e,t,n){let r=[],i=this.getRoleLabel(e.role),a=this.formatTimestamp(e.timestamp);r.push(`### 第 ${t} 轮 - ${i}`),r.push(``),r.push(`> 时间：${a}`),r.push(``);let o=e.content.text;if(o.includes(`<think>`)||o.includes("```think")){let e=this.formatThinkBlock(o);r.push(...e)}else r.push(o);if(r.push(``),n.includeAttachments&&e.content.attachments?.length){r.push(`**附件:**`);for(let t of e.content.attachments)r.push(`- [${t.name||`附件`}](${t.url||`#`})`);r.push(``)}return r.push(`---`),r.push(``),r}formatMessageV1(e,t,n){let r=[],i=this.getRoleLabelV1(e.role);r.push(`## ${i} (Turn ${t})`);let a=this.formatTimestampV1(e.timestamp);r.push(`*${a}*`),r.push(``);let o=e.content.text,s=this.formatContentV1(o);return r.push(...s),r.push(``),r.push(`---`),r.push(``),r}formatContentV1(e){let t=[],n=/<think>([\s\S]*?)<\/think>|```think([\s\S]*?)```/g,r,i=0;for(;(r=n.exec(e))!==null;){if(r.index>i){let n=e.slice(i,r.index).trim();n&&(t.push(n),t.push(``))}let n=(r[1]||r[2]||``).trim();t.push(`> [Think]`);for(let e of n.split(`
`))t.push(`> ${e}`);t.push(``),i=r.index+r[0].length}if(i<e.length){let n=e.slice(i).trim();n&&t.push(n)}return t}formatThinkBlock(e){let t=[],n=/<think>([\s\S]*?)<\/think>|```think([\s\S]*?)```/g,r,i=0;for(;(r=n.exec(e))!==null;){if(r.index>i){let n=e.slice(i,r.index).trim();n&&(t.push(n),t.push(``))}let n=(r[1]||r[2]||``).trim();t.push(`> **思考过程:**`),t.push(`>`);for(let e of n.split(`
`))t.push(`> ${e}`);t.push(``),i=r.index+r[0].length}if(i<e.length){let n=e.slice(i).trim();n&&t.push(n)}return t}getRoleLabel(e){return{user:`用户`,assistant:`助手`,system:`系统`,tool:`工具`,unknown:`未知`}[e]||e}getRoleLabelV1(e){return{user:`User`,assistant:`Assistant`,system:`System`,tool:`Tool`,unknown:`Unknown`}[e]||e}formatTimestamp(e){let t=new Date(e);return`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,`0`)}-${String(t.getDate()).padStart(2,`0`)} ${String(t.getHours()).padStart(2,`0`)}:${String(t.getMinutes()).padStart(2,`0`)}:${String(t.getSeconds()).padStart(2,`0`)}`}formatTimestampV1(e){return new Date(e).toLocaleString(`en-US`,{year:`numeric`,month:`numeric`,day:`numeric`,hour:`numeric`,minute:`2-digit`,second:`2-digit`,hour12:!0})}generateFilename(e,t){return`${(e.title||`conversation`).replace(/[^a-z0-9\u4e00-\u9fa5]/gi,`_`).substring(0,50)}_${new Date(e.updatedAt).toISOString().split(`T`)[0]}.${t}`}},i=class extends t{format=`docx`;async exportConversation(e,t){try{if(!globalThis.JSZip)return console.log(`[DocxExporter] JSZip not available, skipping DOCX generation`),{success:!1,error:`JSZip not available. DOCX export requires browser environment with JSZip loaded.`,outputPath:t.filename||this.generateFilename(e,`docx`),stats:{messageCount:e.messages.length,conversationCount:1}};let n=await this.generateDocx(e,t),r=t.filename||this.generateFilename(e,`docx`);return this.triggerDownload(n,r),{success:!0,outputPath:r,stats:{messageCount:e.messages.length,conversationCount:1}}}catch(e){return{success:!1,error:e instanceof Error?e.message:String(e),stats:{messageCount:0,conversationCount:0}}}}async generateDocx(e,t){let n=window.JSZip;if(!n)throw Error(`JSZip not available. Make sure to include JSZip via @require in userscript.`);let r=new n;r.file(`[Content_Types].xml`,this.generateContentTypesXml()),r.folder(`_rels`).file(`.rels`,this.generateRelsXml());let i=this.generateDocumentXml(e,t);r.folder(`word`).file(`document.xml`,i);let a=this.generateStylesXml();return r.folder(`word`).file(`styles.xml`,a),r.folder(`word`).folder(`_rels`).file(`document.xml.rels`,this.generateDocumentRelsXml()),await r.generateAsync({type:`blob`,mimeType:`application/vnd.openxmlformats-officedocument.wordprocessingml.document`,compression:`DEFLATE`})}generateContentTypesXml(){return`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`}generateRelsXml(){return`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`}generateDocumentXml(e,t){let n=t.formatVersion||`v2`,r=[];if(r.push(this.createTitleParagraph(e.title||`对话导出`)),n===`v2`){t.includeMetadata&&r.push(...this.createMetadataParagraphs(e));for(let n=0;n<e.messages.length;n++){let i=e.messages[n],a=this.createMessageParagraphs(i,n+1,t);r.push(...a)}t.includeMetadata&&r.push(this.createFooterParagraph())}else for(let n=0;n<e.messages.length;n++){let i=e.messages[n],a=this.createMessageParagraphsV1(i,n,t);r.push(...a)}return`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    ${r.join(`
    `)}
    <w:sectPr>
      <w:pgSz w:w="11900" w:h="16840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`}createTitleParagraph(e){return`
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Title"/>
        <w:jc w:val="center"/>
      </w:pPr>
      <w:r>
        <w:t>${this.escapeXml(e)}</w:t>
      </w:r>
    </w:p>`}createMetadataParagraphs(e){let t=[];return t.push(`
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Subtitle"/>
      </w:pPr>
      <w:r>
        <w:t>对话 ID: ${this.escapeXml(e.id)}</w:t>
      </w:r>
    </w:p>`),t.push(`
    <w:p>
      <w:r>
        <w:t>创建时间：${this.escapeXml(this.formatTimestamp(e.createdAt))}</w:t>
      </w:r>
    </w:p>`),t.push(`
    <w:p>
      <w:r>
        <w:t>更新时间：${this.escapeXml(this.formatTimestamp(e.updatedAt))}</w:t>
      </w:r>
    </w:p>`),t.push(`
    <w:p>
      <w:r>
        <w:t>消息数：${e.messages.length}</w:t>
      </w:r>
    </w:p>`),e.metadata?.platform&&t.push(`
    <w:p>
      <w:r>
        <w:t>平台：${this.escapeXml(e.metadata.platform)}</w:t>
      </w:r>
    </w:p>`),t.push(`
    <w:p>
      <w:pPr>
        <w:pStyle w:val="HorizontalLine"/>
      </w:pPr>
    </w:p>`),t}createMessageParagraphs(e,t,n){let r=[],i=this.getRoleLabel(e.role);r.push(`
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading3"/>
        <w:spacing w:before="240" w:after="120"/>
      </w:pPr>
      <w:r>
        <w:t>第 ${t} 轮 - ${this.escapeXml(i)}</w:t>
      </w:r>
    </w:p>`);let a=this.formatTimestamp(e.timestamp);r.push(`
    <w:p>
      <w:pPr>
        <w:ind w:left="720"/>
        <w:i/>
      </w:pPr>
      <w:r>
        <w:t>时间：${this.escapeXml(a)}</w:t>
      </w:r>
    </w:p>`);let o=e.content.text;if(o.includes(`<think>`)||o.includes("```think")){let e=this.createThinkBlockParagraphs(o);r.push(...e)}else r.push(...this.createContentParagraphs(o));if(n.includeAttachments&&e.content.attachments?.length){r.push(`
    <w:p>
      <w:r>
        <w:rPr>
          <w:b/>
        </w:rPr>
        <w:t>附件:</w:t>
      </w:r>
    </w:p>`);for(let t of e.content.attachments)r.push(`
    <w:p>
      <w:pPr>
        <w:ind w:left="720"/>
      </w:pPr>
      <w:r>
        <w:t>• ${this.escapeXml(t.name||`附件`)}: ${this.escapeXml(t.url||``)}</w:t>
      </w:r>
    </w:p>`)}return r.push(`
    <w:p>
      <w:pPr>
        <w:pStyle w:val="HorizontalLine"/>
      </w:pPr>
    </w:p>`),r}createMessageParagraphsV1(e,t,n){let r=[],i=this.getRoleLabelV1(e.role);r.push(`
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading2"/>
        <w:spacing w:before="200" w:after="100"/>
      </w:pPr>
      <w:r>
        <w:t>${this.escapeXml(i)} (Turn ${t})</w:t>
      </w:r>
    </w:p>`);let a=this.formatTimestampV1(e.timestamp);r.push(`
    <w:p>
      <w:pPr>
        <w:i/>
      </w:pPr>
      <w:r>
        <w:t>${this.escapeXml(a)}</w:t>
      </w:r>
    </w:p>`);let o=e.content.text;if(o.includes(`<think>`)||o.includes("```think")){let e=this.createThinkBlockParagraphsV1(o);r.push(...e)}else r.push(...this.createContentParagraphs(o));if(n.includeAttachments&&e.content.attachments?.length){r.push(`
    <w:p>
      <w:r>
        <w:rPr>
          <w:b/>
        </w:rPr>
        <w:t>Attachments:</w:t>
      </w:r>
    </w:p>`);for(let t of e.content.attachments)r.push(`
    <w:p>
      <w:pPr>
        <w:ind w:left="720"/>
      </w:pPr>
      <w:r>
        <w:t>• ${this.escapeXml(t.name||`Attachment`)}: ${this.escapeXml(t.url||``)}</w:t>
      </w:r>
    </w:p>`)}return r.push(`
    <w:p>
      <w:pPr>
        <w:pStyle w:val="HorizontalLine"/>
      </w:pPr>
    </w:p>`),r}createThinkBlockParagraphs(e){let t=[],n=/<think>([\s\S]*?)<\/think>|```think([\s\S]*?)```/g,r,i=0;for(;(r=n.exec(e))!==null;){if(r.index>i){let n=e.slice(i,r.index).trim();n&&t.push(...this.createContentParagraphs(n))}let n=(r[1]||r[2]||``).trim();t.push(`
    <w:p>
      <w:r>
        <w:rPr>
          <w:b/>
        </w:rPr>
        <w:t>思考过程:</w:t>
      </w:r>
    </w:p>`);for(let e of n.split(`
`))e.trim()&&t.push(`
    <w:p>
      <w:pPr>
        <w:ind w:left="720"/>
        <w:i/>
      </w:pPr>
      <w:r>
        <w:t>${this.escapeXml(e)}</w:t>
      </w:r>
    </w:p>`);i=r.index+r[0].length}if(i<e.length){let n=e.slice(i).trim();n&&t.push(...this.createContentParagraphs(n))}return t}createThinkBlockParagraphsV1(e){let t=[],n=/<think>([\s\S]*?)<\/think>|```think([\s\S]*?)```/g,r,i=0;for(;(r=n.exec(e))!==null;){if(r.index>i){let n=e.slice(i,r.index).trim();n&&t.push(...this.createContentParagraphs(n))}let n=(r[1]||r[2]||``).trim();t.push(`
    <w:p>
      <w:r>
        <w:rPr>
          <w:b/>
        </w:rPr>
        <w:t>[Think]</w:t>
      </w:r>
    </w:p>`);for(let e of n.split(`
`))e.trim()&&t.push(`
    <w:p>
      <w:pPr>
        <w:ind w:left="720"/>
        <w:i/>
      </w:pPr>
      <w:r>
        <w:t>${this.escapeXml(e)}</w:t>
      </w:r>
    </w:p>`);i=r.index+r[0].length}if(i<e.length){let n=e.slice(i).trim();n&&t.push(...this.createContentParagraphs(n))}return t}createContentParagraphs(e){let t=[],n=e.split(`

`);for(let e of n)if(e.trim()){let n=e.replace(/\n/g,` `);t.push(`
    <w:p>
      <w:pPr>
        <w:spacing w:after="120"/>
      </w:pPr>
      <w:r>
        <w:t>${this.escapeXml(n)}</w:t>
      </w:r>
    </w:p>`)}return t}createFooterParagraph(){let e=this.formatTimestamp(Date.now());return`
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:i/>
      </w:pPr>
      <w:r>
        <w:t>导出时间：${this.escapeXml(e)} | 由 Chat Export Toolkit V2 生成</w:t>
      </w:r>
    </w:p>`}generateStylesXml(){return`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <!-- 默认样式 -->
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Microsoft YaHei" w:hAnsi="Microsoft YaHei"/>
        <w:sz w:val="21"/>
        <w:szCs w:val="21"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>

  <!-- 标题样式 -->
  <w:style w:type="paragraph" w:styleId="Title" w:default="1">
    <w:name w:val="Title"/>
    <w:rPr>
      <w:b/>
      <w:sz w:val="36"/>
      <w:szCs w:val="36"/>
    </w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="Subtitle">
    <w:name w:val="Subtitle"/>
    <w:rPr>
      <w:i/>
      <w:sz w:val="24"/>
      <w:szCs w:val="24"/>
    </w:rPr>
  </w:style>

  <w:style w:type="paragraph" w:styleId="Heading3">
    <w:name w:val="Heading 3"/>
    <w:rPr>
      <w:b/>
      <w:sz w:val="28"/>
      <w:szCs w:val="28"/>
      <w:color w:val="2E74B5"/>
    </w:rPr>
  </w:style>

  <!-- 分隔线样式 -->
  <w:style w:type="paragraph" w:styleId="HorizontalLine">
    <w:name w:val="Horizontal Line"/>
    <w:pPr>
      <w:spacing w:before="120" w:after="120"/>
      <w:jc w:val="center"/>
    </w:pPr>
    <w:rPr>
      <w:sz w:val="4"/>
    </w:rPr>
  </w:style>
</w:styles>`}generateDocumentRelsXml(){return`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`}escapeXml(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&apos;`)}formatTimestamp(e){let t=new Date(e);return`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,`0`)}-${String(t.getDate()).padStart(2,`0`)} ${String(t.getHours()).padStart(2,`0`)}:${String(t.getMinutes()).padStart(2,`0`)}:${String(t.getSeconds()).padStart(2,`0`)}`}formatTimestampV1(e){return new Date(e).toLocaleString(`en-US`,{year:`numeric`,month:`numeric`,day:`numeric`,hour:`numeric`,minute:`2-digit`,second:`2-digit`,hour12:!0})}getRoleLabel(e){return{user:`用户`,assistant:`助手`,system:`系统`,tool:`工具`,unknown:`未知`}[e]||e}getRoleLabelV1(e){return{user:`User`,assistant:`Assistant`,system:`System`,tool:`Tool`,unknown:`Unknown`}[e]||e}generateFilename(e,t){return`${(e.title||`conversation`).replace(/[^a-z0-9\u4e00-\u9fa5]/gi,`_`).substring(0,50)}_${new Date(e.updatedAt).toISOString().split(`T`)[0]}.${t}`}},a=class extends t{format=`zip`;async exportAll(e,t){try{let n=globalThis.JSZip;if(!n)return console.log(`[ZIPExporter] JSZip not available, skipping ZIP generation`),{success:!1,error:`JSZip not available. ZIP export requires browser environment with JSZip loaded.`,stats:{messageCount:0,conversationCount:0}};if(e.length===0)return{success:!1,error:`No conversations to export`,stats:{messageCount:0,conversationCount:0}};let r=new n,i=t.format||`json`,a=this.getExporterForFormat(i);if(!a)return{success:!1,error:`Unsupported format for ZIP export: ${i}`,stats:{messageCount:0,conversationCount:0}};let o={json:`json`,markdown:`md`,docx:`docx`}[i]||`txt`;console.log(`[ZIPExporter] Exporting ${e.length} conversations as ${i}...`);let s=0,c=0,l=[];for(let n=0;n<e.length;n++){let i=e[n];try{let l=this.generateConversationFilename(i,o,n,e.length),u=await this.generateContent(a,i,t);r.file(l,u),c++,s+=i.messages.length,console.log(`[ZIPExporter] Added: ${l} (${i.messages.length} messages)`)}catch(e){let t=`Failed to export conversation ${i.id}: ${e instanceof Error?e.message:String(e)}`;l.push(t),console.error(`[ZIPExporter] ${t}`)}}if(t.includeMetadata!==!1){let t={exportedAt:new Date().toISOString(),format:i,conversationCount:c,totalMessages:s,conversations:e.map((t,n)=>({id:t.id,title:t.title||`Conversation ${n+1}`,messageCount:t.messages.length,createdAt:t.createdAt,updatedAt:t.updatedAt,filename:this.generateConversationFilename(t,o,n,e.length)}))};r.file(`metadata.json`,JSON.stringify(t,null,2))}let u=await r.generateAsync({type:`blob`,mimeType:`application/zip`,compression:`DEFLATE`,compressionOptions:{level:6}}),d=this.generateZipFilename(i);return this.triggerDownload(u,d),console.log(`[ZIPExporter] Export complete: ${d} (${c}/${e.length} conversations)`),{success:c===e.length,outputPath:d,stats:{messageCount:s,conversationCount:c},error:l.length>0?l.join(`; `):void 0}}catch(e){return console.error(`[ZIPExporter] Export failed:`,e),{success:!1,error:e instanceof Error?e.message:String(e),stats:{messageCount:0,conversationCount:0}}}}async exportConversation(e,t){return{success:!1,error:`ZIPExporter requires multiple conversations. Use exportAll() instead.`,stats:{messageCount:0,conversationCount:0}}}getExporterForFormat(e){switch(e){case`json`:return new n;case`markdown`:return new r;case`docx`:return new i;default:return null}}async generateContent(e,t,a){if(e instanceof n){let e=a.includeMetadata?t:{id:t.id,title:t.title,messages:t.messages,createdAt:t.createdAt,updatedAt:t.updatedAt};return JSON.stringify(e,null,2)}if(e instanceof r)return this.generateSimpleMarkdown(t,a);if(e instanceof i)throw Error(`DOCX format is not fully supported in ZIP export yet (TODO)`);return JSON.stringify(t,null,2)}generateSimpleMarkdown(e,t){let n=[];n.push(`# ${e.title||`对话导出`}`),n.push(``),n.push(`> Exported at: ${new Date().toLocaleString(`en-US`,{year:`numeric`,month:`numeric`,day:`numeric`,hour:`numeric`,minute:`2-digit`,second:`2-digit`,hour12:!0})}`),n.push(``);let r={user:`User`,assistant:`Assistant`,system:`System`,tool:`Tool`,unknown:`Unknown`};for(let t=0;t<e.messages.length;t++){let i=e.messages[t],a=r[i.role]||i.role,o=new Date(i.timestamp).toLocaleString(`en-US`,{year:`numeric`,month:`numeric`,day:`numeric`,hour:`numeric`,minute:`2-digit`,second:`2-digit`,hour12:!0});n.push(`## ${a} (Turn ${t+1})`),n.push(`*${o}*`),n.push(``),n.push(i.content.text),n.push(``),n.push(`---`),n.push(``)}return n.join(`
`)}generateConversationFilename(e,t,n,r){let i=Math.ceil(Math.log10(r+1));return`${String(n+1).padStart(Math.max(3,i),`0`)}_${(e.title||`conversation-${n+1}`).replace(/[^a-z0-9\u4e00-\u9fa5]/gi,`_`).replace(/_+/g,`_`).substring(0,50)}_${new Date(e.updatedAt).toISOString().split(`T`)[0]}.${t}`}generateZipFilename(e){return`chat-export-${e}-${new Date().toISOString().replace(/[:.]/g,``).slice(0,15)}.zip`}},o=new Map;o.set(`json`,n),o.set(`markdown`,r),o.set(`docx`,i),o.set(`zip`,a);function s(e){let t=o.get(e);return t?new t:(console.warn(`[ExporterRegistry] No exporter found for ${e}`),null)}var c={getStatus:`cet:get-status`,exportCurrent:`cet:export-current`,download:`cet:download`},l=class{async getConversation(e){return console.log(`[${this.platform}] getConversation called`,{conversationId:e}),null}async listConversations(){return console.log(`[${this.platform}] listConversations called`),[]}extractMessages(e){return console.log(`[${this.platform}] extractMessages called`,{rawConversation:e}),[]}async getMetadata(){return console.log(`[${this.platform}] getMetadata called`),{}}querySelectorSafe(e,t=document){try{return t.querySelector(e)}catch(t){return console.warn(`[${this.platform}] Failed to query selector:`,e,t),null}}querySelectorAllSafe(e,t=document){try{return Array.from(t.querySelectorAll(e))}catch(t){return console.warn(`[${this.platform}] Failed to query selectors:`,e,t),[]}}async waitForElement(e,t=5e3){return new Promise(n=>{let r=this.querySelectorSafe(e);if(r){n(r);return}let i=new MutationObserver(()=>{let t=this.querySelectorSafe(e);t&&(i.disconnect(),n(t))});i.observe(document.body,{childList:!0,subtree:!0}),setTimeout(()=>{i.disconnect(),n(null)},t)})}},u=[/^\/c\/([a-f0-9-]+)$/i,/^\/chat\/([a-f0-9-]+)$/i,/^\/conversation\/([a-f0-9-]+)$/i],d=class extends l{platform=`chatgpt`;apiEndpoints={detail:null,list:null,discovered:!1};capturedConversations=new Map;conversationMetas=new Map;detect(){if(typeof window>`u`)return!1;let e=window.location.hostname;return!!(e===`chat.openai.com`||e.endsWith(`.openai.com`)||e===`chat.com`)}async getConversation(e){if(console.log(`[ChatGPTAdapter] getConversation called`,{conversationId:e}),e&&this.capturedConversations.has(e)){let t=this.capturedConversations.get(e);return{platform:this.platform,data:t}}let t=this.extractConversationIdFromUrl(),n=e||t;if(!n)return console.warn(`[ChatGPTAdapter] No conversation ID available`),null;try{let e=await this.fetchConversationDetail(n);if(e)return this.capturedConversations.set(n,e),{platform:this.platform,data:e}}catch(e){console.error(`[ChatGPTAdapter] Failed to fetch conversation:`,e)}return console.warn(`[ChatGPTAdapter] Falling back to DOM extraction (not implemented)`),null}async listConversations(){console.log(`[ChatGPTAdapter] listConversations called`);let e=[];for(let[t,n]of this.capturedConversations.entries()){let r=n.title||n.metadata?.title||`ChatGPT Chat`;e.push({id:t,title:r,createTime:n.create_time,updateTime:n.update_time,model:n.metadata?.model})}try{let t=await this.fetchConversationList();if(t&&Array.isArray(t))for(let n of t){let t=this.extractConversationId(n),r=this.extractConversationTitle(n);t&&!e.some(e=>e.id===t)&&e.push({id:t,title:r,createTime:n.create_time,updateTime:n.update_time,model:n.model})}}catch(e){console.warn(`[ChatGPTAdapter] Failed to fetch conversation list:`,e)}if(e.length===0){let t=this.extractConversationMetasFromDom();for(let n of t)e.some(e=>e.id===n.id)||e.push(n)}return e.map(e=>({platform:this.platform,data:{conversationId:e.id,title:e.title,create_time:e.createTime,update_time:e.updateTime,model:e.model}}))}extractMessages(e){if(console.log(`[ChatGPTAdapter] extractMessages called`),!e||!e.data)return console.warn(`[ChatGPTAdapter] Invalid input to extractMessages`),[];let t=e.data,n=[];return Array.isArray(t.messages)?n=t.messages:t.mapping&&(n=this.extractMessagesFromMapping(t.mapping)),n.map(e=>({platform:this.platform,data:e}))}async getMetadata(){return{platform:this.platform,detected:this.detect(),endpointsDiscovered:this.apiEndpoints.discovered,capturedCount:this.capturedConversations.size,metaCount:this.conversationMetas.size}}async discoverApiEndpoints(){if(this.apiEndpoints.discovered)return this.apiEndpoints;let e={detail:null,list:null,discovered:!1};return e.detail||=(console.log(`[ChatGPTAdapter] Using fallback probe for detail API`),await this.probeDetailApi()),e.list||=(console.log(`[ChatGPTAdapter] Using fallback probe for list API`),await this.probeListApi()),console.log(`[ChatGPTAdapter] Discovered API endpoints:`,e),this.apiEndpoints={...e,discovered:!0},this.apiEndpoints}async probeDetailApi(){return console.warn(`[ChatGPTAdapter] probeDetailApi not fully implemented`),`/backend-api/conversation`}async probeListApi(){return console.warn(`[ChatGPTAdapter] probeListApi not fully implemented`),`/backend-api/conversations`}async fetchConversationDetail(e){if(!(await this.discoverApiEndpoints()).detail)throw Error(`Detail API endpoint not available`);return console.warn(`[ChatGPTAdapter] fetchConversationDetail not fully implemented`),null}async fetchConversationList(){if(!(await this.discoverApiEndpoints()).list)throw Error(`List API endpoint not available`);return console.warn(`[ChatGPTAdapter] fetchConversationList not fully implemented`),null}extractConversationIdFromUrl(){if(typeof window>`u`)return``;try{let e=new URL(window.location.href),t=e.pathname;for(let e of u){let n=t.match(e);if(n&&n[1])return n[1]}return e.searchParams.get(`conversationId`)||e.searchParams.get(`conversation_id`)||e.searchParams.get(`id`)||``}catch{return``}}extractConversationId(e){return e.conversation_id||e.id||e.conversationId||e.chatId||e.sessionId||``}extractConversationTitle(e){return e.title||e.conversationTitle||e.name||e.summary||`ChatGPT Chat`}extractConversationMetasFromDom(){if(typeof document>`u`)return[];let e=[],t=new Set,n=document.querySelectorAll(`a[href*="/c/"]`);for(let r of n){let n=r.getAttribute(`href`)||``;for(let i of u){let a=n.match(i);if(!a||!a[1])continue;let o=a[1];if(!o||t.has(o))continue;t.add(o);let s=(r.textContent||``).trim();e.push({id:o,title:s||`ChatGPT Chat`});break}}return e}extractMessagesFromMapping(e){let t=[];for(let n of Object.keys(e)){let r=e[n];r?.message&&t.push(r.message)}return t}installInterceptors(){typeof window>`u`||console.log(`[ChatGPTAdapter] installInterceptors not fully implemented`)}handleChatGPTResponse(e,t){try{let t=JSON.parse(e),n=null;if(Array.isArray(t.messages)||t.mapping?n=t:Array.isArray(t?.data?.messages)?n=t.data:t?.result?.messages&&(n=t.result),!n)return;let r=this.extractConversationIdFromUrl()||t.id||t.conversation_id||`${Date.now()}`,i=t.title||t.metadata?.title||`ChatGPT Chat`;this.conversationMetas.set(r,{id:r,title:i}),this.capturedConversations.set(r,n),console.log(`[ChatGPTAdapter] Captured conversation:`,r)}catch(e){console.error(`[ChatGPTAdapter] Failed to handle response:`,e)}}handleConversationListResponse(e){try{let t=JSON.parse(e),n=t.items||t.conversation_items||(Array.isArray(t.data)?t.data:t.data?.items)||t.result||[],r=Array.isArray(n)?n:[];if(r.length>0)for(let e of r){let t=this.extractConversationId(e),n=this.extractConversationTitle(e);t&&this.conversationMetas.set(t,{id:t,title:n,createTime:e.create_time,updateTime:e.update_time,model:e.model})}}catch(e){console.error(`[ChatGPTAdapter] Failed to handle list response:`,e)}}};new d;var f=class{async normalizeAll(e){console.log(`[${this.platform}] Normalizing ${e.length} conversations`);let t=[];for(let n of e)try{let e=await this.normalizeConversation(n);t.push(e)}catch(e){console.error(`[${this.platform}] Failed to normalize conversation:`,e)}return t}mapRole(e){return{user:`user`,human:`user`,assistant:`assistant`,ai:`assistant`,bot:`assistant`,system:`system`,tool:`tool`,function:`tool`}[e.toLowerCase()]||`unknown`}parseTimestamp(e){return typeof e==`number`?e<0xe8d4a51000?e*1e3:e:new Date(e).getTime()}extractText(e){if(typeof e==`string`)return e;if(typeof e==`object`&&e){let t=e;return typeof t.text==`string`?t.text:typeof t.content==`string`?t.content:typeof t.body==`string`?t.body:JSON.stringify(e)}return String(e)}generateId(e=``){return`${e}${Date.now()}-${Math.random().toString(36).substr(2,9)}`}},p=class extends f{platform=`chatgpt`;async normalizeConversation(e){console.log(`[ChatGPTRNormalizer] normalizeConversation called`);let t=e.data,n=this.extractMessagesFromData(t),r=t.conversation_id||t.id||this.generateId(`chatgpt_`),i=t.title||t.metadata?.title||`ChatGPT Chat`,a=[];for(let e of n)try{let t=await this.normalizeMessage({platform:this.platform,data:e},r);t&&a.push(t)}catch(t){console.error(`[ChatGPTRNormalizer] Failed to normalize message:`,e.id,t)}a.sort((e,t)=>e.timestamp-t.timestamp);let o=a.map(e=>e.timestamp).filter(e=>e>0);return{id:r,title:i,messages:a,createdAt:o.length>0?Math.min(...o):Date.now(),updatedAt:o.length>0?Math.max(...o):Date.now(),metadata:{platform:this.platform,participantCount:this.countParticipants(a),messageCount:a.length,originalData:t,model:t.metadata?.model}}}async normalizeMessage(e,t){console.log(`[ChatGPTRNormalizer] normalizeMessage called`);let n=e.data;return this.normalizeChatGPTMessage(n,t)}async normalizeAll(e){console.log(`[ChatGPTRNormalizer] Normalizing ${e.length} conversations`);let t=[];for(let n of e)try{let e=await this.normalizeConversation(n);t.push(e)}catch(e){console.error(`[ChatGPTRNormalizer] Failed to normalize conversation:`,e)}return t}async normalizeChatGPTMessage(e,t){let n=this.mapChatGPTRole(e.role),r=this.parseTimestamp(e.timestamp||e.createTime||Date.now()),i=this.extractMessageBlocks(e),a=[];for(let e of i)if(e.type===`code`){let t=e.metadata?.language||``;a.push(`\`\`\`${t}\n${e.text}\n\`\`\``)}else e.type===`image`?a.push(`![Image](${e.text||`image`})`):e.type===`file`?a.push(`[File: ${e.title||`attachment`}]`):a.push(e.text);let o={text:a.join(`

`).trim()||`_No content_`,metadata:{blockCount:i.length,originalRole:e.role}};return{id:this.generateMessageId(t,e.id),role:n,content:o,timestamp:r,metadata:{platform:this.platform,originalId:e.id,originalAuthor:e.author?.role,originalMetadata:e.metadata}}}mapChatGPTRole(e){if(!e)return`unknown`;let t=e.toLowerCase();return t===`assistant`||t===`ai`?`assistant`:t===`user`||t===`human`?`user`:t===`system`?`system`:t===`tool`||t===`function`?`tool`:`unknown`}extractMessageBlocks(e){let t=[],n=e.content;if(typeof n==`string`)t.push({type:`text`,text:n});else if(Array.isArray(n))for(let e of n){let n=this.extractBlockContent(e);n&&t.push(n)}else if(typeof n==`object`&&n){let e=this.extractBlockContent(n);e&&t.push(e)}return t}extractBlockContent(e){let t=(e.type||`text`).toLowerCase();if(t===`text`||!e.type){let t=e.text||e.content||String(e);return{type:`text`,text:this.adjustHeaderLevels(t,1)}}if(t===`code`)return{type:`code`,text:e.text||e.content||e.code||``,metadata:{language:e.language||e.lang||``}};if(t===`image`)return{type:`image`,text:e.url||e.src||e.data||``,metadata:{alt:e.alt||e.title||``}};if(t===`file`||t===`attachment`)return{type:`file`,text:e.url||e.path||``,title:e.name||e.filename||e.title||`Attachment`,metadata:{mimeType:e.mimeType||e.type||``,size:e.size}};let n=e.text||e.content||e.msg||String(e);return n?{type:`unsupported`,text:`[${t}] ${n}`,metadata:{originalType:e.type,originalPart:e}}:null}extractMessagesFromData(e){return Array.isArray(e.messages)?e.messages:e.mapping?this.extractMessagesFromMapping(e.mapping):e.data?.messages?e.data.messages:e.result?.messages?e.result.messages:[]}extractMessagesFromMapping(e){let t=[];for(let n of Object.keys(e)){let r=e[n];r?.message&&t.push(r.message)}return t}adjustHeaderLevels(e,t=1){return e?String(e).replace(/^(#+)(\s*)(.*?)\s*$/gm,(e,n,r,i)=>`#`.repeat(n.length+t)+` `+String(i).trim()):``}generateMessageId(e,t){return`${e}_msg_${t||Date.now().toString()}`}countParticipants(e){return new Set(e.map(e=>e.role)).size}};new p;var m=[`chat.openai.com`,`chatgpt.com`],h=[new class{id=`chatgpt`;displayName=`ChatGPT`;hosts=m;matches(e){return this.hosts.includes(e.hostname)}async getStatus(){let e=this.matches(window.location);return{providerId:this.id,displayName:this.displayName,supported:e,detail:e?`已识别 ChatGPT 页面，可导出当前对话。`:`当前页面不是 ChatGPT。`}}async collectCurrentConversation(){let e=new d,t=new p;try{let n=await e.getConversation();if(n)return await t.normalizeConversation(n)}catch(e){console.warn(`[extension/chatgpt] Adapter path failed, falling back to DOM.`,e)}return this.collectConversationFromDom()}collectConversationFromDom(){let e=this.collectMessageNodes();if(e.length===0)throw Error(`未在当前页面找到可导出的消息节点。`);let t=this.extractConversationId(),n=this.extractTitle(),r=Date.now(),i=e.map((e,n)=>this.nodeToMessage(e,t,n)).filter(e=>!!e);if(i.length===0)throw Error(`页面中存在对话容器，但未提取到有效消息内容。`);let a=i.map(e=>e.timestamp).filter(Boolean);return{id:t,title:n,messages:i,createdAt:a.length>0?Math.min(...a):r,updatedAt:a.length>0?Math.max(...a):r,metadata:{platform:this.id,extractionMode:`dom-fallback`,messageCount:i.length,sourceUrl:window.location.href}}}collectMessageNodes(){let e=Array.from(document.querySelectorAll(`[data-message-author-role]`));return e.length>0?e:Array.from(document.querySelectorAll(`article[data-testid^="conversation-turn-"]`))}nodeToMessage(e,t,n){let r=this.resolveRole(e),i=this.serializeNode(e).trim();return i?{id:`${t}_dom_${n+1}`,role:r,content:{text:i,metadata:{extractionMode:`dom-fallback`}},timestamp:Date.now()+n,metadata:{platform:this.id,originalId:e.dataset.testid||e.dataset.messageId||`${n+1}`}}:null}resolveRole(e){let t=e.dataset.messageAuthorRole||e.getAttribute(`data-message-author-role`)||``;return t===`user`?`user`:t===`assistant`||(e.textContent?.toLowerCase()||``).includes(`chatgpt`)?`assistant`:`unknown`}serializeNode(e){let t=e.matches(`[data-message-author-role]`)?e:e.querySelector(`[data-message-author-role]`)||e;return Array.from(t.childNodes).map(e=>this.serializeChild(e)).join(``).replace(/\n{3,}/g,`

`).trim()||(t.textContent?.trim()??``)}serializeChild(e){if(e.nodeType===Node.TEXT_NODE)return e.textContent||``;if(!(e instanceof HTMLElement))return``;let t=e.tagName.toLowerCase();if(t===`br`)return`
`;if(t===`pre`){let t=e.innerText.trim();return t?`\n\`\`\`\n${t}\n\`\`\`\n`:``}if(t===`code`)return e.closest(`pre`)?``:`\`${e.innerText.trim()}\``;if(t===`li`)return`- ${this.serializeChildren(e).trim()}\n`;if(t===`ul`||t===`ol`)return`\n${this.serializeChildren(e).trim()}\n`;if(/^h[1-6]$/.test(t)){let n=Number(t[1]);return`\n${`#`.repeat(n)} ${this.serializeChildren(e).trim()}\n\n`}return t===`blockquote`?`\n> ${this.serializeChildren(e).trim().replace(/\n/g,`
> `)}\n\n`:t===`p`?`${this.serializeChildren(e).trim()}\n\n`:this.serializeChildren(e)}serializeChildren(e){return Array.from(e.childNodes).map(e=>this.serializeChild(e)).join(``)}extractConversationId(){return window.location.pathname.match(/\/(?:c|chat|conversation)\/([^/?#]+)/i)?.[1]||`chatgpt-${Date.now()}`}extractTitle(){return document.title.replace(/\s*[-|].*$/,``).trim()||`ChatGPT Chat`}}];function g(e){return h.find(t=>t.matches(e))||null}function _(){let e=g(window.location);return e?{providerId:e.id,displayName:e.displayName,supported:!0,detail:`已识别 ${e.displayName}，可导出当前对话。`}:{providerId:`unsupported`,displayName:`未支持站点`,supported:!1,detail:`当前页面 ${window.location.hostname} 暂未接入浏览器扩展 MVP。`}}async function v(e,t){let n=s(t);if(!n)throw Error(`未找到 ${t} 导出器。`);let r=await n.exportConversation(e,{format:t,filename:void 0,includeMetadata:!0,includeAttachments:!1});if(!r.success)throw Error(r.error||`导出失败。`)}async function y(e){let t=g(window.location);if(!t)return{ok:!1,provider:_(),error:`当前页面未匹配到可用 provider。`};try{let n=await t.collectCurrentConversation();return await v(n,e.format),{ok:!0,provider:await t.getStatus(),conversation:{id:n.id,title:n.title}}}catch(e){return{ok:!1,provider:await t.getStatus(),error:e instanceof Error?e.message:String(e)}}}async function b(e){return e.type===c.getStatus?{ok:!0,provider:_()}:e.type===c.exportCurrent?y(e):e.type===c.download?x(e):null}async function x(e){try{let t=URL.createObjectURL(new Blob([e.payload.content],{type:e.payload.mimeType}));try{return{ok:!0,downloadId:await chrome.downloads.download({url:t,filename:e.payload.filename,saveAs:!0})}}finally{setTimeout(()=>URL.revokeObjectURL(t),6e4)}}catch(e){return{ok:!1,error:e instanceof Error?e.message:String(e)}}}function S(){chrome.runtime.onMessage.addListener((e,t,n)=>(b(e).then(e=>{e&&n(e)}),!0))}var C=e({matches:[`https://yuanbao.tencent.com/*`,`https://*.yuanbao.tencent.com/*`,`https://chat.openai.com/*`,`https://chatgpt.com/*`,`https://*.openai.com/*`],runAt:`document_idle`,main(){S()}}),w={debug:(...e)=>([...e],void 0),log:(...e)=>([...e],void 0),warn:(...e)=>([...e],void 0),error:(...e)=>([...e],void 0)},T=globalThis.browser?.runtime?.id?globalThis.browser:globalThis.chrome,E=class e extends Event{static EVENT_NAME=D(`wxt:locationchange`);constructor(t,n){super(e.EVENT_NAME,{}),this.newUrl=t,this.oldUrl=n}};function D(e){return`${T?.runtime?.id}:content:${e}`}var O=typeof globalThis.navigation?.addEventListener==`function`;function k(e){let t,n=!1;return{run(){n||(n=!0,t=new URL(location.href),O?globalThis.navigation.addEventListener(`navigate`,e=>{let n=new URL(e.destination.url);n.href!==t.href&&(window.dispatchEvent(new E(n,t)),t=n)},{signal:e.signal}):e.setInterval(()=>{let e=new URL(location.href);e.href!==t.href&&(window.dispatchEvent(new E(e,t)),t=e)},1e3))}}}var A=class e{static SCRIPT_STARTED_MESSAGE_TYPE=D(`wxt:content-script-started`);id;abortController;locationWatcher=k(this);constructor(e,t){this.contentScriptName=e,this.options=t,this.id=Math.random().toString(36).slice(2),this.abortController=new AbortController,this.stopOldScripts(),this.listenForNewerScripts()}get signal(){return this.abortController.signal}abort(e){return this.abortController.abort(e)}get isInvalid(){return T.runtime?.id??this.notifyInvalidated(),this.signal.aborted}get isValid(){return!this.isInvalid}onInvalidated(e){return this.signal.addEventListener(`abort`,e),()=>this.signal.removeEventListener(`abort`,e)}block(){return new Promise(()=>{})}setInterval(e,t){let n=setInterval(()=>{this.isValid&&e()},t);return this.onInvalidated(()=>clearInterval(n)),n}setTimeout(e,t){let n=setTimeout(()=>{this.isValid&&e()},t);return this.onInvalidated(()=>clearTimeout(n)),n}requestAnimationFrame(e){let t=requestAnimationFrame((...t)=>{this.isValid&&e(...t)});return this.onInvalidated(()=>cancelAnimationFrame(t)),t}requestIdleCallback(e,t){let n=requestIdleCallback((...t)=>{this.signal.aborted||e(...t)},t);return this.onInvalidated(()=>cancelIdleCallback(n)),n}addEventListener(e,t,n,r){t===`wxt:locationchange`&&this.isValid&&this.locationWatcher.run(),e.addEventListener?.(t.startsWith(`wxt:`)?D(t):t,n,{...r,signal:this.signal})}notifyInvalidated(){this.abort(`Content script context invalidated`),w.debug(`Content script "${this.contentScriptName}" context invalidated`)}stopOldScripts(){document.dispatchEvent(new CustomEvent(e.SCRIPT_STARTED_MESSAGE_TYPE,{detail:{contentScriptName:this.contentScriptName,messageId:this.id}})),window.postMessage({type:e.SCRIPT_STARTED_MESSAGE_TYPE,contentScriptName:this.contentScriptName,messageId:this.id},`*`)}verifyScriptStartedEvent(e){let t=e.detail?.contentScriptName===this.contentScriptName,n=e.detail?.messageId===this.id;return t&&!n}listenForNewerScripts(){let t=e=>{!(e instanceof CustomEvent)||!this.verifyScriptStartedEvent(e)||this.notifyInvalidated()};document.addEventListener(e.SCRIPT_STARTED_MESSAGE_TYPE,t),this.onInvalidated(()=>document.removeEventListener(e.SCRIPT_STARTED_MESSAGE_TYPE,t))}},j={debug:(...e)=>([...e],void 0),log:(...e)=>([...e],void 0),warn:(...e)=>([...e],void 0),error:(...e)=>([...e],void 0)};return(async()=>{try{let{main:e,...t}=C;return await e(new A(`content`,t))}catch(e){throw j.error(`The content script "content" crashed on startup!`,e),e}})()})();
content;