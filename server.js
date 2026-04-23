const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// 流式聊天接口
app.post('/api/chat', async (req, res) => {
    // 核心修改：同时接收 message 和 history
    const { message, history } = req.body;

    // 设置响应头
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
        // 核心修改：构建发送给DeepSeek的消息列表
        let messagesToSend = [];

        if (history && history.length > 0) {
            // 如果有历史记录，直接使用（排除第一条system消息可能重复的问题）
            messagesToSend = history;
        } else {
            // 兼容旧版本调用（如果没有传history）
            messagesToSend = [
                { role: 'user', content: message }
            ];
        }

        const response = await axios({
            method: 'post',
            url: DEEPSEEK_API_URL,
            data: {
                model: 'deepseek-chat',
                messages: messagesToSend,  // 使用完整的对话历史
                stream: true
            },
            headers: {
                'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
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
        console.error(error.response?.data || error.message);
        res.write('[错误] AI接口调用失败');
        res.end();
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log('流式输出模式已开启');
});