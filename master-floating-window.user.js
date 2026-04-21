// ==UserScript==
// @name         悬浮窗集合管理器
// @namespace    http://tampermonkey.net/
// @version      0.0.1
// @description  主控悬浮窗，统一管理多个工具的入口
// @author       You
// @match        *://*/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addValueChangeListener
// @grant        GM_addStyle
// @grant        GM_removeValueChangeListener
// ==/UserScript==

(function () {
    'use strict';

    const TOOLS_CONFIG = [
        { id: 'tool_a', name: '签到助手A', status: 'idle', desc: '每日自动签到' },
        { id: 'tool_b', name: '签到助手B', status: 'idle', desc: '备用签到工具' }
    ];

    let isCollapsed = false;
    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    const listeners = {};

    function createMasterWindow() {
        const container = document.createElement('div');
        container.id = 'sc-master-window';
        Object.assign(container.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            width: '280px',
            background: '#1a1a2e',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            zIndex: '999999',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#eee',
            fontSize: '14px',
            userSelect: 'none'
        });

        container.innerHTML = `
            <div id="sc-title-bar" style="padding: 12px 16px; background: #16213e; border-radius: 12px 12px 0 0; display: flex; justify-content: space-between; align-items: center; cursor: move;">
                <span style="font-weight: 600;">工具箱</span>
                <button id="sc-toggle-btn" style="background: none; border: none; color: #eee; font-size: 18px; cursor: pointer; padding: 0 4px;">−</button>
            </div>
            <div id="sc-content" style="padding: 12px 16px;"></div>
        `;

        document.body.appendChild(container);
        return container;
    }

    function renderToolCards(container) {
        const content = container.querySelector('#sc-content');
        content.innerHTML = TOOLS_CONFIG.map(tool => `
            <div id="sc-card-${tool.id}" style="background: #0f3460; margin: 8px 0; padding: 12px; border-radius: 8px; cursor: pointer; transition: all 0.2s;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 500;">${tool.name}</span>
                    <span class="sc-status-badge" style="background: #94a3b8; padding: 2px 8px; border-radius: 10px; font-size: 11px;">${tool.status}</span>
                </div>
                <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">${tool.desc}</div>
            </div>
        `).join('');

        TOOLS_CONFIG.forEach(tool => {
            const card = document.getElementById(`sc-card-${tool.id}`);
            card.addEventListener('click', () => handleToolClick(tool.id));
        });
    }

    function handleToolClick(toolId) {
        const event = new CustomEvent('sc-tool-trigger', { detail: { toolId } });
        window.dispatchEvent(event);
    }

    function updateToolStatus(toolId, newStatus) {
        const tool = TOOLS_CONFIG.find(t => t.id === toolId);
        if (!tool) return;
        tool.status = newStatus;

        const card = document.getElementById(`sc-card-${toolId}`);
        if (card) {
            const badge = card.querySelector('.sc-status-badge');
            badge.textContent = newStatus;
            badge.style.background = newStatus === 'running' ? '#22c55e' : newStatus === 'error' ? '#ef4444' : '#94a3b8';
        }
    }

    function setupDrag(container) {
        const titleBar = container.querySelector('#sc-title-bar');
        titleBar.addEventListener('mousedown', e => {
            isDragging = true;
            dragOffsetX = e.clientX - container.offsetLeft;
            dragOffsetY = e.clientY - container.offsetTop;
        });
        document.addEventListener('mousemove', e => {
            if (!isDragging) return;
            container.style.left = (e.clientX - dragOffsetX) + 'px';
            container.style.top = (e.clientY - dragOffsetY) + 'px';
            container.style.right = 'auto';
        });
        document.addEventListener('mouseup', () => { isDragging = false; });
    }

    function setupToggle(container) {
        const btn = container.querySelector('#sc-toggle-btn');
        const content = container.querySelector('#sc-content');
        btn.addEventListener('click', () => {
            isCollapsed = !isCollapsed;
            content.style.display = isCollapsed ? 'none' : 'block';
            btn.textContent = isCollapsed ? '+' : '−';
        });
    }

    function registerListeners() {
        TOOLS_CONFIG.forEach(tool => {
            const key = `status_${tool.id}`;
            const listener = GM_addValueChangeListener(key, (name, oldVal, newVal) => {
                if (newVal) updateToolStatus(tool.id, newVal.status || newVal);
            });
            listeners[tool.id] = listener;
        });
    }

    function init() {
        const container = createMasterWindow();
        renderToolCards(container);
        setupDrag(container);
        setupToggle(container);
        registerListeners();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();