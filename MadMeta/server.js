const express = require('express');
const path = require('path');
const WebSocket = require('ws');

// Express 앱 설정
const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.listen(port, '172.20.30.71', () => {
  console.log(`Web server is running on http://0.0.0.0:${port}`);
});

// WebSocket 서버 설정
const wss = new WebSocket.Server({ port: 8080, host: '0.0.0.0' });

let clients = {};
let states = {};

wss.on('connection', (ws) => {
  const id = Date.now();
  ws.id = id;
  clients[id] = ws;

  // 새로운 클라이언트에게 기존 클라이언트 정보 전달
  ws.send(JSON.stringify({ type: 'init', states }));

  // 기존 클라이언트에게 새로운 클라이언트 정보 전달
  Object.keys(clients).forEach(clientId => {
    if (clientId != id) {
      clients[clientId].send(JSON.stringify({ type: 'newPlayer', id }));
    }
  });

  ws.on('message', (message) => {
    const data = JSON.parse(message);

    // 클라이언트 상태 업데이트
    if (data.position && data.rotation) {
      states[ws.id] = {
        position: data.position,
        rotation: data.rotation,
        hp: states[ws.id]?.hp || 100 // 초기 hp 설정
      };

      // 모든 클라이언트에게 브로드캐스트
      Object.keys(clients).forEach(clientId => {
        if (clients[clientId].readyState === WebSocket.OPEN) {
          clients[clientId].send(JSON.stringify({
            type: 'update',
            id: ws.id,
            position: data.position,
            rotation: data.rotation
          }));
        }
      });
    }

    // 공격 이벤트 처리
    if (data.type === 'attack') {
      Object.keys(clients).forEach(clientId => {
        if (clients[clientId].readyState === WebSocket.OPEN) {
          clients[clientId].send(JSON.stringify({
            type: 'attack',
            id: ws.id
          }));
        }
      });
    }

    // 총 발사 이벤트 처리
    if (data.type === 'shoot') {
      Object.keys(clients).forEach(clientId => {
        if (clients[clientId].readyState === WebSocket.OPEN) {
          clients[clientId].send(JSON.stringify({
            type: 'shoot',
            id: ws.id
          }));
        }
      });
    }

    // 데미지 이벤트 처리
    if (data.type === 'damage') {
      const targetClient = clients[data.targetId];
      if (targetClient && states[data.targetId]) {
        // HP 감소
        states[data.targetId].hp = (states[data.targetId].hp || 100) - data.damage;

        // 모든 클라이언트에게 브로드캐스트
        Object.keys(clients).forEach(clientId => {
          if (clients[clientId].readyState === WebSocket.OPEN) {
            clients[clientId].send(JSON.stringify({
              type: 'damage',
              targetId: data.targetId,
              damage: data.damage
            }));
          }
        });
      }
    }
  });

  ws.on('close', () => {
    delete clients[id];
    delete states[id];
    Object.keys(clients).forEach(clientId => {
      if (clients[clientId].readyState === WebSocket.OPEN) {
        clients[clientId].send(JSON.stringify({ type: 'removePlayer', id }));
      }
    });
  });
});

console.log('WebSocket server is running on ws://localhost:8080');
