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

// 클라이언트 연결 관리
const clients = {};

// 플레이어 상태 관리
const players = {};

// 아이템 상태 관리
const items = {};

// 총알 상태 관리
const bullets = [];

// 아이템 생성 위치와 타입
const itemSpawnLocations = [
    { type: 'sword', position: { x: 6, y: 0.5, z: -6 } },
    { type: 'gun', position: { x: 8, y: 0.5, z: -6 } }
];

// 맵의 충돌 지점 (예시)
const collisionPoints = [
    // 벽, 바닥 등의 충돌 지점 좌표
];

// 브로드캐스트 함수
function broadcast(message) {
    Object.keys(clients).forEach(clientId => {
        const client = clients[clientId];
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}

// 플레이어 상태 업데이트 처리 함수
function handlePlayerUpdate(playerId, data) {
    const player = players[playerId];
    if (player) {
        player.position = data.position;
        player.rotation = data.rotation;

        broadcast({
            type: 'update',
            id: playerId,
            position: data.position,
            rotation: data.rotation
        });
    }
}

// 아이템 획득 처리 함수
function handleItemPickup(playerId, itemId) {
    const player = players[playerId];
    const item = items[itemId];
    if (player && item) {
        item.owner = playerId;
        player.equippedItem = item.type;

        broadcast({
            type: 'itemPickup',
            playerId: playerId,
            itemId: itemId
        });
    }
}

// 공격 처리 함수
function handleAttack(playerId) {
    const attacker = players[playerId];
    if (attacker && attacker.equippedItem === 'sword') {
        Object.keys(players).forEach(targetId => {
            const target = players[targetId];
            if (target && target.isAlive && isInRange(attacker, target)) {
                handleDamage(targetId, 10);
            }
        });

        broadcast({
            type: 'attack',
            id: playerId
        });
    }
}

// 총 발사 처리 함수
function handleShoot(playerId) {
    const shooter = players[playerId];
    if (shooter && shooter.equippedItem === 'gun') {
        const bulletId = Date.now();
        const direction = getBulletDirection(shooter);
        const bullet = {
            id: bulletId,
            position: shooter.position,
            velocity: direction.multiplyScalar(0.2),
            owner: playerId,
            spawnTime: Date.now()
        };
        bullets.push(bullet);

        broadcast({
            type: 'shoot',
            id: playerId,
            bulletId: bulletId,
            position: bullet.position,
            velocity: bullet.velocity
        });
    }
}

// 데미지 처리 함수
function handleDamage(targetId, damage) {
    const target = players[targetId];
    if (target) {
        target.hp -= damage;
        if (target.hp <= 0) {
            target.hp = 0;
            target.isAlive = false;
        }

        broadcast({
            type: 'damage',
            targetId: targetId,
            damage: damage,
            newHp: target.hp
        });
    }
}

// WebSocket 서버의 연결 이벤트 처리
wss.on('connection', (ws) => {
    const playerId = Date.now().toString();
    ws.id = playerId;
    clients[playerId] = ws;

    // 새로운 플레이어에게 기존 상태 전달
    ws.send(JSON.stringify({ 
        type: 'init', 
        players: Object.values(players),
        items: Object.values(items)
    }));

    // 새로운 플레이어 정보 저장 및 브로드캐스트
    players[playerId] = {
        id: playerId,
        position: { x: 0, y: 0, z: 0 },
        rotation: { y: 0 },
        hp: 100,
        equippedItem: null,
        isAttacking: false,
        isAlive: true
    };

    broadcast({
        type: 'newPlayer',
        id: playerId,
        position: { x: 0, y: 0, z: 0 },
        rotation: { y: 0 },
        hp: 100
    });

    // 메시지 수신 이벤트 처리
    ws.on('message', (message) => {
        const data = JSON.parse(message);

        // 상태 업데이트
        if (data.type === 'update') {
            handlePlayerUpdate(playerId, data);
        }

        // 아이템 획득
        if (data.type === 'itemPickup') {
            handleItemPickup(playerId, data.itemId);
        }

        // 공격
        if (data.type === 'attack') {
            handleAttack(playerId);
        }

        // 총 발사
        if (data.type === 'shoot') {
            handleShoot(playerId);
        }

        // 데미지
        if (data.type === 'damage') {
            handleDamage(data.targetId, data.damage);
        }
    });

    // 연결 종료 이벤트 처리
    ws.on('close', () => {
        delete clients[playerId];
        delete players[playerId];
        broadcast({ type: 'removePlayer', id: playerId });
    });
});

console.log('WebSocket server is running on ws://localhost:8080');
