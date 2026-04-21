// ==UserScript==
// @name         悬浮工具箱管理器
// @namespace    https://github.com/Cecilian-Elysian/Floating-Tools
// @version      0.1.0
// @description  悬浮工具箱统一入口，管理多个工具窗口
// @author       Cecilian-Elysian
// @match        *://*/*
// @run-at       document-end
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @grant        GM_addElement
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    const TOOLS = [
        { id: 'news', name: '新闻爬取', icon: '📰', script: 'ft-news-tool.user.js' },
        { id: 'aice', name: 'AI聊天导出', icon: '💬', script: 'ft-aice-tool.user.js' }
    ];

    let entryPanel = null;
    let activeWindow = null;
    const loadedScripts = {};

    const Styles = `
        .ft-float-btn{position:fixed;bottom:24px;right:24px;width:48px;height:48px;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:50%;box-shadow:0 4px 16px rgba(102,126,234,.4);cursor:pointer;z-index:99998;display:flex;align-items:center;justify-content:center;font-size:22px;color:#fff;transition:all .3s}
        .ft-float-btn:hover{transform:scale(1.1);box-shadow:0 6px 24px rgba(102,126,234,.5)}
        .ft-panel{position:fixed;top:0;right:0;width:280px;height:100vh;background:#1a1a2e;z-index:99999;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Microsoft YaHei",sans-serif;color:#eee;display:flex;flex-direction:column;box-shadow:-4px 0 20px rgba(0,0,0,.3)}
        .ft-header{height:56px;padding:0 16px;background:#16213e;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
        .ft-header-title{margin:0;font-size:16px;font-weight:600;display:flex;align-items:center;gap:8px}
        .ft-close-btn{width:28px;height:28px;border:none;background:rgba(255,255,255,.1);border-radius:50%;color:#fff;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;transition:all .2s}
        .ft-close-btn:hover{background:rgba(255,255,255,.2)}
        .ft-body{flex:1;overflow-y:auto;padding:16px}
        .ft-tool-card{display:flex;align-items:center;gap:12px;padding:14px 16px;background:#252540;border-radius:10px;margin-bottom:10px;cursor:pointer;transition:all .2s}
        .ft-tool-card:hover{background:#2d2d50;transform:translateX(-4px)}
        .ft-tool-card-icon{font-size:24px}
        .ft-tool-card-info{flex:1}
        .ft-tool-card-name{font-size:14px;font-weight:500}
        .ft-tool-card-desc{font-size:11px;color:#888;margin-top:2px}
        .ft-tool-card-arrow{font-size:16px;color:#666}
        .ft-loading{text-align:center;padding:40px;color:#888}
        .ft-loading-spinner{display:inline-block;width:24px;height:24px;border:3px solid #333;border-top-color:#667eea;border-radius:50%;animation:ft-spin 1s linear infinite;margin-bottom:12px}
        @keyframes ft-spin{to{transform:rotate(360deg)}}
    `;

    function init() {
        GM_addStyle(Styles);
        createEntryButton();
        createEntryPanel();
    }

    function createEntryButton() {
        const btn = document.createElement('div');
        btn.id = 'ft-float-btn';
        btn.className = 'ft-float-btn';
        btn.textContent = '📦';
        btn.addEventListener('click', showEntryPanel);
        document.body.appendChild(btn);
    }

    function createEntryPanel() {
        entryPanel = document.createElement('div');
        entryPanel.id = 'ft-entry-panel';
        entryPanel.className = 'ft-panel';
        entryPanel.style.display = 'none';
        entryPanel.innerHTML = `
            <div class="ft-header">
                <span class="ft-header-title">📦 工具箱</span>
                <button class="ft-close-btn" id="ft-entry-close">×</button>
            </div>
            <div class="ft-body">
                ${TOOLS.map(tool => `
                    <div class="ft-tool-card" data-tool="${tool.id}">
                        <span class="ft-tool-card-icon">${tool.icon}</span>
                        <div class="ft-tool-card-info">
                            <div class="ft-tool-card-name">${tool.name}</div>
                            <div class="ft-tool-card-desc">点击打开工具窗口</div>
                        </div>
                        <span class="ft-tool-card-arrow">›</span>
                    </div>
                `).join('')}
            </div>
        `;
        document.body.appendChild(entryPanel);

        entryPanel.querySelector('#ft-entry-close').addEventListener('click', hideEntryPanel);
        entryPanel.querySelectorAll('.ft-tool-card').forEach(card => {
            card.addEventListener('click', () => openTool(card.dataset.tool));
        });
    }

    function showEntryPanel() {
        if (activeWindow) closeTool();
        entryPanel.style.display = 'flex';
    }

    function hideEntryPanel() {
        entryPanel.style.display = 'none';
    }

    function openTool(toolId) {
        hideEntryPanel();
        const tool = TOOLS.find(t => t.id === toolId);
        if (!tool) return;

        if (loadedScripts[toolId]) {
            createToolWindow(toolId, tool.name, tool.icon);
        } else {
            showLoading(toolId, tool.name, tool.icon);
            loadToolScript(tool);
        }
    }

    function showLoading(toolId, name, icon) {
        if (activeWindow) activeWindow.remove();
        activeWindow = document.createElement('div');
        activeWindow.id = 'ft-window-' + toolId;
        activeWindow.className = 'ft-panel';
        activeWindow.innerHTML = `
            <div class="ft-header">
                <span class="ft-header-title">${icon} ${name}</span>
                <button class="ft-close-btn" onclick="window.ftClose && window.ftClose()">×</button>
            </div>
            <div class="ft-body">
                <div class="ft-loading">
                    <div class="ft-loading-spinner"></div>
                    <div>加载中...</div>
                </div>
            </div>
        `;
        document.body.appendChild(activeWindow);
    }

    function loadToolScript(tool) {
        GM_xmlhttpRequest({
            method: 'GET',
            url: 'https://raw.githubusercontent.com/Cecilian-Elysian/Floating-Tools/main/' + tool.script,
            onload: (res) => {
                if (res.status === 200) {
                    loadedScripts[tool.id] = res.responseText;
                    createToolWindow(tool.id, tool.name, tool.icon);
                }
            },
            onerror: () => {
                const win = document.getElementById('ft-window-' + tool.id);
                if (win) win.querySelector('.ft-body').innerHTML = '<div class="ft-loading" style="color:#ef4444">加载失败，请检查网络</div>';
            }
        });
    }

    function createToolWindow(toolId, name, icon) {
        if (activeWindow) activeWindow.remove();
        activeWindow = document.createElement('div');
        activeWindow.id = 'ft-window-' + toolId;
        activeWindow.className = 'ft-panel';

        const scriptContent = loadedScripts[toolId];
        activeWindow.innerHTML = `
            <div class="ft-header">
                <span class="ft-header-title">${icon} ${name}</span>
                <button class="ft-close-btn" id="ft-win-close">×</button>
            </div>
            <div class="ft-body" id="ft-win-body"></div>
        `;
        document.body.appendChild(activeWindow);

        activeWindow.querySelector('#ft-win-close').addEventListener('click', closeTool);

        window.ftClose = closeTool;

        const body = activeWindow.querySelector('#ft-win-body');
        if (scriptContent) {
            const script = document.createElement('script');
            script.textContent = scriptContent + `\nwindow.ftToolBody="${toolId}";`;
            document.head.appendChild(script);
        }
    }

    function closeTool() {
        if (activeWindow) {
            activeWindow.remove();
            activeWindow = null;
        }
        window.ftClose = null;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();