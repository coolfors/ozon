const axios = require('axios');

exports.handler = async (event, context) => {
    try {
        // 允许的域名白名单（可选安全措施）
        const allowedOrigins = [
            'https://https://ozonapi1.netlify.app',
            'http://localhost:3000'
        ];

        // 处理 CORS 预检请求
        if (event.httpMethod === 'OPTIONS') {
            return {
                statusCode: 204,
                headers: {
                    'Access-Control-Allow-Origin': event.headers.origin || '*',
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Client-Id, Api-Key'
                }
            };
        }

        // 检查来源域名（可选）
        const origin = event.headers.origin;
        if (allowedOrigins.length > 0 && !allowedOrigins.includes(origin)) {
            return { statusCode: 403, body: 'Forbidden' };
        }

        // 构造目标 API 地址
        const apiBase = 'https://api-seller.ozon.ru';
        const path = event.path.replace('/.netlify/functions/ozon-proxy', '');
        const targetUrl = `${apiBase}${path}`;

        // 转发请求
        const response = await axios({
            method: event.httpMethod,
            url: targetUrl,
            headers: {
                'Client-Id': process.env.OZON_CLIENT_ID,    // 从环境变量读取
                'Api-Key': process.env.OZON_API_KEY,        // 从环境变量读取
                'Content-Type': event.headers['content-type'] || 'application/json'
            },
            data: event.body
        });

        // 返回结果
        return {
            statusCode: response.status,
            headers: {
                'Access-Control-Allow-Origin': origin || '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(response.data)
        };

    } catch (error) {
        // 错误处理
        console.error('Proxy Error:', error);
        return {
            statusCode: error.response?.status || 500,
            body: JSON.stringify({
                error: error.message,
                details: error.response?.data
            })
        };
    }
};
