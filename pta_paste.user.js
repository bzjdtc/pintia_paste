// ==UserScript==
// @name         Pintia 字符粘贴器 (无 UI)
// @namespace    http://tampermonkey.net/
// @version      4.2
// @description  在 Pintia.cn 按 Ctrl+V 自动触发模拟打字粘贴，支持 ESC 键紧急停止
// @author       Bzjdtc
// @match        https://pintia.cn/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let isTyping = false;
    let cancelTyping = false; // 新增：紧急停止标志位

    // --- 速度配置区 ---
    const CHUNK_SIZE = 5;
    const DELAY_MS = 1;

    function insertCharAndTriggerEvents(targetElement, char) {
        targetElement.focus();
        const sel = window.getSelection();
        if (sel.rangeCount === 0 || !targetElement.contains(sel.anchorNode)) {
            const range = document.createRange();
            range.selectNodeContents(targetElement);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
        }

        let success = document.execCommand('insertText', false, char);
        if (!success) {
            const dataTransfer = new DataTransfer();
            dataTransfer.setData('text/plain', char);
            const pasteEvent = new ClipboardEvent('paste', { clipboardData: dataTransfer, bubbles: true, cancelable: true });
            targetElement.dispatchEvent(pasteEvent);
        }
    }

    async function simulateHumanTyping(text, targetElement) {
        if (isTyping) return;

        isTyping = true;
        cancelTyping = false; // 每次打字前重置刹车状态

        const totalChars = text.length;

        for (let i = 0; i < totalChars; i += CHUNK_SIZE) {
            // 【核心逻辑】：每次敲击前检查是否踩了刹车
            if (cancelTyping) {
                showToast('⛔ 已紧急停止粘贴');
                break; // 立刻跳出循环，停止打字
            }

            const charOrChunk = text.substring(i, Math.min(i + CHUNK_SIZE, totalChars));
            insertCharAndTriggerEvents(targetElement, charOrChunk);
            await new Promise(resolve => setTimeout(resolve, DELAY_MS));
        }

        isTyping = false;
        cancelTyping = false;
    }

    // --- 轻量级提示框 (仅在紧急停止时出现) ---
    function showToast(msg) {
        const toast = document.createElement('div');
        toast.textContent = msg;
        toast.style.cssText = `
            position: fixed;
            top: 30px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #ff4757;
            color: white;
            padding: 10px 24px;
            border-radius: 8px;
            font-family: sans-serif;
            font-size: 14px;
            font-weight: bold;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            transition: opacity 0.3s ease;
            pointer-events: none;
        `;
        document.body.appendChild(toast);

        // 2秒后淡出并移除
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    // --- 事件监听区 ---

    // 1. 监听全局粘贴 (Ctrl+V)
    document.addEventListener('paste', function(e) {
        const contentDiv = document.querySelector('div.cm-content[contenteditable="true"]')
            || document.querySelector('div[contenteditable="true"]');

        if (!contentDiv || (!contentDiv.contains(document.activeElement) && contentDiv !== document.activeElement)) {
            return;
        }

        let pastedText = e.clipboardData.getData('text/plain');
        if (!pastedText) return;

        e.preventDefault();
        pastedText = pastedText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        simulateHumanTyping(pastedText, contentDiv);
    }, true);

    // 2. 监听全局键盘事件 (ESC 制动)
    document.addEventListener('keydown', function(e) {
        // 如果按下了 ESC，并且当前正在打字状态
        if (e.key === 'Escape' && isTyping) {
            cancelTyping = true; // 触发制动开关
            // 阻止 ESC 触发网页的其他默认行为
            e.preventDefault();
        }
    }, true);

})();