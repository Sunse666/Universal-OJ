// ==UserScript==
// @name         Universal OJ
// @namespace    http://tampermonkey.net/
// @version      1.2
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
// @match        *://vjudge.net/problem/*
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
        
        const titleEl = document.querySelector(this.selectors.title);
        if (titleEl) {
          html += `<h4 style="color:#89b4fa;font-size:15px;margin:0 0 15px 0;padding-bottom:8px;border-bottom:1px solid #45475a;">${escapeHtml(titleEl.textContent.trim())}</h4>`;
        }

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

          cloned.querySelectorAll('pre code').forEach(code => {
            code.style.background = '#11111b';
            code.style.padding = '12px';
            code.style.borderRadius = '6px';
            code.style.color = '#a6e3a1';
            code.style.fontSize = '12px';
          });

          html += `<div class="problem-content" style="font-size:13px;line-height:1.8;color:#cdd6f4;">${cloned.innerHTML}</div>`;
        }

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
    },

    vjudge: {
      name: 'Virtual Judge',
      match: /vjudge\.net/,
      selectors: {
        title: '#prob-title h2',
        content: '#frame-description',
        buttonContainer: '#prob-title',
        submitBtn: 'a[data-target="#submitModal"]',
        codeEditor: '#solution',
        problemId: () => {
          const match = window.location.pathname.match(/\/problem\/(.+)/);
          return match ? `vj_${match[1].replace(/[^a-zA-Z0-9]/g, '_')}` : 'vj_unknown';
        }
      },
      
      getProblemInfo: function() {
        return new Promise((resolve) => {
          let html = '';
          
          const titleEl = document.querySelector('#prob-title h2');
          if (titleEl) {
            const titleClone = titleEl.cloneNode(true);
            titleClone.querySelectorAll('#btn-fav, .glyphicon, i').forEach(el => el.remove());
            const titleText = titleClone.textContent.trim();
            html += `<h4 style="color:#89b4fa;font-size:15px;margin:0 0 15px 0;padding-bottom:8px;border-bottom:1px solid #45475a;">${escapeHtml(titleText)}</h4>`;
          }

          const originLink = document.querySelector('#prob-title .origin a');
          if (originLink) {
            const originText = originLink.textContent.trim();
            const originHref = originLink.href;
            html += `<p style="color:#a6adc8;font-size:12px;margin-bottom:15px;">
              🔗 来源: <a href="${originHref}" target="_blank" style="color:#89b4fa;text-decoration:none;">${escapeHtml(originText)}</a>
            </p>`;
          }

          const waitForIframe = (attempts = 0) => {
            if (attempts > 40) {
              html += `<p style="color:#f38ba8;">❌ 题目加载超时，请刷新页面</p>`;
              resolve(html);
              return;
            }

            const iframe = document.querySelector('#frame-description');
            
            if (!iframe) {
              setTimeout(() => waitForIframe(attempts + 1), 250);
              return;
            }

            try {
              const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
              
              if (!iframeDoc || !iframeDoc.body) {
                setTimeout(() => waitForIframe(attempts + 1), 250);
                return;
              }

              const container = iframeDoc.querySelector('#description-container dd');
              
              if (!container || container.innerHTML.trim().length < 100) {
                setTimeout(() => waitForIframe(attempts + 1), 250);
                return;
              }

              const cloned = container.cloneNode(true);
              
              cloned.querySelectorAll('style, script, .copier, .data-json-container').forEach(el => el.remove());
              
              cloned.querySelectorAll('h3').forEach(h => {
                h.style.cssText = `
                  color: #cba6f7 !important;
                  font-size: 14px !important;
                  font-weight: bold !important;
                  margin: 20px 0 10px 0 !important;
                  border-left: 3px solid #cba6f7 !important;
                  padding-left: 8px !important;
                `;
              });
              
              cloned.querySelectorAll('div[style*="padding"]').forEach(div => {
                div.style.cssText = `
                  color: #cdd6f4 !important;
                  line-height: 1.8 !important;
                  padding: 0 0 20px 0 !important;
                  font-size: 13px !important;
                `;
              });
              
              cloned.querySelectorAll('p').forEach(p => {
                p.style.cssText = `
                  color: #cdd6f4 !important;
                  line-height: 1.8 !important;
                  margin-bottom: 12px !important;
                  font-size: 13px !important;
                `;
              });
              
              cloned.querySelectorAll('pre').forEach(pre => {
                if (!pre.closest('table.vjudge_sample')) {
                  pre.style.cssText = `
                    background: #11111b !important;
                    padding: 12px !important;
                    border-radius: 6px !important;
                    color: #a6e3a1 !important;
                    font-size: 12px !important;
                    font-family: 'Consolas', 'Monaco', monospace !important;
                    overflow-x: auto !important;
                    margin: 8px 0 !important;
                    border: 1px solid #45475a !important;
                    white-space: pre-wrap !important;
                  `;
                }
              });
              
              cloned.querySelectorAll('table.vjudge_sample').forEach(table => {
                table.style.cssText = `
                  width: 100% !important;
                  border-collapse: collapse !important;
                  margin: 10px 0 20px 0 !important;
                  background: transparent !important;
                `;
                
                table.querySelectorAll('thead th').forEach(th => {
                  th.querySelectorAll('.copier').forEach(el => el.remove());
                  
                  th.style.cssText = `
                    background: #313244 !important;
                    color: #f9e2af !important;
                    padding: 10px !important;
                    border: 1px solid #45475a !important;
                    font-size: 13px !important;
                    font-weight: bold !important;
                    text-align: left !important;
                  `;
                });
                
                table.querySelectorAll('tbody td').forEach(td => {
                  td.style.cssText = `
                    border: 1px solid #45475a !important;
                    padding: 0 !important;
                    vertical-align: top !important;
                    background: #1e1e2e !important;
                  `;
                  
                  const pre = td.querySelector('pre');
                  if (pre) {
                    pre.style.cssText = `
                      background: #11111b !important;
                      padding: 10px !important;
                      margin: 0 !important;
                      border: none !important;
                      border-radius: 0 !important;
                      color: #a6e3a1 !important;
                      font-size: 12px !important;
                      font-family: 'Consolas', 'Monaco', monospace !important;
                      white-space: pre !important;
                      overflow-x: auto !important;
                    `;
                  }
                });
              });
              
              cloned.querySelectorAll('.katex').forEach(katex => {
                katex.style.cssText = `
                  font-size: 1.1em !important;
                  color: #f5e0dc !important;
                `;
              });
              
              cloned.querySelectorAll('.katex-mathml').forEach(el => {
                el.style.display = 'none';
              });
              
              cloned.querySelectorAll('img').forEach(img => {
                if (img.src && !img.src.startsWith('http')) {
                  img.src = 'https://vjudge.net' + (img.src.startsWith('/') ? img.src : '/' + img.src);
                }
                img.style.cssText = `
                  max-width: 100% !important;
                  height: auto !important;
                  display: block !important;
                  margin: 15px auto !important;
                  border-radius: 6px !important;
                  border: 1px solid #45475a !important;
                `;
              });
              
              html += `<div class="vjudge-problem-content" style="font-size:13px;line-height:1.8;color:#cdd6f4;margin-top:10px;">${cloned.innerHTML}</div>`;
              
              resolve(html || '<p style="color:#f38ba8;">无法获取题目信息</p>');
              
            } catch (error) {
              console.error('[Universal OJ] VJudge iframe 访问错误:', error);
              if (error.name === 'SecurityError') {
                html += `<p style="color:#f9e2af;">⚠️ 由于浏览器安全限制，无法直接读取题目内容</p>`;
                html += `<p style="color:#a6adc8;font-size:12px;">请在新标签页打开原题链接查看完整题面</p>`;
                resolve(html);
              } else {
                setTimeout(() => waitForIframe(attempts + 1), 250);
              }
            }
          };

          waitForIframe(0);
        });
      },
      
      syncCode: function(code) {
        const submitLink = document.querySelector('a[data-target="#submitModal"]');
        if (!submitLink) {
          console.error('[Universal OJ] VJudge: 未找到提交按钮');
          return false;
        }
        
        submitLink.click();
        
        setTimeout(() => {
          const cmElement = document.querySelector('#submitModal .CodeMirror');
          if (cmElement && cmElement.CodeMirror) {
            cmElement.CodeMirror.setValue(code);
            console.log('[Universal OJ] VJudge: 已通过 CodeMirror 同步代码');
            return true;
          }
          
          const textarea = document.querySelector('#submitModal textarea, #solution');
          if (textarea) {
            textarea.value = code;
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            textarea.dispatchEvent(new Event('change', { bubbles: true }));
            console.log('[Universal OJ] VJudge: 已同步代码到提交框');
            return true;
          }
          
          console.warn('[Universal OJ] VJudge: 未找到代码编辑器');
        }, 600);
        
        return true;
      }
    },

    jxau: {
      name: 'JXAU OJ',
      match: (url) => {
        if (/luogu\.com\.cn|codeforces\.com|nowcoder\.com/.test(url)) {
          return false;
        }
        return /\/(problem|contest)\//.test(url);
      },
      selectors: {
        title: '.ivu-card-head .panel-title div[data-v-6e5e6c6e], .panel-title, .ivu-card-head span',
        content: '#problem-content.markdown-body, .markdown-body, .ivu-card-body .panel-body',
        buttonContainer: '.ivu-card-body, .panel-body',
        submitBtn: 'button:has-text("提交"), button:has-text("Submit")',
        codeEditor: '.CodeMirror, textarea[name="code"]',
        problemId: () => {
          const match = window.location.pathname.match(/\/problem\/(\d+)/);
          return match ? match[1] : 'unknown';
        }
      },
      getProblemInfo: function() {
        try {
          let html = '';
          const titleElement = document.querySelector('.ivu-card-head .panel-title div[data-v-6e5e6c6e]') ||
                              document.querySelector('.panel-title div') ||
                              document.querySelector('.ivu-card-head span');
          
          if (titleElement) {
            const title = titleElement.textContent.trim();
            html += `<h4 style="color:#89b4fa;font-size:15px;margin:0 0 15px 0;padding-bottom:8px;border-bottom:1px solid #45475a;">${escapeHtml(title)}</h4>`;
          }

          const problemContent = document.querySelector('#problem-content.markdown-body');

          if (problemContent) {
            const clonedContent = problemContent.cloneNode(true);

            clonedContent.querySelectorAll('button, input, textarea, select, .copy, .ivu-icon-clipboard').forEach(el => el.remove());
            const sections = clonedContent.querySelectorAll('p.title');
            sections.forEach(titleEl => {
              const titleText = titleEl.textContent.trim();
              
              if (titleText.includes('Sample Input') || titleText.includes('Sample Output')) {
                return;
              }

              titleEl.style.color = '#cba6f7';
              titleEl.style.fontSize = '14px';
              titleEl.style.fontWeight = 'bold';
              titleEl.style.marginTop = '20px';
              titleEl.style.marginBottom = '10px';
              titleEl.style.paddingBottom = '6px';
              titleEl.style.borderBottom = '1px solid #45475a';
              titleEl.style.display = 'block';
            });

            clonedContent.querySelectorAll('p.content').forEach(contentEl => {
              contentEl.style.color = '#cdd6f4';
              contentEl.style.lineHeight = '1.8';
              contentEl.style.marginBottom = '15px';
              contentEl.style.display = 'block';

              contentEl.querySelectorAll('span[style*="color"]').forEach(span => {
                span.style.color = '#cdd6f4';
              });
            });

            clonedContent.querySelectorAll('code').forEach(code => {
              if (!code.closest('pre')) {
                code.style.background = '#11111b';
                code.style.padding = '2px 6px';
                code.style.borderRadius = '4px';
                code.style.color = '#f38ba8';
                code.style.fontSize = '12px';
                code.style.fontFamily = "'Consolas', 'Monaco', monospace";
              }
            });

            clonedContent.querySelectorAll('pre').forEach(pre => {
              if (!pre.closest('.sample-input') && !pre.closest('.sample-output')) {
                pre.style.background = '#11111b';
                pre.style.padding = '12px';
                pre.style.borderRadius = '6px';
                pre.style.color = '#a6e3a1';
                pre.style.fontSize = '12px';
                pre.style.fontFamily = "'Consolas', 'Monaco', monospace";
                pre.style.overflowX = 'auto';
                pre.style.margin = '10px 0';
                pre.style.whiteSpace = 'pre';
              }
            });

            const mainContent = clonedContent.cloneNode(true);
            mainContent.querySelectorAll('.flex-container.sample, .sample-input, .sample-output').forEach(el => el.remove());
            
            html += `<div class="problem-markdown-content" style="font-size:13px;line-height:1.8;">${mainContent.innerHTML}</div>`;
            const sampleContainers = problemContent.querySelectorAll('.flex-container.sample');
            if (sampleContainers.length > 0) {
              html += `<h5 style="color:#cba6f7;font-size:14px;margin-top:20px;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #45475a;">样例数据</h5>`;
              
              sampleContainers.forEach((container, index) => {
                const inputDiv = container.querySelector('.sample-input');
                const outputDiv = container.querySelector('.sample-output');
                
                html += `<div style="margin-bottom:20px;">`;
                html += `<p style="color:#f9e2af;font-weight:bold;font-size:13px;margin:10px 0 8px 0;">样例 ${index + 1}</p>`;
                
                if (inputDiv) {
                  const inputPre = inputDiv.querySelector('pre');
                  if (inputPre) {
                    html += `<p style="color:#a6adc8;font-size:12px;margin:8px 0 4px 0;">输入：</p>`;
                    html += `<pre style="background:#11111b;padding:10px;border-radius:6px;color:#a6e3a1;font-size:12px;font-family:'Consolas','Monaco',monospace;overflow:auto;white-space:pre;margin:0 0 12px 0;">${escapeHtml(inputPre.textContent)}</pre>`;
                  }
                }
                
                if (outputDiv) {
                  const outputPre = outputDiv.querySelector('pre');
                  if (outputPre) {
                    html += `<p style="color:#a6adc8;font-size:12px;margin:8px 0 4px 0;">输出：</p>`;
                    html += `<pre style="background:#11111b;padding:10px;border-radius:6px;color:#a6e3a1;font-size:12px;font-family:'Consolas','Monaco',monospace;overflow:auto;white-space:pre;margin:0;">${escapeHtml(outputPre.textContent)}</pre>`;
                  }
                }
                
                html += `</div>`;
              });
            }

            return html;
          }

          return `<p style="color:#f38ba8;">无法获取题目内容</p>`;
        } catch (e) {
          console.error('[Universal OJ] JXAU 获取题目信息失败:', e);
          return `<p style="color:#f38ba8;">题目信息加载失败: ${e.message}</p>`;
        }
      },
      syncCode: function(code) {
        const cmElement = document.querySelector('.CodeMirror');
        if (cmElement && cmElement.CodeMirror) {
          cmElement.CodeMirror.setValue(code);
          console.log('[Universal OJ] 已通过 CodeMirror API 同步代码');
          return true;
        }

        const textarea = document.querySelector('.CodeMirror textarea') || 
                        document.querySelector('textarea[name="code"]') ||
                        document.querySelector('#editor textarea');
        
        if (textarea) {
          textarea.value = code;
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
          textarea.dispatchEvent(new Event('change', { bubbles: true }));
          console.log('[Universal OJ] 已通过 Textarea 同步代码');
          return true;
        }

        return false;
      }
    }
  };

  function detectPlatform() {
    const url = window.location.href;
    
    if (platformConfigs.luogu.match.test(url)) {
      console.log(`[Universal OJ] 检测到平台: 洛谷`);
      return { key: 'luogu', ...platformConfigs.luogu };
    }
    if (platformConfigs.codeforces.match.test(url)) {
      console.log(`[Universal OJ] 检测到平台: Codeforces`);
      return { key: 'codeforces', ...platformConfigs.codeforces };
    }
    if (platformConfigs.nowcoder.match.test(url)) {
      console.log(`[Universal OJ] 检测到平台: 牛客网`);
      return { key: 'nowcoder', ...platformConfigs.nowcoder };
    }
    if (platformConfigs.vjudge.match.test(url)) {
      console.log(`[Universal OJ] 检测到平台: Virtual Judge`);
      return { key: 'vjudge', ...platformConfigs.vjudge };
    }
    if (typeof platformConfigs.jxau.match === 'function') {
      if (platformConfigs.jxau.match(url)) {
        console.log(`[Universal OJ] 检测到平台: JXAU OJ`);
        return { key: 'jxau', ...platformConfigs.jxau };
      }
    } else if (platformConfigs.jxau.match.test(url)) {
      console.log(`[Universal OJ] 检测到平台: JXAU OJ`);
      return { key: 'jxau', ...platformConfigs.jxau };
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
      background: transparent !important;
      color: transparent !important;
      caret-color: #ffffff !important;
      resize: none;
      outline: none;
      z-index: 2;
      overflow: auto;
      white-space: pre;
      word-wrap: normal;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace !important;
      font-size: 14px !important;
      line-height: 1.5 !important;
      border: none !important;
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
    .uoj-open-btn {
      display: inline-flex !important;
      align-items: center;
      gap: 6px;
      padding: 10px 20px;
      border: 1px solid #a6e3a1;
      border-radius: 4px;
      background: transparent;
      color: #a6e3a1;
      font-size: 14px;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.3s;
      margin-left: 10px;
      height: auto;
      line-height: normal;
      vertical-align: middle;
    }
    .uoj-open-btn:hover {
      background: #a6e3a1;
      color: #1e1e2e;
      border-color: #a6e3a1;
    }
    .uoj-open-btn .icon {
      display: flex;
      align-items: center;
    }
    .uoj-open-btn .text {
      font-weight: 500;
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
    .uoj-autocomplete {
      position: absolute;
      background: #1e1e2e;
      border: 1px solid #45475a;
      border-radius: 6px;
      max-height: 200px;
      overflow-y: auto;
      z-index: 10000;
      min-width: 150px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    }
    .uoj-autocomplete-item {
      padding: 8px 12px;
      cursor: pointer;
      color: #cdd6f4;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .uoj-autocomplete-item:hover,
    .uoj-autocomplete-item.selected {
      background: #313244;
    }
    .uoj-autocomplete-item.selected {
      background: #45475a;
    }
    .uoj-autocomplete-label {
      flex: 1;
    }
    .uoj-autocomplete-desc {
      font-size: 11px;
      color: #6c7086;
    }
    .uoj-autocomplete::-webkit-scrollbar {
      width: 6px;
    }
    .uoj-autocomplete::-webkit-scrollbar-track {
      background: #1e1e2e;
    }
    .uoj-autocomplete::-webkit-scrollbar-thumb {
      background: #45475a;
      border-radius: 3px;
    }
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

  const autoCompleteData = {
    cpp: {
      keywords: ['alignas', 'alignof', 'and', 'and_eq', 'asm', 'auto', 'bitand', 'bitor', 'bool', 'break', 'case', 'catch', 'char', 'char8_t', 'char16_t', 'char32_t', 'class', 'compl', 'concept', 'const', 'consteval', 'constexpr', 'constinit', 'const_cast', 'continue', 'co_await', 'co_return', 'co_yield', 'decltype', 'default', 'delete', 'do', 'double', 'dynamic_cast', 'else', 'enum', 'explicit', 'export', 'extern', 'false', 'float', 'for', 'friend', 'goto', 'if', 'inline', 'int', 'long', 'mutable', 'namespace', 'new', 'noexcept', 'not', 'not_eq', 'nullptr', 'operator', 'or', 'or_eq', 'private', 'protected', 'public', 'register', 'reinterpret_cast', 'requires', 'return', 'short', 'signed', 'sizeof', 'static', 'static_assert', 'static_cast', 'struct', 'switch', 'template', 'this', 'thread_local', 'throw', 'true', 'try', 'typedef', 'typeid', 'typename', 'union', 'unsigned', 'using', 'virtual', 'void', 'volatile', 'wchar_t', 'while', 'xor', 'xor_eq'],
      types: ['vector', 'string', 'map', 'set', 'unordered_map', 'unordered_set', 'list', 'deque', 'queue', 'stack', 'priority_queue', 'pair', 'tuple', 'array', 'bitset', 'unique_ptr', 'shared_ptr', 'weak_ptr', 'optional', 'variant', 'any', 'function', 'bind', 'cin', 'cout', 'cerr', 'clog', 'endl', 'flush', 'ws', 'boolalpha', 'noboolalpha', 'showbase', 'noshowbase', 'showpoint', 'noshowpoint', 'showpos', 'noshowpos', 'skipws', 'noskipws', 'uppercase', 'nouppercase', 'unitbuf', 'nounitbuf', 'internal', 'left', 'right', 'dec', 'hex', 'oct', 'fixed', 'scientific', 'hexfloat', 'defaultfloat', 'make_pair', 'make_tuple', 'get', 'swap', 'move', 'forward', 'min', 'max', 'minmax', 'clamp', 'size', 'ssize', 'empty', 'data'],
      snippets: {
        'for': 'for (int i = 0; i < n; i++) {\n    \n}',
        'forr': 'for (int i = n - 1; i >= 0; i--) {\n    \n}',
        'while': 'while () {\n    \n}',
        'if': 'if () {\n    \n}',
        'else': 'else {\n    \n}',
        'elif': 'else if () {\n    \n}',
        'main': 'int main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    \n    return 0;\n}',
        'cout': 'cout <<  << endl;',
        'cin': 'cin >> ;',
        'vector': 'vector<int> ',
        'struct': 'struct  {\n    \n};',
        'class': 'class  {\npublic:\n    \n};',
        'template': 'template<typename T>\n',
        'using': 'using ll = long long;\nusing pii = pair<int, int>;',
        'pb': 'push_back',
        'mp': 'make_pair',
        'fi': 'first',
        'se': 'second',
        'sz': 'size()',
        'all': 'begin(), end()',
        'memset': 'memset(vis, 0, sizeof(vis));',
        'gcd': '__gcd(a, b)',
        'swap': 'swap(a, b);',
        'sort': 'sort(begin(), end());',
        'reverse': 'reverse(begin(), end());',
        'unique': 'unique(begin(), end())',
        'lower': 'lower_bound(begin(), end(), )',
        'upper': 'upper_bound(begin(), end(), )',
        'binary': 'binary_search(begin(), end(), )',
        'find': 'find(begin(), end(), )',
        'count': 'count(begin(), end(), )',
        'accumulate': 'accumulate(begin(), end(), 0)',
        'maxe': '*max_element(begin(), end())',
        'mine': '*min_element(begin(), end())',
        'lcm': 'lcm(a, b)',
        'bit': 'bitset<32> ',
        'queue': 'queue<int> ',
        'stack': 'stack<int> ',
        'pq': 'priority_queue<int> ',
        'set': 'set<int> ',
        'map': 'map<int, int> ',
        'umap': 'unordered_map<int, int> ',
        'uset': 'unordered_set<int> ',
        'deque': 'deque<int> ',
        'list': 'list<int> ',
        'array': 'array<int, N> ',
        'string': 'string ',
        'getline': 'getline(cin, );',
        'stoi': 'stoi()',
        'stoll': 'stoll()',
        'to_string': 'to_string()',
        'substr': 'substr(,)',
        'finds': 'find()',
        'npos': 'string::npos',
        'INF': 'const int INF = 1e9;',
        'MOD': 'const int MOD = 1e9 + 7;',
        'EPS': 'const double EPS = 1e-9;',
        'PI': 'const double PI = acos(-1);',
        'dx': 'int dx[] = {0, 1, 0, -1};',
        'dy': 'int dy[] = {1, 0, -1, 0};',
        'dir': 'int dx[] = {0, 1, 0, -1, 1, 1, -1, -1};\nint dy[] = {1, 0, -1, 0, 1, -1, 1, -1};',
        'dfs': 'void dfs(int u) {\n    vis[u] = true;\n    for (int v : adj[u]) {\n        if (!vis[v]) dfs(v);\n    }\n}',
        'bfs': 'void bfs(int s) {\n    queue<int> q;\n    q.push(s);\n    vis[s] = true;\n    while (!q.empty()) {\n        int u = q.front(); q.pop();\n        for (int v : adj[u]) {\n            if (!vis[v]) {\n                vis[v] = true;\n                q.push(v);\n            }\n        }\n    }\n}',
        'dijkstra': 'void dijkstra(int s) {\n    priority_queue<pii, vector<pii>, greater<pii>> pq;\n    dist[s] = 0;\n    pq.push({0, s});\n    while (!pq.empty()) {\n        auto [d, u] = pq.top(); pq.pop();\n        if (d > dist[u]) continue;\n        for (auto [v, w] : adj[u]) {\n            if (dist[u] + w < dist[v]) {\n                dist[v] = dist[u] + w;\n                pq.push({dist[v], v});\n            }\n        }\n    }\n}',
        'spfa': 'bool spfa(int s) {\n    queue<int> q;\n    q.push(s);\n    inq[s] = true;\n    cnt[s] = 1;\n    while (!q.empty()) {\n        int u = q.front(); q.pop();\n        inq[u] = false;\n        for (auto [v, w] : adj[u]) {\n            if (dist[u] + w < dist[v]) {\n                dist[v] = dist[u] + w;\n                if (!inq[v]) {\n                    q.push(v);\n                    inq[v] = true;\n                    if (++cnt[v] > n) return false;\n                }\n            }\n        }\n    }\n    return true;\n}',
        'floyd': 'for (int k = 1; k <= n; k++)\n    for (int i = 1; i <= n; i++)\n        for (int j = 1; j <= n; j++)\n            dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j]);',
        'kruskal': 'sort(edges.begin(), edges.end());\nint cnt = 0;\nfor (auto [w, u, v] : edges) {\n    if (find(u) != find(v)) {\n        unite(u, v);\n        ans += w;\n        if (++cnt == n - 1) break;\n    }\n}',
        'prim': 'priority_queue<pii, vector<pii>, greater<pii>> pq;\npq.push({0, 1});\nwhile (!pq.empty()) {\n    auto [d, u] = pq.top(); pq.pop();\n    if (vis[u]) continue;\n    vis[u] = true;\n    ans += d;\n    for (auto [v, w] : adj[u]) {\n        if (!vis[v]) pq.push({w, v});\n    }\n}',
        'topsort': 'queue<int> q;\nfor (int i = 1; i <= n; i++)\n    if (indeg[i] == 0) q.push(i);\nwhile (!q.empty()) {\n    int u = q.front(); q.pop();\n    topo.push_back(u);\n    for (int v : adj[u]) {\n        if (--indeg[v] == 0) q.push(v);\n    }\n}',
        'dsu': 'struct DSU {\n    vector<int> f;\n    DSU(int n) : f(n + 1) { iota(f.begin(), f.end(), 0); }\n    int find(int x) { return f[x] == x ? x : f[x] = find(f[x]); }\n    void unite(int x, int y) { f[find(x)] = find(y); }\n};',
        'segtree': 'struct SegTree {\n    vector<int> t;\n    int n;\n    SegTree(int n) : n(n), t(4 * n) {}\n    void update(int o, int l, int r, int p, int v) {\n        if (l == r) { t[o] = v; return; }\n        int mid = (l + r) >> 1;\n        if (p <= mid) update(o << 1, l, mid, p, v);\n        else update(o << 1 | 1, mid + 1, r, p, v);\n        t[o] = max(t[o << 1], t[o << 1 | 1]);\n    }\n    int query(int o, int l, int r, int L, int R) {\n        if (L <= l && r <= R) return t[o];\n        int mid = (l + r) >> 1, res = 0;\n        if (L <= mid) res = max(res, query(o << 1, l, mid, L, R));\n        if (R > mid) res = max(res, query(o << 1 | 1, mid + 1, r, L, R));\n        return res;\n    }\n};',
        'fenwick': 'struct Fenwick {\n    vector<int> t;\n    int n;\n    Fenwick(int n) : n(n), t(n + 1) {}\n    void add(int x, int v) {\n        for (; x <= n; x += x & -x) t[x] += v;\n    }\n    int sum(int x) {\n        int res = 0;\n        for (; x; x -= x & -x) res += t[x];\n        return res;\n    }\n    int rangeSum(int l, int r) { return sum(r) - sum(l - 1); }\n};',
        'st': 'struct ST {\n    vector<vector<int>> st;\n    vector<int> lg;\n    ST(const vector<int>& a) {\n        int n = a.size();\n        lg.resize(n + 1);\n        for (int i = 2; i <= n; i++) lg[i] = lg[i >> 1] + 1;\n        int k = lg[n] + 1;\n        st.assign(n, vector<int>(k));\n        for (int i = 0; i < n; i++) st[i][0] = a[i];\n        for (int j = 1; j < k; j++)\n            for (int i = 0; i + (1 << j) <= n; i++)\n                st[i][j] = max(st[i][j - 1], st[i + (1 << (j - 1))][j - 1]);\n    }\n    int query(int l, int r) {\n        int k = lg[r - l + 1];\n        return max(st[l][k], st[r - (1 << k) + 1][k]);\n    }\n};',
        'lca': 'int lca(int u, int v) {\n    if (dep[u] < dep[v]) swap(u, v);\n    for (int i = LOG - 1; i >= 0; i--)\n        if (dep[u] - (1 << i) >= dep[v])\n            u = fa[u][i];\n    if (u == v) return u;\n    for (int i = LOG - 1; i >= 0; i--)\n        if (fa[u][i] != fa[v][i])\n            u = fa[u][i], v = fa[v][i];\n    return fa[u][0];\n}',
        'kmp': 'vector<int> getNext(const string& s) {\n    int n = s.size();\n    vector<int> nxt(n);\n    for (int i = 1, j = 0; i < n; i++) {\n        while (j && s[i] != s[j]) j = nxt[j - 1];\n        if (s[i] == s[j]) nxt[i] = ++j;\n    }\n    return nxt;\n}',
        'manacher': 'string manacher(const string& s) {\n    string t = "#";\n    for (char c : s) t += c, t += "#";\n    int n = t.size(), mx = 0, id = 0;\n    vector<int> p(n);\n    for (int i = 0; i < n; i++) {\n        p[i] = mx > i ? min(p[2 * id - i], mx - i) : 1;\n        while (i - p[i] >= 0 && i + p[i] < n && t[i - p[i]] == t[i + p[i]]) p[i]++;\n        if (i + p[i] > mx) mx = i + p[i], id = i;\n    }\n    return s.substr((id - p[id] + 1) / 2, p[id] - 1);\n}',
        'trie': 'struct Trie {\n    vector<array<int, 26>> tr;\n    vector<int> cnt;\n    int idx;\n    Trie() { tr.push_back({}); cnt.push_back(0); idx = 0; }\n    void insert(const string& s) {\n        int p = 0;\n        for (char c : s) {\n            int u = c - \'a\';\n            if (!tr[p][u]) tr[p][u] = ++idx, tr.push_back({}), cnt.push_back(0);\n            p = tr[p][u];\n        }\n        cnt[p]++;\n    }\n    int query(const string& s) {\n        int p = 0;\n        for (char c : s) {\n            int u = c - \'a\';\n            if (!tr[p][u]) return 0;\n            p = tr[p][u];\n        }\n        return cnt[p];\n    }\n};',
        'ac': 'struct AC {\n    vector<array<int, 26>> tr;\n    vector<int> fail, cnt;\n    int idx;\n    AC() { tr.push_back({}); fail.push_back(0); cnt.push_back(0); idx = 0; }\n    void insert(const string& s) {\n        int p = 0;\n        for (char c : s) {\n            int u = c - \'a\';\n            if (!tr[p][u]) tr[p][u] = ++idx, tr.push_back({}), fail.push_back(0), cnt.push_back(0);\n            p = tr[p][u];\n        }\n        cnt[p]++;\n    }\n    void build() {\n        queue<int> q;\n        for (int i = 0; i < 26; i++) if (tr[0][i]) q.push(tr[0][i]);\n        while (!q.empty()) {\n            int u = q.front(); q.pop();\n            for (int i = 0; i < 26; i++) {\n                if (tr[u][i]) fail[tr[u][i]] = tr[fail[u]][i], q.push(tr[u][i]);\n                else tr[u][i] = tr[fail[u]][i];\n            }\n        }\n    }\n    int query(const string& s) {\n        int p = 0, res = 0;\n        for (char c : s) {\n            p = tr[p][c - \'a\'];\n            for (int j = p; j && cnt[j] != -1; j = fail[j]) res += cnt[j], cnt[j] = -1;\n        }\n        return res;\n    }\n};',
        'sa': 'vector<int> getSA(const string& s) {\n    int n = s.size(), m = 128;\n    vector<int> sa(n), rk(n), oldrk(n), cnt(max(m, n) + 1);\n    for (int i = 0; i < n; i++) cnt[rk[i] = s[i]]++;\n    for (int i = 1; i <= m; i++) cnt[i] += cnt[i - 1];\n    for (int i = n - 1; i >= 0; i--) sa[--cnt[rk[i]]] = i;\n    for (int w = 1; w < n; w <<= 1) {\n        int p = 0;\n        for (int i = n - w; i < n; i++) oldrk[p++] = i;\n        for (int i = 0; i < n; i++) if (sa[i] >= w) oldrk[p++] = sa[i] - w;\n        fill(cnt.begin(), cnt.begin() + m + 1, 0);\n        for (int i = 0; i < n; i++) cnt[rk[oldrk[i]]]++;\n        for (int i = 1; i <= m; i++) cnt[i] += cnt[i - 1];\n        for (int i = n - 1; i >= 0; i--) sa[--cnt[rk[oldrk[i]]]] = oldrk[i];\n        oldrk = rk;\n        rk[sa[0]] = p = 0;\n        for (int i = 1; i < n; i++)\n            rk[sa[i]] = (oldrk[sa[i]] == oldrk[sa[i - 1]] && oldrk[sa[i] + w] == oldrk[sa[i - 1] + w]) ? p : ++p;\n        if (p == n - 1) break;\n        m = p + 1;\n    }\n    return sa;\n}',
        'ntt': 'void ntt(vector<int>& a, bool inv) {\n    int n = a.size();\n    for (int i = 1, j = 0; i < n; i++) {\n        int bit = n >> 1;\n        for (; j & bit; bit >>= 1) j ^= bit;\n        j ^= bit;\n        if (i < j) swap(a[i], a[j]);\n    }\n    for (int len = 2; len <= n; len <<= 1) {\n        int wlen = power(G, (MOD - 1) / len);\n        if (inv) wlen = power(wlen, MOD - 2);\n        for (int i = 0; i < n; i += len) {\n            int w = 1;\n        for (int j = 0; j < len / 2; j++) {\n                int u = a[i + j], v = (ll)a[i + j + len / 2] * w % MOD;\n                a[i + j] = (u + v) % MOD;\n                a[i + j + len / 2] = (u - v + MOD) % MOD;\n                w = (ll)w * wlen % MOD;\n            }\n        }\n    }\n    if (inv) {\n        int n_inv = power(n, MOD - 2);\n        for (int& x : a) x = (ll)x * n_inv % MOD;\n    }\n}',
        'exgcd': 'll exgcd(ll a, ll b, ll& x, ll& y) {\n    if (b == 0) { x = 1; y = 0; return a; }\n    ll d = exgcd(b, a % b, y, x);\n    y -= a / b * x;\n    return d;\n}',
        'inv': 'll inv(ll a) { return power(a, MOD - 2); }',
        'comb': 'll C(int n, int m) {\n    if (m < 0 || m > n) return 0;\n    return fac[n] * ifac[m] % MOD * ifac[n - m] % MOD;\n}',
        'lucas': 'll lucas(ll n, ll m) {\n    if (m == 0) return 1;\n    return C(n % MOD, m % MOD) * lucas(n / MOD, m / MOD) % MOD;\n}',
        'crt': 'll crt(const vector<ll>& r, const vector<ll>& m) {\n    ll M = 1, ans = 0;\n    for (ll x : m) M *= x;\n    for (int i = 0; i < m.size(); i++) {\n        ll Mi = M / m[i];\n        ll _, ti;\n        exgcd(Mi, m[i], _, ti);\n        ans = (ans + r[i] * Mi * (ti % m[i] + m[i]) % m[i]) % M;\n    }\n    return (ans % M + M) % M;\n}',
        'bsgs': 'll bsgs(ll a, ll b, ll p) {\n    a %= p; b %= p;\n    if (b == 1) return 0;\n    if (a == 0) return b == 0 ? 1 : -1;\n    ll k = sqrt(p) + 1;\n    unordered_map<ll, ll> mp;\n    for (ll i = 0, t = b; i < k; i++, t = t * a % p) mp[t] = i;\n    ll ak = 1;\n    for (int i = 0; i < k; i++) ak = ak * a % p;\n    for (ll i = 1, t = ak; i <= k; i++, t = t * ak % p)\n        if (mp.count(t)) return i * k - mp[t];\n    return -1;\n}',
        'isprime': 'bool isPrime(ll n) {\n    if (n < 2) return false;\n    for (ll i = 2; i * i <= n; i++)\n        if (n % i == 0) return false;\n    return true;\n}',
        'factor': 'vector<ll> factor(ll n) {\n    vector<ll> res;\n    for (ll i = 2; i * i <= n; i++) {\n        while (n % i == 0) res.push_back(i), n /= i;\n    }\n    if (n > 1) res.push_back(n);\n    return res;\n}',
        'phi': 'll phi(ll n) {\n    ll res = n;\n    for (ll i = 2; i * i <= n; i++) {\n        if (n % i == 0) {\n            res = res / i * (i - 1);\n            while (n % i == 0) n /= i;\n        }\n    }\n    if (n > 1) res = res / n * (n - 1);\n    return res;\n}',
        'mu': 'void getMu(int n) {\n    vector<int> primes;\n    vector<bool> vis(n + 1);\n    mu[1] = 1;\n    for (int i = 2; i <= n; i++) {\n        if (!vis[i]) primes.push_back(i), mu[i] = -1;\n        for (int p : primes) {\n            if (i * p > n) break;\n            vis[i * p] = true;\n            if (i % p == 0) { mu[i * p] = 0; break; }\n            mu[i * p] = -mu[i];\n        }\n    }\n}',
        'sieve': 'vector<bool> sieve(int n) {\n    vector<bool> isPrime(n + 1, true);\n    isPrime[0] = isPrime[1] = false;\n    for (int i = 2; i * i <= n; i++)\n        if (isPrime[i])\n            for (int j = i * i; j <= n; j += i)\n                isPrime[j] = false;\n    return isPrime;\n}',
        'euler': 'void euler(int n) {\n    vector<int> primes;\n    vector<bool> vis(n + 1);\n    phi[1] = 1;\n    for (int i = 2; i <= n; i++) {\n        if (!vis[i]) primes.push_back(i), phi[i] = i - 1;\n        for (int p : primes) {\n            if (i * p > n) break;\n            vis[i * p] = true;\n            if (i % p == 0) { phi[i * p] = phi[i] * p; break; }\n            phi[i * p] = phi[i] * (p - 1);\n        }\n    }\n}',
        'quickpow': 'll power(ll a, ll b, ll mod = MOD) {\n    ll res = 1;\n    a %= mod;\n    while (b) {\n        if (b & 1) res = res * a % mod;\n        a = a * a % mod;\n        b >>= 1;\n    }\n    return res;\n}',
        'read': 'template<typename T>\nvoid read(T& x) {\n    x = 0;\n    char c = getchar();\n    while (c < \'0\' || c > \'9\') c = getchar();\n    while (c >= \'0\' && c <= \'9\') x = x * 10 + c - \'0\', c = getchar();\n}',
        'write': 'void write(ll x) {\n    if (x < 0) putchar(\'-\'), x = -x;\n    if (x > 9) write(x / 10);\n    putchar(x % 10 + \'0\');\n}'
      }
    },
    c: {
      keywords: ['auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 'extern', 'float', 'for', 'goto', 'if', 'inline', 'int', 'long', 'register', 'restrict', 'return', 'short', 'signed', 'sizeof', 'static', 'struct', 'switch', 'typedef', 'union', 'unsigned', 'void', 'volatile', 'while', '_Alignas', '_Alignof', '_Atomic', '_Bool', '_Complex', '_Generic', '_Imaginary', '_Noreturn', '_Static_assert', '_Thread_local'],
      types: ['NULL', 'size_t', 'FILE', 'int8_t', 'int16_t', 'int32_t', 'int64_t', 'uint8_t', 'uint16_t', 'uint32_t', 'uint64_t', 'intptr_t', 'uintptr_t', 'true', 'false'],
      snippets: {
        'for': 'for (int i = 0; i < n; i++) {\n    \n}',
        'forr': 'for (int i = n - 1; i >= 0; i--) {\n    \n}',
        'while': 'while () {\n    \n}',
        'if': 'if () {\n    \n}',
        'else': 'else {\n    \n}',
        'elif': 'else if () {\n    \n}',
        'main': 'int main() {\n    \n    return 0;\n}',
        'printf': 'printf("", );',
        'scanf': 'scanf("", &);',
        'struct': 'struct  {\n    \n};',
        'malloc': 'malloc(sizeof())',
        'calloc': 'calloc(, sizeof())',
        'realloc': 'realloc(, )',
        'free': 'free();',
        'memset': 'memset(, 0, sizeof());',
        'memcpy': 'memcpy(, , sizeof());',
        'strlen': 'strlen()',
        'strcmp': 'strcmp(, )',
        'strcpy': 'strcpy(, )',
        'fgets': 'fgets(, , stdin);',
        'fopen': 'fopen("", "r")',
        'fclose': 'fclose();',
        'fscanf': 'fscanf(, "", )',
        'fprintf': 'fprintf(, "", )',
        'qsort': 'qsort(, , sizeof(), cmp);',
        'abs': 'abs()',
        'max': 'max(,)',
        'min': 'min(,)',
        'swap': 'swap(&, &, sizeof());',
        'gcd': '__gcd(,)',
        'lcm': 'lcm(,)',
        'sqrt': 'sqrt()',
        'pow': 'pow(,)',
        'log': 'log()',
        'log10': 'log10()',
        'exp': 'exp()',
        'sin': 'sin()',
        'cos': 'cos()',
        'tan': 'tan()',
        'asin': 'asin()',
        'acos': 'acos()',
        'atan': 'atan()',
        'rand': 'rand()',
        'srand': 'srand(time(NULL));',
        'time': 'time(NULL)',
        'clock': 'clock()',
        'exit': 'exit(0);',
        'assert': 'assert();',
        'define': '#define ',
        'ifdef': '#ifdef \n#endif',
        'ifndef': '#ifndef \n#endif',
        'include': '#include <>',
        'pragma': '#pragma ',
        'typedef': 'typedef  ;',
        'static': 'static ',
        'const': 'const ',
        'volatile': 'volatile ',
        'extern': 'extern ',
        'inline': 'inline ',
        'restrict': 'restrict '
      }
    },
    java: {
      keywords: ['abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'final', 'finally', 'float', 'for', 'goto', 'if', 'implements', 'import', 'instanceof', 'int', 'interface', 'long', 'native', 'new', 'package', 'private', 'protected', 'public', 'return', 'short', 'static', 'strictfp', 'super', 'switch', 'synchronized', 'this', 'throw', 'throws', 'transient', 'try', 'void', 'volatile', 'while', 'true', 'false', 'null', 'var', 'yield', 'record', 'sealed', 'permits', 'non-sealed'],
      types: ['String', 'Integer', 'Long', 'Double', 'Float', 'Boolean', 'Character', 'Byte', 'Short', 'Void', 'Object', 'Class', 'System', 'Math', 'Arrays', 'Collections', 'List', 'ArrayList', 'LinkedList', 'Vector', 'Stack', 'Queue', 'PriorityQueue', 'Deque', 'ArrayDeque', 'Set', 'HashSet', 'LinkedHashSet', 'TreeSet', 'Map', 'HashMap', 'LinkedHashMap', 'TreeMap', 'Hashtable', 'Properties', 'Iterator', 'ListIterator', 'Enumeration', 'Scanner', 'BufferedReader', 'BufferedWriter', 'FileReader', 'FileWriter', 'PrintStream', 'InputStream', 'OutputStream', 'FileInputStream', 'FileOutputStream', 'ObjectInputStream', 'ObjectOutputStream', 'ByteArrayInputStream', 'ByteArrayOutputStream', 'DataInputStream', 'DataOutputStream', 'RandomAccessFile', 'File', 'Path', 'Paths', 'Files', 'Stream', 'IntStream', 'LongStream', 'DoubleStream', 'Optional', 'OptionalInt', 'OptionalLong', 'OptionalDouble', 'CompletableFuture', 'Thread', 'Runnable', 'Callable', 'Future', 'ExecutorService', 'Executors', 'Semaphore', 'CountDownLatch', 'CyclicBarrier', 'Lock', 'ReentrantLock', 'ReadWriteLock', 'Condition', 'AtomicInteger', 'AtomicLong', 'AtomicBoolean', 'AtomicReference', 'StringBuilder', 'StringBuffer', 'Pattern', 'Matcher', 'BigInteger', 'BigDecimal', 'LocalDate', 'LocalTime', 'LocalDateTime', 'Instant', 'Duration', 'Period', 'DateTimeFormatter', 'ZoneId', 'Comparator', 'Comparable', 'Function', 'Predicate', 'Consumer', 'Supplier', 'UnaryOperator', 'BinaryOperator', 'Collector', 'Collectors'],
      snippets: {
        'main': 'public static void main(String[] args) {\n    \n}',
        'class': 'public class  {\n    \n}',
        'for': 'for (int i = 0; i < n; i++) {\n    \n}',
        'forr': 'for (int i = n - 1; i >= 0; i--) {\n    \n}',
        'foreach': 'for ( : ) {\n    \n}',
        'while': 'while () {\n    \n}',
        'if': 'if () {\n    \n}',
        'else': 'else {\n    \n}',
        'elif': 'else if () {\n    \n}',
        'switch': 'switch () {\n    case :\n        break;\n    default:\n}',
        'try': 'try {\n    \n} catch (Exception e) {\n    e.printStackTrace();\n}',
        'tryf': 'try {\n    \n} catch (Exception e) {\n    e.printStackTrace();\n} finally {\n    \n}',
        'sout': 'System.out.println();',
        'soutv': 'System.out.println(" = " + );',
        'soutm': 'System.out.println(".");',
        'scanner': 'Scanner sc = new Scanner(System.in);',
        'nextint': 'sc.nextInt()',
        'nextlong': 'sc.nextLong()',
        'nextdouble': 'sc.nextDouble()',
        'nextline': 'sc.nextLine()',
        'next': 'sc.next()',
        'parseint': 'Integer.parseInt()',
        'parselong': 'Long.parseLong()',
        'parsedouble': 'Double.parseDouble()',
        'tostring': '.toString()',
        'length': '.length()',
        'size': '.size()',
        'isempty': '.isEmpty()',
        'contains': '.contains()',
        'add': '.add()',
        'remove': '.remove()',
        'get': '.get()',
        'set': '.set()',
        'clear': '.clear()',
        'sort': 'Collections.sort();',
        'reverse': 'Collections.reverse();',
        'binary': 'Collections.binarySearch();',
        'max': 'Collections.max()',
        'min': 'Collections.min()',
        'swap': 'Collections.swap();',
        'fill': 'Collections.fill();',
        'copy': 'Collections.copy();',
        'shuffle': 'Collections.shuffle();',
        'aslist': 'Arrays.asList()',
        'tolist': '.toArray(new String[0])',
        'arraylist': 'ArrayList<>()',
        'hashmap': 'HashMap<>()',
        'hashset': 'HashSet<>()',
        'linkedlist': 'LinkedList<>()',
        'treemap': 'TreeMap<>()',
        'treeset': 'TreeSet<>()',
        'priority': 'PriorityQueue<>()',
        'stack': 'Stack<>()',
        'queue': 'LinkedList<>()',
        'deque': 'ArrayDeque<>()',
        'mapentry': 'Map.Entry<>',
        'keyset': '.keySet()',
        'values': '.values()',
        'entryset': '.entrySet()',
        'substring': '.substring()',
        'indexof': '.indexOf()',
        'lastindex': '.lastIndexOf()',
        'replace': '.replace()',
        'split': '.split()',
        'trim': '.trim()',
        'toupper': '.toUpperCase()',
        'tolower': '.toLowerCase()',
        'startswith': '.startsWith()',
        'endswith': '.endsWith()',
        'equals': '.equals()',
        'compare': '.compareTo()',
        'charat': '.charAt()',
        'valueof': 'String.valueOf()',
        'format': 'String.format()',
        'join': 'String.join()',
        'repeat': '.repeat()',
        'strip': '.strip()',
        'isblank': '.isBlank()',
        'lines': '.lines()',
        'mathabs': 'Math.abs()',
        'mathmax': 'Math.max()',
        'mathmin': 'Math.min()',
        'mathsqrt': 'Math.sqrt()',
        'mathpow': 'Math.pow()',
        'mathexp': 'Math.exp()',
        'mathlog': 'Math.log()',
        'mathlog10': 'Math.log10()',
        'mathsin': 'Math.sin()',
        'mathcos': 'Math.cos()',
        'mathtan': 'Math.tan()',
        'mathasin': 'Math.asin()',
        'mathacos': 'Math.acos()',
        'mathatan': 'Math.atan()',
        'mathceil': 'Math.ceil()',
        'mathfloor': 'Math.floor()',
        'mathround': 'Math.round()',
        'mathrandom': 'Math.random()',
        'mathpi': 'Math.PI',
        'mathmaxint': 'Integer.MAX_VALUE',
        'mathminint': 'Integer.MIN_VALUE',
        'mathmaxlong': 'Long.MAX_VALUE',
        'mathminlong': 'Long.MIN_VALUE',
        'thread': 'new Thread(() -> {\n    \n}).start();',
        'runnable': 'Runnable r = () -> {\n    \n};',
        'synchronized': 'synchronized () {\n    \n}',
        'override': '@Override',
        'deprecated': '@Deprecated',
        'suppress': '@SuppressWarnings("")',
        'functional': '@FunctionalInterface',
        'safevarargs': '@SafeVarargs',
        'repeatable': '@Repeatable',
        'target': '@Target({})',
        'retention': '@Retention(RetentionPolicy.RUNTIME)',
        'documented': '@Documented',
        'inherited': '@Inherited',
        'native': 'native ',
        'strictfp': 'strictfp ',
        'transient': 'transient ',
        'volatile': 'volatile ',
        'assert': 'assert ;',
        'this': 'this.',
        'super': 'super.',
        'instanceof': ' instanceof ',
        'new': 'new ',
        'return': 'return ;',
        'break': 'break;',
        'continue': 'continue;',
        'throw': 'throw new Exception();',
        'throws': 'throws ',
        'extends': 'extends ',
        'implements': 'implements ',
        'package': 'package ;',
        'import': 'import ;',
        'public': 'public ',
        'private': 'private ',
        'protected': 'protected ',
        'static': 'static ',
        'final': 'final ',
        'abstract': 'abstract ',
        'interface': 'interface  {\n    \n}',
        'enum': 'enum  {\n    \n}',
        'record': 'record (,) {}',
        'sealed': 'sealed class  permits  {}',
        'permits': 'permits ',
        'non-sealed': 'non-sealed ',
        'yield': 'yield ;',
        'var': 'var ',
        'null': 'null',
        'true': 'true',
        'false': 'false'
      }
    },
    python: {
      keywords: ['False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield'],
      types: ['list', 'dict', 'set', 'tuple', 'str', 'int', 'float', 'bool', 'bytes', 'bytearray', 'memoryview', 'range', 'frozenset', 'complex', 'object', 'type', 'enumerate', 'zip', 'map', 'filter', 'reduce', 'sum', 'min', 'max', 'abs', 'round', 'pow', 'divmod', 'len', 'sorted', 'reversed', 'any', 'all', 'chr', 'ord', 'hex', 'oct', 'bin', 'format', 'repr', 'eval', 'exec', 'compile', 'open', 'input', 'print', 'range', 'xrange', 'len', 'sorted', 'reversed', 'enumerate', 'zip', 'map', 'filter', 'sum', 'min', 'max', 'abs', 'round', 'pow', 'divmod', 'any', 'all', 'chr', 'ord', 'hex', 'oct', 'bin', 'format', 'repr', 'ascii', 'bytes', 'bytearray', 'memoryview', 'hash', 'id', 'type', 'isinstance', 'issubclass', 'callable', 'hasattr', 'getattr', 'setattr', 'delattr', 'property', 'staticmethod', 'classmethod', 'super', 'object', '__init__', '__str__', '__repr__', '__len__', '__getitem__', '__setitem__', '__delitem__', '__iter__', '__next__', '__contains__', '__call__', '__enter__', '__exit__', '__name__', '__main__', '__file__', '__doc__', '__package__', '__spec__', '__annotations__', '__builtins__', '__cached__', '__loader__', '__import__'],
      snippets: {
        'def': 'def ():\n    """"""\n    pass',
        'defs': 'def (self):\n    """"""\n    pass',
        'class': 'class :\n    """"""\n    def __init__(self):\n        pass',
        'if': 'if :\n    ',
        'else': 'else:\n    ',
        'elif': 'elif :\n    ',
        'for': 'for  in :\n    ',
        'while': 'while :\n    ',
        'try': 'try:\n    \nexcept Exception as e:\n    print(e)',
        'tryf': 'try:\n    \nexcept Exception as e:\n    print(e)\nfinally:\n    ',
        'with': 'with  as :\n    ',
        'lambda': 'lambda : ',
        'list': '[]',
        'dict': '{}',
        'set': 'set()',
        'tuple': '()',
        'comp': '[ for  in ]',
        'dictc': '{: for  in }',
        'setc': '{ for  in }',
        'genc': '( for  in )',
        'print': 'print()',
        'input': 'input()',
        'int': 'int()',
        'float': 'float()',
        'str': 'str()',
        'bool': 'bool()',
        'listc': 'list()',
        'dictc': 'dict()',
        'setc': 'set()',
        'tuplec': 'tuple()',
        'range': 'range()',
        'len': 'len()',
        'enumerate': 'enumerate()',
        'zip': 'zip()',
        'map': 'map()',
        'filter': 'filter()',
        'reduce': 'reduce()',
        'sum': 'sum()',
        'min': 'min()',
        'max': 'max()',
        'abs': 'abs()',
        'round': 'round()',
        'pow': 'pow()',
        'divmod': 'divmod()',
        'sorted': 'sorted()',
        'reversed': 'reversed()',
        'any': 'any()',
        'all': 'all()',
        'chr': 'chr()',
        'ord': 'ord()',
        'hex': 'hex()',
        'oct': 'oct()',
        'bin': 'bin()',
        'format': 'format()',
        'repr': 'repr()',
        'ascii': 'ascii()',
        'bytes': 'bytes()',
        'bytearray': 'bytearray()',
        'memoryview': 'memoryview()',
        'hash': 'hash()',
        'id': 'id()',
        'type': 'type()',
        'isinstance': 'isinstance()',
        'issubclass': 'issubclass()',
        'callable': 'callable()',
        'hasattr': 'hasattr()',
        'getattr': 'getattr()',
        'setattr': 'setattr()',
        'delattr': 'delattr()',
        'property': '@property\ndef (self):\n    return ',
        'staticmethod': '@staticmethod\ndef ():\n    pass',
        'classmethod': '@classmethod\ndef (cls):\n    pass',
        'abstract': '@abstractmethod\ndef (self):\n    pass',
        'dataclass': '@dataclass\nclass :\n    : ',
        'super': 'super()',
        'self': 'self',
        'init': 'def __init__(self):\n    pass',
        'strm': 'def __str__(self):\n    return ""',
        'reprm': 'def __repr__(self):\n    return ""',
        'lenm': 'def __len__(self):\n    return 0',
        'getitem': 'def __getitem__(self, key):\n    return ',
        'setitem': 'def __setitem__(self, key, value):\n    pass',
        'delitem': 'def __delitem__(self, key):\n    pass',
        'iter': 'def __iter__(self):\n    return self',
        'next': 'def __next__(self):\n    raise StopIteration',
        'contains': 'def __contains__(self, item):\n    return False',
        'call': 'def __call__(self, *args, **kwargs):\n    return ',
        'enter': 'def __enter__(self):\n    return self',
        'exit': 'def __exit__(self, exc_type, exc_val, exc_tb):\n    pass',
        'import': 'import ',
        'from': 'from  import ',
        'as': ' as ',
        'global': 'global ',
        'nonlocal': 'nonlocal ',
        'assert': 'assert ',
        'raise': 'raise ',
        'yield': 'yield ',
        'return': 'return ',
        'pass': 'pass',
        'break': 'break',
        'continue': 'continue',
        'del': 'del ',
        'in': ' in ',
        'is': ' is ',
        'not': 'not ',
        'and': ' and ',
        'or': ' or ',
        'True': 'True',
        'False': 'False',
        'None': 'None',
        'append': '.append()',
        'extend': '.extend()',
        'insert': '.insert()',
        'remove': '.remove()',
        'pop': '.pop()',
        'clear': '.clear()',
        'index': '.index()',
        'count': '.count()',
        'sort': '.sort()',
        'reverse': '.reverse()',
        'copy': '.copy()',
        'keys': '.keys()',
        'values': '.values()',
        'items': '.items()',
        'get': '.get()',
        'update': '.update()',
        'setdefault': '.setdefault()',
        'popitem': '.popitem()',
        'join': '.join()',
        'split': '.split()',
        'strip': '.strip()',
        'lstrip': '.lstrip()',
        'rstrip': '.rstrip()',
        'replace': '.replace()',
        'find': '.find()',
        'rfind': '.rfind()',
        'indexof': '.index()',
        'rindex': '.rindex()',
        'startswith': '.startswith()',
        'endswith': '.endswith()',
        'upper': '.upper()',
        'lower': '.lower()',
        'capitalize': '.capitalize()',
        'title': '.title()',
        'swapcase': '.swapcase()',
        'center': '.center()',
        'ljust': '.ljust()',
        'rjust': '.rjust()',
        'zfill': '.zfill()',
        'expandtabs': '.expandtabs()',
        'encode': '.encode()',
        'decode': '.decode()',
        'format': '.format()',
        'startswith': '.startswith()',
        'endswith': '.endswith()',
        'isalnum': '.isalnum()',
        'isalpha': '.isalpha()',
        'isascii': '.isascii()',
        'isdecimal': '.isdecimal()',
        'isdigit': '.isdigit()',
        'isidentifier': '.isidentifier()',
        'islower': '.islower()',
        'isnumeric': '.isnumeric()',
        'isprintable': '.isprintable()',
        'isspace': '.isspace()',
        'istitle': '.istitle()',
        'isupper': '.isupper()',
        'open': 'open()',
        'read': '.read()',
        'write': '.write()',
        'readline': '.readline()',
        'readlines': '.readlines()',
        'writelines': '.writelines()',
        'close': '.close()',
        'seek': '.seek()',
        'tell': '.tell()',
        'flush': '.flush()',
        'truncate': '.truncate()',
        'fileno': '.fileno()',
        'isatty': '.isatty()',
        'readable': '.readable()',
        'writable': '.writable()',
        'seekable': '.seekable()',
        'json': 'import json\njson.dumps()',
        'pickle': 'import pickle\npickle.dumps()',
        're': 'import re\nre.match()',
        'sys': 'import sys\nsys.exit()',
        'os': 'import os\nos.path.join()',
        'math': 'import math\nmath.sqrt()',
        'random': 'import random\nrandom.randint()',
        'datetime': 'import datetime\ndatetime.now()',
        'time': 'import time\ntime.time()',
        'collections': 'from collections import deque, Counter, defaultdict',
        'itertools': 'from itertools import permutations, combinations, product',
        'functools': 'from functools import lru_cache, reduce, cmp_to_key',
        'heapq': 'import heapq\nheapq.heappush()',
        'bisect': 'import bisect\nbisect.bisect_left()',
        'copy': 'import copy\ncopy.deepcopy()',
        'decimal': 'from decimal import Decimal, getcontext',
        'fractions': 'from fractions import Fraction',
        'statistics': 'import statistics\nstatistics.mean()',
        'typing': 'from typing import List, Dict, Set, Tuple, Optional, Union',
        'numpy': 'import numpy as np',
        'pandas': 'import pandas as pd',
        'matplotlib': 'import matplotlib.pyplot as plt',
        'requests': 'import requests\nrequests.get()',
        'bs4': 'from bs4 import BeautifulSoup',
        'sqlite3': 'import sqlite3\nconn = sqlite3.connect()',
        'threading': 'import threading\nthread = threading.Thread()',
        'multiprocessing': 'from multiprocessing import Pool',
        'asyncio': 'import asyncio\nasync def main():\n    pass',
        'aiohttp': 'import aiohttp\nasync with aiohttp.ClientSession() as session:',
        'flask': 'from flask import Flask\napp = Flask(__name__)',
        'django': 'from django.shortcuts import render',
        'fastapi': 'from fastapi import FastAPI\napp = FastAPI()',
        'pytest': 'import pytest\n@pytest.mark.parametrize',
        'unittest': 'import unittest\nclass Test(unittest.TestCase):',
        'mock': 'from unittest.mock import Mock, patch',
        'logging': 'import logging\nlogging.basicConfig()',
        'argparse': 'import argparse\nparser = argparse.ArgumentParser()',
        'configparser': 'import configparser\nconfig = configparser.ConfigParser()',
        'pathlib': 'from pathlib import Path\npath = Path()',
        'shutil': 'import shutil\nshutil.copy()',
        'glob': 'import glob\nglob.glob()',
        'fnmatch': 'import fnmatch\nfnmatch.fnmatch()',
        'tempfile': 'import tempfile\nwith tempfile.TemporaryFile() as f:',
        'hashlib': 'import hashlib\nhashlib.md5()',
        'base64': 'import base64\nbase64.b64encode()',
        'urllib': 'import urllib.request\nurllib.request.urlopen()',
        'http': 'import http.client\nconn = http.client.HTTPConnection()',
        'socket': 'import socket\ns = socket.socket()',
        'subprocess': 'import subprocess\nsubprocess.run()',
        'signal': 'import signal\nsignal.signal()',
        'atexit': 'import atexit\n@atexit.register',
        'weakref': 'import weakref\nweakref.ref()',
        'gc': 'import gc\ngc.collect()',
        'inspect': 'import inspect\ninspect.getmembers()',
        'ast': 'import ast\nast.parse()',
        'dis': 'import dis\ndis.dis()',
        'pdb': 'import pdb\npdb.set_trace()',
        'traceback': 'import traceback\ntraceback.print_exc()',
        'warnings': 'import warnings\nwarnings.warn()',
        'contextlib': 'from contextlib import contextmanager\n@contextmanager',
        'functools': 'from functools import wraps\n@wraps',
        'total_ordering': '@functools.total_ordering',
        'singledispatch': '@functools.singledispatch',
        'lru_cache': '@functools.lru_cache(maxsize=128)',
        'cache': '@functools.cache',
        'cmp_to_key': 'functools.cmp_to_key()',
        'partial': 'functools.partial()',
        'reduce': 'functools.reduce()'
      }
    },
    go: {
      keywords: ['break', 'case', 'chan', 'const', 'continue', 'default', 'defer', 'else', 'fallthrough', 'for', 'func', 'go', 'goto', 'if', 'import', 'interface', 'map', 'package', 'range', 'return', 'select', 'struct', 'switch', 'type', 'var'],
      types: ['bool', 'byte', 'complex64', 'complex128', 'error', 'float32', 'float64', 'int', 'int8', 'int16', 'int32', 'int64', 'rune', 'string', 'uint', 'uint8', 'uint16', 'uint32', 'uint64', 'uintptr', 'any', 'comparable', 'true', 'false', 'iota', 'nil', 'append', 'cap', 'close', 'complex', 'copy', 'delete', 'imag', 'len', 'make', 'new', 'panic', 'print', 'println', 'real', 'recover'],
      snippets: {
        'package': 'package main',
        'import': 'import (\n    \n)',
        'func': 'func () {\n    \n}',
        'main': 'func main() {\n    \n}',
        'for': 'for i := 0; i < n; i++ {\n    \n}',
        'forr': 'for i := n - 1; i >= 0; i-- {\n    \n}',
        'range': 'for _, v := range  {\n    \n}',
        'rangei': 'for i, v := range  {\n    \n}',
        'if': 'if  {\n    \n}',
        'else': 'else {\n    \n}',
        'elif': 'else if  {\n    \n}',
        'switch': 'switch  {\n    case :\n        \n    default:\n        \n}',
        'select': 'select {\n    case <-:\n        \n    default:\n        \n}',
        'struct': 'type  struct {\n    \n}',
        'interface': 'type  interface {\n    \n}',
        'type': 'type  ',
        'const': 'const  = ',
        'var': 'var  ',
        ':=': ' := ',
        'make': 'make()',
        'new': 'new()',
        'append': 'append(,)',
        'len': 'len()',
        'cap': 'cap()',
        'copy': 'copy(,)',
        'delete': 'delete(,)',
        'close': 'close()',
        'panic': 'panic()',
        'recover': 'recover()',
        'print': 'print()',
        'println': 'println()',
        'fmt': 'fmt.Printf("", )',
        'fmtln': 'fmt.Println()',
        'scan': 'fmt.Scan(&)',
        'scanf': 'fmt.Scanf("", )',
        'sprintf': 'fmt.Sprintf("", )',
        'error': 'errors.New("")',
        'nil': 'nil',
        'true': 'true',
        'false': 'false',
        'iota': 'iota',
        'int': 'int',
        'int8': 'int8',
        'int16': 'int16',
        'int32': 'int32',
        'int64': 'int64',
        'uint': 'uint',
        'uint8': 'uint8',
        'uint16': 'uint16',
        'uint32': 'uint32',
        'uint64': 'uint64',
        'float32': 'float32',
        'float64': 'float64',
        'complex64': 'complex64',
        'complex128': 'complex128',
        'byte': 'byte',
        'rune': 'rune',
        'string': 'string',
        'bool': 'bool',
        'any': 'any',
        'comparable': 'comparable',
        'uintptr': 'uintptr',
        'chan': 'chan ',
        'goroutine': 'go func() {\n    \n}()',
        'defer': 'defer func() {\n    \n}()',
        'return': 'return ',
        'break': 'break',
        'continue': 'continue',
        'fallthrough': 'fallthrough',
        'goto': 'goto ',
        'map': 'map[]',
        'slice': '[]',
        'array': '[]',
        'pointer': '*',
        'address': '&',
        'channel': 'make(chan )',
        'buffered': 'make(chan , )',
        'goroutine': 'go ',
        'waitgroup': 'var wg sync.WaitGroup\nwg.Add()\nwg.Wait()',
        'mutex': 'var mu sync.Mutex\nmu.Lock()\ndefer mu.Unlock()',
        'rwmutex': 'var rw sync.RWMutex\nrw.RLock()\ndefer rw.RUnlock()',
        'once': 'var once sync.Once\nonce.Do(func() {\n    \n})',
        'pool': 'var pool = sync.Pool{\n    New: func() interface{} {\n        return nil\n    },\n}',
        'context': 'ctx, cancel := context.WithCancel(context.Background())\ndefer cancel()',
        'timeout': 'ctx, cancel := context.WithTimeout(context.Background(), time.Second)\ndefer cancel()',
        'deadline': 'ctx, cancel := context.WithDeadline(context.Background(), time.Now().Add(time.Second))\ndefer cancel()',
        'value': 'ctx := context.WithValue(context.Background(), key, value)',
        'timer': 'timer := time.NewTimer(time.Second)\n<-timer.C',
        'ticker': 'ticker := time.NewTicker(time.Second)\nfor range ticker.C {\n    \n}',
        'sleep': 'time.Sleep(time.Second)',
        'after': '<-time.After(time.Second)',
        'tick': '<-time.Tick(time.Second)',
        'now': 'time.Now()',
        'since': 'time.Since()',
        'until': 'time.Until()',
        'format': '.Format(time.RFC3339)',
        'parse': 'time.Parse(time.RFC3339, )',
        'duration': 'time.Duration()',
        'second': 'time.Second',
        'minute': 'time.Minute',
        'hour': 'time.Hour',
        'millisecond': 'time.Millisecond',
        'microsecond': 'time.Microsecond',
        'nanosecond': 'time.Nanosecond',
        'json': 'json.Marshal()',
        'jsoni': 'json.Unmarshal()',
        'xml': 'xml.Marshal()',
        'xmli': 'xml.Unmarshal()',
        'yaml': 'yaml.Marshal()',
        'ymli': 'yaml.Unmarshal()',
        'csv': 'csv.NewReader()',
        'zip': 'zip.NewReader()',
        'tar': 'tar.NewReader()',
        'gzip': 'gzip.NewReader()',
        'http': 'http.Get()',
        'httppost': 'http.Post()',
        'httpnew': 'http.NewRequest()',
        'serve': 'http.ListenAndServe(":8080", nil)',
        'handler': 'func(w http.ResponseWriter, r *http.Request) {\n    \n}',
        'fileserver': 'http.FileServer(http.Dir(""))',
        'template': 'template.ParseFiles()',
        'execute': 'template.Execute()',
        'db': 'db, err := sql.Open("", "")',
        'query': 'rows, err := db.Query()',
        'exec': 'result, err := db.Exec()',
        'prepare': 'stmt, err := db.Prepare()',
        'begin': 'tx, err := db.Begin()',
        'commit': 'tx.Commit()',
        'rollback': 'tx.Rollback()',
        'scan': 'rows.Scan()',
        'next': 'rows.Next()',
        'close': '.Close()',
        'err': 'if err != nil {\n    log.Fatal(err)\n}',
        'ok': 'if !ok {\n    \n}',
        'exists': 'if _, ok := ; ok {\n    \n}',
        'regex': 'regexp.MustCompile()',
        'match': '.MatchString()',
        'find': '.FindString()',
        'replace': '.ReplaceAllString()',
        'split': '.Split()',
        'strings': 'strings.Contains()',
        'strconv': 'strconv.Atoi()',
        'sort': 'sort.Ints()',
        'reverse': 'sort.Sort(sort.Reverse())',
        'search': 'sort.Search()',
        'heap': 'heap.Push()',
        'list': 'list.New()',
        'ring': 'ring.New()',
        'container': 'container/heap',
        'crypto': 'crypto/sha256',
        'hash': 'h := sha256.New()',
        'rand': 'rand.Intn()',
        'crypto': 'crypto/rand',
        'big': 'big.NewInt()',
        'rat': 'big.NewRat()',
        'float': 'big.NewFloat()',
        'complex': 'cmplx.Sqrt()',
        'math': 'math.Sqrt()',
        'abs': 'math.Abs()',
        'pow': 'math.Pow()',
        'max': 'math.Max()',
        'min': 'math.Min()',
        'ceil': 'math.Ceil()',
        'floor': 'math.Floor()',
        'round': 'math.Round()',
        'trunc': 'math.Trunc()',
        'mod': 'math.Mod()',
        'sin': 'math.Sin()',
        'cos': 'math.Cos()',
        'tan': 'math.Tan()',
        'asin': 'math.Asin()',
        'acos': 'math.Acos()',
        'atan': 'math.Atan()',
        'atan2': 'math.Atan2()',
        'exp': 'math.Exp()',
        'log': 'math.Log()',
        'log10': 'math.Log10()',
        'log2': 'math.Log2()',
        'sqrt': 'math.Sqrt()',
        'cbrt': 'math.Cbrt()',
        'pi': 'math.Pi',
        'e': 'math.E',
        'phi': 'math.Phi',
        'inf': 'math.Inf(1)',
        'nan': 'math.NaN()',
        'isnan': 'math.IsNaN()',
        'isinf': 'math.IsInf()',
        'signbit': 'math.Signbit()',
        'copysign': 'math.Copysign()',
        'dim': 'math.Dim()',
        'hypot': 'math.Hypot()',
        'remainder': 'math.Remainder()',
        'nextafter': 'math.Nextafter()',
        'gamma': 'math.Gamma()',
        'lgamma': 'math.Lgamma()',
        'j0': 'math.J0()',
        'j1': 'math.J1()',
        'jn': 'math.Jn()',
        'y0': 'math.Y0()',
        'y1': 'math.Y1()',
        'yn': 'math.Yn()',
        'erfc': 'math.Erfc()',
        'erf': 'math.Erf()',
        'erfinv': 'math.Erfinv()',
        'erfcinv': 'math.Erfcinv()',
        'norm': 'math.Norm()',
        'norminv': 'math.Norminv()',
        'pow10': 'math.Pow10()',
        'ilogb': 'math.Ilogb()',
        'logb': 'math.Logb()',
        'frexp': 'math.Frexp()',
        'ldexp': 'math.Ldexp()',
        'modf': 'math.Modf()',
        'sincos': 'math.Sincos()',
        'sincosh': 'math.Sincosh()',
        'tanh': 'math.Tanh()',
        'sinh': 'math.Sinh()',
        'cosh': 'math.Cosh()',
        'asinh': 'math.Asinh()',
        'acosh': 'math.Acosh()',
        'atanh': 'math.Atanh()',
        'expm1': 'math.Expm1()',
        'log1p': 'math.Log1p()',
        'fma': 'math.FMA()',
        'float32bits': 'math.Float32bits()',
        'float32frombits': 'math.Float32frombits()',
        'float64bits': 'math.Float64bits()',
        'float64frombits': 'math.Float64frombits()',
        'abs32': 'math.Abs(32)',
        'abs64': 'math.Abs(64)',
        'max32': 'math.Max(32)',
        'max64': 'math.Max(64)',
        'min32': 'math.Min(32)',
        'min64': 'math.Min(64)'
      }
    },
    javascript: {
      keywords: ['await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do', 'else', 'export', 'extends', 'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof', 'new', 'return', 'super', 'switch', 'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield', 'let', 'static', 'yield', 'await', 'of'],
      types: ['console', 'Array', 'Object', 'String', 'Number', 'Boolean', 'Date', 'RegExp', 'Function', 'Math', 'JSON', 'Promise', 'Set', 'Map', 'WeakSet', 'WeakMap', 'Symbol', 'BigInt', 'Error', 'EvalError', 'RangeError', 'ReferenceError', 'SyntaxError', 'TypeError', 'URIError', 'ArrayBuffer', 'SharedArrayBuffer', 'DataView', 'Int8Array', 'Uint8Array', 'Uint8ClampedArray', 'Int16Array', 'Uint16Array', 'Int32Array', 'Uint32Array', 'Float32Array', 'Float64Array', 'BigInt64Array', 'BigUint64Array', 'Intl', 'Collator', 'DateTimeFormat', 'ListFormat', 'NumberFormat', 'PluralRules', 'RelativeTimeFormat', 'Segmenter', 'document', 'window', 'navigator', 'location', 'history', 'localStorage', 'sessionStorage', 'fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'Worker', 'SharedWorker', 'Atomics', 'WebAssembly', 'Buffer', 'process', 'global', 'require', 'module', 'exports', '__dirname', '__filename', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'setImmediate', 'clearImmediate', 'queueMicrotask', 'performance', 'crypto', 'TextEncoder', 'TextDecoder', 'URL', 'URLSearchParams', 'FormData', 'Headers', 'Request', 'Response', 'Blob', 'File', 'FileReader', 'FileList', 'DragEvent', 'ClipboardEvent', 'CustomEvent', 'MutationObserver', 'IntersectionObserver', 'ResizeObserver', 'PerformanceObserver', 'ReportingObserver', 'Notification', 'PermissionStatus', 'PushManager', 'PushSubscription', 'ServiceWorker', 'ServiceWorkerRegistration', 'ServiceWorkerContainer', 'Cache', 'CacheStorage', 'Clients', 'Client', 'WindowClient', 'BackgroundFetchManager', 'BackgroundFetchRecord', 'BackgroundFetchRegistration', 'SyncManager', 'SyncEvent', 'PeriodicSyncManager', 'PeriodicSyncEvent', 'PushEvent', 'NotificationEvent', 'ExtendableEvent', 'ExtendableMessageEvent', 'FetchEvent', 'InstallEvent', 'ActivateEvent', 'MessageEvent', 'ErrorEvent', 'CloseEvent', 'PromiseRejectionEvent', 'UnhandledRejectionEvent', 'RejectionHandledEvent', 'PopStateEvent', 'HashChangeEvent', 'PageTransitionEvent', 'BeforeUnloadEvent', 'UnloadEvent', 'LoadEvent', 'DOMContentLoadedEvent', 'ReadystatechangeEvent', 'ScrollEvent', 'ResizeEvent', 'FocusEvent', 'BlurEvent', 'FocusinEvent', 'FocusoutEvent', 'InputEvent', 'ChangeEvent', 'SubmitEvent', 'ResetEvent', 'ClickEvent', 'DblclickEvent', 'MousedownEvent', 'MouseupEvent', 'MousemoveEvent', 'MouseoverEvent', 'MouseoutEvent', 'MouseenterEvent', 'MouseleaveEvent', 'ContextmenuEvent', 'WheelEvent', 'KeydownEvent', 'KeyupEvent', 'KeypressEvent', 'TouchEvent', 'PointerEvent', 'GestureEvent', 'CompositionEvent', 'BeforeInputEvent', 'InvalidEvent', 'SearchEvent', 'SelectEvent', 'ToggleEvent', 'ShowEvent', 'HideEvent', 'OpenEvent', 'CloseEvent', 'CancelEvent', 'PlayEvent', 'PauseEvent', 'EndedEvent', 'LoadedmetadataEvent', 'LoadeddataEvent', 'CanplayEvent', 'CanplaythroughEvent', 'WaitingEvent', 'PlayingEvent', 'SeekingEvent', 'SeekedEvent', 'TimeupdateEvent', 'VolumechangeEvent', 'RatechangeEvent', 'DurationchangeEvent', 'ProgressEvent', 'SuspendEvent', 'EmptiedEvent', 'StalledEvent', 'LoadstartEvent', 'LoadEvent', 'AbortEvent', 'ErrorEvent', 'OnlineEvent', 'OfflineEvent', 'MessageEvent', 'StorageEvent', 'HashchangeEvent', 'PopstateEvent', 'PageshowEvent', 'PagehideEvent', 'BeforeprintEvent', 'AfterprintEvent', 'AnimationEvent', 'TransitionEvent', 'AnimationstartEvent', 'AnimationendEvent', 'AnimationiterationEvent', 'TransitionstartEvent', 'TransitionendEvent', 'WebkitAnimationEvent', 'WebkitTransitionEvent', 'DOMActivateEvent', 'DOMFocusInEvent', 'DOMFocusOutEvent', 'DOMMouseScrollEvent', 'DOMSubtreeModifiedEvent', 'DOMNodeInsertedEvent', 'DOMNodeRemovedEvent', 'DOMNodeInsertedIntoDocumentEvent', 'DOMNodeRemovedFromDocumentEvent', 'DOMAttrModifiedEvent', 'DOMCharacterDataModifiedEvent', 'DOMElementNameChangedEvent', 'DOMAttributeNameChangedEvent', 'DOMContentLoadedEvent'],
      snippets: {
        'log': 'console.log();',
        'error': 'console.error();',
        'warn': 'console.warn();',
        'info': 'console.info();',
        'debug': 'console.debug();',
        'table': 'console.table();',
        'time': 'console.time();',
        'timee': 'console.timeEnd();',
        'group': 'console.group();',
        'groupc': 'console.groupCollapsed();',
        'grouped': 'console.groupEnd();',
        'count': 'console.count();',
        'countr': 'console.countReset();',
        'trace': 'console.trace();',
        'assert': 'console.assert();',
        'clear': 'console.clear();',
        'dir': 'console.dir();',
        'dirxml': 'console.dirxml();',
        'profile': 'console.profile();',
        'profilee': 'console.profileEnd();',
        'func': 'function () {\n    \n}',
        'arrow': '() => {\n    \n}',
        'af': 'async () => {\n    \n}',
        'for': 'for (let i = 0; i < ; i++) {\n    \n}',
        'forr': 'for (let i =  - 1; i >= 0; i--) {\n    \n}',
        'forof': 'for (const  of ) {\n    \n}',
        'forin': 'for (const  in ) {\n    \n}',
        'while': 'while () {\n    \n}',
        'dowhile': 'do {\n    \n} while ();',
        'if': 'if () {\n    \n}',
        'else': 'else {\n    \n}',
        'elif': 'else if () {\n    \n}',
        'switch': 'switch () {\n    case :\n        break;\n    default:\n}',
        'try': 'try {\n    \n} catch (error) {\n    console.error(error);\n}',
        'tryf': 'try {\n    \n} catch (error) {\n    console.error(error);\n} finally {\n    \n}',
        'class': 'class  {\n    constructor() {\n        \n    }\n}',
        'extends': 'class  extends  {\n    constructor() {\n        super();\n        \n    }\n}',
        'import': 'import  from \'\';',
        'export': 'export default ;',
        'named': 'export { };',
        'require': 'const  = require(\'\');',
        'module': 'module.exports = ;',
        'promise': 'new Promise((resolve, reject) => {\n    \n})',
        'then': '.then(() => {\n    \n})',
        'catch': '.catch((error) => {\n    console.error(error);\n})',
        'finally': '.finally(() => {\n    \n})',
        'async': 'async function () {\n    \n}',
        'await': 'await ',
        'fetch': 'fetch(\'\')\n    .then(response => response.json())\n    .then(data => console.log(data))\n    .catch(error => console.error(error));',
        'axios': 'axios.get(\'\')\n    .then(response => console.log(response.data))\n    .catch(error => console.error(error));',
        'timeout': 'setTimeout(() => {\n    \n}, 1000);',
        'interval': 'setInterval(() => {\n    \n}, 1000);',
        'immediate': 'setImmediate(() => {\n    \n});',
        'map': '.map(() => )',
        'filter': '.filter(() => )',
        'reduce': '.reduce((acc, curr) => , 0)',
        'foreach': '.forEach(() => )',
        'find': '.find(() => )',
        'findi': '.findIndex(() => )',
        'some': '.some(() => )',
        'every': '.every(() => )',
        'includes': '.includes()',
        'indexof': '.indexOf()',
        'lastindex': '.lastIndexOf()',
        'slice': '.slice()',
        'splice': '.splice()',
        'concat': '.concat()',
        'join': '.join()',
        'split': '.split()',
        'replace': '.replace()',
        'match': '.match()',
        'search': '.search()',
        'trim': '.trim()',
        'tolower': '.toLowerCase()',
        'toupper': '.toUpperCase()',
        'substr': '.substring()',
        'charat': '.charAt()',
        'charcode': '.charCodeAt()',
        'fromchar': 'String.fromCharCode()',
        'parseint': 'parseInt()',
        'parsefloat': 'parseFloat()',
        'isnan': 'isNaN()',
        'isfinite': 'isFinite()',
        'json': 'JSON.stringify()',
        'jsonp': 'JSON.parse()',
        'local': 'localStorage.getItem(\'\')',
        'locals': 'localStorage.setItem(\'\', \'\')',
        'session': 'sessionStorage.getItem(\'\')',
        'sessions': 'sessionStorage.setItem(\'\', \'\')',
        'query': 'document.querySelector()',
        'querya': 'document.querySelectorAll()',
        'getid': 'document.getElementById()',
        'getclass': 'document.getElementsByClassName()',
        'gettag': 'document.getElementsByTagName()',
        'create': 'document.createElement()',
        'append': '.appendChild()',
        'remove': '.removeChild()',
        'replace': '.replaceChild()',
        'insert': '.insertBefore()',
        'clone': '.cloneNode()',
        'addevent': '.addEventListener()',
        'removeevent': '.removeEventListener()',
        'prevent': 'event.preventDefault()',
        'stop': 'event.stopPropagation()',
        'target': 'event.target',
        'current': 'event.currentTarget',
        'delegate': 'event.delegateTarget',
        'stopimmediate': 'event.stopImmediatePropagation()',
        'composed': 'event.composedPath()',
        'math': 'Math.',
        'abs': 'Math.abs()',
        'ceil': 'Math.ceil()',
        'floor': 'Math.floor()',
        'round': 'Math.round()',
        'max': 'Math.max()',
        'min': 'Math.min()',
        'pow': 'Math.pow()',
        'sqrt': 'Math.sqrt()',
        'cbrt': 'Math.cbrt()',
        'exp': 'Math.exp()',
        'log': 'Math.log()',
        'log10': 'Math.log10()',
        'log2': 'Math.log2()',
        'sin': 'Math.sin()',
        'cos': 'Math.cos()',
        'tan': 'Math.tan()',
        'asin': 'Math.asin()',
        'acos': 'Math.acos()',
        'atan': 'Math.atan()',
        'atan2': 'Math.atan2()',
        'random': 'Math.random()',
        'pi': 'Math.PI',
        'e': 'Math.E',
        'ln2': 'Math.LN2',
        'ln10': 'Math.LN10',
        'log2e': 'Math.LOG2E',
        'log10e': 'Math.LOG10E',
        'sqrt1_2': 'Math.SQRT1_2',
        'sqrt2': 'Math.SQRT2',
        'date': 'new Date()',
        'now': 'Date.now()',
        'parse': 'Date.parse()',
        'utc': 'Date.UTC()',
        'gettime': '.getTime()',
        'getfull': '.getFullYear()',
        'getmonth': '.getMonth()',
        'getdate': '.getDate()',
        'getday': '.getDay()',
        'gethours': '.getHours()',
        'getmin': '.getMinutes()',
        'getsec': '.getSeconds()',
        'getms': '.getMilliseconds()',
        'settime': '.setTime()',
        'setfull': '.setFullYear()',
        'setmonth': '.setMonth()',
        'setdate': '.setDate()',
        'sethours': '.setHours()',
        'setmin': '.setMinutes()',
        'setsec': '.setSeconds()',
        'setms': '.setMilliseconds()',
        'toiso': '.toISOString()',
        'toutc': '.toUTCString()',
        'tostring': '.toString()',
        'tolocale': '.toLocaleString()',
        'tolocaledate': '.toLocaleDateString()',
        'tolocaletime': '.toLocaleTimeString()',
        'reg': '/pattern/flags',
        'test': '.test()',
        'exec': '.exec()',
        'match': '.match()',
        'matchall': '.matchAll()',
        'search': '.search()',
        'replace': '.replace()',
        'replaceall': '.replaceAll()',
        'split': '.split()',
        'set': 'new Set()',
        'mapo': 'new Map()',
        'weakset': 'new WeakSet()',
        'weakmap': 'new WeakMap()',
        'array': 'new Array()',
        'object': 'new Object()',
        'string': 'new String()',
        'number': 'new Number()',
        'boolean': 'new Boolean()',
        'date': 'new Date()',
        'regexp': 'new RegExp()',
        'error': 'new Error()',
        'typeerror': 'new TypeError()',
        'syntaxerror': 'new SyntaxError()',
        'referenceerror': 'new ReferenceError()',
        'rangeerror': 'new RangeError()',
        'evalerror': 'new EvalError()',
        'urierror': 'new URIError()',
        'aggregateerror': 'new AggregateError()',
        'intl': 'new Intl.Collator()',
        'bigint': 'BigInt()',
        'symbol': 'Symbol()',
        'proxy': 'new Proxy(target, handler)',
        'reflect': 'Reflect.',
        'objecta': 'Object.assign()',
        'objectc': 'Object.create()',
        'objectd': 'Object.defineProperty()',
        'objecte': 'Object.entries()',
        'objectf': 'Object.freeze()',
        'objectg': 'Object.getOwnPropertyDescriptor()',
        'objecth': 'Object.getOwnPropertyNames()',
        'objecti': 'Object.getOwnPropertySymbols()',
        'objectj': 'Object.getPrototypeOf()',
        'objectk': 'Object.is()',
        'objectl': 'Object.isExtensible()',
        'objectm': 'Object.isFrozen()',
        'objectn': 'Object.isSealed()',
        'objecto': 'Object.keys()',
        'objectp': 'Object.preventExtensions()',
        'objectq': 'Object.seal()',
        'objectr': 'Object.setPrototypeOf()',
        'objects': 'Object.values()',
        'arrayf': 'Array.from()',
        'arrayi': 'Array.isArray()',
        'arrayo': 'Array.of()',
        'stringf': 'String.fromCharCode()',
        'stringr': 'String.raw()',
        'numberi': 'Number.isInteger()',
        'numberf': 'Number.isFinite()',
        'numbern': 'Number.isNaN()',
        'numbers': 'Number.parseFloat()',
        'numberp': 'Number.parseInt()',
        'maths': 'Math.sign()',
        'matht': 'Math.trunc()',
        'mathf': 'Math.fround()',
        'mathc': 'Math.clz32()',
        'mathi': 'Math.imul()',
        'jsons': 'JSON.stringify()',
        'jsonp': 'JSON.parse()',
        'datep': 'Date.parse()',
        'dateu': 'Date.UTC()',
        'regexpf': 'RegExp.prototype',
        'errorp': 'Error.prototype',
        'evalp': 'EvalError.prototype',
        'rangep': 'RangeError.prototype',
        'refp': 'ReferenceError.prototype',
        'syntaxp': 'SyntaxError.prototype',
        'typep': 'TypeError.prototype',
        'urip': 'URIError.prototype',
        'objectp': 'Object.prototype',
        'arrayp': 'Array.prototype',
        'stringp': 'String.prototype',
        'numberp': 'Number.prototype',
        'booleanp': 'Boolean.prototype',
        'datep': 'Date.prototype',
        'regexpf': 'RegExp.prototype',
        'errorp': 'Error.prototype',
        'functionp': 'Function.prototype',
        'promisee': 'Promise.prototype',
        'setp': 'Set.prototype',
        'mapp': 'Map.prototype',
        'weaksetp': 'WeakSet.prototype',
        'weakmapp': 'WeakMap.prototype',
        'arraybufferp': 'ArrayBuffer.prototype',
        'sharedarraybufferp': 'SharedArrayBuffer.prototype',
        'dataviewp': 'DataView.prototype',
        'int8arrayp': 'Int8Array.prototype',
        'uint8arrayp': 'Uint8Array.prototype',
        'uint8clampedarrayp': 'Uint8ClampedArray.prototype',
        'int16arrayp': 'Int16Array.prototype',
        'uint16arrayp': 'Uint16Array.prototype',
        'int32arrayp': 'Int32Array.prototype',
        'uint32arrayp': 'Uint32Array.prototype',
        'float32arrayp': 'Float32Array.prototype',
        'float64arrayp': 'Float64Array.prototype',
        'bigint64arrayp': 'BigInt64Array.prototype',
        'biguint64arrayp': 'BigUint64Array.prototype',
        'generatorp': 'Generator.prototype',
        'asyncfunctionp': 'AsyncFunction.prototype',
        'asyncgeneratorp': 'AsyncGenerator.prototype',
        'intl': 'Intl.',
        'collator': 'new Intl.Collator()',
        'datetimeformat': 'new Intl.DateTimeFormat()',
        'listformat': 'new Intl.ListFormat()',
        'numberformat': 'new Intl.NumberFormat()',
        'pluralrules': 'new Intl.PluralRules()',
        'relativetimeformat': 'new Intl.RelativeTimeFormat()',
        'segmenter': 'new Intl.Segmenter()',
        'displaynames': 'new Intl.DisplayNames()',
        'locale': 'new Intl.Locale()',
        'getcanonical': 'Intl.getCanonicalLocales()',
        'supported': 'Intl.supportedValuesOf()'
      }
    }
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
                <div class="uoj-autocomplete" id="uojAutocomplete" style="display: none;"></div>
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
        setTimeout(triggerAutocomplete, 0);
    });
    editor.addEventListener('scroll', syncScroll);
    editor.addEventListener('keydown', handleKey);
    editor.addEventListener('click', () => {
        updateCursorInfo();
        hideAutocomplete();
    });
    editor.addEventListener('keyup', (e) => {
        updateCursorInfo();
        if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Tab', 'Escape', 'Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) {
            setTimeout(triggerAutocomplete, 0);
        }
    });

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
    } else if (currentPlatform.key === 'vjudge') {
      GM_addStyle(`
        #uojEditorOverlay .uoj-code-highlight,
        #uojEditorOverlay .uoj-code-highlight code,
        #uojEditorOverlay .uoj-code-highlight pre,
        #uojEditorOverlay .uoj-code-highlight span {
          background: transparent !important;
        }
        #uojEditorOverlay .uoj-code-highlight .hljs-keyword,
        #uojEditorOverlay .uoj-code-highlight .hljs-type,
        #uojEditorOverlay .uoj-code-highlight .hljs-built_in {
          color: #ff7b72 !important;
        }
        #uojEditorOverlay .uoj-code-highlight .hljs-string,
        #uojEditorOverlay .uoj-code-highlight .hljs-regexp {
          color: #a5d6ff !important;
        }
        #uojEditorOverlay .uoj-code-highlight .hljs-comment,
        #uojEditorOverlay .uoj-code-highlight .hljs-formula {
          color: #8b949e !important;
        }
        #uojEditorOverlay .uoj-code-highlight .hljs-number,
        #uojEditorOverlay .uoj-code-highlight .hljs-literal {
          color: #79c0ff !important;
        }
        #uojEditorOverlay .uoj-code-highlight .hljs-title,
        #uojEditorOverlay .uoj-code-highlight .hljs-title.function_,
        #uojEditorOverlay .uoj-code-highlight .hljs-function {
          color: #d2a8ff !important;
        }
        #uojEditorOverlay .uoj-code-highlight .hljs-symbol {
          color: #ffa657 !important;
        }
        #uojEditorOverlay .uoj-code-highlight .hljs-variable-enhanced {
          color: #79c0ff !important;
          font-weight: 500 !important;
        }
        #uojEditorOverlay .uoj-code-highlight .hljs-operator-enhanced {
          color: #ff7b72 !important;
          font-weight: bold !important;
        }
        #uojEditorOverlay .uoj-code-highlight .hljs-type-enhanced {
          color: #ffa657 !important;
          font-weight: 600 !important;
        }
        #uojEditorOverlay .uoj-code-highlight .bracket-level-0 { 
          color: #FFD700 !important; 
        }
        #uojEditorOverlay .uoj-code-highlight .bracket-level-1 { 
          color: #DA70D6 !important; 
        }
        #uojEditorOverlay .uoj-code-highlight .bracket-level-2 { 
          color: #87CEEB !important; 
        }
        #uojEditorOverlay .uoj-code-highlight .bracket-level-3 { 
          color: #98FB98 !important; 
        }
        #uojEditorOverlay .uoj-code-highlight .bracket-level-4 { 
          color: #FFA07A !important; 
        }
        #uojEditorOverlay .uoj-code-highlight .bracket-level-5 { 
          color: #F0E68C !important; 
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
    const problemContentEl = document.getElementById('uojProblemContent');
    problemContentEl.innerHTML = '<p style="color:#f9e2af;">⏳ 正在加载题目信息...</p>';
    const problemInfo = currentPlatform.getProblemInfo();
    
    if (problemInfo instanceof Promise) {
      problemInfo.then(html => {
        problemContentEl.innerHTML = html;
        setTimeout(() => {
          if (window.MathJax && window.MathJax.typeset) {
            window.MathJax.typeset([problemContentEl]);
          }
        }, 500);
      });
    } else {
      problemContentEl.innerHTML = problemInfo;
    }

    const saved = localStorage.getItem(`uoj_code_${problemId}_${currentLang}`);
    const editor = document.getElementById('uojCodeEditor');
    editor.value = saved || codeTemplates[currentLang];

    updateLineNumbers();
    updateHighlight();
    updateCursorInfo();

    setTimeout(() => editor.focus(), 100);
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
          if (typeof hljs === 'undefined') {
              console.error('[Universal OJ] highlight.js 未加载');
              return;
          }
          
          console.log('[Universal OJ] 代码高亮:', currentLang);
          hljs.highlightElement(highlightCode);
          console.log('[Universal OJ] 高亮完成');
          
          requestAnimationFrame(() => {
              const code = document.getElementById('uojHighlightCode');
              if (code) {
                  console.log('[Universal OJ] 高亮后的HTML:', code.innerHTML.substring(0, 200));
                  console.log('[Universal OJ] 应用增强样式');
                  applyAllEnhancements(code);
                  console.log('[Universal OJ] 增强后的HTML:', code.innerHTML.substring(0, 200));
              }
          });
      } catch (e) {
          console.error('[Universal OJ] 失败:', e);
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
              if (node.className && (
                  node.className.includes('bracket-level') ||
                  node.className.includes('hljs-keyword') ||
                  node.className.includes('hljs-string') ||
                  node.className.includes('hljs-comment') ||
                  node.className.includes('hljs-number') ||
                  node.className.includes('hljs-title') ||
                  node.className.includes('hljs-type') ||
                  node.className.includes('hljs-built_in')
              )) return;
              
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

  let autocompleteState = {
    active: false,
    items: [],
    selectedIndex: 0,
    startPos: 0,
    endPos: 0,
    word: ''
  };

  function getWordAtCursor(text, pos) {
    const before = text.substring(0, pos);
    const match = before.match(/[a-zA-Z_][a-zA-Z0-9_]*$/);
    return match ? match[0] : '';
  }

  function getAutocompleteItems(word, lang) {
    if (!word || word.length < 2) return [];
    
    const data = autoCompleteData[lang];
    if (!data) return [];
    
    const items = [];
    const lowerWord = word.toLowerCase();
    
    data.keywords.forEach(keyword => {
      if (keyword.toLowerCase().startsWith(lowerWord)) {
        items.push({
          label: keyword,
          type: 'keyword',
          insertText: keyword
        });
      }
    });
    
    data.types.forEach(type => {
      if (type.toLowerCase().startsWith(lowerWord)) {
        items.push({
          label: type,
          type: 'type',
          insertText: type
        });
      }
    });
    
    Object.entries(data.snippets).forEach(([key, value]) => {
      if (key.toLowerCase().startsWith(lowerWord)) {
        items.push({
          label: key,
          type: 'snippet',
          insertText: value,
          desc: value.substring(0, 30) + (value.length > 30 ? '...' : '')
        });
      }
    });
    
    items.sort((a, b) => {
      const aExact = a.label.toLowerCase() === lowerWord;
      const bExact = b.label.toLowerCase() === lowerWord;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return a.label.length - b.label.length;
    });
    
    return items.slice(0, 10);
  }

  function showAutocomplete(items, x, y) {
    const container = document.getElementById('uojAutocomplete');
    if (!container || items.length === 0) {
      hideAutocomplete();
      return;
    }
    
    autocompleteState.items = items;
    autocompleteState.selectedIndex = 0;
    autocompleteState.active = true;
    
    container.innerHTML = items.map((item, index) => `
      <div class="uoj-autocomplete-item ${index === 0 ? 'selected' : ''}" data-index="${index}">
        <span class="uoj-autocomplete-label">${item.label}</span>
        ${item.desc ? `<span class="uoj-autocomplete-desc">${item.desc}</span>` : ''}
      </div>
    `).join('');
    
    container.style.display = 'block';
    container.style.left = x + 'px';
    container.style.top = y + 'px';
    
    container.querySelectorAll('.uoj-autocomplete-item').forEach(el => {
      el.addEventListener('click', () => {
        selectAutocompleteItem(parseInt(el.dataset.index));
      });
    });
  }

  function hideAutocomplete() {
    const container = document.getElementById('uojAutocomplete');
    if (container) {
      container.style.display = 'none';
    }
    autocompleteState.active = false;
    autocompleteState.items = [];
    autocompleteState.selectedIndex = 0;
  }

  function updateAutocompleteSelection(newIndex) {
    const container = document.getElementById('uojAutocomplete');
    if (!container) return;
    
    const items = container.querySelectorAll('.uoj-autocomplete-item');
    items.forEach((item, index) => {
      item.classList.toggle('selected', index === newIndex);
    });
    
    autocompleteState.selectedIndex = newIndex;
    
    const selectedItem = items[newIndex];
    if (selectedItem) {
      selectedItem.scrollIntoView({ block: 'nearest' });
    }
  }

  function selectAutocompleteItem(index) {
    const editor = document.getElementById('uojCodeEditor');
    if (!editor || !autocompleteState.active) return;
    
    const item = autocompleteState.items[index];
    if (!item) return;
    
    const value = editor.value;
    const before = value.substring(0, autocompleteState.startPos);
    const after = value.substring(autocompleteState.endPos);
    
    editor.value = before + item.insertText + after;
    
    const newPos = autocompleteState.startPos + item.insertText.length;
    editor.selectionStart = editor.selectionEnd = newPos;
    
    updateCode();
    hideAutocomplete();
    editor.focus();
  }

  function triggerAutocomplete() {
    const editor = document.getElementById('uojCodeEditor');
    if (!editor) return;
    
    const pos = editor.selectionStart;
    const value = editor.value;
    const word = getWordAtCursor(value, pos);
    
    if (!word || word.length < 1) {
      hideAutocomplete();
      return;
    }
    
    autocompleteState.word = word;
    autocompleteState.startPos = pos - word.length;
    autocompleteState.endPos = pos;
    
    const items = getAutocompleteItems(word, currentLang);
    if (items.length === 0) {
      hideAutocomplete();
      return;
    }
    
    const lines = value.substring(0, pos).split('\n');
    const currentLine = lines[lines.length - 1];
    const lineHeight = 21;
    const charWidth = 8;
    
    const x = currentLine.length * charWidth + 60;
    const y = (lines.length - 1) * lineHeight + 12 + lineHeight;
    
    showAutocomplete(items, x, y);
  }

  function handleKey(e) {
      const editor = document.getElementById('uojCodeEditor');
      if (!editor) return;

      if (autocompleteState.active) {
          if (e.key === 'ArrowDown') {
              e.preventDefault();
              const newIndex = (autocompleteState.selectedIndex + 1) % autocompleteState.items.length;
              updateAutocompleteSelection(newIndex);
              return;
          }
          if (e.key === 'ArrowUp') {
              e.preventDefault();
              const newIndex = (autocompleteState.selectedIndex - 1 + autocompleteState.items.length) % autocompleteState.items.length;
              updateAutocompleteSelection(newIndex);
              return;
          }
          if (e.key === 'Enter' || e.key === 'Tab') {
              e.preventDefault();
              selectAutocompleteItem(autocompleteState.selectedIndex);
              return;
          }
          if (e.key === 'Escape') {
              e.preventDefault();
              hideAutocomplete();
              return;
          }
      }

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
              hideAutocomplete();
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

    let container = null;
    let submitBtn = null;

    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      const text = btn.textContent.toLowerCase();
      if (text.includes('提交') || text.includes('submit')) {
        submitBtn = btn;
        container = btn.parentNode;
        console.log('[Universal OJ] 找到提交按钮:', btn);
        break;
      }
    }

    if (!container && currentPlatform.selectors.buttonContainer) {
      const selectors = currentPlatform.selectors.buttonContainer.split(',');
      for (const selector of selectors) {
        container = document.querySelector(selector.trim());
        if (container) {
          console.log('[Universal OJ] 使用平台选择器找到容器:', selector);
          break;
        }
      }
    }

    if (!container) {
      switch(currentPlatform.key) {
        case 'jxau':
          container = document.querySelector('.ivu-row-flex .ivu-col-span-12:last-child') ||
                    document.querySelector('#submit-code .ivu-card-body');
          break;
        case 'nowcoder':
          container = document.querySelector('.question-btns') ||
                    document.querySelector('.terminal-topic-operation') ||
                    document.querySelector('.question-operate');
          break;
        case 'luogu':
          container = document.querySelector('.operation') ||
                    document.querySelector('.main .actions');
          break;
        case 'codeforces':
          container = document.querySelector('.roundbox') ||
                    document.querySelector('.problem-statement');
          break;
      }
    }

    if (!container) {
      console.warn('[Universal OJ] 未找到合适的按钮容器');
      return false;
    }

    const btn = document.createElement('button');
    btn.id = 'uojOpenBtn';
    btn.type = 'button';
    btn.className = 'uoj-open-btn';
    btn.innerHTML = '✏️ 高级编辑器';
    
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openEditor();
    });

    if (submitBtn) {
      submitBtn.parentNode.insertBefore(btn, submitBtn.nextSibling);
      console.log('[Universal OJ] 按钮已插入到提交按钮后面');
    } else {
      container.appendChild(btn);
      console.log('[Universal OJ] 按钮已追加到容器');
    }

    return true;
  }

  function init() {
    console.log('[Universal OJ] 开始初始化...');
    console.log('[Universal OJ] 当前平台:', currentPlatform.name);
    console.log('[Universal OJ] URL:', window.location.href);

    const tryAddButton = () => {
      if (addOpenButton()) {
        console.log('[Universal OJ] ✅ 初始化成功');
        return true;
      }
      return false;
    };

    setTimeout(() => {
      if (tryAddButton()) return;

      let attempts = 0;
      const maxAttempts = 3;
      const interval = setInterval(() => {
        attempts++;
        console.log(`[Universal OJ] 尝试添加按钮 (${attempts}/${maxAttempts})`);
        
        if (tryAddButton() || attempts >= maxAttempts) {
          clearInterval(interval);
          if (attempts >= maxAttempts) {
            console.error('[Universal OJ] ❌ 无法添加按钮，请检查页面结构');
          }
        }
      }, 1000);
    }, 2000);

    const observer = new MutationObserver((mutations) => {
      if (!document.getElementById('uojOpenBtn')) {
        tryAddButton();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();