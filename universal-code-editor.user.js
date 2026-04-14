// ==UserScript==
// @name         Universal OJ
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  OJ 代码编辑器
// @author       Sunse666
// @match        *://www.luogu.com.cn/problem/*
// @match        *://www.luogu.com.cn/contest/*/problem/*
// @match        *://codeforces.com/contest/*/problem/*
// @match        *://codeforces.com/problemset/problem/*/*
// @match        *://codeforces.com/gym/*/problem/*
// @match        *://codeforces.com/group/*/contest/*/problem/*
// @match        *://ac.nowcoder.com/acm/problem/*
// @match        *://ac.nowcoder.com/acm/contest/*
// @match        *://*/problem/*
// @match        *://*/contest/*/problem/*
// @grant        GM_addStyle
// @require      https://cdn.bootcdn.net/ajax/libs/highlight.js/11.11.1/highlight.min.js
// @require      https://cdn.bootcdn.net/ajax/libs/highlight.js/11.11.1/languages/go.min.js
// @run-at       document-end
// ==/UserScript==

(function() {
  'use strict';

  console.log('[Universal OJ] 脚本启动');

  //平台配置
  const platformConfigs = {
    luogu: {
      name: '洛谷',
      match: /luogu\.com\.cn/,
      selectors: {
        title: '.lfe-h1, h1[class*="title"]',
        content: '.lfe-marked-wrap, .problem-markdown-content',
        buttonContainer: '.ide-toolbar .actions, .problem .actions',
        submitBtn: 'a[class*="title"]:has(.fa-paper-plane)',
        codeEditor: '.cm-editor, .CodeMirror, textarea.lfe-code',
        problemId: () => {
          const match = window.location.pathname.match(/\/problem\/(P\d+|[A-Z]+\d+)/);
          return match ? match[1] : 'unknown';
        }
      },
      getProblemInfo: function() {
        let html = '';
        
        //获取标题
        const titleEl = document.querySelector(this.selectors.title);
        if (titleEl) {
          html += `<h4 style="color:#89b4fa;font-size:15px;margin:0 0 15px 0;padding-bottom:8px;border-bottom:1px solid #45475a;">${escapeHtml(titleEl.textContent.trim())}</h4>`;
        }

        //获取题目内容
        const contentEl = document.querySelector('.problem[data-v-3bac9eed]');
        if (contentEl) {
          const cloned = contentEl.cloneNode(true);
          
          cloned.querySelectorAll('button, .lfe-caption, .problem-block-actions, .io-sample').forEach(el => el.remove());
          cloned.querySelectorAll('.lfe-h2').forEach(h2 => {
            h2.style.color = '#cba6f7';
            h2.style.fontSize = '14px';
            h2.style.marginTop = '15px';
            h2.style.marginBottom = '8px';
          });

          //处理代码块
          cloned.querySelectorAll('pre code').forEach(code => {
            code.style.background = '#11111b';
            code.style.padding = '12px';
            code.style.borderRadius = '6px';
            code.style.color = '#a6e3a1';
            code.style.fontSize = '12px';
          });

          html += `<div class="problem-content" style="font-size:13px;line-height:1.8;color:#cdd6f4;">${cloned.innerHTML}</div>`;
        }

        //处理样例
        const samples = document.querySelectorAll('.io-sample');
        if (samples.length > 0) {
          html += `<h5 style="color:#cba6f7;font-size:14px;margin-top:20px;margin-bottom:10px;">样例数据</h5>`;
          samples.forEach((sample, idx) => {
            const inputEl = sample.querySelector('.io-sample-block:first-child pre');
            const outputEl = sample.querySelector('.io-sample-block:last-child pre');
            
            if (inputEl || outputEl) {
              html += `<div style="margin-bottom:15px;">`;
              html += `<p style="color:#f9e2af;font-weight:bold;font-size:13px;margin:8px 0;">样例 ${idx + 1}</p>`;
              
              if (inputEl) {
                html += `<p style="color:#a6adc8;font-size:12px;margin:5px 0;">输入：</p>`;
                html += `<pre style="background:#11111b;padding:10px;border-radius:6px;color:#a6e3a1;font-size:12px;overflow:auto;">${escapeHtml(inputEl.textContent)}</pre>`;
              }
              
              if (outputEl) {
                html += `<p style="color:#a6adc8;font-size:12px;margin:5px 0;">输出：</p>`;
                html += `<pre style="background:#11111b;padding:10px;border-radius:6px;color:#a6e3a1;font-size:12px;overflow:auto;">${escapeHtml(outputEl.textContent)}</pre>`;
              }
              
              html += `</div>`;
            }
          });
        }

        return html || '<p style="color:#f38ba8;">无法获取题目信息</p>';
      },
      syncCode: function(code) {
        const cmElement = document.querySelector('.cm-editor');
        if (cmElement) {
          if (cmElement.cmView && cmElement.cmView.view) {
            const view = cmElement.cmView.view;
            view.dispatch({
              changes: {from: 0, to: view.state.doc.length, insert: code}
            });
            console.log('[Universal OJ] 已通过 CodeMirror 6 API 同步代码');
            return true;
          }
          
          const contentEl = cmElement.querySelector('.cm-content[contenteditable="true"]');
          if (contentEl) {
            contentEl.textContent = code;
            contentEl.dispatchEvent(new Event('input', { bubbles: true }));
            console.log('[Universal OJ] 已通过 contenteditable 同步代码');
            return true;
          }
        }

        const textarea = document.querySelector('textarea[class*="cm-"], textarea.lfe-code');
        if (textarea) {
          textarea.value = code;
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
          console.log('[Universal OJ] 已通过 textarea 同步代码');
          return true;
        }

        return false;
      }
    },

    nowcoder: {
      name: '牛客网',
      match: /nowcoder\.com/,
      selectors: {
        title: '.terminal-topic h2.subject-item-title',
        content: '.terminal-topic',
        buttonContainer: '.question-operate, .terminal-topic-operation',
        submitBtn: 'button.runcode-btn, button[type="submit"]',
        codeEditor: '.CodeMirror, #codeMirror, textarea[name="code"]',
        problemId: () => {
          const problemMatch = window.location.pathname.match(/\/acm\/problem\/(\d+)/);
          if (problemMatch) {
            return problemMatch[1];
          }
          
          const contestMatch = window.location.pathname.match(/\/acm\/contest\/(\d+)\/([A-Z])/);
          if (contestMatch) {
            return `contest_${contestMatch[1]}_${contestMatch[2]}`;
          }
          
          return 'unknown';
        }
      },
      getProblemInfo: function() {
        let html = '';
        
        function cleanKatexText(element) {
          const cloned = element.cloneNode(true);
          
          cloned.querySelectorAll('.katex-mathml').forEach(el => el.remove());
          cloned.querySelectorAll('.katex-html').forEach(el => {
            const text = el.textContent.trim();
            const textNode = document.createTextNode(text);
            el.parentNode.replaceChild(textNode, el);
          });
          
          cloned.querySelectorAll('.katex').forEach(el => {
            const text = el.textContent.trim();
            const textNode = document.createTextNode(text);
            el.parentNode.replaceChild(textNode, el);
          });
          
          return cloned;
        }
        
        const titleEl = document.querySelector('h2.subject-item-title');
        if (titleEl) {
          const titleText = titleEl.textContent.trim().replace(/只看题目描述.*$/s, '').trim();
          html += `<h4 style="color:#89b4fa;font-size:15px;margin:0 0 15px 0;padding-bottom:8px;border-bottom:1px solid #45475a;">${escapeHtml(titleText)}</h4>`;
        }

        const descEl = document.querySelector('.subject-describe .subject-question');
        if (descEl) {
          const cleaned = cleanKatexText(descEl);
          
          html += `<div class="problem-section" style="margin-bottom:20px;">`;
          html += `<h5 style="color:#cba6f7;font-size:14px;margin-bottom:10px;">题目描述</h5>`;
          html += `<div style="font-size:13px;line-height:1.8;color:#cdd6f4;white-space:pre-wrap;">${cleaned.innerHTML}</div>`;
          html += `</div>`;
        }

        const inputDescTitle = Array.from(document.querySelectorAll('h2')).find(h => h.textContent.includes('输入描述'));
        if (inputDescTitle) {
          const inputDescContent = inputDescTitle.nextElementSibling;
          if (inputDescContent && inputDescContent.tagName === 'PRE') {
            const cleaned = cleanKatexText(inputDescContent);
            html += `<div class="problem-section" style="margin-bottom:20px;">`;
            html += `<h5 style="color:#cba6f7;font-size:14px;margin-bottom:10px;">输入描述</h5>`;
            html += `<div style="background:#11111b;padding:12px;border-radius:6px;color:#a6e3a1;font-size:12px;overflow:auto;white-space:pre-wrap;line-height:1.6;">${cleaned.textContent}</div>`;
            html += `</div>`;
          }
        }

        const outputDescTitle = Array.from(document.querySelectorAll('h2')).find(h => h.textContent.includes('输出描述'));
        if (outputDescTitle) {
          const outputDescContent = outputDescTitle.nextElementSibling;
          if (outputDescContent && outputDescContent.tagName === 'PRE') {
            const cleaned = cleanKatexText(outputDescContent);
            html += `<div class="problem-section" style="margin-bottom:20px;">`;
            html += `<h5 style="color:#cba6f7;font-size:14px;margin-bottom:10px;">输出描述</h5>`;
            html += `<div style="background:#11111b;padding:12px;border-radius:6px;color:#a6e3a1;font-size:12px;overflow:auto;white-space:pre-wrap;line-height:1.6;">${cleaned.textContent}</div>`;
            html += `</div>`;
          }
        }

        const exampleSection = document.querySelector('.question-oi');
        if (exampleSection) {
          html += `<h5 style="color:#cba6f7;font-size:14px;margin-top:20px;margin-bottom:10px;">示例</h5>`;
          
          const inputDiv = exampleSection.querySelector('.question-oi-mod:nth-child(1) .question-oi-cont pre');
          const outputDiv = exampleSection.querySelector('.question-oi-mod:nth-child(2) .question-oi-cont pre');
          
          if (inputDiv || outputDiv) {
            html += `<div style="margin-bottom:15px;">`;
            
            if (inputDiv) {
              html += `<p style="color:#a6adc8;font-size:12px;margin:5px 0;">输入：</p>`;
              html += `<pre style="background:#11111b;padding:10px;border-radius:6px;color:#a6e3a1;font-size:12px;overflow:auto;white-space:pre-wrap;">${escapeHtml(inputDiv.textContent)}</pre>`;
            }
            
            if (outputDiv) {
              html += `<p style="color:#a6adc8;font-size:12px;margin:5px 0 5px 0;">输出：</p>`;
              html += `<pre style="background:#11111b;padding:10px;border-radius:6px;color:#a6e3a1;font-size:12px;overflow:auto;white-space:pre-wrap;">${escapeHtml(outputDiv.textContent)}</pre>`;
            }
            
            html += `</div>`;
          }
          
          const explanationDiv = exampleSection.querySelector('.question-oi-mod:last-child .question-oi-cont pre');
          if (explanationDiv) {
            const cleaned = cleanKatexText(explanationDiv);
            html += `<p style="color:#a6adc8;font-size:12px;margin:10px 0 5px 0;">说明：</p>`;
            html += `<div style="background:#11111b;padding:10px;border-radius:6px;color:#cdd6f4;font-size:12px;overflow:auto;white-space:pre-wrap;line-height:1.6;">${cleaned.textContent}</div>`;
          }
        }

        return html || '<p style="color:#f38ba8;">无法获取题目信息</p>';
      },
      syncCode: function(code) {
        const cmElement = document.querySelector('.CodeMirror');
        if (cmElement && cmElement.CodeMirror) {
          cmElement.CodeMirror.setValue(code);
          console.log('[Universal OJ] 已通过 CodeMirror API 同步代码');
          return true;
        }

        const cmById = document.getElementById('codeMirror');
        if (cmById && cmById.CodeMirror) {
          cmById.CodeMirror.setValue(code);
          console.log('[Universal OJ] 已通过 CodeMirror (ID) 同步代码');
          return true;
        }

        const textarea = document.querySelector('textarea[name="code"]');
        if (textarea) {
          textarea.value = code;
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
          textarea.dispatchEvent(new Event('change', { bubbles: true }));
          console.log('[Universal OJ] 已通过 textarea 同步代码');
          return true;
        }

        return false;
      }
    },

    codeforces: {
      name: 'Codeforces',
      match: /codeforces\.com/,
      selectors: {
        title: '.problem-statement .header .title',
        content: '.problem-statement',
        buttonContainer: '.second-level-menu, .sidebox .rtable, .problem-statement .header',
        submitBtn: 'input[type="submit"]',
        codeEditor: '.CodeMirror, #sourceCodeTextarea',
        problemId: () => {
          const path = window.location.pathname;
          const m1 = path.match(/\/(contest|gym)\/(\d+)\/problem\/([A-Z]\d?)/);
          if (m1) return `cf_${m1[2]}${m1[3]}`;
          const m2 = path.match(/\/problemset\/problem\/(\d+)\/([A-Z]\d?)/);
          if (m2) return `cf_${m2[1]}${m2[2]}`;
          return 'cf_unknown';
        }
      },
      getProblemInfo: function() {
        const root = document.querySelector('.problem-statement');
        if (!root) return '<p style="color:#f38ba8;">无法找到题面</p>';

        const cloned = root.cloneNode(true);
        const header = cloned.querySelector('.header');
        let headerHtml = '';
        if (header) {
          const title = header.querySelector('.title')?.textContent || '';
          const time = header.querySelector('.time-limit')?.textContent.replace('time limit per test', '').trim() || '';
          const memory = header.querySelector('.memory-limit')?.textContent.replace('memory limit per test', '').trim() || '';
          
          headerHtml = `
            <h4 style="color:#89b4fa;font-size:16px;margin:0 0 8px 0;">${escapeHtml(title)}</h4>
            <div style="display:flex;gap:15px;margin-bottom:15px;padding-bottom:10px;border-bottom:1px solid #45475a;font-size:12px;color:#a6adc8;">
              <span>⏱️ ${time}</span>
              <span>💾 ${memory}</span>
            </div>
          `;
          header.remove();
        }

        cloned.querySelectorAll('.input-output-copier').forEach(el => el.remove());
        cloned.querySelectorAll('.tex-span').forEach(span => {
          span.style.fontFamily = '"Times New Roman", Times, serif';
          span.style.fontSize = '110%';
        });
        cloned.querySelectorAll('.section-title').forEach(st => {
          st.style.color = '#cba6f7';
          st.style.fontSize = '14px';
          st.style.fontWeight = 'bold';
          st.style.marginTop = '18px';
          st.style.marginBottom = '8px';
          st.style.borderLeft = '3px solid #cba6f7';
          st.style.paddingLeft = '8px';
        });

        const sampleTest = cloned.querySelector('.sample-tests');
        if (sampleTest) {
            sampleTest.querySelectorAll('.input, .output').forEach(block => {
                block.style.marginBottom = '10px';
                const title = block.querySelector('.title');
                if (title) {
                    title.style.color = '#f9e2af';
                    title.style.fontSize = '12px';
                    title.style.marginBottom = '4px';
                }
                const pre = block.querySelector('pre');
                if (pre) {
                    pre.style.background = '#11111b';
                    pre.style.padding = '10px';
                    pre.style.borderRadius = '6px';
                    pre.style.color = '#a6e3a1';
                    pre.style.border = '1px solid #45475a';
                    pre.style.margin = '0';
                }
            });
        }

        return `
          <div class="cf-content-wrapper" style="color:#cdd6f4; line-height:1.6;">
            ${headerHtml}
            ${cloned.innerHTML}
          </div>
        `;
      },
      syncCode: function(code) {
        const cmElement = document.querySelector('.CodeMirror');
        if (cmElement && cmElement.CodeMirror) {
          cmElement.CodeMirror.setValue(code);
          console.log('[Universal OJ] 已通过 CodeMirror API 同步代码');
          return true;
        }

        const textarea = document.getElementById('sourceCodeTextarea');
        if (textarea) {
          textarea.value = code;
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
          textarea.dispatchEvent(new Event('change', { bubbles: true }));
          console.log('[Universal OJ] 已通过 textarea 同步代码');
          return true;
        }

        return false;
      }
    }
  };

  function detectPlatform() {
    for (const [key, config] of Object.entries(platformConfigs)) {
      if (config.match.test(window.location.href)) {
        console.log(`[Universal OJ] 检测到平台: ${config.name}`);
        return { key, ...config };
      }
    }
    console.log('[Universal OJ] 未检测到支持的平台');
    return null;
  }

  const currentPlatform = detectPlatform();
  if (!currentPlatform) return;

  GM_addStyle(`
    .hljs{color:#ffffff;background:#0d1117}.hljs-doctag,.hljs-keyword,.hljs-meta .hljs-keyword,.hljs-template-tag,.hljs-template-variable,.hljs-type,.hljs-variable.language_{color:#ff7b72}.hljs-title,.hljs-title.class_,.hljs-title.class_.inherited__,.hljs-title.function_{color:#d2a8ff}.hljs-attr,.hljs-attribute,.hljs-literal,.hljs-meta,.hljs-number,.hljs-operator,.hljs-selector-attr,.hljs-selector-class,.hljs-selector-id,.hljs-variable{color:#79c0ff}.hljs-meta .hljs-string,.hljs-regexp,.hljs-string{color:#a5d6ff}.hljs-built_in,.hljs-symbol{color:#ffa657}.hljs-code,.hljs-comment,.hljs-formula{color:#8b949e}.hljs-name,.hljs-quote,.hljs-selector-pseudo,.hljs-selector-tag{color:#7ee787}.hljs-subst{color:#c9d1d9}.hljs-section{color:#1f6feb;font-weight:700}.hljs-bullet{color:#f2cc60}.hljs-emphasis{color:#c9d1d9;font-style:italic}.hljs-strong{color:#c9d1d9;font-weight:700}.hljs-addition{color:#aff5b4;background-color:#033a16}.hljs-deletion{color:#ffdcd7;background-color:#67060c}
  `);

  GM_addStyle(`
    .uoj-editor-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.85);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 99999;
    }
    .uoj-editor-overlay.active {
      display: flex;
    }
    .uoj-editor-container {
      width: 95%;
      max-width: 1200px;
      height: 90vh;
      background: #1e1e2e;
      border: 1px solid #45475a;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
    }
    .uoj-editor-header {
      padding: 14px 18px;
      border-bottom: 1px solid #45475a;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #313244;
      border-radius: 12px 12px 0 0;
    }
    .uoj-editor-header h3 {
      color: #89b4fa;
      font-size: 15px;
      margin: 0;
    }
    .uoj-editor-controls {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .uoj-lang-select {
      padding: 8px 14px;
      border: 1px solid #45475a;
      border-radius: 6px;
      background: #1e1e2e;
      color: #cdd6f4;
      font-size: 13px;
      cursor: pointer;
    }
    .uoj-close-btn {
      width: 32px;
      height: 32px;
      border: 1px solid #45475a;
      border-radius: 6px;
      background: #313244;
      color: #a6adc8;
      font-size: 20px;
      cursor: pointer;
    }
    .uoj-close-btn:hover {
      border-color: #f38ba8;
      color: #f38ba8;
    }
    .uoj-editor-body {
      flex: 1;
      display: flex;
      overflow: hidden;
      padding: 15px;
      gap: 15px;
    }
    .uoj-problem-panel {
      width: 40%;
      background: #313244;
      border-radius: 8px;
      padding: 15px;
      overflow: auto;
      color: #cdd6f4;
      font-size: 13px;
      line-height: 1.8;
    }
    .uoj-problem-panel::-webkit-scrollbar,
    .uoj-code-editor::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    .uoj-problem-panel::-webkit-scrollbar-track,
    .uoj-code-editor::-webkit-scrollbar-track {
      background: #1e1e2e;
      border-radius: 4px;
    }
    .uoj-problem-panel::-webkit-scrollbar-thumb,
    .uoj-code-editor::-webkit-scrollbar-thumb {
      background: #45475a;
      border-radius: 4px;
    }
    .uoj-problem-panel::-webkit-scrollbar-thumb:hover,
    .uoj-code-editor::-webkit-scrollbar-thumb:hover {
      background: #585b70;
    }
    .uoj-code-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #313244;
      border-radius: 8px;
      padding: 15px;
    }
    .uoj-editor-wrapper {
      flex: 1;
      display: flex;
      overflow: hidden;
      border: 1px solid #45475a;
      border-radius: 8px;
      background: #0d1117;
      margin-bottom: 12px;
      position: relative;
    }
    .uoj-line-numbers {
      width: 50px;
      background: #1e1e2e;
      border-right: 1px solid #45475a;
      padding: 12px 8px;
      text-align: right;
      color: #6c7086;
      overflow: hidden;
      flex-shrink: 0;
      user-select: none;
      line-height: 1.5 !important;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace !important;
      font-size: 14px !important;
      box-sizing: border-box;
    }
    .uoj-line-numbers div {
      line-height: 1.5 !important;
      height: 21px;
    }
    .uoj-code-area {
      flex: 1;
      position: relative;
      overflow: hidden;
      background: #0d1117;
    }
    .uoj-code-highlight {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 12px;
      background: transparent;
      pointer-events: none;
      z-index: 1;
      overflow: hidden;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace !important;
      font-size: 14px !important;
      line-height: 1.5 !important;
      white-space: pre;
      word-wrap: normal;
      box-sizing: border-box;
    }
    .uoj-code-highlight code {
      display: block;
      margin: 0;
      padding: 0;
      background: transparent;
      font-family: inherit !important;
      font-size: inherit !important;
      line-height: inherit !important;
      white-space: inherit;
    }
    .uoj-code-editor {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 12px;
      background: transparent;
      color: transparent;
      caret-color: #ffffff;
      resize: none;
      outline: none;
      z-index: 2;
      overflow: auto;
      white-space: pre;
      word-wrap: normal;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace !important;
      font-size: 14px !important;
      line-height: 1.5 !important;
      border: none;
      box-sizing: border-box;
      letter-spacing: 0;
    }
    .uoj-code-editor::selection {
      background: rgba(137, 180, 250, 0.3);
    }
    .uoj-editor-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .uoj-editor-info {
      font-size: 12px;
      color: #a6adc8;
    }
    .uoj-btn {
      padding: 10px 20px;
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
      border: none;
      background: #45475a;
      color: #cdd6f4;
    }
    .uoj-btn:hover {
      background: #89b4fa;
      color: #1e1e2e;
    }
    .uoj-open-btn-luogu {
      display: inline-flex !important;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border: 1px solid #52c41a;
      border-radius: 4px;
      background: transparent;
      color: #52c41a;
      font-size: 14px;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.3s;
      margin-left: 8px;
    }
    .uoj-open-btn-luogu:hover {
      background: #52c41a;
      color: #fff;
    }
    .uoj-open-btn-luogu .icon {
      display: flex;
      align-items: center;
    }
    .uoj-open-btn-luogu .text {
      font-weight: 500;
    }
    .uoj-problem-panel .tex-span {
      font-family: 'Times New Roman', serif;
      font-style: italic;
    }
    .uoj-problem-panel .tex-font-style-tt {
      font-family: 'Courier New', monospace;
      background: #11111b;
      padding: 2px 6px;
      border-radius: 3px;
    }
    .cf-content-wrapper p {
      margin-bottom: 12px;
    }
    .cf-content-wrapper ul {
      padding-left: 20px;
      margin-bottom: 12px;
    }
    .cf-content-wrapper .tex-span {
      padding: 0 2px;
      color: #f5e0dc;
    }
    .cf-content-wrapper .tex-font-style-it {
      font-style: italic;
    }
    .cf-content-wrapper .tex-font-style-bf {
      font-weight: bold;
    }
    .cf-content-wrapper pre, .cf-content-wrapper code {
      white-space: pre-wrap;
      word-break: break-all;
    }
    .problem-statement > div:nth-child(2) {
      font-size: 13px;
      margin-bottom: 20px;
    }
    .hljs-variable-enhanced {
        color: #79c0ff !important;
        font-weight: 500 !important;
    }
    .hljs-operator-enhanced {
        color: #ff7b72 !important;
        font-weight: bold !important;
    }
    .hljs-type-enhanced {
        color: #ffa657 !important;
        font-weight: 600 !important;
    }
    .hljs-variable-enhanced {
        color: #79c0ff !important;
        font-weight: 500 !important;
    }
    .bracket-level-0 { color: #FFD700; font-weight: bold; }
    .bracket-level-1 { color: #DA70D6; font-weight: bold; }
    .bracket-level-2 { color: #87CEEB; font-weight: bold; }
    .bracket-level-3 { color: #98FB98; font-weight: bold; }
    .bracket-level-4 { color: #FFA07A; font-weight: bold; }
    .bracket-level-5 { color: #F0E68C; font-weight: bold; }
  `);

  const codeTemplates = {
    c: ``,
    cpp: ``,
    go: ``,
    java: ``,
    javascript: ``,
    python: ``
  };

  const langNames = {
    c: 'C',
    cpp: 'C++',
    go: 'Go',
    java: 'Java',
    javascript: 'JavaScript',
    python: 'Python 3'
  };

  const langClasses = {
    c: 'language-c',
    cpp: 'language-cpp',
    go: 'language-go',
    java: 'language-java',
    javascript: 'language-javascript',
    python: 'language-python'
  };

  let currentLang = 'cpp';
  let problemId = null;

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function createLightbox() {
    if (document.getElementById('uojEditorOverlay')) return;

    const div = document.createElement('div');
    div.className = 'uoj-editor-overlay';
    div.id = 'uojEditorOverlay';
    div.innerHTML = `
      <div class="uoj-editor-container">
        <div class="uoj-editor-header">
          <h3>✏️ 代码编辑器 - ${currentPlatform.name}</h3>
          <div class="uoj-editor-controls">
            <select class="uoj-lang-select" id="uojLangSelect">
              <option value="c">C</option>
              <option value="cpp" selected>C++</option>
              <option value="go">Go</option>
              <option value="java">Java</option>
              <option value="javascript">JavaScript</option>
              <option value="python">Python 3</option>
            </select>
            <button class="uoj-close-btn" data-action="close">×</button>
          </div>
        </div>
        <div class="uoj-editor-body">
          <div class="uoj-problem-panel">
            <div id="uojProblemContent"></div>
          </div>
          <div class="uoj-code-panel">
            <div class="uoj-editor-wrapper">
              <div class="uoj-line-numbers" id="uojLineNumbers">1</div>
              <div class="uoj-code-area">
                <pre class="uoj-code-highlight"><code class="language-cpp hljs" id="uojHighlightCode"></code></pre>
                <textarea class="uoj-code-editor" id="uojCodeEditor" spellcheck="false" autocomplete="off"></textarea>
              </div>
            </div>
            <div class="uoj-editor-footer">
              <span class="uoj-editor-info" id="uojEditorInfo">行 1, 列 1 | C++</span>
              <div>
                <button class="uoj-btn" data-action="close">关闭</button>
                <button class="uoj-btn" id="uojConfirmBtn">确定</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(div);

    //事件绑定
    div.addEventListener('click', (e) => {
      if (e.target.dataset.action === 'close' || e.target === div) {
        closeEditor();
      }
    });

    document.getElementById('uojLangSelect').addEventListener('change', changeLanguage);
    document.getElementById('uojConfirmBtn').addEventListener('click', handleConfirm);

    const editor = document.getElementById('uojCodeEditor');
    editor.addEventListener('input', () => {
        updateCode();
        syncScroll();
    });
    editor.addEventListener('scroll', syncScroll);
    editor.addEventListener('keydown', handleKey);
    editor.addEventListener('click', updateCursorInfo);
    editor.addEventListener('keyup', updateCursorInfo);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeEditor();
    });

    if (currentPlatform.key === 'nowcoder') {
      GM_addStyle(`
        pre code.hljs {
          padding: 0 !important;
        }
        .uoj-code-highlight {
          padding: 10px 0 10px 10px !important;
          margin: 0 !important;
        }
        .uoj-code-highlight code {
          display: block;
          line-height: 1.5 !important;
          font-size: 14px !important;
          font-family: 'Consolas', 'Monaco', monospace !important;
        }
        .uoj-code-editor {
          padding: 12px 12px 12px 12px !important;
          margin: 0 !important;
          line-height: 1.5 !important;
          font-size: 14px !important;
          font-family: 'Consolas', 'Monaco', monospace !important;
          text-indent: 0 !important;
          border: none !important;
        }
        .uoj-line-numbers {
          padding: 12px 8px 12px 8px !important;
          line-height: 1.5 !important;
          font-size: 14px !important;
        }
        .uoj-line-numbers div {
          line-height: 1.5 !important;
          height: 21px !important;
          margin: 0 !important;
          padding: 0 !important;
        }
      `);
    } else if (currentPlatform.key === 'codeforces') {
      GM_addStyle(`
        .uoj-code-editor, 
        .uoj-code-highlight,
        .uoj-line-numbers {
          font-family: 'Courier New', 'Courier', monospace !important;
          line-height: 1.6 !important;
        }
        .uoj-line-numbers div {
          height: 22.4px;
        }
      `);
    } else if (currentPlatform.key === 'luogu') {
      GM_addStyle(`
        .uoj-code-highlight,
        .uoj-code-highlight *,
        .uoj-code-highlight code,
        .uoj-code-highlight code * {
          color: #ffffff !important;
        }
        .uoj-code-highlight .hljs-keyword,
        .uoj-code-highlight .hljs-type,
        .uoj-code-highlight .hljs-built_in {
          color: #ff7b72 !important;
        }
        .uoj-code-highlight .hljs-string,
        .uoj-code-highlight .hljs-regexp {
          color: #a5d6ff !important;
        }
        .uoj-code-highlight .hljs-comment,
        .uoj-code-highlight .hljs-formula {
          color: #8b949e !important;
        }
        .uoj-code-highlight .hljs-number,
        .uoj-code-highlight .hljs-literal {
          color: #79c0ff !important;
        }
        .uoj-code-highlight .hljs-title,
        .uoj-code-highlight .hljs-function {
          color: #d2a8ff !important;
        }
        .uoj-code-highlight .hljs-variable-enhanced {
          color: #79c0ff !important;
          font-weight: 500 !important;
        }
        .uoj-code-highlight .hljs-operator-enhanced {
          color: #ff7b72 !important;
          font-weight: bold !important;
        }
        .uoj-code-highlight .hljs-type-enhanced {
          color: #ffa657 !important;
          font-weight: 600 !important;
        }
        .uoj-code-highlight .bracket-level-0 { color: #FFD700 !important; }
        .uoj-code-highlight .bracket-level-1 { color: #DA70D6 !important; }
        .uoj-code-highlight .bracket-level-2 { color: #87CEEB !important; }
        .uoj-code-highlight .bracket-level-3 { color: #98FB98 !important; }
        .uoj-code-highlight .bracket-level-4 { color: #FFA07A !important; }
        .uoj-code-highlight .bracket-level-5 { color: #F0E68C !important; }
      `);
    }
  }

  function openEditor() {
    problemId = currentPlatform.selectors.problemId();
    console.log('[Universal OJ] 打开编辑器，题目ID:', problemId);
    createLightbox();

    const overlay = document.getElementById('uojEditorOverlay');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    document.getElementById('uojProblemContent').innerHTML = currentPlatform.getProblemInfo();

    const saved = localStorage.getItem(`uoj_code_${problemId}_${currentLang}`);
    const editor = document.getElementById('uojCodeEditor');
    editor.value = saved || codeTemplates[currentLang];

    updateLineNumbers();
    updateHighlight();
    updateCursorInfo();

    setTimeout(() => editor.focus(), 100);
    setTimeout(() => {
      if (window.MathJax && window.MathJax.typeset) {
        window.MathJax.typeset([document.getElementById('uojProblemContent')]);
      } else if (window.MathJax && window.MathJax.Hub && window.MathJax.Hub.Queue) {
        window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub, "uojProblemContent"]);
      }
    }, 500);
  }

  function closeEditor() {
    const overlay = document.getElementById('uojEditorOverlay');
    if (overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  function handleConfirm() {
    const editor = document.getElementById('uojCodeEditor');
    const success = currentPlatform.syncCode(editor.value);
    
    const btn = document.getElementById('uojConfirmBtn');
    const originalText = btn.innerHTML;
    
    if (success) {
      btn.innerHTML = '✅ 已载入';
      setTimeout(() => {
        btn.innerHTML = originalText;
        closeEditor();
      }, 800);
    } else {
      btn.innerHTML = '❌ 失败';
      setTimeout(() => {
        btn.innerHTML = originalText;
      }, 1500);
      alert('代码同步失败，请手动复制粘贴');
    }
  }

  function changeLanguage() {
    const editor = document.getElementById('uojCodeEditor');
    const select = document.getElementById('uojLangSelect');

    localStorage.setItem(`uoj_code_${problemId}_${currentLang}`, editor.value);

    currentLang = select.value;
    const saved = localStorage.getItem(`uoj_code_${problemId}_${currentLang}`);
    editor.value = saved || codeTemplates[currentLang];

    updateLineNumbers();
    updateHighlight();
    updateCursorInfo();
  }

  function updateCode() {
    updateLineNumbers();
    updateHighlight();
    updateCursorInfo();

    const editor = document.getElementById('uojCodeEditor');
    if (editor) {
      localStorage.setItem(`uoj_code_${problemId}_${currentLang}`, editor.value);
    }
  }

  function updateHighlight() {
      const editor = document.getElementById('uojCodeEditor');
      const highlightCode = document.getElementById('uojHighlightCode');
      
      if (!editor || !highlightCode) return;

      let content = editor.value;
      
      if (content.endsWith('\n')) {
          highlightCode.textContent = content + ' ';
      } else {
          highlightCode.textContent = content + '\n ';
      }

      highlightCode.removeAttribute('data-highlighted');
      highlightCode.className = `${langClasses[currentLang]} hljs`;

      try {
          hljs.highlightElement(highlightCode);
          
          requestAnimationFrame(() => {
              const code = document.getElementById('uojHighlightCode');
              if (code) {
                  applyAllEnhancements(code);
              }
          });
      } catch (e) {
          console.error('[Universal OJ] 高亮失败:', e);
      }
      
      syncScroll();
  }

  function applyAllEnhancements(element) {
      applyBracketColors(element);
      applyStdTypes(element);
      applyOperators(element);
      applyVariableHighlight(element);
  }

  function applyBracketColors(element) {
      const brackets = ['{', '}', '[', ']', '(', ')'];
      const colors = 6;
      let stack = [];

      function processNode(node) {
          if (node.nodeType === Node.TEXT_NODE) {
              const text = node.textContent;
              if (!/[(){}\[\]]/.test(text)) return;

              const fragment = document.createDocumentFragment();
              let lastIdx = 0;

              for (let i = 0; i < text.length; i++) {
                  const char = text[i];
                  if (brackets.includes(char)) {
                      if (i > lastIdx) {
                          fragment.appendChild(document.createTextNode(text.substring(lastIdx, i)));
                      }

                      const span = document.createElement('span');
                      let level = 0;
                      if (['{', '[', '('].includes(char)) {
                          level = stack.length % colors;
                          stack.push({ char, level });
                      } else {
                          const pair = { '}': '{', ']': '[', ')': '(' };
                          if (stack.length > 0 && stack[stack.length - 1].char === pair[char]) {
                              level = stack.pop().level;
                          } else {
                              level = stack.length % colors;
                          }
                      }
                      span.className = `bracket-level-${level}`;
                      span.textContent = char;
                      fragment.appendChild(span);
                      lastIdx = i + 1;
                  }
              }
              
              if (lastIdx < text.length) {
                  fragment.appendChild(document.createTextNode(text.substring(lastIdx)));
              }

              if (lastIdx > 0) {
                  node.parentNode.replaceChild(fragment, node);
              }
          } else if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.className && node.className.includes('bracket-level')) return;
              
              const children = Array.from(node.childNodes);
              children.forEach(processNode);
          }
      }

      processNode(element);
  }

  function applyStdTypes(element) {
      const typeMap = {
          cpp: ['vector', 'string', 'map', 'set', 'unordered_map', 'unordered_set',
                'list', 'deque', 'queue', 'stack', 'priority_queue', 'pair',
                'cin', 'cout', 'cerr', 'endl', 'nullptr', 'NULL'],
          c: ['NULL', 'size_t', 'FILE'],
          java: ['String', 'Integer', 'ArrayList', 'HashMap', 'Scanner', 'System'],
          python: ['list', 'dict', 'set', 'tuple', 'str', 'True', 'False', 'None'],
          go: ['string', 'map', 'slice', 'nil', 'make', 'len', 'append'],
          javascript: ['console', 'Array', 'Object', 'String', 'Number']
      };

      const types = typeMap[currentLang] || [];
      if (types.length === 0) return;

      function processNode(node) {
          if (node.nodeType === Node.TEXT_NODE) {
              const text = node.textContent;
              const matches = [];

              types.forEach(type => {
                  const regex = new RegExp(`\\b${type}\\b`, 'g');
                  let match;
                  while ((match = regex.exec(text)) !== null) {
                      matches.push({
                          start: match.index,
                          end: match.index + type.length,
                          text: type
                      });
                  }
              });

              if (matches.length === 0) return;
              matches.sort((a, b) => a.start - b.start);
              const filtered = [];
              let lastEnd = -1;
              matches.forEach(m => {
                  if (m.start >= lastEnd) {
                      filtered.push(m);
                      lastEnd = m.end;
                  }
              });

              if (filtered.length === 0) return;

              const fragment = document.createDocumentFragment();
              let pos = 0;

              filtered.forEach(m => {
                  if (m.start > pos) {
                      fragment.appendChild(document.createTextNode(text.substring(pos, m.start)));
                  }
                  const span = document.createElement('span');
                  span.className = 'hljs-type-enhanced';
                  span.textContent = m.text;
                  fragment.appendChild(span);
                  pos = m.end;
              });

              if (pos < text.length) {
                  fragment.appendChild(document.createTextNode(text.substring(pos)));
              }

              node.parentNode.replaceChild(fragment, node);
          } else if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.className && (
                  node.className.includes('hljs-string') ||
                  node.className.includes('hljs-comment') ||
                  node.className.includes('hljs-type-enhanced') ||
                  node.className.includes('bracket-level')
              )) return;

              Array.from(node.childNodes).forEach(processNode);
          }
      }

      processNode(element);
  }

  function applyOperators(element) {
      const operators = [
          '==', '!=', '<=', '>=', '&&', '||', '<<', '>>', '++', '--',
          '+=', '-=', '*=', '/=', '%=', '->', '::',
          '=', '+', '-', '*', '/', '%', '<', '>', '!', '&', '|', '^', '~'
      ];

      operators.sort((a, b) => b.length - a.length);

      function processNode(node) {
          if (node.nodeType === Node.TEXT_NODE) {
              const text = node.textContent;
              if (!/[=!<>&|+\-*\/%~^]/.test(text)) return;

              const fragment = document.createDocumentFragment();
              let pos = 0;

              while (pos < text.length) {
                  let matched = false;

                  for (const op of operators) {
                      if (text.substr(pos, op.length) === op) {
                          const span = document.createElement('span');
                          span.className = 'hljs-operator-enhanced';
                          span.textContent = op;
                          fragment.appendChild(span);
                          pos += op.length;
                          matched = true;
                          break;
                      }
                  }

                  if (!matched) {
                      const nextOpPos = text.slice(pos).search(/[=!<>&|+\-*\/%~^]/);
                      const endPos = nextOpPos === -1 ? text.length : pos + nextOpPos;
                      fragment.appendChild(document.createTextNode(text.substring(pos, endPos)));
                      pos = endPos;
                  }
              }

              if (fragment.childNodes.length > 1 || 
                  (fragment.childNodes.length === 1 && fragment.firstChild.nodeType === Node.ELEMENT_NODE)) {
                  node.parentNode.replaceChild(fragment, node);
              }
          } else if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.className && (
                  node.className.includes('hljs-string') ||
                  node.className.includes('hljs-comment') ||
                  node.className.includes('hljs-number') ||
                  node.className.includes('hljs-operator-enhanced') ||
                  node.className.includes('bracket-level')
              )) return;

              Array.from(node.childNodes).forEach(processNode);
          }
      }

      processNode(element);
  }

  function applyVariableHighlight(element) {
      const patterns = {
          cpp: /\b(?:int|long|float|double|char|bool|string|auto|void)\s+(\w+)/g,
          c: /\b(?:int|long|float|double|char|void)\s+(\w+)/g,
          python: /\b(\w+)\s*=/g,
          java: /\b(?:int|long|float|double|char|boolean|String)\s+(\w+)/g,
          javascript: /\b(?:var|let|const)\s+(\w+)/g,
          go: /(\w+)\s*:=/g
      };

      const pattern = patterns[currentLang];
      if (!pattern) return;

      const fullText = element.textContent;
      const varNames = new Set();

      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(fullText)) !== null) {
          if (match[1] && !/^(true|false|null|NULL|nullptr)$/.test(match[1])) {
              varNames.add(match[1]);
          }
      }

      if (varNames.size === 0) return;

      function processNode(node) {
          if (node.nodeType === Node.TEXT_NODE) {
              const text = node.textContent;
              const matches = [];

              varNames.forEach(varName => {
                  const regex = new RegExp(`\\b${varName}\\b`, 'g');
                  let m;
                  while ((m = regex.exec(text)) !== null) {
                      matches.push({
                          start: m.index,
                          end: m.index + varName.length,
                          text: varName
                      });
                  }
              });

              if (matches.length === 0) return;

              matches.sort((a, b) => a.start - b.start);
              const filtered = [];
              let lastEnd = -1;
              matches.forEach(m => {
                  if (m.start >= lastEnd) {
                      filtered.push(m);
                      lastEnd = m.end;
                  }
              });

              if (filtered.length === 0) return;

              const fragment = document.createDocumentFragment();
              let pos = 0;

              filtered.forEach(m => {
                  if (m.start > pos) {
                      fragment.appendChild(document.createTextNode(text.substring(pos, m.start)));
                  }
                  const span = document.createElement('span');
                  span.className = 'hljs-variable-enhanced';
                  span.textContent = m.text;
                  fragment.appendChild(span);
                  pos = m.end;
              });

              if (pos < text.length) {
                  fragment.appendChild(document.createTextNode(text.substring(pos)));
              }

              node.parentNode.replaceChild(fragment, node);
          } else if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.className && (
                  node.className.includes('hljs-keyword') ||
                  node.className.includes('hljs-string') ||
                  node.className.includes('hljs-comment') ||
                  node.className.includes('hljs-variable-enhanced') ||
                  node.className.includes('hljs-type-enhanced') ||
                  node.className.includes('bracket-level')
              )) return;

              Array.from(node.childNodes).forEach(processNode);
          }
      }

      processNode(element);
  }

  function updateLineNumbers() {
    const editor = document.getElementById('uojCodeEditor');
    const lineNumbers = document.getElementById('uojLineNumbers');
    if (!editor || !lineNumbers) return;

    const lines = editor.value.split('\n').length;
    const lineHtml = Array(lines).fill(0).map((_, i) => 
      `<div style="line-height:1.5;height:21px;">${i + 1}</div>`
    ).join('');
    
    lineNumbers.innerHTML = lineHtml;
  }

  function syncScroll() {
    const editor = document.getElementById('uojCodeEditor');
    const highlightPre = document.querySelector('.uoj-code-highlight');
    const lineNumbers = document.getElementById('uojLineNumbers');
    
    if (editor && highlightPre && lineNumbers) {
      highlightPre.scrollTop = editor.scrollTop;
      highlightPre.scrollLeft = editor.scrollLeft;
      lineNumbers.scrollTop = editor.scrollTop;
    }
  }

  function updateCursorInfo() {
    const editor = document.getElementById('uojCodeEditor');
    const info = document.getElementById('uojEditorInfo');
    if (!editor || !info) return;

    const value = editor.value;
    const pos = editor.selectionStart;
    const lines = value.substring(0, pos).split('\n');
    const line = lines.length;
    const col = lines[lines.length - 1].length + 1;
    info.textContent = `行 ${line}, 列 ${col} | ${langNames[currentLang]}`;
  }

  function handleKey(e) {
      const editor = document.getElementById('uojCodeEditor');
      if (!editor) return;

      const start = editor.selectionStart;
      const end = editor.selectionEnd;
      const value = editor.value;
      const before = value.substring(0, start);
      const after = value.substring(end);
      const pairs = {
          '(': ')',
          '[': ']',
          '{': '}',
          '"': '"',
          "'": "'",
          '<': '>'
      };
      const closingChars = [')', ']', '}', '"', "'", '>'];
      
      if (closingChars.includes(e.key)) {
          const nextChar = value.charAt(start);
          if (nextChar === e.key) {
              e.preventDefault();
              editor.selectionStart = editor.selectionEnd = start + 1;
              return;
          }
      }

      if (pairs[e.key]) {
          e.preventDefault();
          const pair = pairs[e.key];
          
          if (start !== end) {
              const selectedText = value.substring(start, end);
              editor.value = before + e.key + selectedText + pair + after;
              editor.selectionStart = start + 1;
              editor.selectionEnd = start + 1 + selectedText.length;
          } else {
              editor.value = before + e.key + pair + after;
              editor.selectionStart = editor.selectionEnd = start + 1;
          }
          updateCode();
          return;
      }
      
      if (e.key === 'Enter') {
          e.preventDefault();
          
          const lines = before.split('\n');
          const currentLine = lines[lines.length - 1];
          const indentMatch = currentLine.match(/^\s*/);
          const indent = indentMatch ? indentMatch[0] : "";
          
          let extraIndent = "";
          let closingBrace = "";
          
          const charBefore = value.charAt(start - 1);
          const charAfter = value.charAt(start);
          const isInBrackets = (charBefore === '{' && charAfter === '}') ||
                              (charBefore === '[' && charAfter === ']') ||
                              (charBefore === '(' && charAfter === ')');
          
          if (isInBrackets) {
              extraIndent = "    ";
              closingBrace = "\n" + indent;
          } else if (currentLine.trim().endsWith('{')) {
              extraIndent = "    ";
          }

          const insertText = "\n" + indent + extraIndent;
          editor.value = before + insertText + closingBrace + after;
          
          editor.selectionStart = editor.selectionEnd = start + insertText.length;
          updateCode();
          return;
      }

      if (e.key === 'Backspace' && start === end) {
          const charBefore = value.charAt(start - 1);
          const charAfter = value.charAt(start);
          
          if (pairs[charBefore] === charAfter) {
              e.preventDefault();
              editor.value = value.substring(0, start - 1) + value.substring(start + 1);
              editor.selectionStart = editor.selectionEnd = start - 1;
              updateCode();
              return;
          }
      }

      if (e.key === 'Tab') {
          e.preventDefault();
          
          if (start !== end) {
              const selectedText = value.substring(start, end);
              const lines = selectedText.split('\n');
              
              if (e.shiftKey) {
                  const unindented = lines.map(line => {
                      if (line.startsWith('    ')) return line.substring(4);
                      if (line.startsWith('\t')) return line.substring(1);
                      return line;
                  }).join('\n');
                  
                  editor.value = before + unindented + after;
                  editor.selectionStart = start;
                  editor.selectionEnd = start + unindented.length;
              } else {
                  const indented = lines.map(line => '    ' + line).join('\n');
                  editor.value = before + indented + after;
                  editor.selectionStart = start;
                  editor.selectionEnd = start + indented.length;
              }
          } else {
              editor.value = before + "    " + after;
              editor.selectionStart = editor.selectionEnd = start + 4;
          }
          updateCode();
          return;
      }

      if (e.key === '/' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          
          const lines = value.split('\n');
          const startLine = value.substring(0, start).split('\n').length - 1;
          const endLine = value.substring(0, end).split('\n').length - 1;
          
          const commentSymbol = currentLang === 'python' ? '#' : '//';
          let allCommented = true;
          
          for (let i = startLine; i <= endLine; i++) {
              if (!lines[i].trim().startsWith(commentSymbol)) {
                  allCommented = false;
                  break;
              }
          }
          
          for (let i = startLine; i <= endLine; i++) {
              if (allCommented) {
                  lines[i] = lines[i].replace(new RegExp(`^(\\s*)${commentSymbol}\\s?`), '$1');
              } else {
                  const indent = lines[i].match(/^\s*/)[0];
                  lines[i] = indent + commentSymbol + ' ' + lines[i].substring(indent.length);
              }
          }
          
          editor.value = lines.join('\n');
          updateCode();
          return;
      }

      setTimeout(updateCursorInfo, 0);
  }

  function addOpenButton() {
    if (document.getElementById('uojOpenBtn')) {
      console.log('[Universal OJ] 按钮已存在');
      return true;
    }

    if (currentPlatform.key === 'nowcoder') {
      const containers = [
        document.querySelector('.question-operate'),
        document.querySelector('.terminal-topic-operation'),
        document.querySelector('.terminal-topic')
      ];

      for (const container of containers) {
        if (container) {
          console.log('[Universal OJ] 找到牛客按钮容器:', container);
          
          const btn = document.createElement('button');
          btn.id = 'uojOpenBtn';
          btn.style.cssText = `
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 16px;
            border: 1px solid #52c41a;
            border-radius: 4px;
            background: transparent;
            color: #52c41a;
            font-size: 14px;
            cursor: pointer;
            margin-left: 10px;
            transition: all 0.3s;
          `;
          btn.innerHTML = `
            <svg style="width:14px;height:14px;" viewBox="0 0 640 512" fill="currentColor">
              <path d="M392.8 1.2c-17-4.9-34.7 5-39.6 22l-128 448c-4.9 17 5 34.7 22 39.6s34.7-5 39.6-22l128-448c4.9-17-5-34.7-22-39.6zm80.6 120.1c-12.5 12.5-12.5 32.8 0 45.3L562.7 256l-89.4 89.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l112-112c12.5-12.5 12.5-32.8 0-45.3l-112-112c-12.5-12.5-32.8-12.5-45.3 0zm-306.7 0c-12.5-12.5-32.8-12.5-45.3 0l-112 112c-12.5 12.5-12.5 32.8 0 45.3l112 112c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256l89.4-89.4c12.5-12.5 12.5-32.8 0-45.3z"/>
            </svg>
            高级编辑器
          `;
          btn.onmouseover = () => {
            btn.style.background = '#52c41a';
            btn.style.color = '#fff';
          };
          btn.onmouseout = () => {
            btn.style.background = 'transparent';
            btn.style.color = '#52c41a';
          };
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openEditor();
          });

          container.appendChild(btn);
          console.log('[Universal OJ] 牛客按钮添加成功');
          return true;
        }
      }
    }

    if (currentPlatform.key === 'luogu') {
      const containers = [
        document.querySelector('.ide-toolbar .actions'),
        document.querySelector('.problem .actions'),
        document.querySelector('a[class*="title"]:has(.fa-paper-plane)')?.parentElement
      ];

      for (const container of containers) {
        if (container) {
          console.log('[Universal OJ] 找到按钮容器:', container);
          
          const btn = document.createElement('a');
          btn.id = 'uojOpenBtn';
          btn.className = 'uoj-open-btn-luogu title';
          btn.href = 'javascript:void(0)';
          btn.innerHTML = `
            <span class="icon">
              <svg class="svg-inline--fa fa-code" style="width:14px;height:14px;" viewBox="0 0 640 512">
                <path fill="currentColor" d="M392.8 1.2c-17-4.9-34.7 5-39.6 22l-128 448c-4.9 17 5 34.7 22 39.6s34.7-5 39.6-22l128-448c4.9-17-5-34.7-22-39.6zm80.6 120.1c-12.5 12.5-12.5 32.8 0 45.3L562.7 256l-89.4 89.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l112-112c12.5-12.5 12.5-32.8 0-45.3l-112-112c-12.5-12.5-32.8-12.5-45.3 0zm-306.7 0c-12.5-12.5-32.8-12.5-45.3 0l-112 112c-12.5 12.5-12.5 32.8 0 45.3l112 112c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256l89.4-89.4c12.5-12.5 12.5-32.8 0-45.3z"/>
              </svg>
            </span>
            <span class="text">高级编辑器</span>
          `;
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openEditor();
          });

          container.appendChild(btn);
          console.log('[Universal OJ] 按钮添加成功');
          return true;
        }
      }
    }

    if (currentPlatform.key === 'codeforces') {
      const containers = [
        document.querySelector('.second-level-menu'),
        document.querySelector('.sidebox .rtable'),
        document.querySelector('.problem-statement .header'),
        document.querySelector('.roundbox.menu-box')
      ];

      for (const container of containers) {
        if (container) {
          const btn = document.createElement('div');
          btn.style.cssText = "margin: 10px 0; display: inline-block; vertical-align: middle;";
          
          btn.innerHTML = `
            <a id="uojOpenBtn" href="javascript:void(0)" class="uoj-cf-btn" style="
              display: inline-flex;
              align-items: center;
              gap: 6px;
              padding: 5px 12px;
              border: 1px solid #FF591F;
              border-radius: 4px;
              background: #fff;
              color: #FF591F;
              font-size: 13px;
              font-weight: bold;
              text-decoration: none;
              transition: all 0.3s;
              cursor: pointer;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            ">
              <svg style="width:14px;height:14px;" viewBox="0 0 640 512" fill="currentColor">
                <path d="M392.8 1.2c-17-4.9-34.7 5-39.6 22l-128 448c-4.9 17 5 34.7 22 39.6s34.7-5 39.6-22l128-448c4.9-17-5-34.7-22-39.6zm80.6 120.1c-12.5 12.5-12.5 32.8 0 45.3L562.7 256l-89.4 89.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l112-112c12.5-12.5 12.5-32.8 0-45.3l-112-112c-12.5-12.5-32.8-12.5-45.3 0zm-306.7 0c-12.5-12.5-32.8-12.5-45.3 0l-112 112c-12.5 12.5-12.5 32.8 0 45.3l112 112c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256l89.4-89.4c12.5-12.5 12.5-32.8 0-45.3z"/>
              </svg>
              高级编辑器
            </a>
          `;
          
          const link = btn.querySelector('a');
          link.onmouseover = () => { link.style.background = '#FF591F'; link.style.color = '#fff'; };
          link.onmouseout = () => { link.style.background = '#fff'; link.style.color = '#FF591F'; };
          link.onclick = (e) => { e.preventDefault(); openEditor(); };

          if (container.tagName === 'UL') {
            const li = document.createElement('li');
            li.appendChild(btn);
            container.appendChild(li);
          } else {
            container.appendChild(btn);
          }
          return true;
        }
      }
    }

    console.log('[Universal OJ] 未找到合适的按钮容器');
    return false;
  }

  function init() {
    console.log('[Universal OJ] 开始初始化...');

    setTimeout(() => {
      if (addOpenButton()) return;

      let attempts = 0;
      const interval = setInterval(() => {
        console.log(`[Universal OJ] 尝试添加按钮 (${attempts + 1}/20)`);
        if (addOpenButton() || attempts >= 20) {
          clearInterval(interval);
          if (attempts >= 20) {
            console.error('[Universal OJ] 添加按钮失败，已达最大尝试次数');
          }
        }
        attempts++;
      }, 1000);
    }, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();