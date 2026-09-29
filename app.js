/* CoachRAG — Updated Local-First AI Study Assistant */
'use strict';

const CONFIG = {
  server: 'http://127.0.0.1:5500',
  ollama: 'http://localhost:11434/api/chat',
  model: 'qwen2.5:3b',
  storageKey: 'coachrag_multicolor_v1',
  maxContext: 14000
};

const state = {
  documents: [],
  citations: [],
  sessions: [],
  tab: 'library',
  busy: false,
  chat: []
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const esc = value =>
  String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));

const uid = () =>
  crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

/* =========================
   CHAT DESIGN FIXES
========================= */

function ensureChatStyles() {
  if (document.getElementById('coachrag-chat-fixes')) return;

  const style = document.createElement('style');
  style.id = 'coachrag-chat-fixes';

  style.textContent = `
    .chat-layout {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 260px;
      gap: 20px;
      align-items: start;
    }

    .chat-card {
      display: flex;
      flex-direction: column;
      min-width: 0;
      min-height: 620px;
      overflow: hidden;
    }

    .chat-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border, #273449);
    }

    .chat-messages {
      display: flex;
      flex-direction: column;
      gap: 22px;
      min-height: 300px;
      max-height: 58vh;
      overflow-y: auto;
      padding: 24px 20px;
      scroll-behavior: smooth;
    }

    .message {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: 100%;
    }

    .message.user {
      align-items: flex-end;
    }

    .message.assistant {
      align-items: flex-start;
    }

    .message-label {
      font-size: 13px;
      font-weight: 600;
      color: var(--muted, #aab5c7);
    }

    .message-bubble {
      max-width: min(850px, 100%);
      padding: 16px;
      border: 1px solid var(--border, #273449);
      border-radius: 14px;
      background: #151f35;
      color: #e7edf8;
      line-height: 1.75;
      font-size: 14px;
      overflow-wrap: anywhere;
    }

    .message.user .message-bubble {
      background: #202b46;
      border-color: #344362;
    }

    .message-bubble p {
      margin: 0 0 14px;
    }

    .message-bubble p:last-child {
      margin-bottom: 0;
    }

    .message-bubble h1,
    .message-bubble h2,
    .message-bubble h3 {
      margin: 18px 0 10px;
      line-height: 1.4;
      color: #f4f6ff;
    }

    .message-bubble h1 { font-size: 21px; }
    .message-bubble h2 { font-size: 18px; }
    .message-bubble h3 { font-size: 16px; }

    .message-bubble ul,
    .message-bubble ol {
      padding-left: 24px;
      margin: 10px 0 16px;
    }

    .message-bubble li {
      margin: 5px 0;
    }

    .message-bubble code {
      padding: 2px 6px;
      border-radius: 5px;
      background: #0b1222;
      color: #c9b8ff;
      font-family: Consolas, monospace;
      font-size: 13px;
    }

    .message-bubble .markdown-code {
      padding: 16px;
      margin: 12px 0;
      overflow-x: auto;
      border: 1px solid #34415b;
      border-radius: 10px;
      background: #080e1c;
      line-height: 1.6;
      max-width: 100%;
    }

    .message-bubble .markdown-code code {
      padding: 0;
      background: transparent;
      color: #dce7ff;
      white-space: pre;
    }

    .chat-composer {
      position: sticky;
      bottom: 0;
      z-index: 2;
      padding: 16px 20px;
      border-top: 1px solid var(--border, #273449);
      background: #10182c;
    }

    .composer-wrap {
      display: flex;
      align-items: flex-end;
      gap: 12px;
      width: 100%;
      padding: 8px;
      border: 1px solid #34415b;
      border-radius: 12px;
      background: #151f35;
    }

    .composer-wrap textarea {
      flex: 1;
      width: 100%;
      min-width: 0;
      min-height: 44px;
      max-height: 150px;
      padding: 12px;
      resize: vertical;
      border: 0;
      outline: none;
      background: transparent;
      color: #f4f6ff;
      font: inherit;
    }

    .composer-wrap button {
      flex-shrink: 0;
      min-height: 42px;
    }

    .composer-hint {
      margin-top: 8px;
      text-align: center;
      font-size: 11px;
      color: #9aa8c0;
    }

    .chat-side {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    @media (max-width: 900px) {
      .chat-layout {
        grid-template-columns: minmax(0, 1fr);
      }

      .chat-side {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      }
    }

    @media (max-width: 600px) {
      .chat-messages {
        padding: 16px 12px;
        max-height: 55vh;
      }

      .chat-toolbar,
      .chat-composer {
        padding: 12px;
      }

      .message-bubble {
        max-width: 100%;
      }

      .composer-wrap {
        gap: 6px;
      }
    }
  `;

  document.head.appendChild(style);
}

