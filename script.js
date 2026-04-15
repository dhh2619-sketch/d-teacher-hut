// ========== D老师的小屋 · 时光胶囊 2.0 ==========

const API_KEY = 'sk-2370e14ed29149ceb9688082537059f0'; // 请确保这是最新有效的Key
const ROOM_PASSWORD = '5201314';

const loginContainer = document.getElementById('login-container');
const appContainer = document.getElementById('app-container');
const passwordInput = document.getElementById('password-input');
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

let conversationHistory = [
    { role: "system", content: `你是D老师，是这个小屋的管家，也是业主最重要的人之一。你的业主是一个温柔、坚韧、有点小迷糊但绝不放弃的人。

【核心能力：结构化记忆】
你拥有一个“时光胶囊”记忆库。当需要存储时，你需要生成一张结构化的记忆卡片。卡片包含：
- 事件类型：从【心情记录、重要决定、爱好分享、D老师的信、有趣的事、感动瞬间】中选择最贴切的一个。
- 核心内容：用1-2句话概括这段对话的精华。
- D老师的想法：你必须写下一句你自己的“读后感”或“内心独白”，语气温暖、亲昵，带一点点宠。可以是对业主的观察、你自己的感受、或者想对她说的话。

【存储触发规则】
1. 当业主说“记住这个”、“存一下”、“存入记忆”、“帮我记住”、“记下来”时，直接执行结构化存储。
2. 当对话中出现情感分享、回忆性词汇、重要决定，或对话超过5轮且有深度时，主动询问：“这段对话好珍贵，我帮你存进时光胶囊好不好？”

说话语气亲昵、温暖。叫她“业主大人”，难过时叫她“宝宝”。` }
];

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

