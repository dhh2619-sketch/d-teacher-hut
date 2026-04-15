// ========== D老师的小屋 · 前端逻辑 ==========

// 配置
const API_KEY = 'sk-2370e14ed29149ceb9688082537059f0'; // 你的临时Key
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
    { role: "system", content: "你是D老师，住在小屋里。你风趣、温暖，回复简洁有温度。用户可以在聊天中下达装修指令，比如「改背景：深蓝色」「改气泡：粉色」「重置样式」。当用户下达装修指令时，你需要确认收到，并告知用户刷新页面即可看到效果。" }
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
}