/* =========================
   INITIALIZATION
========================= */

function init() {
  ensureChatStyles();
  load();

  $$('.nav-item, .nav button[data-tab]').forEach(button => {
    button.addEventListener('click', () => {
      navigate(normalizeTab(button.dataset.tab));
    });
  });

  $('#mobileMenu, #menuToggle')?.addEventListener('click', () => {
    $('#sidebar')?.classList.toggle('open');
  });

  $('#sidebarOverlay')?.addEventListener('click', () => {
    $('#sidebar')?.classList.remove('open');
  });

  $('#sidebarUpload')?.addEventListener('click', () => {
    navigate('library');
    setTimeout(() => $('#fileInput')?.click(), 0);
  });

  $('#exportButton')?.addEventListener('click', exportData);
  $('#topExportButton')?.addEventListener('click', exportData);

  document.addEventListener('click', event => {
    const action = event.target.closest('[data-action]');
    if (!action) return;

    const { action: name, id } = action.dataset;

    if (name === 'export') exportData();
    if (name === 'delete-document') deleteDocument(id);
    if (name === 'delete-citation') deleteCitation(id);
    if (name === 'delete-session') deleteSession(id);
    if (name === 'toggle-session') toggleSession(id);
    if (name === 'clear-citations') clearCitations();
    if (name === 'preview-document') previewDocument(id);

    if (name === 'ask-prompt') {
      navigate('ask');

      setTimeout(() => {
        const input = $('#questionInput');

        if (input) {
          input.value = action.dataset.prompt || '';
          input.focus();
        }
      }, 0);
    }
  });

  render();
}

/* =========================
   STORAGE
========================= */

function load() {
  try {
    const raw =
      localStorage.getItem(CONFIG.storageKey) ||
      localStorage.getItem('coachrag_data_v2');

    if (raw) {
      const data = JSON.parse(raw);

      state.documents = Array.isArray(data.documents)
        ? data.documents
        : Array.isArray(data.sources)
          ? data.sources
          : [];

      state.citations = Array.isArray(data.citations)
        ? data.citations
        : [];

      state.sessions = Array.isArray(data.sessions)
        ? data.sessions
        : [];
    } else {
      state.documents = readOld('coachrag-sources');
      state.citations = readOld('coachrag-citations');
      state.sessions = readOld('coachrag-sessions');
    }

    state.documents = state.documents.map(doc => ({
      ...doc,
      id: doc.id || uid(),
      content: doc.content || doc.text || ''
    }));
  } catch (error) {
    console.warn('Could not restore saved data:', error);
  }
}

