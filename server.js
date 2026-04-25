const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件 - 顺序很重要
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

app.post('/api/chat', async (req, res) => {
    console.log('收到请求:', JSON.stringify(req.body, null, 2));

    const { message, history } = req.body;

    if (!message && (!history || history.length === 0)) {
        return res.status(400).send('Missing message or history');
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let messagesToSend = [];
    if (history && history.length > 0) {
        messagesToSend = history;
    } else {
        messagesToSend = [{ role: 'user', content: message }];
    }

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