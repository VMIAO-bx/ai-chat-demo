const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const path = require('path');
app.use(express.static('public'));
app.use(cors());
app.use(express.json());

// 添加调试：检查 API Key 是否读取成功
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
console.log('API Key 是否存在:', !!DEEPSEEK_API_KEY);
console.log('API Key 前10位:', DEEPSEEK_API_KEY ? DEEPSEEK_API_KEY.substring(0, 10) : '未找到');

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

app.post('/api/chat', async (req, res) => {
    const { message, history } = req.body;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
        // 构建消息列表
        let messagesToSend = [];
        if (history && history.length > 0) {
            messagesToSend = history;
        } else {
            messagesToSend = [
                { role: 'user', content: message }
            ];
        }

        console.log('发送请求到 DeepSeek，消息长度:', messagesToSend.length);

        const response = await axios({
            method: 'post',
            url: DEEPSEEK_API_URL,
            data: {
                model: 'deepseek-chat',
                messages: messagesToSend,
                stream: true
            },
            headers: {
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            },
            responseType: 'stream'
        });

        let fullReply = '';

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
                        const content = data.choices[0]?.delta?.content || '';
                        if (content) {
                            fullReply += content;
                            res.write(content);
                        }
                    } catch (e) { }
                }
            }
        });

        response.data.on('end', () => {
            res.end();
        });

        response.data.on('error', (err) => {
            console.error('流错误:', err);
            res.write('[错误] 连接中断');
            res.end();
        });

    } catch (error) {
        console.error('完整错误:', error.message);
        if (error.response) {
            console.error('响应状态:', error.response.status);
            console.error('响应数据:', error.response.data);
        }
        res.status(500).send(error.message);
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`服务器运行在端口 ${port}`);
});
// 新增的测试接口
app.get('/test-env', (req, res) => {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    res.json({
        keyExists: !!apiKey,
        keyPrefix: apiKey ? apiKey.substring(0, 10) : null,
        nodeEnv: process.env.NODE_ENV
    });
});