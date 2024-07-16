const https = require('https');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const express = require('express');

// HTTPS 서버 옵션 설정
const options = {
    key: fs.readFileSync('../secret/rootca.key'),
    cert: fs.readFileSync('../secret/rootca.crt')
};

// Express 앱 설정
const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));

const server = https.createServer(options, app);

// 음성 채팅용 WebSocket 서버 설정
const voiceWss = new WebSocket.Server({ server });

voiceWss.on('connection', (ws) => {
    console.log('New client connected to voice WebSocket server');

    ws.on('message', (message) => {
        console.log('Received on voice server:', message);
        // 받은 메시지를 모든 클라이언트에게 브로드캐스트
        voiceWss.clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    ws.on('close', () => {
        console.log('Client disconnected from voice WebSocket server');
    });
});

// HTTPS 서버 시작
server.listen(port, () => {
    console.log(`Voice WebSocket server is running on https://localhost:${port}`);
});
