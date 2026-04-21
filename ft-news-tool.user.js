// ==UserScript==
// @name         新闻爬取器工具
// @namespace    https://github.com/Cecilian-Elysian/Floating-Tools
// @version      0.1.0
// @description  新闻爬取工具，提供RSS/JSON新闻抓取和日报生成功能
// @match        *://*/*
// @run-at       document-end
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_download
// @grant        GM_notification
// @grant        GM_addElement
// @grant        GM_addStyle
// @connect     *
// ==/UserScript==

(function() {
    'use strict';

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
            { name: "凤凰网", url: "http://www.ifeng.com/rss/news.xml", type: "rss" },
            { name: "财经网", url: "http://feed.CNaiQ.com/finance", type: "rss" },
            { name: "第一财经", url: "https://feed.yicai.com/rss", type: "rss" },
            { name: "参考消息", url: "http://www.cankaoxiaoxi.com/rss/", type: "rss" },
            { name: "环球时报", url: "http://www.huanqiu.com/rss/", type: "rss" },
            { name: "RadarAI", url: "https://radarai.top/feed.xml", type: "rss" },
            { name: "微博热搜", url: "https://rsshub.app/weibo/hot", type: "rss" },
            { name: "知乎热榜", url: "https://rsshub.app/zhihu/hot", type: "rss" },
            { name: "百度热搜", url: "https://rsshub.app/baidu/hot", type: "rss" },
            { name: "Bilibili热搜", url: "https://rsshub.app/bilibili/hot", type: "rss" },
            { name: "抖音热搜", url: "https://rsshub.app/douyin/hot", type: "rss" },
            { name: "即刻热榜", url: "https://rsshub.app/jike/topic/default", type: "rss" },
            { name: "GitHub趋势", url: "https://rsshub.app/github/trending", type: "rss" },
            { name: "ProductHunt", url: "https://rsshub.app/producthunt/today", type: "rss" },
            { name: "HackerNews", url: "https://rsshub.app/hacker-news/best", type: "rss" },
            { name: "Reddit编程", url: "https://www.reddit.com/r/programming/.rss", type: "rss" },
            { name: "Stack Overflow", url: "https://stackprinter/questions?service=stackoverflow&language=zh-CN&width=640", type: "webpage" },
        ],
        API_ENDPOINTS: {
            "Bilibili": { url: "https://api.bilibili.com/x/web-interface/ranking/v2?type=all", type: "json" },
            "36氪": { url: "https://36kr.com/pp/api/newsflash?per_page=20&page=1", type: "json" }
        },
        PRIORITY: {
            "人民日报": 10, "新华网": 10, "央视新闻": 10, "澎湃新闻": 8, "观察者网": 8,
            "腾讯新闻": 6, "腾讯科技": 6, "新浪新闻": 6, "网易新闻": 6, "知乎热榜": 7, "36氪": 7, "虎嗅": 7,
            "IT之家": 6, "搜狐新闻": 5, "少数派": 7, "掘金": 7, "凤凰网": 5, "财经网": 5, "第一财经": 5,
            "参考消息": 6, "环球时报": 6, "RadarAI": 8,
            "微博热搜": 6, "百度热搜": 6, "Bilibili热搜": 5, "抖音热搜": 5, "即刻热榜": 6,
            "GitHub趋势": 7, "ProductHunt": 6, "HackerNews": 7, "Reddit编程": 7, "Stack Overflow": 6,
            "Bilibili": 6
        }
    };

    const State = { news: [], customFeeds: [], opacity: 90, folder: "新闻日报", lastFetch: null, darkMode: true };
    const Storage = {
        get: (key, defaultVal) => GM_getValue(key, defaultVal),
        set: (key, val) => GM_setValue(key, val),
        getNews: () => State.news,
        setNews: (arr) => { State.news = arr; Storage.set("ft_news", arr); },
        getCustomFeeds: () => State.customFeeds.length ? State.customFeeds : Config.DEFAULT_FEEDS,
        setCustomFeeds: (arr) => { State.customFeeds = arr; Storage.set("ft_custom_feeds", arr); },
        getFolder: () => State.folder,
        setFolder: (f) => { State.folder = f; Storage.set("ft_folder", f); },
        getOpacity: () => State.opacity,
        setOpacity: (o) => { State.opacity = o; Storage.set("ft_opacity", o); },
        getLastFetch: () => State.lastFetch,
        setLastFetch: (t) => { State.lastFetch = t; Storage.set("ft_news_time", t); }
    };

    const Utils = {
        formatDate: (s) => { if (!s) return ""; try { const d = new Date(s); return isNaN(d.getTime()) ? s : d.toLocaleString("zh-CN"); } catch { return s; } },
        formatDateStr: () => new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" }),
        httpReq: (url) => new Promise((resolve, reject) => {
            GM_xmlhttpRequest({ method: "GET", url, timeout: 15000,
                onload: (r) => { if (r.status >= 200 && r.status < 300) resolve(r.responseText); else reject(new Error("HTTP " + r.status)); },
                onerror: (e) => reject(new Error("请求失败")), ontimeout: () => reject(new Error("请求超时")) });
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
            } catch (e) { console.warn("RSS解析失败:", sourceName); }
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
            } catch (e) { console.warn("JSON解析失败:", sourceName); }
            return news;
        },
        parseWebpage: (data, sourceName) => {
            const news = [];
            try {
                const p = new DOMParser().parseFromString(data, "text/html");
                p.querySelectorAll("a[href]").forEach(a => {
                    const title = a.textContent?.trim() || "";
                    const link = a.getAttribute("href") || "";
                    if (title && title.length > 5 && link.startsWith("http")) {
                        news.push({ title: title.substring(0, 100), link, date: Utils.formatDate(Date.now()), source: sourceName });
                    }
                });
            } catch (e) { console.warn("网页解析失败:", sourceName); }
            return news;
        },
        parseBilibili: (data, sourceName) => {
            const news = [];
            try {
                const json = JSON.parse(data);
                (json.data?.list || []).forEach(item => {
                    if (item.title) {
                        news.push({ title: item.title, link: item.short_link_v2 || "https://www.bilibili.com/video/" + item.bvid, date: Utils.formatDate(item.pubdate * 1000), source: sourceName });
                    }
                });
            } catch (e) { console.warn("Bilibili解析失败:", sourceName); }
            return news;
        },
        parse36kr: (data, sourceName) => {
            const news = [];
            try {
                const json = JSON.parse(data);
                (json.data?.items || []).forEach(item => {
                    if (item.title) {
                        news.push({ title: item.title, link: item.news_url || "https://36kr.com/p/" + item.id, date: Utils.formatDate(item.published_at), source: sourceName });
                    }
                });
            } catch (e) { console.warn("36kr解析失败:", sourceName); }
            return news;
        },
        parse: (data, sourceName, type) => {
            if (type === "json") return Parser.parseJSON(data, sourceName);
            if (type === "webpage") return Parser.parseWebpage(data, sourceName);
            return Parser.parseRSS(data, sourceName);
        }
    };

    const Fetcher = {
        fetchAll: async () => {
            const allFeeds = Storage.getCustomFeeds();
            statusEl.textContent = "🔄 并行抓取中...";

            const fallback = (primaryType) => ["rss", "json", "webpage"].filter(t => t !== primaryType);

            const tryApiEndpoint = async (feedName) => {
                for (const [apiName, apiConfig] of Object.entries(Config.API_ENDPOINTS)) {
                    if (feedName.includes(apiName) || apiName.includes(feedName)) {
                        try {
                            const data = await Utils.httpReq(apiConfig.url);
                            if (!data || data.length < 10) continue;
                            let parsed = apiName === "Bilibili" ? Parser.parseBilibili(data, feedName) : apiName === "36氪" ? Parser.parse36kr(data, feedName) : Parser.parse(data, feedName, apiConfig.type);
                            if (parsed.length > 0) { console.log(feedName + ": API(" + apiName + ")成功"); return parsed; }
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
                        if (parsed.length > 0) { console.log(feed.name + ": " + primaryType + "成功"); return parsed; }
                    }
                } catch (e) { console.warn(feed.name + ": " + primaryType + "失败"); }

                if (parsed.length === 0) {
                    for (const type of fallback(primaryType)) {
                        try {
                            const data = await Utils.httpReq(feed.url);
                            if (!data || data.length < 10) continue;
                            parsed = Parser.parse(data, feed.name, type);
                            if (parsed.length > 0) { console.log(feed.name + ": " + type + "成功"); return parsed; }
                        } catch (e) { continue; }
                    }
                }

                if (parsed.length === 0) parsed = await tryApiEndpoint(feed.name);
                if (parsed.length === 0) console.error(feed.name + ": 所有方式均失败");
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

            md += "\n---\n*由新闻爬取器自动生成*\n";

            const fileName = folder + "/【" + dateStr + "】日报.md";
            Downloader.downloadText(md, fileName);
            statusEl.textContent = "✅ 日报已导出";
        }
    };

    const Downloader = {
        dirHandle: null,
        downloadText: async (content, fileName) => {
            const blob = new Blob(["\uFEFF" + content], { type: "text/plain;charset=utf-8" });

            if (window.showDirectoryPicker && Downloader.dirHandle) {
                try {
                    const fileHandle = await Downloader.dirHandle.getFileHandle(fileName, { create: true });
                    const writable = await fileHandle.createWritable();
                    await writable.write(blob);
                    await writable.close();
                    Utils.notify("下载成功", fileName);
                    return;
                } catch (e) { console.warn("File System Access API 失败:", e); }
            }

            const url = URL.createObjectURL(blob);
            GM_download({ url, name: fileName, saveAs: true,
                onload: () => { URL.revokeObjectURL(url); Utils.notify("下载成功", fileName); },
                onerror: () => Utils.notify("下载失败", "请重试") });
        },
        selectFolder: async () => {
            if (window.showDirectoryPicker) {
                try {
                    Downloader.dirHandle = await window.showDirectoryPicker();
                    Utils.notify("已选择文件夹", "下载将保存到: " + Downloader.dirHandle.name);
                    Storage.set("ft_downloadFolder", Downloader.dirHandle.name);
                    return true;
                } catch (e) { console.warn("选择文件夹取消:", e); return false; }
            } else { Utils.notify("不支持", "您的浏览器不支持文件夹选择功能"); return false; }
        }
    };

    let sidebar, elements, statusEl;
    let newsListEl, countEl, sourcesEl, timeEl, folderEl;

    function createStyles() {
        GM_addStyle(`
            .ft-tool-panel{width:300px;height:100vh;background:#1a1a2e;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Microsoft YaHei",sans-serif;color:#eee;display:flex;flex-direction:column;box-sizing:border-box}
            .ft-tool-header{height:56px;padding:0 16px;background:#16213e;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;border-radius:12px 12px 0 0}
            .ft-tool-header h2{margin:0;font-size:15px;font-weight:600;display:flex;align-items:center;gap:6px}
            .ft-tool-close{width:28px;height:28px;border:none;background:rgba(255,255,255,.1);border-radius:50%;color:#fff;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;transition:all .2s}
            .ft-tool-close:hover{background:rgba(255,255,255,.2)}
            .ft-tool-body{flex:1;overflow-y:auto;padding:12px}
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
            .ft-tool-modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);z-index:100001;display:none;align-items:center;justify-content:center}
            .ft-tool-modal-overlay.active{display:flex}
            .ft-tool-modal{background:#1a1a2e;border-radius:12px;padding:20px;width:90%;max-width:340px;border:1px solid #333}
            .ft-tool-modal h3{margin:0 0 14px;font-size:14px;color:#eee}
            .ft-tool-modal input,.ft-tool-modal select{width:100%;padding:8px 10px;margin-bottom:8px;border:1px solid #333;border-radius:6px;font-size:12px;box-sizing:border-box;background:#252540;color:#eee}
            .ft-tool-modal input:focus,.ft-tool-modal select:focus{outline:none;border-color:#667eea}
            .ft-tool-modal-btns{display:flex;gap:8px;margin-top:12px}
            .ft-tool-modal-btns button{flex:1;padding:8px;border-radius:6px;border:none;cursor:pointer;font-size:12px;transition:all .2s}
            .ft-tool-modal-cancel{background:#333;color:#aaa}
            .ft-tool-modal-confirm{background:#667eea;color:#fff}
            .ft-tool-group-header{padding:6px 8px;background:#16213e;font-size:11px;font-weight:600;color:#667eea;border-radius:4px;margin-bottom:4px;display:flex;justify-content:space-between}
        `);
    }

    function createSidebar(container) {
        sidebar = document.createElement('div');
        sidebar.className = 'ft-tool-panel';
        sidebar.innerHTML = `
            <div class="ft-tool-header">
                <h2>📰 新闻日报</h2>
                <button class="ft-tool-close" id="ft-news-close">×</button>
            </div>
            <div class="ft-tool-body">
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
        State.customFeeds = Storage.get("ft_custom_feeds", []);
        State.folder = Storage.get("ft_folder", "新闻日报");
        State.lastFetch = Storage.get("ft_news_time", null);

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