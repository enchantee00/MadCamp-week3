const express = require('express');
const path = require('path');
const WebSocket = require('ws');

// Express 앱 설정
const app = express();
const port = 3000;


let gameOn = false;

// 


app.use(express.static(path.join(__dirname, '../public')));


app.listen(port, '143.248.226.210', () => {
  console.log(`Web server is running on http://0.0.0.0:${port}`);
});

// WebSocket 서버 설정
const wss = new WebSocket.Server({ port: 8080, host: '0.0.0.0' });

let clients = {};
let players = { // dummy 플레이어 추가
    dummy: {
        id: '1',
        name: 'dummy1',
        hp: 100,
        position: { x: 4, y: 0.6, z: -8 },
        rotation: { y: 0 },
        weapon: null,
        state: "alive"
    },
    dummy1: {
      id: '2',
      name: 'dummy2',
      hp: 100,
      position: { x: 5, y: 0.6, z: -8 },
      rotation: { y: 0 },
      weapon: null,
      state: "alive"
  },
  dummy2: {
    id: '3',
    name: 'dummy3',
    hp: 100,
    position: { x: 6, y: 0.6, z: -8 },
    rotation: { y: 0 },
    weapon: null,
    state: "alive"
}
};
let whiteboards = {};

let items = { // dummy 아이템 추가
    // itemId1: { type: 'gun', position: { x: 6, y: 0.5, z: -6 } },
    // itemId2: { type: 'gun', position: { x: 8, y: 0.5, z: -6 } },
    // itemId3: { type: 'gun', position: { x: 10, y: 0.5, z: -6 } },
    // itemId4: { type: 'gun', position: { x: 12, y: 0.5, z: -6 } },
    // itemId5: { type: 'gun', position: { x: 16, y: 0.5, z: -6 } },
    // itemId6: { type: 'gun', position: { x: 18, y: 0.5, z: -6 } },
    // itemId7: { type: 'gun', position: { x: 20, y: 0.5, z: -6 } },
    // itemId8: { type: 'gun', position: { x: 22, y: 0.5, z: -6 } }
};
let usingItems = {};
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
  ws.send(JSON.stringify({ type: 'init', states: players, whiteboard: whiteboards,items:items}));


  ws.on('message', (message) => {
    const data = JSON.parse(message);

    if(data.type === 'characterName') {
      // 새로운 클라이언트에게 확인 메시지 전송
      const name = data.text;
      ws.send(JSON.stringify({ type: 'connected', id, name }));

      // 새로운 플레이어 정보를 players 객체에 추가
      players[id] = {
        id: id,
        name: name,
        hp: 100,
        position: { x: 0, y: 0, z: 0 },
        rotation: { y: 0 },
        weapon: null // 초기 무기 정보
      };

      // 기존 클라이언트에게 새로운 클라이언트 정보 전달 (현재 클라이언트를 제외)
      broadcast(JSON.stringify({ type: 'newPlayer', id, name }), id);
    }

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
      console.log("server: attack");
      broadcast(JSON.stringify({
        type: 'attack',
        id: ws.id
      }));
    }

    // 총 발사 이벤트 처리
    if (data.type === 'shoot') {
      console.log("server: shoot");
      broadcast(JSON.stringify({
        type: 'shoot',
        id: ws.id
      }));
    }

    // 데미지 이벤트 처리
    if (data.type === 'damage') {
      console.log("server: damage");
      const targetClient = clients[data.targetId];
      if (targetClient && players[data.targetId]) {
        // HP 감소
        players[data.targetId].hp = (players[data.targetId].hp || 100) - data.damage;

        if(players[data.targetId].hp == 0){
          players[data.targetId].state = "dead";
          console.log("player death", players[data.targetId]);
          broadcast(JSON.stringify({
            type:"death",
            playerId : data.targetId
          }))
        }
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
        // 아이템을 items 객체에서 제거 후 usingItems 로 이동
        usingItems[data.itemId] = items[data.itemId];
        delete items[data.itemId];
        // 아이템을 플레이어에게 할당
        
        players[data.playerId].weapon = usingItems[data.itemId].type;
        console.log("pickup",usingItems[data.itemId].type);
        // 모든 클라이언트에게 아이템 제거와 플레이어의 아이템 상태 업데이트 브로드캐스트
        broadcast(JSON.stringify({
          type: 'itemRemoved',
          itemId: data.itemId
        }));

        broadcast(JSON.stringify({
          type: 'playerWeaponUpdate',
          playerId: data.playerId,
          weapon: usingItems[data.itemId].type
        }));
      }
    }
    // 게임 스타트 이벤트 처리
    // 일단 3 2 1  start 카운트 처리하기
    // 아이템 뿌리고 시작
    if (data.type === "gameStart") {

      if(gameOn) return;
      gameOn = true;

      sendGameStartSequence().then(() => {
          items = generateRandomItems(20);
          console.log(items.length);
          broadcast(JSON.stringify({
              type: "itemDistribution",
              items: items
          }));

          broadcastRemainingTime(60);

      });
    }

    if (data.type === 'whiteboardUpdate') {
      whiteboards[data.whiteboard.whiteboardId] = data.text;
      broadcast(JSON.stringify({
        type: 'whiteboardUpdate',
        whiteboardId: data.whiteboard.whiteboardId,
        text: data.text
      }));
    }
    // 채팅 메시지 브로드캐스트
    if (data.type === 'chat') {
      broadcast(JSON.stringify({
          type: 'chat',
          id: data.id,
          name: data.name,
          message: data.message
      }));
    }

  });

  ws.on('close', () => {
    delete clients[id];
    delete players[id]; // players 객체에서 플레이어 정보 삭제
    broadcast(JSON.stringify({ type: 'removePlayer', id }));
  });
});