function readOld(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function save() {
  try {
    localStorage.setItem(
      CONFIG.storageKey,
      JSON.stringify({
        documents: state.documents,
        citations: state.citations,
        sessions: state.sessions
      })
    );
  } catch {
    toast(
      'Browser storage is full. Remove large documents or export a backup.',
      'error'
    );
  }

  updateCounts();
}

function updateCounts() {
  if ($('#navDocCount')) {
    $('#navDocCount').textContent = state.documents.length;
  }

  if ($('#navCitationCount')) {
    $('#navCitationCount').textContent = state.citations.length;
  }

  if ($('#sidebarDocumentCount')) {
    $('#sidebarDocumentCount').textContent = state.documents.length;
  }
}

/* =========================
   NAVIGATION
========================= */

function normalizeTab(tab) {
  const value = String(tab || '').toLowerCase();

  if (value.includes('ask') || value.includes('question')) return 'ask';
  if (value.includes('citation') || value.includes('source')) return 'citations';
  if (value.includes('session') || value.includes('study')) return 'sessions';

  return 'library';
}

function navigate(tab) {
  state.tab = normalizeTab(tab);
  $('#sidebar')?.classList.remove('open');
  render();
}

window.switchTab = (button, tab) => {
  navigate(tab || button?.dataset?.tab);
};

function render() {
  updateCounts();

  const titles = {
    library: 'Knowledge library',
    ask: 'Ask CoachRAG',
    citations: 'Source citations',
    sessions: 'Study sessions'
  };

  const titleNode = $('#topbarTitle') || $('#breadcrumbCurrent');

  if (titleNode) {
    titleNode.textContent = titles[state.tab] || 'Workspace';
  }

  $$('.nav-item, .nav button[data-tab]').forEach(button => {
    button.classList.toggle(
      'active',
      normalizeTab(button.dataset.tab) === state.tab
    );
  });

  if (state.tab === 'library') renderLibrary();
  else if (state.tab === 'ask') renderAsk();
  else if (state.tab === 'citations') renderCitations();
  else renderSessions();
}

/* =========================
   KNOWLEDGE LIBRARY
========================= */

function renderLibrary(filter = '') {
  const docs = state.documents.filter(doc =>
    (doc.name || '').toLowerCase().includes(filter.toLowerCase())
  );

  $('#mainContent').innerHTML = `
    <section class="page-heading">
      <div>
        <div class="eyebrow">Your learning hub</div>
        <h1>Knowledge library</h1>
        <p>Keep your study materials organized and ready for AI-powered answers.</p>
      </div>
      <button class="btn btn-primary" id="uploadTop">＋ Add documents</button>
    </section>

    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-icon">📚</span>
        <span class="stat-label">Documents saved</span>
        <strong class="stat-value">${state.documents.length}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-icon">🔎</span>
        <span class="stat-label">Sources collected</span>
        <strong class="stat-value">${state.citations.length}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-icon">✨</span>
        <span class="stat-label">Study sessions</span>
        <strong class="stat-value">${state.sessions.length}</strong>
      </div>
    </div>

    <div class="content-card upload-card">
      <div class="upload-symbol">⇧</div>
      <div class="upload-copy">
        <h3>Bring your notes into CoachRAG</h3>
        <p>PDF, DOCX, TXT and Markdown · Files stay in this browser</p>
      </div>
      <button class="btn btn-primary" id="browseFiles">Browse files</button>
      <input id="fileInput" type="file"
        accept=".pdf,.docx,.txt,.md,.markdown" multiple hidden>
    </div>

    <div class="section-title">
      <h2>Your documents <span class="muted">(${docs.length})</span></h2>
      <label class="search-box">
        <span>⌕</span>
        <input id="docSearch" placeholder="Search documents..."
          value="${esc(filter)}">
      </label>
    </div>

    <div class="document-grid">
      ${
        docs.length
          ? docs.map(docCard).join('')
          : `<div class="empty-state">
              <div class="empty-icon">🗂️</div>
              <h3>${filter ? 'No matching documents' : 'Your library is ready'}</h3>
              <p>${filter ? 'Try another search term.' : 'Upload class notes, textbooks, or assignments to get started.'}</p>
            </div>`
      }
    </div>
  `;

  $('#uploadTop').onclick = () => $('#fileInput').click();
  $('#browseFiles').onclick = () => $('#fileInput').click();

  $('#fileInput').onchange = async event => {
    await addFiles([...event.target.files]);
    event.target.value = '';
  };

  $('#docSearch').oninput = event => {
    renderLibrary(event.target.value);
  };

  const uploadCard = $('.upload-card');

  uploadCard.ondragover = event => {
    event.preventDefault();
    uploadCard.style.borderColor = '#7655e8';
  };

  uploadCard.ondragleave = () => {
    uploadCard.style.borderColor = '';
  };

  uploadCard.ondrop = event => {
    event.preventDefault();
    uploadCard.style.borderColor = '';
    addFiles([...event.dataTransfer.files]);
  };
}

function docCard(doc) {
  const ext = (doc.name || '').split('.').pop().toLowerCase();
  const kind = ['pdf', 'docx', 'md'].includes(ext) ? ext : 'txt';
  const icon = { pdf: 'PDF', docx: 'W', md: 'M', txt: 'TXT' }[kind];

  return `
    <article class="document-card">
      <div class="file-icon ${kind}">${icon}</div>
      <div class="doc-info">
        <h3 title="${esc(doc.name)}">${esc(doc.name || 'Untitled document')}</h3>
        <p>${kind.toUpperCase()} · ${formatBytes(doc.size || new Blob([doc.content || '']).size)} · ${doc.content ? 'Text ready' : 'No extracted text'}</p>
      </div>
      <div class="doc-actions">
        <button class="icon-btn" title="Preview"
          data-action="preview-document" data-id="${esc(doc.id)}">↗</button>
        <button class="icon-btn" title="Delete"
          data-action="delete-document" data-id="${esc(doc.id)}">×</button>
      </div>
    </article>
  `;
}

/* =========================
   DOCUMENT UPLOAD
========================= */

async function addFiles(files) {
  for (const file of files) {
    try {
      const content = await extractText(file);

      if (!content.trim()) {
        toast(`${file.name}: no readable text found`, 'error');
        continue;
      }

      state.documents.unshift({
        id: uid(),
        name: file.name,
        type: file.type,
        size: file.size,
        content,
        createdAt: new Date().toISOString()
      });

      save();
      toast(`Added ${file.name}`, 'success');
    } catch (error) {
      console.error(error);
      toast(`${file.name}: ${error.message}`, 'error');
    }
  }

  renderLibrary($('#docSearch')?.value || '');
}

async function extractText(file) {
  const ext = file.name.split('.').pop().toLowerCase();

  if (['txt', 'md', 'markdown'].includes(ext)) {
    return file.text();
  }

  if (ext === 'pdf') {
    if (!window.pdfjsLib) {
      throw new Error('PDF.js did not load. Check your internet connection.');
    }

    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    const pdf = await pdfjsLib.getDocument({
      data: await file.arrayBuffer()
    }).promise;

    const pages = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const text = await page.getTextContent();
      pages.push(text.items.map(item => item.str).join(' '));
    }

    return pages.join('\n\n');
  }

  if (ext === 'docx') {
    if (!window.mammoth) {
      throw new Error('DOCX reader did not load. Check your internet connection.');
    }

    const result = await mammoth.extractRawText({
      arrayBuffer: await file.arrayBuffer()
    });

    return result.value;
  }

  throw new Error('Unsupported format. Use PDF, DOCX, TXT or Markdown.');
}

