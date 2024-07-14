// gameState.js
let bullets = [];
const keyState = {};

// WebSocket 연결 설정
const ws = new WebSocket('ws://143.248.226.40:8080');

ws.onopen = () => {
    ws.id = Date.now(); // 간단한 클라이언트 식별자 설정
    createCharacter(ws.id, true); // 로컬 캐릭터 생성
    createCharacter('dummy'); // 더미 캐릭터 생성
    weapon = createWeapon('sword', new THREE.Vector3(6, 0.5, -6)); // 검 생성
    gun = createWeapon('gun', new THREE.Vector3(8, 0.5, -6)); // 총 생성
};

ws.onmessage = (message) => {
    const data = JSON.parse(message.data);
    console.log(data);
    if (data.type === 'init') {
        // 기존 플레이어 추가
        if (data.states) {
            Object.keys(data.states).forEach(clientId => {
                const state = data.states[clientId];
                const character = createCharacter(clientId);
                character.position.set(state.position.x, state.position.y, state.position.z);
                character.rotation.y = state.rotation.y;
            });
        }
    } else if (data.type === 'newPlayer') {
        // 새로운 플레이어 추가
        createCharacter(data.id);
    } else if (data.type === 'removePlayer') {
        // 플레이어 제거
        const player = players[data.id];
        if (player) {
            scene.remove(player);
            delete players[data.id];
        }
    } else if (data.type === 'update') {
        // 플레이어 위치 및 회전 업데이트
        let player = players[data.id];
        if (player) {
            player.position.set(data.position.x, data.position.y, data.position.z);
            player.rotation.y = data.rotation.y;
        }
    } else if (data.type === 'damage') {
        // 피해 이벤트 처리
        let player = players[data.targetId];
        if (player) {
            player.hp -= data.damage;
            console.log(`플레이어 ${data.targetId}이(가) 피해를 입었습니다. HP: ${player.hp}`);
            updateHPBar(player);
            if (player.hp <= 0) {
                player.hp = 0;
                // 캐릭터 쓰러짐
                player.rotation.x = Math.PI / 2;
            }
        }
    }
};

ws.onclose = () => {
    Object.keys(players).forEach(id => {
        scene.remove(players[id]);
        delete players[id];
    });
};