//gameSequence 보내기
function sendGameStartSequence() {
  return new Promise((resolve) => {
      let count = 3;

      const countdown = setInterval(() => {
          if (count > 0) {
              broadcast(JSON.stringify({
                  type: 'readyForGame',
                  state: count.toString()
              }));
              count--;
          } else {
              clearInterval(countdown);
              broadcast(JSON.stringify({
                  type: 'readyForGame',
                  state: 'Game Start!'
              }));
              resolve(); // Promise를 해결하여 후속 작업을 실행 가능하게 합니다.
          }
      }, 1000);
  });
}


//game Item 뿌리기
function getRandomPosition(min, max) {
  return Math.random() * (max - min) + min;
}

function getRandomItemType() {
  const types = ['gun', 'sword'];
  return types[Math.floor(Math.random() * types.length)];
}

function generateRandomItems(n) {
  let items = {};
  for (let i = 0; i < n; i++) {
      const itemId = `itemId${i + 1}`;
      const position = {
          x: getRandomPosition(-60, 60),
          y: 0.5,
          z: getRandomPosition(-60, 60)
      };
      const type = getRandomItemType();
      items[itemId] = { type: type, position: position };
  }
  return items;
}
function resetPlayers() {
  for (let id in players) {
    if (players.hasOwnProperty(id)) {
      players[id].weapon = null;
      players[id].hp = 100;
    }
  }
}
//game 남은 시간 세기
function broadcastRemainingTime(n) {
  let remainingTime = n;
  
  // n초 동안 remainingTime을 broadcast
  const intervalId = setInterval(() => {
      if (remainingTime > 0) {
          broadcast(JSON.stringify({
              type: "remainingTime",
              time: remainingTime
          }));
          remainingTime--;
      }
  }, 1000); // 1000ms = 1초

  // n초 후에 다른 메시지를 broadcast하고 interval을 종료
  setTimeout(() => {
      clearInterval(intervalId);
      resetPlayers();
      broadcast(JSON.stringify({
          type: "gameOver",
          players: players
      }));
  }, n * 1000); // n초 후에 실행
  gameOn = false;
}

console.log('WebSocket server is running on ws://localhost:8080');