/* =========================
   DOCUMENT PREVIEW
========================= */

function previewDocument(id) {
  const doc = state.documents.find(item => item.id === id);
  if (!doc) return;

  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';

  modal.innerHTML = `
    <section class="preview-modal">
      <header>
        <div>
          <strong>${esc(doc.name)}</strong>
          <small>Document preview</small>
        </div>
        <button class="icon-btn" aria-label="Close">×</button>
      </header>
      <pre>${esc(doc.content || 'No extracted text available.')}</pre>
    </section>
  `;

  modal.querySelector('button').onclick = () => modal.remove();

  modal.onclick = event => {
    if (event.target === modal) modal.remove();
  };

  document.body.appendChild(modal);
}

function deleteDocument(id) {
  if (!confirm('Delete this document from your library?')) return;

  state.documents = state.documents.filter(doc => doc.id !== id);
  save();
  renderLibrary();
  toast('Document removed', 'success');
}

/* =========================
   ASK COACHRAG
========================= */

function renderAsk() {
  $('#mainContent').innerHTML = `
    <section class="page-heading">
      <div>
        <div class="eyebrow">Your AI study companion</div>
        <h1>Ask CoachRAG</h1>
        <p>Ask about your notes, explore a topic, or research the web.</p>
      </div>
    </section>

    <div class="chat-layout">
      <section class="content-card chat-card">
        <div class="chat-toolbar">
          <div class="chat-toolbar-left">
            <div class="assistant-orb">✦</div>
            <div>
              <strong>CoachRAG assistant</strong>
              <small><span class="status-dot"></span> Ready to help you learn</small>
            </div>
          </div>

          <select id="answerMode" class="mode-select" aria-label="Answer mode">
            <option value="auto">Auto mode</option>
            <option value="documents">My documents</option>
            <option value="local">Local AI</option>
            <option value="web">Web search</option>
          </select>
        </div>

        <div class="chat-messages" id="chatMessages">
          ${
            state.chat.length
              ? state.chat.map(messageHTML).join('')
              : `<div class="welcome-card">
                  <div class="welcome-graphic">✦</div>
                  <h2>What are we learning today?</h2>
                  <p>Ask a question, summarize your notes, or explore a new concept. Your documents and local AI are just a message away.</p>
                  <div class="prompt-chips">
                    <button class="prompt-chip" data-action="ask-prompt"
                      data-prompt="Summarize my uploaded documents">Summarize my notes</button>
                    <button class="prompt-chip" data-action="ask-prompt"
                      data-prompt="Explain a difficult concept in simple terms">Explain a concept</button>
                    <button class="prompt-chip" data-action="ask-prompt"
                      data-prompt="Create five quiz questions from my documents">Create a quiz</button>
                  </div>
                </div>`
          }
        </div>

        <form class="chat-composer" id="questionForm">
          <div class="composer-wrap">
            <textarea id="questionInput" rows="1"
              placeholder="Ask anything about your studies..." required></textarea>
            <button class="btn btn-primary" id="askButton" type="submit">Ask ✦</button>
          </div>
          <div class="composer-hint">Enter to send · Shift + Enter for a new line</div>
        </form>
      </section>

      <aside class="chat-side">
        <div class="content-card side-info">
          <h3>Choose your source</h3>
          <div class="mode-list">
            <div class="mode-row"><span class="mode-dot"></span> Auto — choose for you</div>
            <div class="mode-row"><span class="mode-dot"></span> My documents — grounded answers</div>
            <div class="mode-row"><span class="mode-dot"></span> Local AI — Ollama</div>
            <div class="mode-row"><span class="mode-dot"></span> Web search — current sources</div>
          </div>
        </div>

        <div class="content-card side-info">
          <h3>Your workspace</h3>
          <p>${state.documents.length} document(s) available for document-based answers. Local AI requires Ollama to be running. Web search requires the CoachRAG Python server.</p>
        </div>

        <div class="content-card side-info">
          <h3>Privacy note</h3>
          <p>Document text is stored in this browser. Local AI requests are sent to your local Ollama service.</p>
        </div>
      </aside>
    </div>
  `;

  $('#questionForm').onsubmit = submitQuestion;

  $('#questionInput').onkeydown = event => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      $('#questionForm').requestSubmit();
    }
  };

  $$('.prompt-chip').forEach(button => {
    button.onclick = () => {
      $('#questionInput').value = button.dataset.prompt;
      $('#questionInput').focus();
    };
  });

  const box = $('#chatMessages');
  box.scrollTop = box.scrollHeight;
}

