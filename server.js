const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

app.post('/api/chat', async (req, res) => {
    console.log('收到请求:', JSON.stringify(req.body, null, 2));

    let { message, history } = req.body;

    if (!message && (!history || history.length === 0)) {
        return res.status(400).send('Missing message or history');
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 构建发送给 DeepSeek 的消息列表
    let messagesToSend = [];

    // 1. 先添加历史记录
    if (history && history.length > 0) {
        messagesToSend = [...history];
    }

    // 2. 确保当前用户消息在最后
    if (message) {
        const lastMsg = messagesToSend[messagesToSend.length - 1];
        if (!lastMsg || lastMsg.role !== 'user' || lastMsg.content !== message) {
            messagesToSend.push({ role: 'user', content: message });
            console.log('已添加当前消息:', message);
        } else {
            console.log('当前消息已在历史中');
        }
    }

    // 3. 确保第一条是 system 消息
    if (messagesToSend.length === 0) {
        return res.status(400).send('No messages to send');
    }

    if (messagesToSend[0].role !== 'system') {
        messagesToSend.unshift({ role: 'system', content: '你是一个乐于助人的AI助手。' });
    }

    console.log('发送给 DeepSeek 的消息数:', messagesToSend.length);
    console.log('最后一条消息:', messagesToSend[messagesToSend.length - 1]);

    try {
        const response = await axios({
            method: 'post',
            url: DEEPSEEK_API_URL,
            data: {
                model: 'deepseek-chat',
                messages: messagesToSend,
                stream: true
            },
            headers: {
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            },
            responseType: 'stream'
        });

        response.data.on('data', (chunk) => {
            const lines = chunk.toString().split('\n');
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const jsonStr = line.slice(6);
                    if (jsonStr === '[DONE]') {
                        res.end();
                        return;
                    }
                    try {
                        const data = JSON.parse(jsonStr);
                        const content = data.choices?.[0]?.delta?.content || '';
                        if (content) {
                            res.write(content);
                        }
                    } catch (e) { }
                }
            }
        });

        response.data.on('end', () => res.end());
        response.data.on('error', (err) => {
            console.error('流错误:', err);
            res.write('[错误] 连接中断');
            res.end();
        });

    } catch (error) {
        console.error('API调用失败:', error.message);
        if (error.response?.status === 401) {
            res.status(500).send('API密钥无效');
        } else {
            res.status(500).send('服务器错误: ' + error.message);
        }
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`✅ 服务器运行在端口 ${PORT}`);
    console.log(`📡 API地址: /api/chat`);
    console.log(`🔑 API Key存在: ${!!process.env.DEEPSEEK_API_KEY}`);
});