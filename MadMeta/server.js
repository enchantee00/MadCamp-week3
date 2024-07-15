const express = require('express');
const path = require('path');
const WebSocket = require('ws');

// Express 앱 설정
const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));


app.listen(port, '143.248.226.64', () => {

  console.log(`Web server is running on http://0.0.0.0:${port}`);
});

// WebSocket 서버 설정
const wss = new WebSocket.Server({ port: 8080, host: '0.0.0.0' });

let clients = {};
let players = { // dummy 플레이어 추가
    dummy: {
        id: 'dummy',
        hp: 100,
        position: { x: 4, y: 0.6, z: -8 },
        rotation: { y: 0 },
        weapon: null
    }
};
let items = { // dummy 아이템 추가
    itemId1: { type: 'sword', position: { x: 6, y: 0.5, z: -6 } },
    itemId2: { type: 'gun', position: { x: 8, y: 0.5, z: -6 } }
};

// 모든 클라이언트에게 메시지를 브로드캐스트하는 함수
function broadcast(message, excludeId) {
  Object.keys(clients).forEach(clientId => {
    if (clients[clientId].readyState === WebSocket.OPEN && clientId != excludeId) {
      clients[clientId].send(message);
    }
  });
}

wss.on('connection', (ws) => {
  const id = Date.now(); // TODO: login 로직
  ws.id = id;
  clients[id] = ws;

  // 새로운 클라이언트에게 기존 클라이언트 정보와 아이템 정보 전달
  ws.send(JSON.stringify({ type: 'init', states: players, items }));

  // 새로운 플레이어 정보를 players 객체에 추가
  players[id] = {
    id: id,
    hp: 100,
    position: { x: 0, y: 0, z: 0 },
    rotation: { y: 0 },
    weapon: null // 초기 무기 정보
  };

  // 새로운 클라이언트에게 확인 메시지 전송
  ws.send(JSON.stringify({ type: 'connected', id }));

  // 기존 클라이언트에게 새로운 클라이언트 정보 전달 (현재 클라이언트를 제외)
  broadcast(JSON.stringify({ type: 'newPlayer', id }), id);

  ws.on('message', (message) => {
    const data = JSON.parse(message);

    // 클라이언트 상태 업데이트
    if (data.position && data.rotation) {
      players[ws.id] = {
        ...players[ws.id],
        position: data.position,
        rotation: data.rotation
      };

      // 모든 클라이언트에게 브로드캐스트
      broadcast(JSON.stringify({
        type: 'update',
        id: ws.id,
        position: data.position,
        rotation: data.rotation
      }));
    }

    // 공격 이벤트 처리
    if (data.type === 'attack') {
      broadcast(JSON.stringify({
        type: 'attack',
        id: ws.id
      }));
    }

    // 총 발사 이벤트 처리
    if (data.type === 'shoot') {
      broadcast(JSON.stringify({
        type: 'shoot',
        id: ws.id
      }));
    }

    // 데미지 이벤트 처리
    if (data.type === 'damage') {
      const targetClient = clients[data.targetId];
      if (targetClient && players[data.targetId]) {
        // HP 감소
        players[data.targetId].hp = (players[data.targetId].hp || 100) - data.damage;

        // 모든 클라이언트에게 브로드캐스트
        broadcast(JSON.stringify({
          type: 'damage',
          targetId: data.targetId,
          damage: data.damage
        }));
      }
    }

    // 아이템 줍기 이벤트 처리
    if (data.type === 'pickup') {
      // 아이템이 존재하는지 확인
      if (items[data.itemId]) {
        // 아이템을 items 객체에서 제거
        delete items[data.itemId];

        // 아이템을 플레이어에게 할당
        players[data.playerId].weapon = data.itemId;

        // 모든 클라이언트에게 아이템 제거와 플레이어의 아이템 상태 업데이트 브로드캐스트
        broadcast(JSON.stringify({
          type: 'itemRemoved',
          itemId: data.itemId
        }));

        broadcast(JSON.stringify({
          type: 'playerWeaponUpdate',
          playerId: data.playerId,
          weapon: data.itemId
        }));
      }
    }
  });

  ws.on('close', () => {
    delete clients[id];
    delete players[id]; // players 객체에서 플레이어 정보 삭제
    broadcast(JSON.stringify({ type: 'removePlayer', id }));
  });
});

console.log('WebSocket server is running on ws://localhost:8080');