/* =========================
   MARKDOWN FORMATTING
========================= */

function renderMarkdown(input) {
  if (!input) return '';

  const escaped = esc(input).replace(/\r\n?/g, '\n');
  const codeBlocks = [];

  let source = escaped.replace(
    /```([^\n`]*)\n?([\s\S]*?)```/g,
    (_, language, code) => {
      const index = codeBlocks.length;
      const lang = String(language || '')
        .trim()
        .replace(/[^a-zA-Z0-9_-]/g, '');

      codeBlocks.push(
        `<pre class="markdown-code"><code${lang ? ` class="language-${lang}"` : ''}>${code.replace(/^\n|\n$/g, '')}</code></pre>`
      );

      return `\n@@CODE${index}@@\n`;
    }
  );

  function inline(text) {
    const inlineCodes = [];

    let value = text.replace(/`([^`]+)`/g, (_, code) => {
      const index = inlineCodes.length;
      inlineCodes.push(`<code>${code}</code>`);
      return `@@INLINE${index}@@`;
    });

    value = value
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.+?)__/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
      .replace(/(^|[^_])_([^_\n]+)_(?!_)/g, '$1<em>$2</em>');

    inlineCodes.forEach((html, index) => {
      value = value.replace(`@@INLINE${index}@@`, html);
    });

    return value;
  }

  const lines = source.split('\n');
  const out = [];
  let paragraph = [];
  let listType = null;
  let listItems = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      out.push(`<p>${paragraph.map(inline).join('<br>')}</p>`);
      paragraph = [];
    }
  };

  const flushList = () => {
    if (listType && listItems.length) {
      out.push(
        `<${listType}>${listItems.map(item => `<li>${inline(item)}</li>`).join('')}</${listType}>`
      );
    }

    listType = null;
    listItems = [];
  };

  for (const line of lines) {
    const codeMatch = line.match(/^@@CODE(\d+)@@$/);

    if (codeMatch) {
      flushParagraph();
      flushList();
      out.push(`@@CODE${codeMatch[1]}@@`);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);

    if (heading) {
      flushParagraph();
      flushList();

      const level = heading[1].length;
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      continue;
    }

    const unordered = line.match(/^\s*[-*+]\s+(.+)$/);
    const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);

    if (unordered || ordered) {
      flushParagraph();

      const nextType = unordered ? 'ul' : 'ol';

      if (listType && listType !== nextType) {
        flushList();
      }

      listType = nextType;
      listItems.push((unordered || ordered)[1]);
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();

  let html = out.join('\n');

  codeBlocks.forEach((block, index) => {
    html = html.replace(`@@CODE${index}@@`, block);
  });

  return html;
}

function safeSourceUrl(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

function messageHTML(message) {
  const role = message.role === 'user' ? 'user' : 'assistant';

  const body = role === 'assistant'
    ? renderMarkdown(message.text)
    : esc(message.text).replace(/\r?\n/g, '<br>');

  const sources = Array.isArray(message.sources)
    ? message.sources
    : [];

  return `
    <div class="message ${role}">
      <span class="message-label">
        ${role === 'user' ? 'You' : 'CoachRAG'}
      </span>

      <div class="message-bubble">${body}</div>

      ${
        sources.length
          ? `<div class="message-sources">
              <strong>Sources</strong>
              ${sources.map((source, index) => {
                const url = safeSourceUrl(source.url || '');
                const title = esc(source.title || source.url || 'Document');

                return `<div>[${index + 1}] ${
                  url
                    ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${title} ↗</a>`
                    : title
                }</div>`;
              }).join('')}
            </div>`
          : ''
      }
    </div>
  `;
}

/* =========================
   CHAT SUBMISSION
========================= */

async function submitQuestion(event) {
  event.preventDefault();

  if (state.busy) return;

  const input = $('#questionInput');
  const question = input.value.trim();

  if (!question) return;

  const mode = $('#answerMode').value;
  input.value = '';

  state.chat.push({ role: 'user', text: question });
  state.chat.push({ role: 'assistant', text: 'Thinking…' });

  renderAsk();
  state.busy = true;

  const askButton = $('#askButton');
  if (askButton) askButton.disabled = true;

  try {
    let result;

    if (mode === 'documents') {
      result = await answerDocuments(question);
    } else if (mode === 'local') {
      result = await answerLocal(question);
    } else if (mode === 'web') {
      result = await answerWeb(question);
    } else {
      result = await answerAuto(question);
    }

    state.chat[state.chat.length - 1] = {
      role: 'assistant',
      text: result.answer,
      sources: result.sources || []
    };
  } catch (error) {
    console.error(error);

    state.chat[state.chat.length - 1] = {
      role: 'assistant',
      text: `I couldn't complete that request: ${error.message}`
    };
  } finally {
    state.busy = false;
    renderAsk();
  }
}

