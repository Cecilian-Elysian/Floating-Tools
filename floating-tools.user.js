// ==UserScript==
// @name         悬浮工具箱
// @namespace    https://github.com/Cecilian-Elysian/Floating-Tools
// @version      0.2.0
// @description  悬浮工具箱统一入口，集成新闻爬取、AI聊天导出
// @author       Cecilian-Elysian
// @match        *://*/*
// @run-at       document-end
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @grant        GM_addElement
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// @grant        GM_notification
// @connect     *
// @connect      qianwen.com
// @connect      quark.cn
// ==/UserScript==

(function() {
    'use strict';

    const TOOLS = [
        { id: 'news', name: '新闻爬取', icon: '📰' },
        { id: 'aice', name: 'AI聊天导出', icon: '💬' }
    ];

    let entryPanel = null;
    let activeWindow = null;

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
        .ft-tool-panel{width:300px;height:100vh;background:#1a1a2e;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Microsoft YaHei",sans-serif;color:#eee;display:flex;flex-direction:column;box-sizing:border-box}
        .ft-tool-header{height:56px;padding:0 16px;background:#16213e;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
        .ft-tool-header h2{margin:0;font-size:15px;font-weight:600;display:flex;align-items:center;gap:6px}
        .ft-tool-stats{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}
        .ft-tool-stat{padding:10px;background:#252540;border-radius:8px;text-align:center}
        .ft-tool-stat-num{font-size:18px;font-weight:700;color:#667eea}
        .ft-tool-stat-label{font-size:10px;color:#888;margin-top:2px}
        .ft-tool-status{padding:8px 12px;background:#252540;border-radius:6px;font-size:12px;color:#667eea;text-align:center;margin-bottom:12px}
        .ft-tool-btn{display:block;width:100%;padding:10px 12px;background:#667eea;border:none;border-radius:8px;cursor:pointer;font-size:13px;color:#fff;font-weight:500;transition:all .2s;margin-bottom:6px;box-sizing:border-box}
        .ft-tool-btn:hover{filter:brightness(1.1)}
        .ft-tool-btn:active{transform:scale(.98)}
        .ft-tool-btn-secondary{background:#252540;border:1px solid #333}
        .ft-tool-btn-secondary:hover{background:#2d2d50}
        .ft-tool-section{border-top:1px solid #333;padding-top:10px;margin-top:8px}
        .ft-tool-section-title{font-size:11px;color:#888;margin:0 0 8px;font-weight:600;display:flex;align-items:center;gap:4px}
        .ft-tool-item{padding:8px 10px;background:#252540;border-radius:6px;margin-bottom:4px;font-size:12px;cursor:pointer;transition:background .15s}
        .ft-tool-item:hover{background:#2d2d50}
        .ft-tool-item-title{line-height:1.4;margin-bottom:2px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
        .ft-tool-item-meta{font-size:10px;color:#888;display:flex;gap:6px}
        .ft-tool-empty{text-align:center;color:#666;font-size:12px;padding:30px 0}
        .ft-tool-group-header{padding:6px 8px;background:#16213e;font-size:11px;font-weight:600;color:#667eea;border-radius:4px;margin-bottom:4px;display:flex;justify-content:space-between}
        .ft-tool-row{margin-bottom:12px}
        .ft-tool-label{display:block;font-size:11px;color:#888;margin-bottom:6px;font-weight:500}
        .ft-tool-select,.ft-tool-input{width:100%;padding:8px 10px;border:1px solid #333;border-radius:6px;font-size:12px;box-sizing:border-box;background:#252540;color:#eee}
        .ft-tool-select:focus,.ft-tool-input:focus{outline:none;border-color:#667eea}
        .ft-tool-btn-cookie{background:#8b5cf6}
        .ft-tool-btn-cookie:hover{filter:brightness(1.1)}
        .ft-tool-info{font-size:10px;color:#666;margin-top:4px}
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
        if (toolId === 'news') NewsTool.open();
        else if (toolId === 'aice') AiceTool.open();
    }

    function closeTool() {
        if (activeWindow) {
            activeWindow.remove();
            activeWindow = null;
        }
        window.ftClose = null;
    }

    window.ftClose = null;

    const NewsTool = (function() {
        const Config = {
            DEFAULT_FEEDS: [
                { name: "新浪新闻", url: "https://feed.mix.sina.com.cn/api/roll/get?pageid=153&lid=2516&k=&num=50&page=1", type: "json" },
                { name: "腾讯新闻", url: "https://rss.qq.com/news.xml", type: "rss" },
                { name: "网易新闻", url: "https://news.163.com/special/rss/newsrdf.xml", type: "rss" },
                { name: "搜狐新闻", url: "https://www.sohu.com/rss/rss.xml", type: "rss" },
                { name: "知乎热榜", url: "https://www.zhihu.com/rss", type: "rss" },
                { name: "36氪", url: "https://36kr.com/feed", type: "rss" },
                { name: "虎嗅", url: "https://www.huxiu.com/rss/", type: "rss" },
                { name: "IT之家", url: "https://www.ithome.com/rss/", type: "rss" },
                { name: "观察者网", url: "https://www.guancha.cn/rss/", type: "rss" },
                { name: "澎湃新闻", url: "https://feed.mix.sina.com.cn/api/roll/get?pageid=153&lid=2165&num=50&page=1", type: "json" },
                { name: "少数派", url: "https://sspai.com/rss", type: "rss" },
                { name: "掘金", url: "https://juejin.cn/rss", type: "rss" },
                { name: "腾讯科技", url: "https://new.qq.com/rss/index.xml", type: "rss" },
                { name: "RadarAI", url: "https://radarai.top/feed.xml", type: "rss" },
                { name: "GitHub趋势", url: "https://rsshub.app/github/trending", type: "rss" },
                { name: "HackerNews", url: "https://rsshub.app/hacker-news/best", type: "rss" }
            ],
            API_ENDPOINTS: {
                "Bilibili": { url: "https://api.bilibili.com/x/web-interface/ranking/v2?type=all", type: "json" },
                "36氪": { url: "https://36kr.com/pp/api/newsflash?per_page=20&page=1", type: "json" }
            },
            PRIORITY: { "人民日报": 10, "新华网": 10, "央视新闻": 10, "澎湃新闻": 8, "观察者网": 8, "腾讯新闻": 6, "腾讯科技": 6, "新浪新闻": 6, "网易新闻": 6, "知乎热榜": 7, "36氪": 7, "虎嗅": 7, "IT之家": 6, "搜狐新闻": 5, "少数派": 7, "掘金": 7, "RadarAI": 8, "GitHub趋势": 7, "HackerNews": 7, "Bilibili": 6 }
        };

        const State = { news: [], customFeeds: [], folder: "新闻日报", lastFetch: null };

        const Storage = {
            get: (key, defaultVal) => GM_getValue('ft_news_' + key, defaultVal),
            set: (key, val) => GM_setValue('ft_news_' + key, val),
            getNews: () => State.news,
            setNews: (arr) => { State.news = arr; Storage.set('data', arr); },
            getCustomFeeds: () => State.customFeeds.length ? State.customFeeds : Config.DEFAULT_FEEDS,
            setCustomFeeds: (arr) => { State.customFeeds = arr; Storage.set('feeds', arr); },
            getFolder: () => State.folder,
            setFolder: (f) => { State.folder = f; Storage.set('folder', f); },
            getLastFetch: () => State.lastFetch,
            setLastFetch: (t) => { State.lastFetch = t; Storage.set('time', t); }
        };

        const Utils = {
            formatDate: (s) => { if (!s) return ""; try { const d = new Date(s); return isNaN(d.getTime()) ? s : d.toLocaleString("zh-CN"); } catch { return s; } },
            formatDateStr: () => new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" }),
            httpReq: (url) => new Promise((resolve, reject) => {
                GM_xmlhttpRequest({ method: "GET", url, timeout: 15000,
                    onload: (r) => { if (r.status >= 200 && r.status < 300) resolve(r.responseText); else reject(new Error("HTTP " + r.status)); },
                    onerror: () => reject(new Error("请求失败")), ontimeout: () => reject(new Error("请求超时")) });
            }),
            notify: (title, text) => GM_notification({ title, text, silent: true })
        };

        const Parser = {
            parseRSS: (data, sourceName) => {
                const news = [];
                try {
                    const p = new DOMParser().parseFromString(data, "text/xml");
                    if (p.querySelector("parsererror")) return news;
                    p.querySelectorAll("item, entry").forEach(item => {
                        const title = item.querySelector("title")?.textContent?.trim();
                        const link = item.querySelector("link")?.getAttribute("href") || item.querySelector("link")?.textContent?.trim() || "";
                        const date = item.querySelector("pubDate, published")?.textContent?.trim() || "";
                        if (title) news.push({ title, link, date: Utils.formatDate(date), source: sourceName });
                    });
                } catch (e) {}
                return news;
            },
            parseJSON: (data, sourceName) => {
                const news = [];
                try {
                    const json = JSON.parse(data);
                    (json.result?.data || json.data || []).forEach(item => {
                        const title = item.title || item.titleTxt;
                        if (title) {
                            let ct = item.ctime || item.pubTime;
                            if (ct) ct = ct > 1e12 ? ct : ct * 1000;
                            news.push({ title, link: item.url || "", date: Utils.formatDate(ct) || Utils.formatDate(item.pubDate), source: sourceName });
                        }
                    });
                } catch (e) {}
                return news;
            },
            parseBilibili: (data, sourceName) => {
                const news = [];
                try {
                    const json = JSON.parse(data);
                    (json.data?.list || []).forEach(item => {
                        if (item.title) news.push({ title: item.title, link: item.short_link_v2 || "https://www.bilibili.com/video/" + item.bvid, date: Utils.formatDate(item.pubdate * 1000), source: sourceName });
                    });
                } catch (e) {}
                return news;
            },
            parse36kr: (data, sourceName) => {
                const news = [];
                try {
                    const json = JSON.parse(data);
                    (json.data?.items || []).forEach(item => {
                        if (item.title) news.push({ title: item.title, link: item.news_url || "https://36kr.com/p/" + item.id, date: Utils.formatDate(item.published_at), source: sourceName });
                    });
                } catch (e) {}
                return news;
            },
            parse: (data, sourceName, type) => {
                if (type === "json") return Parser.parseJSON(data, sourceName);
                return Parser.parseRSS(data, sourceName);
            }
        };

        const Fetcher = {
            fetchAll: async () => {
                const allFeeds = Storage.getCustomFeeds();
                statusEl.textContent = "🔄 并行抓取中...";

                const fallback = (primaryType) => ["rss", "json"].filter(t => t !== primaryType);

                const tryApiEndpoint = async (feedName) => {
                    for (const [apiName, apiConfig] of Object.entries(Config.API_ENDPOINTS)) {
                        if (feedName.includes(apiName) || apiName.includes(feedName)) {
                            try {
                                const data = await Utils.httpReq(apiConfig.url);
                                if (!data || data.length < 10) continue;
                                let parsed = apiName === "Bilibili" ? Parser.parseBilibili(data, feedName) : apiName === "36氪" ? Parser.parse36kr(data, feedName) : Parser.parse(data, feedName, apiConfig.type);
                                if (parsed.length > 0) return parsed;
                            } catch (e) { continue; }
                        }
                    }
                    return [];
                };

                const fetchOne = async (feed) => {
                    const primaryType = feed.type || "rss";
                    let parsed = [];
                    try {
                        const data = await Utils.httpReq(feed.url);
                        if (data && data.length >= 10) {
                            parsed = Parser.parse(data, feed.name, primaryType);
                            if (parsed.length > 0) return parsed;
                        }
                    } catch (e) {}
                    if (parsed.length === 0) {
                        for (const type of fallback(primaryType)) {
                            try {
                                const data = await Utils.httpReq(feed.url);
                                if (!data || data.length < 10) continue;
                                parsed = Parser.parse(data, feed.name, type);
                                if (parsed.length > 0) return parsed;
                            } catch (e) { continue; }
                        }
                    }
                    if (parsed.length === 0) parsed = await tryApiEndpoint(feed.name);
                    return parsed;
                };

                const results = await Promise.all(allFeeds.map(fetchOne));
                const news = results.flat();
                const successCount = news.length > 0 ? new Set(news.map(n => n.source)).size : 0;
                news.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
                Storage.setNews(news);
                Storage.setLastFetch(Date.now());
                updateStats();
                updateNewsList();
                statusEl.textContent = "✅ 抓取完成: " + successCount + "个源, " + news.length + "条";
                Utils.notify("抓取完成", "获取 " + news.length + " 条新闻");
            }
        };

        const Reporter = {
            generate: async () => {
                const news = Storage.getNews();
                if (!news.length) { statusEl.textContent = "⚠️ 请先抓取新闻"; Utils.notify("无新闻", "请先抓取"); return; }
                const top = [...news].sort((a, b) => (Config.PRIORITY[b.source] || 5) - (Config.PRIORITY[a.source] || 5)).slice(0, 3);
                const dateStr = Utils.formatDateStr();
                const folder = Storage.getFolder();
                let md = "# 📰 今日新闻日报\n\n> " + dateStr + " | 共" + news.length + "条\n\n---\n\n## 📌 重点关注\n\n";
                top.forEach((n, i) => { md += (i + 1) + ". **" + n.title + "**\n   - " + n.source + " | " + (n.date || "无日期") + "\n\n"; });
                md += "---\n\n## 📋 全部新闻\n\n";
                const grouped = {};
                news.forEach(item => { if (!grouped[item.source]) grouped[item.source] = []; grouped[item.source].push(item); });
                Object.keys(grouped).sort().forEach(src => {
                    md += "### " + src + " (" + grouped[src].length + ")\n\n";
                    grouped[src].forEach(n => { md += "- [" + n.title + "](" + (n.link || "#") + ")\n"; });
                    md += "\n";
                });
                md += "\n---\n*由悬浮工具箱自动生成*\n";
                const fileName = folder + "/【" + dateStr + "】日报.md";
                downloadText(md, fileName);
                statusEl.textContent = "✅ 日报已导出";
            }
        };

        function downloadText(content, fileName) {
            const blob = new Blob(["\uFEFF" + content], { type: "text/plain;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            GM_download({ url, name: fileName, saveAs: true, onload: () => { URL.revokeObjectURL(url); Utils.notify("下载成功", fileName); }, onerror: () => Utils.notify("下载失败", "请重试") });
        }

        let sidebar, statusEl, countEl, sourcesEl, timeEl, folderEl, newsListEl;

        function createSidebar(container) {
            sidebar = document.createElement('div');
            sidebar.className = 'ft-tool-panel';
            sidebar.innerHTML = `
                <div class="ft-tool-header">
                    <h2>📰 新闻日报</h2>
                    <button class="ft-close-btn" id="ft-news-close">×</button>
                </div>
                <div class="ft-body">
                    <div class="ft-tool-stats">
                        <div class="ft-tool-stat"><div class="ft-tool-stat-num" id="ft-news-count">0</div><div class="ft-tool-stat-label">新闻条数</div></div>
                        <div class="ft-tool-stat"><div class="ft-tool-stat-num" id="ft-news-sources">0</div><div class="ft-tool-stat-label">来源数量</div></div>
                        <div class="ft-tool-stat"><div class="ft-tool-stat-num" id="ft-news-time">-</div><div class="ft-tool-stat-label">最后更新</div></div>
                        <div class="ft-tool-stat"><div class="ft-tool-stat-num" id="ft-news-folder" style="font-size:14px">📁</div><div class="ft-tool-stat-label">导出位置</div></div>
                    </div>
                    <div class="ft-tool-status" id="ft-news-status">就绪</div>
                    <button class="ft-tool-btn" id="ft-news-start">🚀 一键抓取并生成日报</button>
                    <button class="ft-tool-btn ft-tool-btn-secondary" id="ft-news-fetch">🔄 仅抓取新闻</button>
                    <button class="ft-tool-btn ft-tool-btn-secondary" id="ft-news-report">📑 仅生成日报</button>
                    <div class="ft-tool-section">
                        <h3 class="ft-tool-section-title">📋 最新新闻 <span id="ft-news-list-count"></span></h3>
                        <div id="ft-news-list"><div class="ft-tool-empty">暂无新闻，点击抓取</div></div>
                    </div>
                </div>
            `;
            container.appendChild(sidebar);

            statusEl = sidebar.querySelector('#ft-news-status');
            countEl = sidebar.querySelector('#ft-news-count');
            sourcesEl = sidebar.querySelector('#ft-news-sources');
            timeEl = sidebar.querySelector('#ft-news-time');
            folderEl = sidebar.querySelector('#ft-news-folder');
            newsListEl = sidebar.querySelector('#ft-news-list');

            sidebar.querySelector('#ft-news-close').addEventListener('click', () => { if (window.ftClose) window.ftClose(); });
            sidebar.querySelector('#ft-news-start').addEventListener('click', async () => { statusEl.textContent = "🚀 开始一键抓取..."; await Fetcher.fetchAll(); await Reporter.generate(); statusEl.textContent = "✅ 全部完成!"; });
            sidebar.querySelector('#ft-news-fetch').addEventListener('click', async () => { await Fetcher.fetchAll(); });
            sidebar.querySelector('#ft-news-report').addEventListener('click', async () => { await Reporter.generate(); });

            updateStats();
            updateNewsList();
        }

        function updateStats() {
            const news = Storage.getNews();
            const sources = new Set(news.map(n => n.source));
            countEl.textContent = news.length;
            sourcesEl.textContent = sources.size;
            timeEl.textContent = State.lastFetch ? Utils.formatDate(State.lastFetch) : "-";
            folderEl.textContent = State.folder;
        }

        function updateNewsList() {
            const news = Storage.getNews();
            newsListEl = sidebar?.querySelector('#ft-news-list');
            if (!newsListEl) return;
            const listCount = sidebar.querySelector('#ft-news-list-count');
            if (listCount) listCount.textContent = news.length ? "(" + news.length + ")" : "";
            if (!news.length) { newsListEl.innerHTML = '<div class="ft-tool-empty">暂无新闻，点击抓取</div>'; return; }
            const grouped = {};
            news.forEach(item => { if (!grouped[item.source]) grouped[item.source] = []; grouped[item.source].push(item); });
            let html = "";
            Object.keys(grouped).sort().forEach(src => {
                html += '<div class="ft-tool-group-header"><span>' + src + '</span><span>' + grouped[src].length + '条</span></div>';
                grouped[src].slice(0, 3).forEach(n => {
                    html += '<div class="ft-tool-item" data-link="' + (n.link || "") + '"><div class="ft-tool-item-title">' + n.title + '</div><div class="ft-tool-item-meta"><span>' + (n.date || "") + '</span></div></div>';
                });
            });
            newsListEl.innerHTML = html;
            newsListEl.querySelectorAll('.ft-tool-item[data-link]').forEach(item => {
                item.addEventListener('click', () => { const link = item.dataset.link; if (link) window.open(link, "_blank"); });
            });
        }

        function init() {
            State.customFeeds = Storage.get('feeds', []);
            State.folder = Storage.get('folder', "新闻日报");
            State.lastFetch = Storage.get('time', null);
            const container = document.createElement('div');
            document.body.appendChild(container);
            createSidebar(container);
        }

        return { open: () => { init(); } };
    })();

    const AiceTool = (function() {
        const CONFIG_KEY = 'ft_aice_config';
        const COOKIE_KEY = 'ft_aice_cookies';
        const defaultConfig = { intervalMinutes: 60, exportFormat: 'md' };

        function loadConfig() { const stored = GM_getValue(CONFIG_KEY, null); return stored ? { ...defaultConfig, ...stored } : defaultConfig; }
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
                GM_xmlhttpRequest({ method: 'GET', url, onload: () => { const newCookies = getAllPageCookies(); saveCookies(newCookies); resolve(newCookies); }, onerror: () => resolve({}) });
            });
        }

        function buildCookieHeader(cookies) { if (!cookies) return ''; return Object.entries(cookies).map(([k, v]) => k + '=' + v).join('; '); }

        function httpRequest(url, cookies) {
            return new Promise((resolve, reject) => {
                const token = cookies['aliyung残留'] || cookies['token'] || cookies['QToken'];
                GM_xmlhttpRequest({ method: 'GET', url, headers: { 'Cookie': buildCookieHeader(cookies), 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
                    onload: (res) => { try { resolve(JSON.parse(res.responseText)); } catch { resolve(null); } }, onerror: reject });
            });
        }

        function getBaseUrl() { return window.location.hostname.includes('quark.cn') ? 'https://unite.quark.cn' : 'https://qianwen.com'; }

        async function fetchConversations() {
            let cookies = getCookies();
            if (!cookies || !cookies.cookies) cookies = { cookies: await fetchCookies() };
            const baseUrl = getBaseUrl();
            const listUrl = baseUrl.includes('quark.cn') ? baseUrl + '/pc/chat/conversation/list' : baseUrl + '/quarkchat/api/chat/list?type=conversation&page=1&pageSize=50';
            const data = await httpRequest(listUrl, cookies.cookies);
            if (!data || !data.data || !Array.isArray(data.data)) return [];
            return data.data.map(item => ({ id: item.id || item.conversation_id, title: item.title || item.name || '未命名', created_at: item.created_at || item.create_time }));
        }

        async function fetchMessages(conversationId) {
            let cookies = getCookies();
            if (!cookies || !cookies.cookies) return [];
            const baseUrl = getBaseUrl();
            const msgUrl = baseUrl.includes('quark.cn') ? baseUrl + '/pc/chat/message/list?conversation_id=' + conversationId : baseUrl + '/quarkchat/api/chat/messages?conversation_id=' + conversationId;
            const data = await httpRequest(msgUrl, cookies.cookies);
            if (!data || !data.messages) return [];
            return data.messages;
        }

        async function extractAll() {
            const conversations = await fetchConversations();
            const sessions = [];
            for (const conv of conversations) {
                const messages = await fetchMessages(conv.id);
                sessions.push({ sessionId: conv.id, platform: 'qianwen', title: conv.title, created_at: conv.created_at, messages: messages.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content || m.text || '', timestamp: m.created_at || '' })) });
            }
            return sessions;
        }

        function toMarkdown(sessions) {
            let md = '';
            const date = new Date().toLocaleString('zh-CN');
            for (const s of sessions) {
                md += '# ' + s.title + '\n\n> Platform: ' + s.platform + ' | Date: ' + (s.created_at || date) + '\n\n';
                for (const m of s.messages) md += '## ' + (m.role === 'user' ? '用户' : '助手') + '\n\n' + m.content + '\n\n';
                md += '---\n\n';
            }
            md += '\n> Export: ' + date + ' | Total: ' + sessions.length + ' conversations\n';
            return md;
        }

        function toJSON(sessions) { return JSON.stringify({ exported_at: new Date().toISOString(), session_count: sessions.length, sessions }, null, 2); }

        function toCSV(sessions) {
            const rows = [['session_id', 'platform', 'title', 'role', 'content', 'timestamp']];
            for (const s of sessions) {
                for (const m of s.messages) rows.push([s.sessionId, s.platform, s.title, m.role, '"' + (m.content || '').replace(/"/g, '""') + '"', m.timestamp || '']);
            }
            return rows.map(r => r.join(',')).join('\n');
        }

        function download(content, filename, mimeType) {
            const blob = new Blob(['\uFEFF' + content], { type: mimeType });
            const url = URL.createObjectURL(blob);
            if (typeof GM_download !== 'undefined') GM_download({ url, name: filename, saveAs: true, onload: () => URL.revokeObjectURL(url), onerror: () => { const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url); } });
            else { const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url); }
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

        function createSidebar(container) {
            sidebar = document.createElement('div');
            sidebar.className = 'ft-tool-panel';
            sidebar.innerHTML = `
                <div class="ft-tool-header">
                    <h2>💬 AI聊天导出</h2>
                    <button class="ft-close-btn" id="ft-aice-close">×</button>
                </div>
                <div class="ft-body">
                    <div class="ft-tool-status" id="ft-aice-status">就绪</div>
                    <div class="ft-tool-row">
                        <label class="ft-tool-label">导出格式</label>
                        <select class="ft-tool-select" id="ft-aice-format"><option value="md">Markdown (.md)</option><option value="json">JSON (.json)</option><option value="csv">CSV (.csv)</option></select>
                    </div>
                    <div class="ft-tool-row">
                        <label class="ft-tool-label">定时间隔（分钟）</label>
                        <input type="number" class="ft-tool-input" id="ft-aice-interval" value="60" min="1">
                    </div>
                    <button class="ft-tool-btn ft-tool-btn-cookie" id="ft-aice-get-cookie">🍪 获取Cookie</button>
                    <div class="ft-tool-info" id="ft-aice-cookie-info" style="text-align:center;margin-bottom:12px">未获取</div>
                    <button class="ft-tool-btn" id="ft-aice-run">▶ 立即导出</button>
                    <button class="ft-tool-btn" id="ft-aice-auto" style="background:#3b82f6">⏰ 启动定时</button>
                </div>
            `;
            container.appendChild(sidebar);

            statusEl = sidebar.querySelector('#ft-aice-status');
            cookieInfoEl = sidebar.querySelector('#ft-aice-cookie-info');

            const config = loadConfig();
            const cookies = getCookies();
            sidebar.querySelector('#ft-aice-format').value = config.exportFormat || 'md';
            sidebar.querySelector('#ft-aice-interval').value = config.intervalMinutes || 60;
            if (cookies && cookies.cookies) cookieInfoEl.textContent = '已获取 (' + Object.keys(cookies.cookies).length + ' 个)';

            sidebar.querySelector('#ft-aice-close').addEventListener('click', () => { if (window.ftClose) window.ftClose(); });

            sidebar.querySelector('#ft-aice-get-cookie').addEventListener('click', async () => {
                cookieInfoEl.textContent = '获取中...';
                const newCookies = await fetchCookies();
                cookieInfoEl.textContent = (newCookies && Object.keys(newCookies).length) ? '已获取 (' + Object.keys(newCookies).length + ' 个)' : '获取失败';
            });

            sidebar.querySelector('#ft-aice-run').addEventListener('click', async () => {
                const format = sidebar.querySelector('#ft-aice-format').value;
                const interval = parseInt(sidebar.querySelector('#ft-aice-interval').value) || 60;
                saveConfig({ exportFormat: format, intervalMinutes: interval });
                await runOnce();
            });

            let timerId = null;
            sidebar.querySelector('#ft-aice-auto').addEventListener('click', () => {
                if (timerId) { clearInterval(timerId); timerId = null; sidebar.querySelector('#ft-aice-auto').textContent = '⏰ 启动定时'; sidebar.querySelector('#ft-aice-auto').style.background = '#3b82f6'; statusEl.textContent = '定时已停止'; return; }
                const interval = parseInt(sidebar.querySelector('#ft-aice-interval').value) || 60;
                sidebar.querySelector('#ft-aice-auto').textContent = '⏹ 停止定时';
                sidebar.querySelector('#ft-aice-auto').style.background = '#ef4444';
                statusEl.textContent = '定时中 (' + interval + 'min)';
                runOnce();
                timerId = setInterval(runOnce, interval * 60 * 1000);
            });
        }

        function init() {
            const container = document.createElement('div');
            document.body.appendChild(container);
            createSidebar(container);
        }

        return { open: () => { init(); } };
    })();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();