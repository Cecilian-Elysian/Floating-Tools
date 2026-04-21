// ==UserScript==
// @name         AI聊天导出工具
// @namespace    https://github.com/Cecilian-Elysian/Floating-Tools
// @version      0.1.0
// @description  AI聊天导出工具，支持通义千问、夸克等平台
// @match        *://*.qianwen.com/*
// @match        *://*.quark.cn/*
// @match        *://qianwen.com/*
// @match        *://quark.cn/*
// @run-at       document-end
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_download
// @grant        GM_addStyle
// @connect      qianwen.com
// @connect      quark.cn
// ==/UserScript==

(function() {
    'use strict';

    const CONFIG_KEY = 'ft_aice_config';
    const COOKIE_KEY = 'ft_aice_cookies';

    const defaultConfig = {
        intervalMinutes: 60,
        exportFormat: 'md',
        autoExport: false
    };

    function loadConfig() {
        const stored = GM_getValue(CONFIG_KEY, null);
        return stored ? { ...defaultConfig, ...stored } : defaultConfig;
    }

    function saveConfig(config) { GM_setValue(CONFIG_KEY, config); }

    function getCookies() { return GM_getValue(COOKIE_KEY, null); }
    function saveCookies(cookies) { GM_setValue(COOKIE_KEY, { cookies, time: Date.now() }); }

    function getAllPageCookies() {
        const cookies = document.cookie.split(';');
        const obj = {};
        cookies.forEach(c => { const [k, v] = c.trim().split('='); if (k) obj[k] = v; });
        return obj;
    }

    function fetchCookies() {
        return new Promise((resolve) => {
            const cookies = getAllPageCookies();
            const token = cookies['aliyung残留'] || cookies['token'] || cookies['QToken'];
            if (token) { saveCookies(cookies); resolve(cookies); return; }

            const host = window.location.hostname;
            const url = host.includes('quark.cn') ? 'https://unite.quark.cn/page/chat' : 'https://qianwen.com/quarkchat';
            GM_xmlhttpRequest({
                method: 'GET',
                url,
                onload: () => { const newCookies = getAllPageCookies(); saveCookies(newCookies); resolve(newCookies); },
                onerror: () => resolve({})
            });
        });
    }

    function buildCookieHeader(cookies) {
        if (!cookies) return '';
        return Object.entries(cookies).map(([k, v]) => k + '=' + v).join('; ');
    }

    function httpRequest(url, cookies) {
        return new Promise((resolve, reject) => {
            const token = cookies['aliyung残留'] || cookies['token'] || cookies['QToken'];
            GM_xmlhttpRequest({
                method: 'GET',
                url,
                headers: { 'Cookie': buildCookieHeader(cookies), 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
                onload: (res) => { try { resolve(JSON.parse(res.responseText)); } catch { resolve(null); } },
                onerror: reject
            });
        });
    }

    function getBaseUrl() {
        return window.location.hostname.includes('quark.cn') ? 'https://unite.quark.cn' : 'https://qianwen.com';
    }

    async function fetchConversations() {
        let cookies = getCookies();
        if (!cookies || !cookies.cookies) { cookies = { cookies: await fetchCookies() }; }

        const baseUrl = getBaseUrl();
        const token = cookies.cookies['aliyung残留'] || cookies.cookies['token'] || cookies.cookies['QToken'];

        const listUrl = baseUrl.includes('quark.cn')
            ? baseUrl + '/pc/chat/conversation/list'
            : baseUrl + '/quarkchat/api/chat/list?type=conversation&page=1&pageSize=50';

        const data = await httpRequest(listUrl, cookies.cookies);
        if (!data || !data.data || !Array.isArray(data.data)) return [];

        return data.data.map(item => ({
            id: item.id || item.conversation_id,
            title: item.title || item.name || '未命名',
            created_at: item.created_at || item.create_time
        }));
    }

    async function fetchMessages(conversationId) {
        let cookies = getCookies();
        if (!cookies || !cookies.cookies) return [];

        const baseUrl = getBaseUrl();
        const msgUrl = baseUrl.includes('quark.cn')
            ? baseUrl + '/pc/chat/message/list?conversation_id=' + conversationId
            : baseUrl + '/quarkchat/api/chat/messages?conversation_id=' + conversationId;

        const data = await httpRequest(msgUrl, cookies.cookies);
        if (!data || !data.messages) return [];
        return data.messages;
    }

    async function extractAll() {
        const conversations = await fetchConversations();
        const sessions = [];
        for (const conv of conversations) {
            const messages = await fetchMessages(conv.id);
            sessions.push({
                sessionId: conv.id,
                platform: 'qianwen',
                title: conv.title,
                created_at: conv.created_at,
                messages: messages.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content || m.text || '', timestamp: m.created_at || '' }))
            });
        }
        return sessions;
    }

    function toMarkdown(sessions) {
        let md = '';
        const date = new Date().toLocaleString('zh-CN');
        for (const s of sessions) {
            md += '# ' + s.title + '\n\n> Platform: ' + s.platform + ' | Date: ' + (s.created_at || date) + '\n\n';
            for (const m of s.messages) { md += '## ' + (m.role === 'user' ? '用户' : '助手') + '\n\n' + m.content + '\n\n'; }
            md += '---\n\n';
        }
        md += '\n> Export: ' + date + ' | Total: ' + sessions.length + ' conversations\n';
        return md;
    }

    function toJSON(sessions) { return JSON.stringify({ exported_at: new Date().toISOString(), session_count: sessions.length, sessions }, null, 2); }

    function toCSV(sessions) {
        const rows = [['session_id', 'platform', 'title', 'role', 'content', 'timestamp']];
        for (const s of sessions) {
            for (const m of s.messages) {
                rows.push([s.sessionId, s.platform, s.title, m.role, '"' + (m.content || '').replace(/"/g, '""') + '"', m.timestamp || '']);
            }
        }
        return rows.map(r => r.join(',')).join('\n');
    }

    function download(content, filename, mimeType) {
        const blob = new Blob(['\uFEFF' + content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        if (typeof GM_download !== 'undefined') {
            GM_download({ url, name: filename, saveAs: true, onload: () => { URL.revokeObjectURL(url); }, onerror: () => { const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url); } });
        } else {
            const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
        }
    }

    function exportSessions(sessions, config) {
        if (!sessions.length) { statusEl.textContent = '⚠️ 无对话可导出'; return; }

        const timestamp = Date.now();
        let content, filename, mimeType;

        if (config.exportFormat === 'json') { content = toJSON(sessions); filename = 'aice_' + timestamp + '.json'; mimeType = 'application/json'; }
        else if (config.exportFormat === 'csv') { content = toCSV(sessions); filename = 'aice_' + timestamp + '.csv'; mimeType = 'text/csv'; }
        else { content = toMarkdown(sessions); filename = 'aice_' + timestamp + '.md'; mimeType = 'text/plain'; }

        download(content, filename, mimeType);
        statusEl.textContent = '✅ 已触发下载';
    }

    async function runOnce() {
        statusEl.textContent = '🔄 提取中...';
        const sessions = await extractAll();
        exportSessions(sessions, loadConfig());
        GM_setValue('ft_aice_last_run', Date.now());
    }

    let sidebar, statusEl, cookieInfoEl;

    function createStyles() {
        GM_addStyle(`
            .ft-tool-panel{width:280px;height:100vh;background:#1a1a2e;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Microsoft YaHei",sans-serif;color:#eee;display:flex;flex-direction:column;box-sizing:border-box}
            .ft-tool-header{height:56px;padding:0 16px;background:#16213e;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;border-radius:12px 12px 0 0}
            .ft-tool-header h2{margin:0;font-size:15px;font-weight:600;display:flex;align-items:center;gap:6px}
            .ft-tool-close{width:28px;height:28px;border:none;background:rgba(255,255,255,.1);border-radius:50%;color:#fff;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;transition:all .2s}
            .ft-tool-close:hover{background:rgba(255,255,255,.2)}
            .ft-tool-body{flex:1;overflow-y:auto;padding:16px}
            .ft-tool-status{padding:10px;background:#252540;border-radius:8px;font-size:12px;color:#667eea;text-align:center;margin-bottom:14px}
            .ft-tool-row{margin-bottom:12px}
            .ft-tool-label{display:block;font-size:11px;color:#888;margin-bottom:6px;font-weight:500}
            .ft-tool-select,.ft-tool-input{width:100%;padding:8px 10px;border:1px solid #333;border-radius:6px;font-size:12px;box-sizing:border-box;background:#252540;color:#eee}
            .ft-tool-select:focus,.ft-tool-input:focus{outline:none;border-color:#667eea}
            .ft-tool-btn{display:block;width:100%;padding:10px;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;transition:all .2s;margin-bottom:8px}
            .ft-tool-btn-primary{background:#667eea;color:#fff}
            .ft-tool-btn-primary:hover{filter:brightness(1.1)}
            .ft-tool-btn-cookie{background:#8b5cf6;color:#fff}
            .ft-tool-btn-cookie:hover{filter:brightness(1.1)}
            .ft-tool-btn:active{transform:scale(.98)}
            .ft-tool-info{font-size:10px;color:#666;margin-top:4px}
            .ft-tool-modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);z-index:100001;display:none;align-items:center;justify-content:center}
            .ft-tool-modal-overlay.active{display:flex}
            .ft-tool-modal{background:#1a1a2e;border-radius:12px;padding:20px;width:90%;max-width:320px;border:1px solid #333}
            .ft-tool-modal h3{margin:0 0 12px;font-size:14px;color:#eee}
            .ft-tool-modal-btns{display:flex;gap:8px;margin-top:14px}
            .ft-tool-modal-btns button{flex:1;padding:8px;border-radius:6px;border:none;cursor:pointer;font-size:12px}
            .ft-tool-modal-cancel{background:#333;color:#aaa}
            .ft-tool-modal-confirm{background:#667eea;color:#fff}
        `);
    }

    function createSidebar(container) {
        sidebar = document.createElement('div');
        sidebar.className = 'ft-tool-panel';
        sidebar.innerHTML = `
            <div class="ft-tool-header">
                <h2>💬 AI聊天导出</h2>
                <button class="ft-tool-close" id="ft-aice-close">×</button>
            </div>
            <div class="ft-tool-body">
                <div class="ft-tool-status" id="ft-aice-status">就绪</div>

                <div class="ft-tool-row">
                    <label class="ft-tool-label">导出格式</label>
                    <select class="ft-tool-select" id="ft-aice-format">
                        <option value="md">Markdown (.md)</option>
                        <option value="json">JSON (.json)</option>
                        <option value="csv">CSV (.csv)</option>
                    </select>
                </div>

                <div class="ft-tool-row">
                    <label class="ft-tool-label">定时间隔（分钟）</label>
                    <input type="number" class="ft-tool-input" id="ft-aice-interval" value="60" min="1">
                </div>

                <button class="ft-tool-btn ft-tool-btn-cookie" id="ft-aice-get-cookie">🍪 获取Cookie</button>
                <div class="ft-tool-info" id="ft-aice-cookie-info" style="text-align:center;margin-bottom:12px">未获取</div>

                <button class="ft-tool-btn ft-tool-btn-primary" id="ft-aice-run">▶ 立即导出</button>
                <button class="ft-tool-btn ft-tool-btn-primary" id="ft-aice-auto" style="background:#3b82f6">⏰ 启动定时</button>
            </div>
        `;
        container.appendChild(sidebar);

        statusEl = sidebar.querySelector('#ft-aice-status');
        cookieInfoEl = sidebar.querySelector('#ft-aice-cookie-info');

        const config = loadConfig();
        const cookies = getCookies();
        sidebar.querySelector('#ft-aice-format').value = config.exportFormat || 'md';
        sidebar.querySelector('#ft-aice-interval').value = config.intervalMinutes || 60;
        if (cookies && cookies.cookies) { cookieInfoEl.textContent = '已获取 (' + Object.keys(cookies.cookies).length + ' 个)'; }

        sidebar.querySelector('#ft-aice-close').addEventListener('click', () => { if (window.ftClose) window.ftClose(); });

        sidebar.querySelector('#ft-aice-get-cookie').addEventListener('click', async () => {
            cookieInfoEl.textContent = '获取中...';
            const newCookies = await fetchCookies();
            if (newCookies && Object.keys(newCookies).length) { cookieInfoEl.textContent = '已获取 (' + Object.keys(newCookies).length + ' 个)'; }
            else { cookieInfoEl.textContent = '获取失败'; }
        });

        sidebar.querySelector('#ft-aice-run').addEventListener('click', async () => {
            const format = sidebar.querySelector('#ft-aice-format').value;
            const interval = parseInt(sidebar.querySelector('#ft-aice-interval').value) || 60;
            saveConfig({ exportFormat: format, intervalMinutes: interval });
            await runOnce();
        });

        let timerId = null;
        sidebar.querySelector('#ft-aice-auto').addEventListener('click', () => {
            if (timerId) {
                clearInterval(timerId);
                timerId = null;
                sidebar.querySelector('#ft-aice-auto').textContent = '⏰ 启动定时';
                sidebar.querySelector('#ft-aice-auto').style.background = '#3b82f6';
                statusEl.textContent = '定时已停止';
                return;
            }
            const interval = parseInt(sidebar.querySelector('#ft-aice-interval').value) || 60;
            sidebar.querySelector('#ft-aice-auto').textContent = '⏹ 停止定时';
            sidebar.querySelector('#ft-aice-auto').style.background = '#ef4444';
            statusEl.textContent = '定时中 (' + interval + 'min)';
            runOnce();
            timerId = setInterval(runOnce, interval * 60 * 1000);
        });
    }

    function init() {
        createStyles();
        const container = document.createElement('div');
        document.body.appendChild(container);
        createSidebar(container);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();