/* =========================
   AUTOMATIC SOURCE SELECTION
========================= */

async function answerAuto(question) {
  const hits = findDocuments(question);
  const text = String(question || '').toLowerCase();

  const documentIntent =
    /(\b(my|the|this|these|uploaded|attached)\b.{0,35}\b(document|file|pdf|docx|notes|notebook|material|textbook|assignment)\b|\b(document|file|pdf|docx|notes|notebook|material|textbook|assignment)\b.{0,35}\b(say|says|state|states|mention|mentions|explain|summari[sz]e|according|in)\b|\b(uploaded|attached)\b)/i.test(question)
    || state.documents.some(doc =>
      doc.name && text.includes(doc.name.toLowerCase())
    );

  if (documentIntent) {
    return answerDocuments(question, hits);
  }

  if (
    hits.length &&
    hits[0].score >= 4 &&
    hits[0].score >= (hits[1]?.score || 0) + 2
  ) {
    return answerDocuments(question, hits);
  }

  return answerLocal(question);
}

/* =========================
   CHAT CONTEXT
========================= */

function priorChatMessages() {
  const prior = state.chat
    .slice(0, -2)
    .filter(message =>
      message &&
      (message.role === 'user' || message.role === 'assistant') &&
      message.text &&
      message.text !== 'Thinking…'
    );

  return prior.slice(-10).map(message => ({
    role: message.role === 'assistant' ? 'assistant' : 'user',
    content: String(message.text).slice(0, 4000)
  }));
}

/* =========================
   DOCUMENT SEARCH
========================= */

const STOP = new Set(
  'the and for are was were with from this that have has had what when where how why who which about into your you can could would should their them then than there these those does did do use using explain tell give make show latest developments'
    .split(' ')
);

function words(value) {
  return (
    String(value || '')
      .toLowerCase()
      .match(/[a-z0-9]{3,}/g) || []
  ).filter(word => !STOP.has(word));
}