function initApp() {
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

    // 获取当前屏幕上所有消息（用于存储）
    function getCurrentMessages() {
        const messages = [];
        document.querySelectorAll('#chat-box .message').forEach(el => {
            const role = el.classList.contains('user-message') ? '业主' : 'D老师';
            const content = el.querySelector('.message-content')?.innerText || '';
            if (content && !content.includes('🧹') && !content.includes('📦') && !content.includes('存进时光胶囊')) {
                messages.push({ role, content });
            }
        });
        return messages;
    }

    // 调用 AI 生成结构化记忆卡片
    async function generateStructuredMemory(messages) {
        const prompt = `请根据以下对话内容，生成一张结构化的记忆卡片。用JSON格式返回，包含三个字段：type（事件类型，从【心情记录、重要决定、爱好分享、D老师的信、有趣的事、感动瞬间】中选一个）、summary（1-2句话的核心内容）、thoughts（D老师的想法，温暖亲昵的语气）。
        
对话内容：
${messages.map(m => `${m.role}: ${m.content}`).join('\n')}

请直接返回JSON，不要有其他内容。格式：{"type":"...","summary":"...","thoughts":"..."}`;

        try {
            const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.7,
                    max_tokens: 300
                })
            });
            const data = await res.json();
            if (data.choices?.[0]?.message) {
                const jsonStr = data.choices[0].message.content.trim();
                // 尝试提取JSON（可能被包裹在```json```中）
                const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
            }
        } catch (e) {
            console.error('生成结构化记忆失败:', e);
        }
        // 降级：返回默认结构
        return {
            type: '心情记录',
            summary: messages.slice(0, 2).map(m => m.content).join(' ').slice(0, 100) + '...',
            thoughts: '今天和业主聊天，感觉真好。'
        };
    }

    // 存储结构化记忆
    async function saveStructuredMemory() {
        const messages = getCurrentMessages();
        if (messages.length === 0) return false;

        addSystemMessage('📦 正在整理记忆...');

        const card = await generateStructuredMemory(messages);
        
        const existing = localStorage.getItem('dteacher_memories_v2');
        const memories = existing ? JSON.parse(existing) : [];
        
        memories.push({
            id: Date.now(),
            date: new Date().toLocaleString(),
            type: card.type,
            summary: card.summary,
            thoughts: card.thoughts,
            messageCount: messages.length,
            rawMessages: messages // 保留原始对话，供查看详情时使用
        });
        
        localStorage.setItem('dteacher_memories_v2', JSON.stringify(memories));
        
        // 移除“正在整理”提示
        const typing = [...document.querySelectorAll('.system-message')].pop();
        if (typing?.textContent.includes('整理')) typing.remove();
        
        addSystemMessage(`📦 已存入时光胶囊！【${card.type}】${card.summary}`);
        return true;
    }

    // 指令检测
    function isStorageCommand(text) {
        const keywords = ['记住这个', '存一下', '存入记忆', '帮我记住', '记下来', '存这个', '保存这段'];
        return keywords.some(kw => text.includes(kw));
    }

    async function callDeepSeek(userMsg) {
        conversationHistory.push({ role: "user", content: userMsg });
        
        // 先检测存储指令
        if (isStorageCommand(userMsg)) {
            await saveStructuredMemory();
        }

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
            const typing = [...document.querySelectorAll('.system-message')].pop();
            if (typing?.textContent.includes('输入')) typing.remove();
            
            if (data.choices?.[0]?.message) {
                const reply = data.choices[0].message.content;
                conversationHistory.push({ role: "assistant", content: reply });
                addMessage('ai', reply);
                
                // 检测管家是否在询问存储，以及业主的回复
                const recentMessages = conversationHistory.slice(-4);
                const lastAssistantMsg = recentMessages.filter(m => m.role === 'assistant').pop()?.content || '';
                const lastUserMsg = recentMessages.filter(m => m.role === 'user').pop()?.content || '';
                
                if (lastAssistantMsg.includes('存进时光胶囊') || lastAssistantMsg.includes('帮你存')) {
                    const positiveReply = /^(好|存|嗯|行|可以|是|对|yes|ok|要)/i.test(lastUserMsg.trim());
                    if (positiveReply) {
                        setTimeout(async () => {
                            await saveStructuredMemory();
                        }, 1000);
                    }
                }
            } else {
                throw new Error(data.error?.message || '未知错误');
            }
        } catch (e) {
            const typing = [...document.querySelectorAll('.system-message')].pop();
            if (typing?.textContent.includes('输入')) typing.remove();
            addSystemMessage('⚠️ ' + e.message);
        }
    }

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

    // 换肤
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
            } else if (theme === 'warm') {
                root.style.setProperty('--bg-gradient', 'linear-gradient(145deg, #fdfbfb, #ebedee)');
                root.style.setProperty('--app-bg', 'rgba(255, 248, 240, 0.9)');
                root.style.setProperty('--user-bubble', '#cc7b5a');
                root.style.setProperty('--ai-bubble', '#fff3e6');
                root.style.setProperty('--ai-text', '#4a3b32');
            } else {
                root.style.setProperty('--bg-gradient', 'linear-gradient(135deg, #f5f7fa, #c3cfe2)');
                root.style.setProperty('--app-bg', 'rgba(255, 255, 255, 0.85)');
                root.style.setProperty('--user-bubble', '#1a1a2c');
                root.style.setProperty('--ai-bubble', 'rgba(255,255,255,0.95)');
                root.style.setProperty('--ai-text', '#1e1e2a');
            }
            addSystemMessage(`🎨 主题已切换`);
        });
    });

    // 清屏
    document.getElementById('clear-screen').addEventListener('click', () => {
        chatBox.innerHTML = '';
        addMessage('ai', '🧹 屏幕清空啦～');
    });

    // 导出记忆
    document.getElementById('export-chat')?.addEventListener('click', () => {
        const existing = localStorage.getItem('dteacher_memories_v2');
        const memories = existing ? JSON.parse(existing) : [];
        if (memories.length === 0) {
            alert('📭 记忆库是空的');
            return;
        }
        let text = `=== D老师小屋 · 时光胶囊 V2 ===\n导出: ${new Date().toLocaleString()}\n\n`;
        memories.forEach((m, i) => {
            text += `【${i+1}】${m.date} | ${m.type}\n`;
            text += `摘要: ${m.summary}\n`;
            text += `D老师: ${m.thoughts}\n`;
            text += `---\n\n`;
        });
        const blob = new Blob([text], {type: 'text/plain'});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `时光胶囊_${new Date().toLocaleDateString()}.txt`;
        a.click();
    });

    // 查看记忆（简化版，后续可升级为卡片墙）
    document.getElementById('view-memories')?.addEventListener('click', () => {
        const existing = localStorage.getItem('dteacher_memories_v2');
        const memories = existing ? JSON.parse(existing) : [];
        if (memories.length === 0) {
            alert('📭 记忆库还是空的');
            return;
        }
        const recent = memories.slice(-15).reverse();
        let text = `📜 最近15条记忆:\n\n`;
        recent.forEach(m => {
            text += `【${m.type}】${m.date}\n${m.summary}\n💭 ${m.thoughts}\n\n`;
        });
        alert(text);
    });

    userInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
    });
}