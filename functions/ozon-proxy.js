const axios = require('axios');

exports.handler = async (event, context) => {
    // 允许跨域配置（按需调整）
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, X-Ozon-Client-Id, X-Ozon-Api-Key',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    };
// 记录关键日志（需配合日志服务）

    // 处理预检请求
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers: corsHeaders };
    }

    try {
        // 从请求头获取认证信息（更安全的方式）
        const clientId = event.headers['x-ozon-client-id'];
        const apiKey = event.headers['x-ozon-api-key'];

        console.log('Proxy Request:', {
            path: event.path,
            method: event.httpMethod,
            clientId: clientId,
            timestamp: new Date().toISOString()
        });

        // 认证校验
        if (!clientId || !apiKey) {
            return {
                statusCode: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: "Missing client_id or api_key in headers" })
            };
        }

        // 动态构建目标URL
        const baseUrl = 'https://api-seller.ozon.ru';
        const apiPath = event.path.replace('/.netlify/functions/ozon-proxy', '');
        const targetUrl = `${baseUrl}${apiPath}`;

        // 构造代理请求配置
        const proxyConfig = {
            method: event.httpMethod,
            url: targetUrl,
            headers: {
                'Client-Id': clientId,
                'Api-Key': apiKey,
                'Content-Type': event.headers['content-type'] || 'application/json'
            },
            data: event.body
        };

        // 执行代理请求
        const response = await axios(proxyConfig);

        return {
            statusCode: response.status,
            headers: {
                ...corsHeaders,
                'Content-Type': response.headers['content-type']
            },
            body: JSON.stringify(response.data)
        };

    } catch (error) {
        console.error('Proxy Error:', error);
        return {
            statusCode: error.response?.status || 500,
            headers: corsHeaders,
            body: JSON.stringify({
                error: error.message,
                details: error.response?.data || null
            })
        };
    }
};