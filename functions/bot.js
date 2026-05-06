const axios = require('axios');

const OWNER_ID = '7412418424';
const BOTS = {
    1: '8673017468:AAFn81K_h1wHi81eP7EfqR8DTRwa_HCgedM'
};

exports.handler = async (event) => {
    const path = event.path;

    // ---------- SET WEBHOOK ----------
    if (path.includes('/set-webhook')) {
        const host = event.headers.host;
        let results = [];

        for (const [i, token] of Object.entries(BOTS)) {
            const webhookUrl = `https://${host}/.netlify/functions/bot?bot=${i}`;
            try {
                const res = await axios.get(`https://api.telegram.org/bot${token}/setWebhook?url=${webhookUrl}`);
                results.push(`Bot ${i}: ${res.data.ok ? '✅ Set' : '❌ ' + res.data.description}`);
            } catch (err) {
                results.push(`Bot ${i}: ❌ Request Failed`);
            }
        }
        return { statusCode: 200, body: results.join('\n') };
    }

    // ---------- HANDLE WEBHOOK ----------
    const botNumber = event.queryStringParameters.bot || 1;
    const token = BOTS[botNumber];

    if (!token) return { statusCode: 404, body: "Bot not found" };

    if (event.httpMethod === 'POST') {
        const update = JSON.parse(event.body);
        if (!update.message) return { statusCode: 200, body: "OK" };

        const msg = update.message;
        const chatId = msg.chat.id;
        const messageId = msg.message_id;
        const text = msg.text || '';

        // START Command
        if (text === '/start') {
            await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
                chat_id: chatId,
                text: "👋 Welcome!\n\n✅ Your messages will be forwarded to admin.",
                reply_to_message_id: messageId
            });
            return { statusCode: 200, body: "OK" };
        }

        // FORWARD Message
        await axios.post(`https://api.telegram.org/bot${token}/forwardMessage`, {
            chat_id: OWNER_ID,
            from_chat_id: chatId,
            message_id: messageId
        });

        return { statusCode: 200, body: "OK" };
    }

    return { statusCode: 200, body: "Bot is running!" };
};
