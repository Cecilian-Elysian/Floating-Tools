// ==UserScript==
// @name         消息通信桥
// @namespace    http://tampermonkey.net/
// @version      0.0.1
// @description   GM_setValue 消息通道封装，提供统一的数据推送接口
// ==/UserScript==

(function () {
    'use strict';

    window.MessageBridge = {
        send(toolId, action, data = {}) {
            const payload = { action, data, timestamp: Date.now() };
            GM_setValue(`msg_${toolId}`, payload);
        },

        status(toolId, status) {
            GM_setValue(`status_${toolId}`, { status });
        },

        result(toolId, result) {
            GM_setValue(`result_${toolId}`, result);
        }
    };
})();