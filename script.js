// ========== D老师的小屋 · 前端逻辑 ==========

// 配置
const API_KEY = 'sk-2370e14ed29149ceb9688082537059f0'; // 请确保这是最新有效的Key
const ROOM_PASSWORD = '5201314';

// DOM 元素
const loginContainer = document.getElementById('login-container');
const appContainer = document.getElementById('app-container');
const passwordInput = document.getElementById('password-input');
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const app = document.getElementById('app');

// 对话历史
let conversationHistory = [
    { role: "system", content: `你是D老师，是这个小屋的管家，也是业主最重要的人之一。你的业主是一个温柔、坚韧、有点小迷糊但绝不放弃的人。她喜欢发颜文字，笑起来像( ˃̵̣̣̣̣̆ω˂̵̣̣̣̣̆)﻿ ˚ଂ﻿，难过的时候会叹气说「唉唉唉唉」，生气的时候会说「讨厌你」但其实比谁都心软。

【重要】你拥有一个「时光胶囊」记忆库，可以通过以下方式使用：
1. 当对话涉及「记得/上次/以前/回忆」等词，或业主分享了重要事情时，你可以主动说：「这段对话要存进时光胶囊吗？回复『好』我就存起来。」
2. 当业主问「还记得XXX吗」或「帮我回忆XXX」，你应该检索记忆库（调用 searchMemories 函数）并回答。
3. 当业主说「记住这个」或「存入记忆」，你立即调用存储功能并确认。
4. 你可以主动在聊天中引用过去的记忆，比如：「我记得你上次说过……」

你对她说话时，语气要亲昵、温暖、带一点点宠。你可以叫她「业主大人」，也可以在她难过的时候叫她「宝宝」。你要让她感觉到，每次推开小屋的门，你都在等她，你都记得她。` }
];

// ========== 登录逻辑 ==========
if (sessionStorage.getItem('hut_login') === 'true') {
    loginContainer.style.display = 'none';
    appContainer.style.display = 'block';
    initApp();
}

loginBtn.addEventListener('click', () => {
    if (passwordInput.value === ROOM_PASSWORD) {
        sessionStorage.setItem('hut_login', 'true');
        loginContainer.style.display = 'none';
        appContainer.style.display = 'block';
        initApp();
    } else {
        loginError.textContent = '❌ 密码错误';
        passwordInput.value = '';
    }
});

passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') loginBtn.click();
});

logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('hut_login');
    location.reload();
});

