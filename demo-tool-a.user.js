// ==UserScript==
// @name         签到助手A
// @namespace    http://tampermonkey.net/
// @version      0.0.1
// @description  示例功能脚本 - 自动签到A
// @match        *://*/*
// @grant        GM_setValue
// ==/UserScript==

(function () {
    'use strict';

    const TOOL_ID = 'tool_a';

    window.MessageBridge.status(TOOL_ID, 'idle');

    window.addEventListener('sc-tool-trigger', e => {
        if (e.detail.toolId !== TOOL_ID) return;
        runTask();
    });

    function runTask() {
        window.MessageBridge.status(TOOL_ID, 'running');
        setTimeout(() => {
            window.MessageBridge.status(TOOL_ID, 'idle');
        }, 2000);
    }
})();