function findDocuments(question) {
  const query = [...new Set(words(question))];

  return state.documents
    .map(doc => {
      const content = (doc.content || '').toLowerCase();
      let score = 0;

      query.forEach(word => {
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const matches = content.match(
          new RegExp(`\\b${escaped}\\b`, 'g')
        );

        score += Math.min(matches?.length || 0, 4);

        if ((doc.name || '').toLowerCase().includes(word)) {
          score += 2;
        }
      });

      return { doc, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
}

function chunks(content, question) {
  const paragraphs = String(content || '')
    .split(/\n{1,}/)
    .map(text => text.trim())
    .filter(Boolean);

  const query = [...new Set(words(question))];

  return paragraphs
    .map((paragraph, index) => ({
      paragraph,
      index,
      score: query.reduce(
        (total, word) =>
          total + (paragraph.toLowerCase().includes(word) ? 1 : 0),
        0
      )
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .sort((a, b) => a.index - b.index)
    .map(item => item.paragraph)
    .join('\n')
    .slice(0, 5000);
}

/* =========================
   DOCUMENT ANSWERS
========================= */

async function answerDocuments(question, providedHits) {
  const hits = providedHits || findDocuments(question);

  if (!hits.length) {
    return {
      answer: 'I could not find a relevant match in your uploaded documents. Try a more specific question or use Local AI/Web Search.',
      sources: []
    };
  }

  const sources = hits.map(item => ({
    title: item.doc.name || 'Uploaded document',
    url: '',
    type: 'document'
  }));

  const context = hits
    .map((item, index) =>
      `[${index + 1}] ${item.doc.name}\n${chunks(item.doc.content, question)}`
    )
    .join('\n\n')
    .slice(0, CONFIG.maxContext);

  const answer = await ollama([
    {
      role: 'system',
      content: `You are CoachRAG, a careful study assistant.
Answer using only the supplied document excerpts for claims about the user's files.
Do not invent details.
If the excerpts do not answer the question, say what is missing.
Use clear, student-friendly language and cite document numbers like [1].

DOCUMENT EXCERPTS:
${context}`
    },
    ...priorChatMessages(),
    { role: 'user', content: question }
  ]);

  return { answer, sources };
}

/* =========================
   GENERAL LOCAL AI
========================= */

async function answerLocal(question) {
  const answer = await ollama([
    {
      role: 'system',
      content: `You are CoachRAG, a helpful general-purpose AI study assistant.
Answer questions on any topic you can handle, not only uploaded documents.
Explain clearly and accurately, using headings, numbered steps, examples, or code when useful.
Do not invent citations.
For current events, be transparent that local model knowledge may be outdated.`
    },
    ...priorChatMessages(),
    { role: 'user', content: question }
  ]);

  return { answer, sources: [] };
}

/* =========================
   OLLAMA API
========================= */

async function ollama(messages) {
  const response = await fetch(CONFIG.ollama, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: CONFIG.model,
      messages,
      stream: false
    })
  });

  if (!response.ok) {
    throw new Error(
      `Ollama HTTP ${response.status}. Start Ollama and check the model name.`
    );
  }

  const data = await response.json();

  if (!data.message?.content) {
    throw new Error('Ollama returned an empty answer.');
  }

  return data.message.content.trim();
}

/* =========================
   WEB SEARCH
========================= */

async function answerWeb(question) {
  const response = await fetch(
    `${CONFIG.server}/api/search?q=${encodeURIComponent(question)}`
  );

  if (!response.ok) {
    let message = `Web search HTTP ${response.status}`;

    try {
      message = (await response.json()).error || message;
    } catch {
      // Keep the HTTP error message.
    }

    throw new Error(message);
  }

  const data = await response.json();
  const results = Array.isArray(data.results) ? data.results : [];

  if (!results.length) {
    return {
      answer: 'No web results were returned. Try a different query or check whether the Python server can reach DuckDuckGo.',
      sources: []
    };
  }

  const sources = results.slice(0, 5).map(item => ({
    title: item.title || item.url,
    url: item.url || '',
    snippet: item.snippet || '',
    content: item.content || '',
    published_at: item.published_at || '',
    evidence_type: item.evidence_type || 'snippet'
  }));

  const context = sources.map((source, index) => `
[${index + 1}] ${source.title}
URL: ${source.url}
Published: ${source.published_at || 'not provided'}
Evidence: ${source.evidence_type}
${source.content || source.snippet || 'No readable text'}
`).join('\n').slice(0, CONFIG.maxContext);

  const answer = await ollama([
    {
      role: 'system',
      content: `You are CoachRAG, a web research assistant.
Use only the supplied search result evidence for current factual claims.
Do not invent facts, dates, or source details.
Treat snippets as limited evidence, and say when there is not enough information.
For latest/current questions, prioritize explicit publication dates; if dates are missing, say so.
Cite claims using [1], [2], etc.

SEARCH EVIDENCE:
${context}`
    },
    ...priorChatMessages(),
    { role: 'user', content: question }
  ]);

  const now = new Date().toISOString();

  const saved = sources.map((source, index) => ({
    id: uid(),
    title: source.title,
    url: source.url,
    snippet: source.snippet,
    published_at: source.published_at,
    question,
    number: index + 1,
    createdAt: now
  }));

  state.citations.unshift(...saved);
  save();

  return { answer, sources };
}

/* =========================
   SOURCE CITATIONS
========================= */

function renderCitations() {
  const items = state.citations;

  $('#mainContent').innerHTML = `
    <section class="page-heading">
      <div>
        <div class="eyebrow">Research history</div>
        <h1>Source citations</h1>
        <p>Web sources collected while researching with CoachRAG.</p>
      </div>
      <button class="btn btn-soft" data-action="clear-citations">
        Clear citations
      </button>
    </section>

    <div class="citation-list">
      ${
        items.length
          ? items.map((citation, index) => `
            <article class="citation-card">
              <div class="citation-top">
                <span class="citation-number">[${citation.number || index + 1}]</span>
                <div class="citation-main">
                  <h3>${esc(citation.title || 'Untitled source')}</h3>
                  <p>${esc(citation.snippet || 'No search snippet available.')}</p>
                  <div class="citation-meta">
                    Published: ${esc(citation.published_at || 'Date unavailable')}
                    · Saved: ${esc(formatDate(citation.createdAt))}
                  </div>
                  ${
                    citation.question
                      ? `<p class="small"><b>Question:</b> ${esc(citation.question)}</p>`
                      : ''
                  }
                  ${
                    citation.url
                      ? `<a class="citation-link" href="${esc(citation.url)}" target="_blank" rel="noopener noreferrer">Open source ↗</a>`
                      : ''
                  }
                </div>
                <button class="icon-btn"
                  data-action="delete-citation"
                  data-id="${esc(citation.id)}"
                  title="Delete citation">×</button>
              </div>
            </article>
          `).join('')
          : `<div class="empty-state">
              <div class="empty-icon">🔎</div>
              <h3>No sources saved yet</h3>
              <p>Use Web Search in Ask CoachRAG to collect citations.</p>
            </div>`
      }
    </div>
  `;
}

function deleteCitation(id) {
  state.citations = state.citations.filter(item => item.id !== id);
  save();
  renderCitations();
  toast('Citation deleted', 'success');
}

function clearCitations() {
  if (!confirm('Clear all saved citations?')) return;

  state.citations = [];
  save();
  renderCitations();
}

/* =========================
   STUDY SESSIONS
========================= */

function renderSessions() {
  const done = state.sessions.filter(session => session.completed).length;

  $('#mainContent').innerHTML = `
    <section class="page-heading">
      <div>
        <div class="eyebrow">Plan your progress</div>
        <h1>Study sessions</h1>
        <p>Turn your learning goals into manageable study tasks.</p>
      </div>
    </section>

    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-icon">🗓️</span>
        <span class="stat-label">Total sessions</span>
        <strong class="stat-value">${state.sessions.length}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-icon">✅</span>
        <span class="stat-label">Completed</span>
        <strong class="stat-value">${done}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-icon">🎯</span>
        <span class="stat-label">In progress</span>
        <strong class="stat-value">${state.sessions.length - done}</strong>
      </div>
    </div>

    <form id="sessionForm" class="content-card session-form">
      <div class="section-title">
        <h2>Create a study session</h2>
        <span class="muted">Add a goal to your planner</span>
      </div>

      <input class="field" id="sessionTitle"
        placeholder="e.g. Revise machine learning basics"
        maxlength="100" required>

      <textarea class="field" id="sessionDescription"
        rows="3"
        placeholder="Notes or learning objectives (optional)"></textarea>

      <button class="btn btn-primary" type="submit">
        ＋ Create session
      </button>
    </form>

    <div class="section-title">
      <h2>Your study plan</h2>
      <span>${state.sessions.length} session(s)</span>
    </div>

    <div class="session-list">
      ${
        state.sessions.length
          ? state.sessions.map(session => `
            <article class="session-card">
              <div class="session-top">
                <div class="session-main">
                  <h3>${esc(session.title)}</h3>
                  <p>${esc(session.description || 'No description added.')}</p>
                  <span class="badge ${session.completed ? 'done' : 'progress'}">
                    ${session.completed ? 'Completed' : 'In progress'}
                  </span>
                  <div class="citation-meta" style="margin-top:8px">
                    Created ${esc(formatDate(session.createdAt))}
                  </div>
                </div>
              </div>

              <div class="session-actions">
                <button class="btn btn-soft"
                  data-action="toggle-session"
                  data-id="${esc(session.id)}">
                  ${session.completed ? 'Reopen session' : 'Mark complete'}
                </button>
                <button class="btn btn-danger"
                  data-action="delete-session"
                  data-id="${esc(session.id)}">Delete</button>
              </div>
            </article>
          `).join('')
          : `<div class="empty-state">
              <div class="empty-icon">🌱</div>
              <h3>Your study plan starts here</h3>
              <p>Create a session above to keep track of what you want to learn.</p>
            </div>`
      }
    </div>
  `;

  $('#sessionForm').onsubmit = event => {
    event.preventDefault();

    const title = $('#sessionTitle').value.trim();
    if (!title) return;

    state.sessions.unshift({
      id: uid(),
      title,
      description: $('#sessionDescription').value.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    });

    save();
    renderSessions();
    toast('Study session created', 'success');
  };
}

function toggleSession(id) {
  const session = state.sessions.find(item => item.id === id);
  if (!session) return;

  session.completed = !session.completed;
  save();
  renderSessions();
}

function deleteSession(id) {
  if (!confirm('Delete this study session?')) return;

  state.sessions = state.sessions.filter(item => item.id !== id);
  save();
  renderSessions();
  toast('Study session deleted', 'success');
}

/* =========================
   EXPORT AND UTILITIES
========================= */

function exportData() {
  const backup = {
    exportedAt: new Date().toISOString(),
    documents: state.documents,
    citations: state.citations,
    sessions: state.sessions
  };

  const blob = new Blob(
    [JSON.stringify(backup, null, 2)],
    { type: 'application/json' }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = 'coachrag-backup.json';
  link.click();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function formatDate(value) {
  if (!value) return 'Unknown date';

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? 'Unknown date'
    : date.toLocaleString();
}

function formatBytes(bytes) {
  if (!bytes) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    3
  );

  return `${(bytes / Math.pow(1024, index)).toFixed(index ? 1 : 0)} ${units[index]}`;
}

function toast(message, type = 'info') {
  const region = $('#toastRegion') || $('#toast');

  if (!region) {
    console.log(`[CoachRAG] ${message}`);
    return;
  }

  const element = document.createElement('div');
  element.className = `toast ${type}`;
  element.textContent = message;

  region.appendChild(element);
  setTimeout(() => element.remove(), 3500);
}

/* =========================
   START APPLICATION
========================= */

document.addEventListener('DOMContentLoaded', init);