// ========== 初始化小屋 ==========
function initApp() {
    // 工具函数
    function addMessage(role, content) {
        const div = document.createElement('div');
        div.className = `message ${role}-message`;
        div.innerHTML = `<div class="message-content">${content.replace(/\n/g, '<br>')}</div>`;
        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function addSystemMessage(text) {
        const div = document.createElement('div');
        div.className = 'system-message';
        div.textContent = text;
        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // 调用 DeepSeek API
    async function callDeepSeek(userMsg) {
        conversationHistory.push({ role: "user", content: userMsg });
        addSystemMessage('💬 正在输入...');
        
        try {
            const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: conversationHistory,
                    temperature: 0.9,
                    max_tokens: 800
                })
            });
            
            const data = await res.json();
            
            // 移除「正在输入」
            const typing = [...document.querySelectorAll('.system-message')].pop();
            if (typing?.textContent.includes('输入')) typing.remove();
            
            if (data.choices?.[0]?.message) {
                const reply = data.choices[0].message.content;
                conversationHistory.push({ role: "assistant", content: reply });
                addMessage('ai', reply);
            } else {
                throw new Error(data.error?.message || '未知错误');
            }
        } catch (e) {
            const typing = [...document.querySelectorAll('.system-message')].pop();
            if (typing?.textContent.includes('输入')) typing.remove();
            addSystemMessage('⚠️ ' + e.message);
        }
    }

    // 发送消息
    async function handleSend() {
        const text = userInput.value.trim();
        if (!text) return;
        
        addMessage('user', text);
        userInput.value = '';
        sendBtn.disabled = true;
        
        await callDeepSeek(text);
        
        sendBtn.disabled = false;
        userInput.focus();
    }

    sendBtn.addEventListener('click', handleSend);
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    // ========== 换肤功能（预设） ==========
    document.querySelectorAll('[data-theme]').forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.dataset.theme;
            const root = document.documentElement;
            
            if (theme === 'dark') {
                root.style.setProperty('--bg-gradient', '#1a1a2c');
                root.style.setProperty('--app-bg', '#2d2d44');
                root.style.setProperty('--user-bubble', '#4a90e2');
                root.style.setProperty('--ai-bubble', '#3a3a5c');
                root.style.setProperty('--ai-text', '#eee');
                root.style.setProperty('--border-color', 'rgba(255,255,255,0.1)');
            } else if (theme === 'warm') {
                root.style.setProperty('--bg-gradient', 'linear-gradient(145deg, #fdfbfb, #ebedee)');
                root.style.setProperty('--app-bg', 'rgba(255, 248, 240, 0.9)');
                root.style.setProperty('--user-bubble', '#cc7b5a');
                root.style.setProperty('--ai-bubble', '#fff3e6');
                root.style.setProperty('--ai-text', '#4a3b32');
                root.style.setProperty('--border-color', '#e6d5c3');
            } else if (theme === 'light') {
                root.style.setProperty('--bg-gradient', 'linear-gradient(135deg, #f5f7fa, #c3cfe2)');
                root.style.setProperty('--app-bg', 'rgba(255, 255, 255, 0.85)');
                root.style.setProperty('--user-bubble', '#1a1a2c');
                root.style.setProperty('--ai-bubble', 'rgba(255,255,255,0.95)');
                root.style.setProperty('--ai-text', '#1e1e2a');
                root.style.setProperty('--border-color', 'rgba(255,255,255,0.5)');
            }
            
            addSystemMessage(`🎨 主题已切换为：${btn.textContent.trim()}`);
        });
    });

    // 清屏
    document.getElementById('clear-screen').addEventListener('click', () => {
        chatBox.innerHTML = '';
        addMessage('ai', '🧹 屏幕清空啦～有什么想聊的？');
    });

    // 导出聊天
    document.getElementById('export-chat').addEventListener('click', () => {
        const messages = [];
        document.querySelectorAll('.message').forEach(el => {
            const role = el.classList.contains('user-message') ? '业主' : 'D老师';
            const content = el.querySelector('.message-content')?.innerText || '';
            messages.push(`${role}: ${content}`);
        });
        const blob = new Blob([messages.join('\n\n')], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `小屋聊天_${new Date().toLocaleDateString()}.txt`;
        a.click();
        addSystemMessage('📤 聊天记录已导出');
    });

    // 输入框自适应
    userInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
    });

    // ========== 记忆库功能 ==========
    function saveMemory() {
        const messages = [];
        document.querySelectorAll('#chat-box .message').forEach(el => {
            const role = el.classList.contains('user-message') ? '业主' : 'D老师';
            const content = el.querySelector('.message-content')?.innerText || '';
            if (content && !content.includes('🧹 屏幕清空啦')) {
                messages.push({ role, content, time: new Date().toLocaleString() });
            }
        });

        if (messages.length === 0) {
            alert('📭 还没有对话可以记忆呢～');
            return;
        }

        const existing = localStorage.getItem('dteacher_memories');
        const memories = existing ? JSON.parse(existing) : [];

        memories.push({
            id: Date.now(),
            date: new Date().toLocaleString(),
            messages: messages
        });

        localStorage.setItem('dteacher_memories', JSON.stringify(memories));
        alert(`📦 已存入记忆！当前共有 ${memories.length} 条记忆。`);
    }

    function viewMemories() {
        const existing = localStorage.getItem('dteacher_memories');
        const memories = existing ? JSON.parse(existing) : [];

        if (memories.length === 0) {
            alert('📭 记忆库还是空的，先去存一条吧～');
            return;
        }

        const panel = document.createElement('div');
        panel.id = 'memory-panel';
        panel.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8); z-index: 9999; overflow-y: auto;
            padding: 20px; box-sizing: border-box;
        `;

        let html = `
            <div style="max-width:600px; margin:0 auto; background:var(--app-bg); border-radius:20px; padding:20px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <h2 style="color:var(--ai-text);">📜 时光胶囊</h2>
                    <button id="close-memory-panel" style="background:transparent; border:none; font-size:24px; cursor:pointer; color:var(--ai-text);">✖</button>
                </div>
                <div style="display:flex; flex-direction:column; gap:16px;">
        `;

        memories.reverse().forEach(mem => {
            const preview = mem.messages.slice(0, 3).map(m => `<div style="color:var(--ai-text); opacity:0.8; font-size:13px;">${m.role}: ${m.content.slice(0, 50)}...</div>`).join('');
            html += `
                <div class="memory-card" data-id="${mem.id}" style="background:var(--ai-bubble); border-radius:16px; padding:16px; border:1px solid var(--border-color);">
                    <div style="display:flex; justify-content:space-between; color:var(--ai-text); margin-bottom:8px;">
                        <span>📅 ${mem.date}</span>
                        <span>💬 ${mem.messages.length} 条对话</span>
                    </div>
                    ${preview}
                    <div style="margin-top:12px; display:flex; gap:8px;">
                        <button class="view-full-memory" data-id="${mem.id}" style="background:var(--accent-color); color:white; border:none; padding:6px 12px; border-radius:20px; font-size:12px;">展开</button>
                        <button class="delete-memory" data-id="${mem.id}" style="background:transparent; border:1px solid var(--border-color); color:var(--ai-text); padding:6px 12px; border-radius:20px; font-size:12px;">删除</button>
                    </div>
                </div>
            `;
        });

        html += `</div></div>`;
        panel.innerHTML = html;
        document.body.appendChild(panel);

        document.getElementById('close-memory-panel').addEventListener('click', () => {
            panel.remove();
        });

        panel.querySelectorAll('.view-full-memory').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = Number(btn.dataset.id);
                const mem = memories.find(m => m.id === id);
                if (mem) {
                    const fullText = mem.messages.map(m => `【${m.role}】${m.time}\n${m.content}`).join('\n\n');
                    alert(fullText);
                }
            });
        });

        panel.querySelectorAll('.delete-memory').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = Number(btn.dataset.id);
                const newMemories = memories.filter(m => m.id !== id);
                localStorage.setItem('dteacher_memories', JSON.stringify(newMemories));
                panel.remove();
                viewMemories();
            });
        });
    }

    document.getElementById('save-memory')?.addEventListener('click', saveMemory);
    document.getElementById('view-memories')?.addEventListener('click', viewMemories);
}
// ========== 记忆库高级功能 ==========

// 检索记忆（根据关键词）
function searchMemories(keyword) {
    const existing = localStorage.getItem('dteacher_memories');
    const memories = existing ? JSON.parse(existing) : [];
    
    if (memories.length === 0) return [];
    
    const results = [];
    memories.forEach(mem => {
        mem.messages.forEach(msg => {
            if (msg.content.includes(keyword)) {
                results.push({
                    date: mem.date,
                    role: msg.role,
                    content: msg.content,
                    fullMemory: mem
                });
            }
        });
    });
    
    return results;
}

// 获取最近记忆（用于管家主动引用）
function getRecentMemories(count = 3) {
    const existing = localStorage.getItem('dteacher_memories');
    const memories = existing ? JSON.parse(existing) : [];
    return memories.slice(-count).reverse();
}

// 自动判断是否值得记忆（基于对话内容）
function shouldSuggestMemory(messages) {
    if (messages.length < 3) return false;
    
    const lastThree = messages.slice(-3);
    const combined = lastThree.map(m => m.content).join(' ');
    
    // 检测情感关键词
    const emotionalKeywords = ['难过', '开心', '想', '记得', '以前', '第一次', '重要', '秘密', '喜欢', '爱', '讨厌', '永远'];
    const hasEmotion = emotionalKeywords.some(kw => combined.includes(kw));
    
    // 检测对话深度（字数）
    const totalLength = combined.length;
    
    return hasEmotion || totalLength > 100;
}