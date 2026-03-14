// ==UserScript==
// @name         Pintia 字符粘贴器
// @namespace    http://tampermonkey.net/
// @version      3.4
// @description  在 Pintia.cn 自动逐字符粘贴文本
// @author       Bzjdtc
// @match        https://pintia.cn/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 样式部分
    const style = document.createElement('style');
    style.textContent = `
        .pintia-paster-container { position: fixed; bottom: 20px; right: 20px; width: 260px; height: 380px; background-color: #ffffff; border: 2px solid #4a90e2; padding: 16px; border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.15); z-index: 10000; font-family: Arial, sans-serif; background: linear-gradient(135deg, #f5f7ff 0%, #f0f4ff 100%); transition: box-shadow 0.3s ease, border-color 0.3s ease; cursor: move; will-change: transform; display: flex; flex-direction: column; }
        .pintia-paster-container.dragging { box-shadow: 0 12px 40px rgba(0,0,0,0.2); border-color: #3a7bc8; cursor: grabbing; transition: none; }
        .pintia-paster-title { margin: 0 0 6px 0; padding: 0; color: #2c3e50; font-size: 12px; font-weight: 560; text-align: center; border-bottom: 1px solid #eaeaea; padding-bottom: 2px; cursor: move; flex-shrink: 0; }
        .pintia-paster-input { width: 100%; flex: 1; min-height: 210px; padding: 10px; font-size: 12px; line-height: 1.5; resize: vertical; overflow: auto; box-sizing: border-box; border: 1px solid #d1d9e6; border-radius: 8px; background-color: #ffffff; font-family: monospace, Consolas, Monaco; outline: none; transition: border-color 0.2s, box-shadow 0.2s; cursor: text; }
        .pintia-paster-input:focus { border-color: #4a90e2; box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2); }
        .pintia-paster-button-container { display: flex; justify-content: center; margin-top: 12px; flex-shrink: 0; gap: 10px; }
        .pintia-paster-button { width: 90px; height: 30px; padding: 6px 14px; background-color: #4a90e2; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 540; font-size: 12px; transition: all 0.2s ease; box-shadow: 0 2px 5px rgba(74, 144, 226, 0.3); }
        .pintia-paster-button:hover:not(:disabled) { background-color: #3a7bc8; transform: translateY(-1px); box-shadow: 0 4px 8px rgba(74, 144, 226, 0.4); }
        .pintia-paster-button:active:not(:disabled) { transform: translateY(1px); box-shadow: 0 1px 2px rgba(74, 144, 226, 0.3); }
        .pintia-paster-button:disabled { background-color: #a0a0a0; cursor: not-allowed; transform: none; box-shadow: none; }
        .pintia-paster-button.clear { background-color: #e74c3c; box-shadow: 0 2px 5px rgba(231, 76, 60, 0.3); }
        .pintia-paster-button.clear:hover:not(:disabled) { background-color: #c0392b; box-shadow: 0 4px 8px rgba(231, 76, 60, 0.4); }
        .pintia-settings-container { display: flex; flex-direction: column; align-items: center; margin-top: 8px; flex-shrink: 0; gap: 8px; }
        .pintia-setting-row { display: flex; align-items: center; justify-content: center; width: 80%; }
        .pintia-mode-label, .pintia-speed-label { font-size: 12px; color: #666; margin-right: 8px; min-width: 60px; text-align: right; }
        .pintia-mode-select, .pintia-speed-select { padding: 4px 8px; border: 1px solid #d1d9e6; border-radius: 6px; font-size: 12px; background-color: white; min-width: 130px; transition: border-color 0.2s, box-shadow 0.2s; }
        .pintia-mode-select:focus, .pintia-speed-select:focus { border-color: #4a90e2; box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2); outline: none; }
        .pintia-progress-container { display: flex; align-items: center; justify-content: center; margin-top: 10px; gap: 12px; flex-shrink: 0; display: none; }
        .pintia-status-text { font-size: 12px; color: #4a90e2; font-weight: 560; min-width: 70px; text-align: center; }
        .pintia-cancel-button { width: 50px; height: 20px; padding: 0px 4px; background-color: #4a90e2; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 10px; transition: all 0.2s ease; box-shadow: 0 2px 4px rgba(74, 144, 226, 0.3); }
        .pintia-cancel-button:hover:not(:disabled) { background-color: #3a7bc8; transform: translateY(-1px); box-shadow: 0 2px 6px rgba(74, 144, 226, 0.4); }
        .pintia-cancel-button:active:not(:disabled) { transform: translateY(1px); box-shadow: 0 1px 2px rgba(74, 144, 226, 0.3); }
    `;
    document.head.appendChild(style);

    // DOM 构建部分
    const container = document.createElement('div'); container.className = 'pintia-paster-container';
    const title = document.createElement('h3'); title.className = 'pintia-paster-title'; title.textContent = 'Pintia 字符粘贴器';
    const input = document.createElement('textarea'); input.className = 'pintia-paster-input'; input.placeholder = '在此输入要粘贴的文本...';
    const buttonContainer = document.createElement('div'); buttonContainer.className = 'pintia-paster-button-container';
    const button = document.createElement('button'); button.className = 'pintia-paster-button'; button.textContent = '开始粘贴';
    const clearButton = document.createElement('button'); clearButton.className = 'pintia-paster-button clear'; clearButton.textContent = '清空输入';
    const settingsContainer = document.createElement('div'); settingsContainer.className = 'pintia-settings-container';

    const modeRow = document.createElement('div'); modeRow.className = 'pintia-setting-row';
    const modeLabel = document.createElement('span'); modeLabel.className = 'pintia-mode-label'; modeLabel.textContent = '粘贴模式:';
    const modeSelect = document.createElement('select'); modeSelect.className = 'pintia-mode-select';
    const appendOption = document.createElement('option'); appendOption.value = 'append'; appendOption.textContent = '追加到现有内容';
    const replaceOption = document.createElement('option'); replaceOption.value = 'replace'; replaceOption.textContent = '替换现有内容';
    modeSelect.appendChild(appendOption); modeSelect.appendChild(replaceOption);
    modeRow.appendChild(modeLabel); modeRow.appendChild(modeSelect);

    const speedRow = document.createElement('div'); speedRow.className = 'pintia-setting-row';
    const speedLabel = document.createElement('span'); speedLabel.className = 'pintia-speed-label'; speedLabel.textContent = '打字速度:';
    const speedSelect = document.createElement('select'); speedSelect.className = 'pintia-speed-select';
    const slowOption = document.createElement('option'); slowOption.value = 'slow'; slowOption.textContent = '慢速';
    const mediumOption = document.createElement('option'); mediumOption.value = 'medium'; mediumOption.textContent = '中速';
    const fastOption = document.createElement('option'); fastOption.value = 'fast'; fastOption.textContent = '快速';
    const ultraOption = document.createElement('option'); ultraOption.value = 'ultra'; ultraOption.textContent = '极速'; ultraOption.selected = true;
    speedSelect.appendChild(slowOption); speedSelect.appendChild(mediumOption); speedSelect.appendChild(fastOption); speedSelect.appendChild(ultraOption);
    speedRow.appendChild(speedLabel); speedRow.appendChild(speedSelect);

    settingsContainer.appendChild(modeRow); settingsContainer.appendChild(speedRow);

    const progressContainer = document.createElement('div'); progressContainer.className = 'pintia-progress-container';
    const statusText = document.createElement('div'); statusText.className = 'pintia-status-text';
    const cancelButton = document.createElement('button'); cancelButton.className = 'pintia-cancel-button'; cancelButton.textContent = '取消';
    progressContainer.appendChild(statusText); progressContainer.appendChild(cancelButton);

    container.appendChild(title); container.appendChild(input); container.appendChild(buttonContainer);
    buttonContainer.appendChild(button); buttonContainer.appendChild(clearButton);
    container.appendChild(settingsContainer); container.appendChild(progressContainer);
    document.body.appendChild(container);

    // 拖拽逻辑
    let isDragging = false; let dragStartX, dragStartY; let containerStartX, containerStartY;
    function getContainerPosition() { const rect = container.getBoundingClientRect(); return { x: rect.left, y: rect.top }; }
    function setContainerPosition(x, y) {
        const maxX = window.innerWidth - container.offsetWidth; const maxY = window.innerHeight - container.offsetHeight;
        container.style.left = Math.max(0, Math.min(x, maxX)) + 'px'; container.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
        container.style.right = 'auto'; container.style.bottom = 'auto';
    }
    function startDrag(e) {
        if (e.target === input || e.target === button || e.target === clearButton || e.target === modeSelect || e.target === speedSelect || e.target === cancelButton) return;
        isDragging = true; const pos = getContainerPosition(); containerStartX = pos.x; containerStartY = pos.y;
        dragStartX = e.clientX; dragStartY = e.clientY; container.classList.add('dragging'); e.preventDefault();
    }
    function onDrag(e) {
        if (!isDragging) return;
        setContainerPosition(containerStartX + (e.clientX - dragStartX), containerStartY + (e.clientY - dragStartY));
        e.preventDefault();
    }
    function endDrag() { if (!isDragging) return; isDragging = false; container.classList.remove('dragging'); }

    container.addEventListener('mousedown', startDrag); title.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', onDrag); document.addEventListener('mouseup', endDrag);
    window.addEventListener('resize', () => { const pos = getContainerPosition(); setContainerPosition(pos.x, pos.y); });

    // === 核心逻辑 ===
    let isTyping = false;
    let cancelTyping = false;

    function getRandomDelay() {
        const speed = speedSelect.value;
        if (speed === 'ultra') return 1;
        if (speed === 'slow') return 70 + Math.random() * 80;
        if (speed === 'fast') return 5 + Math.random() * 15;
        return 30 + Math.random() * 40;
    }

    // 【全新修复】利用已知有效的 insertText 进行“覆盖清空法”
    async function clearEditor(targetElement) {
        targetElement.focus();

        // 1. 发送 Ctrl+A 事件唤醒编辑器全选状态
        targetElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', code: 'KeyA', ctrlKey: true, bubbles: true }));

        // 2. DOM 层面强制全选
        const sel = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(targetElement);
        sel.removeAllRanges();
        sel.addRange(range);

        await new Promise(r => setTimeout(r, 20)); // 等待状态同步


        // 4. 发送 Backspace 退格键，把刚才覆盖用的那个空格删掉，大功告成
        targetElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', code: 'Backspace', keyCode: 8, bubbles: true }));
        document.execCommand('delete', false, null);
        targetElement.dispatchEvent(new InputEvent('input', { inputType: 'deleteContentBackward', bubbles: true }));
    }

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

    async function simulateHumanTyping(text, targetElement, mode) {
        isTyping = true; cancelTyping = false; button.disabled = true; clearButton.disabled = true;
        modeSelect.disabled = true; speedSelect.disabled = true; button.textContent = '粘贴中...';
        progressContainer.style.display = 'flex'; statusText.textContent = '准备开始输入...';

        // 替换模式下，调用新的全选覆盖清除法
        if (mode === 'replace') {
            await clearEditor(targetElement);
            await new Promise(r => setTimeout(r, 50));
        }

        const totalChars = text.length;
        let typedChars = 0;
        const speed = speedSelect.value;
        const CHUNK_SIZE = (speed === 'ultra') ? 5 : 1;

        for (let i = 0; i < totalChars; i += CHUNK_SIZE) {
            if (cancelTyping) break;

            const charOrChunk = text.substring(i, Math.min(i + CHUNK_SIZE, totalChars));
            typedChars += charOrChunk.length;
            const progress = (typedChars / totalChars) * 100;
            statusText.textContent = `输入中... ${Math.round(progress)}%`;

            insertCharAndTriggerEvents(targetElement, charOrChunk);
            await new Promise(resolve => setTimeout(resolve, getRandomDelay()));
        }

        isTyping = false; button.disabled = false; clearButton.disabled = false;
        modeSelect.disabled = false; speedSelect.disabled = false; button.textContent = '开始粘贴';
        progressContainer.style.display = 'none';

        if (cancelTyping) {
            statusText.textContent = '输入已取消';
            setTimeout(() => { statusText.textContent = ''; }, 2000);
        } else {
            statusText.textContent = '输入完成！';
            setTimeout(() => { statusText.textContent = ''; }, 2000);
        }
    }

    function cancelTypingProcess() {
        if (isTyping) { cancelTyping = true; button.textContent = '取消中...'; statusText.textContent = '正在取消...'; }
    }

    clearButton.addEventListener('click', () => { input.value = ''; input.focus(); });
    cancelButton.addEventListener('click', () => { cancelTypingProcess(); });

    button.addEventListener('click', () => {
        const text = input.value;
        if (!text) { alert('输入框为空，请输入内容'); return; }
        if (isTyping) { cancelTypingProcess(); return; }

        // 【精准定位】只寻找“允许编辑”的 CodeMirror 6 文本框（修复只读题目代码干扰）
        const contentDiv = document.querySelector('div.cm-content[contenteditable="true"]')
            || document.querySelector('div[contenteditable="true"]');

        if (!contentDiv) { alert('未找到内容区域，请确保在题目页面。'); return; }

        const mode = modeSelect.value;
        input.value = '';
        simulateHumanTyping(text, contentDiv, mode);
    });

})();