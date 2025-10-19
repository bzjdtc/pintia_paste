// ==UserScript==
// @name         Pintia 字符粘贴器
// @namespace    http://tampermonkey.net/
// @version      3.2
// @description  在 Pintia.cn 自动逐字符粘贴文本（模拟人类打字，支持全屏丝滑拖拽）
// @author       Bzjdtc
// @match        https://pintia.cn/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 添加样式到页面
    const style = document.createElement('style');
    style.textContent = `
        .pintia-paster-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 380px;
            height: 500px;
            background-color: #ffffff;
            border: 2px solid #4a90e2;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 8px 30px rgba(0,0,0,0.15);
            z-index: 10000;
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #f5f7ff 0%, #f0f4ff 100%);
            transition: box-shadow 0.3s ease, border-color 0.3s ease;
            cursor: move;
            will-change: transform;
            display: flex;
            flex-direction: column;
        }

        .pintia-paster-container.dragging {
            box-shadow: 0 12px 40px rgba(0,0,0,0.2);
            border-color: #3a7bc8;
            cursor: grabbing;
            transition: none;
        }

        .pintia-paster-title {
            margin: 0 0 15px 0;
            padding: 0;
            color: #2c3e50;
            font-size: 16px;
            font-weight: 600;
            text-align: center;
            border-bottom: 1px solid #eaeaea;
            padding-bottom: 10px;
            cursor: move;
            flex-shrink: 0;
        }

        .pintia-paster-input {
            width: 100%;
            flex: 1;
            min-height: 250px;
            padding: 12px;
            font-size: 14px;
            line-height: 1.5;
            resize: vertical;
            overflow: auto;
            box-sizing: border-box;
            border: 1px solid #d1d9e6;
            border-radius: 8px;
            background-color: #ffffff;
            font-family: monospace, Consolas, Monaco;
            outline: none;
            transition: border-color 0.2s, box-shadow 0.2s;
            cursor: text;
        }

        .pintia-paster-input:focus {
            border-color: #4a90e2;
            box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
        }

        .pintia-paster-button-container {
            display: flex;
            justify-content: center;
            margin-top: 15px;
            flex-shrink: 0;
            gap: 10px;
        }

        .pintia-paster-button {
            width: 120px;
            height: 40px;
            padding: 8px 16px;
            background-color: #4a90e2;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.2s ease;
            box-shadow: 0 2px 5px rgba(74, 144, 226, 0.3);
        }

        .pintia-paster-button:hover:not(:disabled) {
            background-color: #3a7bc8;
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(74, 144, 226, 0.4);
        }

        .pintia-paster-button:active:not(:disabled) {
            transform: translateY(1px);
            box-shadow: 0 1px 2px rgba(74, 144, 226, 0.3);
        }

        .pintia-paster-button:disabled {
            background-color: #a0a0a0;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }

        .pintia-paster-button.clear {
            background-color: #e74c3c;
            box-shadow: 0 2px 5px rgba(231, 76, 60, 0.3);
        }

        .pintia-paster-button.clear:hover:not(:disabled) {
            background-color: #c0392b;
            box-shadow: 0 4px 8px rgba(231, 76, 60, 0.4);
        }

        .pintia-settings-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-top: 10px;
            flex-shrink: 0;
            gap: 8px;
        }

        .pintia-setting-row {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
        }

        .pintia-mode-label, .pintia-speed-label {
            font-size: 12px;
            color: #666;
            margin-right: 8px;
            min-width: 60px;
            text-align: right;
        }

        .pintia-mode-select, .pintia-speed-select {
            padding: 6px 10px;
            border: 1px solid #d1d9e6;
            border-radius: 6px;
            font-size: 12px;
            background-color: white;
            min-width: 150px;
            transition: border-color 0.2s, box-shadow 0.2s;
        }

        .pintia-mode-select:focus, .pintia-speed-select:focus {
            border-color: #4a90e2;
            box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
            outline: none;
        }

        .pintia-progress-container {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-top: 10px;
            gap: 15px;
            flex-shrink: 0;
            display: none;
        }

        .pintia-status-text {
            font-size: 14px;
            color: #4a90e2;
            font-weight: 600;
            min-width: 120px;
            text-align: center;
        }

        .pintia-cancel-button {
            width: 80px;
            height: 32px;
            padding: 6px 12px;
            background-color: #4a90e2;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            font-size: 12px;
            transition: all 0.2s ease;
            box-shadow: 0 2px 5px rgba(74, 144, 226, 0.3);
        }

        .pintia-cancel-button:hover:not(:disabled) {
            background-color: #3a7bc8;
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(74, 144, 226, 0.4);
        }

        .pintia-cancel-button:active:not(:disabled) {
            transform: translateY(1px);
            box-shadow: 0 1px 2px rgba(74, 144, 226, 0.3);
        }
    `;
    document.head.appendChild(style);

    // 创建输入框和按钮容器
    const container = document.createElement('div');
    container.className = 'pintia-paster-container';

    // 创建标题
    const title = document.createElement('h3');
    title.className = 'pintia-paster-title';
    title.textContent = 'Pintia 字符粘贴器';

    // 创建多行输入框
    const input = document.createElement('textarea');
    input.className = 'pintia-paster-input';
    input.placeholder = '在此输入要粘贴的文本...';

    // 创建按钮容器用于居中
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'pintia-paster-button-container';

    // 创建粘贴按钮
    const button = document.createElement('button');
    button.className = 'pintia-paster-button';
    button.textContent = '开始粘贴';

    // 创建清空按钮
    const clearButton = document.createElement('button');
    clearButton.className = 'pintia-paster-button clear';
    clearButton.textContent = '清空输入';

    // 创建设置容器
    const settingsContainer = document.createElement('div');
    settingsContainer.className = 'pintia-settings-container';

    // 创建模式选择行
    const modeRow = document.createElement('div');
    modeRow.className = 'pintia-setting-row';

    const modeLabel = document.createElement('span');
    modeLabel.className = 'pintia-mode-label';
    modeLabel.textContent = '粘贴模式:';

    const modeSelect = document.createElement('select');
    modeSelect.className = 'pintia-mode-select';

    const appendOption = document.createElement('option');
    appendOption.value = 'append';
    appendOption.textContent = '追加到现有内容';

    const replaceOption = document.createElement('option');
    replaceOption.value = 'replace';
    replaceOption.textContent = '替换现有内容';

    modeSelect.appendChild(appendOption);
    modeSelect.appendChild(replaceOption);

    modeRow.appendChild(modeLabel);
    modeRow.appendChild(modeSelect);

    // 创建速度选择行
    const speedRow = document.createElement('div');
    speedRow.className = 'pintia-setting-row';

    const speedLabel = document.createElement('span');
    speedLabel.className = 'pintia-speed-label';
    speedLabel.textContent = '打字速度:';

    const speedSelect = document.createElement('select');
    speedSelect.className = 'pintia-speed-select';

    const slowOption = document.createElement('option');
    slowOption.value = 'slow';
    slowOption.textContent = '慢速';

    const mediumOption = document.createElement('option');
    mediumOption.value = 'medium';
    mediumOption.textContent = '中速';
    mediumOption.selected = true;

    const fastOption = document.createElement('option');
    fastOption.value = 'fast';
    fastOption.textContent = '快速';

    speedSelect.appendChild(slowOption);
    speedSelect.appendChild(mediumOption);
    speedSelect.appendChild(fastOption);

    speedRow.appendChild(speedLabel);
    speedRow.appendChild(speedSelect);

    // 将模式选择和速度选择添加到设置容器
    settingsContainer.appendChild(modeRow);
    settingsContainer.appendChild(speedRow);

    // 创建进度容器（包含状态文本和取消按钮）
    const progressContainer = document.createElement('div');
    progressContainer.className = 'pintia-progress-container';

    // 创建状态文本
    const statusText = document.createElement('div');
    statusText.className = 'pintia-status-text';

    // 创建取消按钮
    const cancelButton = document.createElement('button');
    cancelButton.className = 'pintia-cancel-button';
    cancelButton.textContent = '取消';

    // 将状态文本和取消按钮添加到进度容器
    progressContainer.appendChild(statusText);
    progressContainer.appendChild(cancelButton);

    // 组装容器
    container.appendChild(title);
    container.appendChild(input);
    container.appendChild(buttonContainer);
    buttonContainer.appendChild(button);
    buttonContainer.appendChild(clearButton);
    container.appendChild(settingsContainer);
    container.appendChild(progressContainer);
    document.body.appendChild(container);

    // === 丝滑拖拽实现 - 支持全屏移动 ===
    let isDragging = false;
    let dragStartX, dragStartY;
    let containerStartX, containerStartY;

    // 获取容器当前位置
    function getContainerPosition() {
        const rect = container.getBoundingClientRect();
        return {
            x: rect.left,
            y: rect.top
        };
    }

    // 设置容器位置
    function setContainerPosition(x, y) {
        // 限制在可视区域内
        const maxX = window.innerWidth - container.offsetWidth;
        const maxY = window.innerHeight - container.offsetHeight;

        const constrainedX = Math.max(0, Math.min(x, maxX));
        const constrainedY = Math.max(0, Math.min(y, maxY));

        container.style.left = constrainedX + 'px';
        container.style.top = constrainedY + 'px';
        container.style.right = 'auto';
        container.style.bottom = 'auto';
    }

    // 拖拽开始
    function startDrag(e) {
        // 检查是否点击了输入框或按钮，如果是则不触发拖拽
        if (e.target === input || e.target === button || e.target === clearButton ||
            e.target === modeSelect || e.target === speedSelect || e.target === cancelButton) {
            return;
        }

        isDragging = true;
        const pos = getContainerPosition();
        containerStartX = pos.x;
        containerStartY = pos.y;
        dragStartX = e.clientX;
        dragStartY = e.clientY;

        container.classList.add('dragging');
        e.preventDefault();
    }

    // 拖拽中 - 使用requestAnimationFrame优化性能
    function onDrag(e) {
        if (!isDragging) return;

        const deltaX = e.clientX - dragStartX;
        const deltaY = e.clientY - dragStartY;

        const newX = containerStartX + deltaX;
        const newY = containerStartY + deltaY;

        setContainerPosition(newX, newY);
        e.preventDefault();
    }

    // 拖拽结束
    function endDrag() {
        if (!isDragging) return;

        isDragging = false;
        container.classList.remove('dragging');
    }

    // 事件监听 - 容器本身和标题监听拖拽
    container.addEventListener('mousedown', startDrag);
    title.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', endDrag);

    // 触摸设备支持
    container.addEventListener('touchstart', (e) => {
        if (e.target === input || e.target === button || e.target === clearButton ||
            e.target === modeSelect || e.target === speedSelect || e.target === cancelButton) {
            return;
        }
        startDrag(e.touches[0]);
    });

    document.addEventListener('touchmove', (e) => {
        onDrag(e.touches[0]);
    });

    document.addEventListener('touchend', endDrag);

    // 窗口大小变化时重新定位容器，防止移出可视区域
    window.addEventListener('resize', () => {
        const pos = getContainerPosition();
        setContainerPosition(pos.x, pos.y);
    });

    // === 模拟人类打字功能 ===
    let isTyping = false;
    let cancelTyping = false;

    // 根据速度设置获取延迟时间
    function getRandomDelay() {
        const speed = speedSelect.value;
        let minDelay, maxDelay;

        switch(speed) {
            case 'slow':
                minDelay = 70;
                maxDelay = 150;
                break;
            case 'fast':
                minDelay = 5;
                maxDelay = 20;
                break;
            case 'medium':
            default:
                minDelay = 30;
                maxDelay = 70;
                break;
        }

        return minDelay + Math.random() * (maxDelay - minDelay);
    }

    // 根据速度设置获取思考停顿时间
    function getThinkingDelay() {
        const speed = speedSelect.value;

        switch(speed) {
            case 'slow':
                return 200 + Math.random() * 200;
            case 'fast':
                return 30 + Math.random() * 60;
            case 'medium':
            default:
                return 50 + Math.random() * 100;
        }
    }

    // 触发所有必要的事件以确保编辑器处理内容
    function triggerEditorEvents(element) {
        // 触发输入事件
        const inputEvent = new Event('input', {
            bubbles: true,
            cancelable: true
        });
        element.dispatchEvent(inputEvent);

        // 触发变化事件
        const changeEvent = new Event('change', {
            bubbles: true,
            cancelable: true
        });
        element.dispatchEvent(changeEvent);

        // 触发键盘事件
        const keyDownEvent = new KeyboardEvent('keydown', {
            bubbles: true,
            cancelable: true,
            key: ' ',
            keyCode: 32
        });
        element.dispatchEvent(keyDownEvent);

        const keyUpEvent = new KeyboardEvent('keyup', {
            bubbles: true,
            cancelable: true,
            key: ' ',
            keyCode: 32
        });
        element.dispatchEvent(keyUpEvent);

        // 触发焦点和模糊事件以确保编辑器状态更新
        element.dispatchEvent(new Event('focus', { bubbles: true }));
        element.dispatchEvent(new Event('blur', { bubbles: true }));
        element.dispatchEvent(new Event('focus', { bubbles: true }));
    }

    // 更可靠的文本设置方法
    function setEditorContent(targetElement, text) {
        // 尝试多种方法设置编辑器内容
        if (targetElement.isContentEditable) {
            // 对于contenteditable元素
            targetElement.focus();
            targetElement.textContent = text;
            triggerEditorEvents(targetElement);
        } else if (targetElement.tagName === 'TEXTAREA' || targetElement.tagName === 'INPUT') {
            // 对于表单元素
            targetElement.value = text;
            triggerEditorEvents(targetElement);
        } else {
            // 对于其他元素，使用textContent作为后备
            targetElement.textContent = text;
            triggerEditorEvents(targetElement);
        }

        // 额外尝试：如果元素有CodeMirror实例，直接设置值
        if (targetElement.codeMirror) {
            targetElement.codeMirror.setValue(text);
        }

        // 尝试通过父元素查找CodeMirror实例
        let parent = targetElement.parentElement;
        while (parent) {
            if (parent.CodeMirror) {
                parent.CodeMirror.setValue(text);
                break;
            }
            if (parent.querySelector && parent.querySelector('.CodeMirror')) {
                const cmElement = parent.querySelector('.CodeMirror');
                if (cmElement.CodeMirror) {
                    cmElement.CodeMirror.setValue(text);
                }
                break;
            }
            parent = parent.parentElement;
        }
    }

    // 获取编辑器当前内容
    function getEditorContent(targetElement) {
        if (targetElement.isContentEditable) {
            return targetElement.textContent;
        } else if (targetElement.tagName === 'TEXTAREA' || targetElement.tagName === 'INPUT') {
            return targetElement.value;
        } else {
            return targetElement.textContent;
        }
    }

    // 插入单个字符并触发事件
    function insertCharAndTriggerEvents(targetElement, char) {
        if (targetElement.isContentEditable) {
            // 对于contenteditable元素
            document.execCommand('insertText', false, char);
        } else if (targetElement.tagName === 'TEXTAREA' || targetElement.tagName === 'INPUT') {
            // 对于表单元素
            targetElement.value += char;
        } else {
            // 对于其他元素
            targetElement.textContent += char;
        }

        // 触发事件
        triggerEditorEvents(targetElement);
    }

    // 模拟人类打字
    async function simulateHumanTyping(text, targetElement, mode) {
        isTyping = true;
        cancelTyping = false;
        button.disabled = true;
        clearButton.disabled = true;
        modeSelect.disabled = true;
        speedSelect.disabled = true;
        button.textContent = '粘贴中...';
        progressContainer.style.display = 'flex';
        statusText.textContent = '准备开始输入...';

        // 确保目标元素可编辑
        targetElement.style.setProperty('white-space', 'pre-wrap', 'important');
        targetElement.style.setProperty('font-family', 'monospace', 'important');
        targetElement.style.setProperty('line-height', '1.5', 'important');

        // 根据模式决定是否清空目标元素
        if (mode === 'replace') {
            setEditorContent(targetElement, '');
        }

        const totalChars = text.length;
        let typedChars = 0;

        // 使用for循环而不是forEach，以便在取消时中断
        for (let i = 0; i < totalChars; i++) {
            if (cancelTyping) {
                break;
            }

            const char = text[i];

            // 更新进度
            typedChars++;
            const progress = (typedChars / totalChars) * 100;
            statusText.textContent = `输入中... ${Math.round(progress)}%`;

            // 使用可靠的方法插入字符并触发事件
            insertCharAndTriggerEvents(targetElement, char);

            // 随机延迟，模拟人类打字速度
            await new Promise(resolve => {
                setTimeout(resolve, getRandomDelay());
            });

            // 每输入20个字符，增加一个稍长的停顿，模拟人类思考
            if (i % 20 === 19 && i < totalChars - 1) {
                await new Promise(resolve => {
                    setTimeout(resolve, getThinkingDelay());
                });
            }
        }

        // 完成或取消后的清理工作
        isTyping = false;
        button.disabled = false;
        clearButton.disabled = false;
        modeSelect.disabled = false;
        speedSelect.disabled = false;
        button.textContent = '开始粘贴';
        progressContainer.style.display = 'none';

        if (cancelTyping) {
            statusText.textContent = '输入已取消';
            setTimeout(() => {
                statusText.textContent = '';
            }, 2000);
        } else {
            statusText.textContent = '输入完成！';
            // 最后再触发一次事件确保所有内容都被处理
            triggerEditorEvents(targetElement);
            setTimeout(() => {
                statusText.textContent = '';
            }, 2000);
        }
    }

    // 取消输入函数
    function cancelTypingProcess() {
        if (isTyping) {
            cancelTyping = true;
            button.textContent = '取消中...';
            statusText.textContent = '正在取消...';
        }
    }

    // 清空输入框
    clearButton.addEventListener('click', () => {
        input.value = '';
        input.focus();
    });

    // 取消按钮点击事件
    cancelButton.addEventListener('click', () => {
        cancelTypingProcess();
    });

    // 粘贴功能
    button.addEventListener('click', () => {
        const text = input.value;
        if (!text) {
            alert('输入框为空，请输入内容');
            return;
        }

        // 如果正在输入，则取消输入
        if (isTyping) {
            cancelTypingProcess();
            return;
        }

        const contentDiv = document.querySelector('div.cm-content, div[contenteditable="true"]')
            || document.querySelector('div[contenteditable]')
            || document.querySelector('div.CodeMirror-code');

        if (!contentDiv) {
            alert('未找到内容区域，请确保在题目页面。');
            return;
        }

        // 获取当前选择的模式
        const mode = modeSelect.value;

        // 清空输入框
        input.value = '';

        // 开始模拟人类打字
        simulateHumanTyping(text, contentDiv, mode);
    });

    // 确保脚本在页面加载后执行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            document.body.appendChild(container);
        });
    }
})();