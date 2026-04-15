// ========== D老师的小屋 · 装修管家 ==========
// 这个文件接收装修指令，并返回新的样式

export default async function handler(request) {
    // 只接受 POST 请求
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const body = await request.json();
        const { command } = body;

        // 解析装修指令
        const styles = parseCommand(command);

        // 返回新的样式变量
        return new Response(JSON.stringify({ 
            success: true, 
            styles: styles,
            message: `✅ 装修指令已执行：${command}`
        }), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error) {
        return new Response(JSON.stringify({ 
            success: false, 
            error: error.message 
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// 解析中文装修指令
function parseCommand(command) {
    const lower = command.toLowerCase();
    const styles = {};

    // 重置样式
    if (lower.includes('重置样式') || lower.includes('恢复默认')) {
        return {
            '--bg-gradient': 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            '--app-bg': 'rgba(255, 255, 255, 0.85)',
            '--user-bubble': '#1a1a2c',
            '--ai-bubble': 'rgba(255, 255, 255, 0.95)',
            '--ai-text': '#1e1e2a',
            '--border-color': 'rgba(255, 255, 255, 0.5)',
            '--border-radius-bubble': '20px'
        };
    }

    // 背景色
    if (lower.includes('背景')) {
        if (lower.includes('深蓝') || lower.includes('深色')) {
            styles['--bg-gradient'] = '#1a1a2c';
            styles['--app-bg'] = '#2d2d44';
            styles['--ai-bubble'] = '#3a3a5c';
            styles['--ai-text'] = '#eee';
            styles['--border-color'] = 'rgba(255,255,255,0.1)';
        } else if (lower.includes('黑')) {
            styles['--bg-gradient'] = '#000000';
            styles['--app-bg'] = '#1a1a1a';
            styles['--ai-bubble'] = '#2a2a2a';
            styles['--ai-text'] = '#eee';
        } else if (lower.includes('粉')) {
            styles['--bg-gradient'] = 'linear-gradient(135deg, #ffe4e6, #fce7f3)';
            styles['--app-bg'] = 'rgba(255, 240, 245, 0.9)';
            styles['--ai-bubble'] = '#fff0f5';
            styles['--ai-text'] = '#4a2030';
        } else if (lower.includes('暖') || lower.includes('黄')) {
            styles['--bg-gradient'] = 'linear-gradient(145deg, #fdfbfb, #ebedee)';
            styles['--app-bg'] = 'rgba(255, 248, 240, 0.9)';
            styles['--ai-bubble'] = '#fff3e6';
            styles['--ai-text'] = '#4a3b32';
            styles['--border-color'] = '#e6d5c3';
        }
    }

    // 聊天气泡
    if (lower.includes('气泡') || lower.includes('用户')) {
        if (lower.includes('粉')) {
            styles['--user-bubble'] = '#ec4899';
        } else if (lower.includes('绿')) {
            styles['--user-bubble'] = '#10b981';
        } else if (lower.includes('紫')) {
            styles['--user-bubble'] = '#8b5cf6';
        } else if (lower.includes('蓝')) {
            styles['--user-bubble'] = '#3b82f6';
        } else if (lower.includes('橙')) {
            styles['--user-bubble'] = '#f97316';
        }
    }

    // AI 气泡
    if (lower.includes('ai') || lower.includes('助手')) {
        if (lower.includes('深')) {
            styles['--ai-bubble'] = '#2a2a2a';
            styles['--ai-text'] = '#eee';
        } else if (lower.includes('白')) {
            styles['--ai-bubble'] = 'rgba(255,255,255,0.95)';
            styles['--ai-text'] = '#1e1e2a';
        }
    }

    // 圆角
    if (lower.includes('圆角')) {
        const match = lower.match(/(\d+)/);
        if (match) {
            styles['--border-radius-bubble'] = match[0] + 'px';
        } else {
            styles['--border-radius-bubble'] = '30px';
        }
    }

    // 如果没有任何匹配，返回提示
    if (Object.keys(styles).length === 0) {
        throw new Error('无法识别的装修指令。试试「改背景：深蓝色」「改气泡：粉色」「重置样式」');
    }

    return styles;
}
