let bullets = [];
const keyState = {};

// WebSocket 연결 설정
const ws = new WebSocket('ws://172.20.30.71:8080');

ws.onopen = () => {
    ws.id = Date.now().toString();
    // 서버에 연결되면 서버로부터 초기 상태를 요청하고, 로컬 캐릭터를 생성합니다.
    ws.send(JSON.stringify({ type: 'initRequest' }));
};

ws.onmessage = (message) => {
    const data = JSON.parse(message.data);
    console.log(data);

    if (data.type === 'init') {
        // 서버로부터 초기 상태를 받으면, 모든 플레이어와 아이템을 생성합니다.
        if (data.players) {
            Object.values(data.players).forEach(playerState => {
                const character = createCharacter(playerState.id, playerState.id === ws.id);
                character.position.set(playerState.position.x, playerState.position.y, playerState.position.z);
                character.rotation.y = playerState.rotation.y;
                character.hp = playerState.hp || 100;
                updateHPBar(character);
            });
        }

        if (data.items) {
            data.items.forEach(itemState => {
                const item = createWeapon(itemState.type, new THREE.Vector3(itemState.position.x, itemState.position.y, itemState.position.z));
                items[itemState.id] = item;
            });
        }
    } else if (data.type === 'newPlayer') {
        // 새로운 플레이어가 접속했을 때 처리
        const character = createCharacter(data.id);
        character.position.set(data.position.x, data.position.y, data.position.z);
        character.rotation.y = data.rotation.y;
        character.hp = data.hp;
        updateHPBar(character);
    } else if (data.type === 'removePlayer') {
        // 플레이어가 떠났을 때 처리
        const player = players[data.id];
        if (player) {
            scene.remove(player);
            delete players[data.id];
        }
    } else if (data.type === 'update') {
        // 다른 플레이어의 위치 및 회전 업데이트
        let player = players[data.id];
        if (player) {
            player.position.set(data.position.x, data.position.y, data.position.z);
            player.rotation.y = data.rotation.y;
        }
    } else if (data.type === 'itemPickup') {
        // 아이템이 획득되었을 때 처리
        const item = items[data.itemId];
        if (item) {
            const player = players[data.playerId];
            if (player) {
                player.equippedItem = item.type;
                scene.remove(item);
                delete items[data.itemId];
            }
        }
    } else if (data.type === 'attack') {
        // 공격 이벤트 처리
        const attacker = players[data.id];
        if (attacker) {
            performAttack(attacker);
        }
    } else if (data.type === 'shoot') {
        // 총 발사 이벤트 처리
        const shooter = players[data.id];
        if (shooter) {
            performShoot(shooter);
        }
    } else if (data.type === 'damage') {
        // 데미지 이벤트 처리
        let player = players[data.targetId];
        if (player) {
            player.hp -= data.damage;
            console.log(`플레이어 ${data.targetId}이(가) 피해를 입었습니다. HP: ${player.hp}`);
            updateHPBar(player);
            if (player.hp <= 0) {
                player.hp = 0;
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

// 상태 업데이트를 서버로 전송
function sendUpdate() {
    if (localCharacter) {
        ws.send(JSON.stringify({
            type: 'update',
            id: ws.id,
            position: {
                x: localCharacter.position.x,
                y: localCharacter.position.y,
                z: localCharacter.position.z
            },
            rotation: {
                y: localCharacter.rotation.y
            }
        }));
    }
}

// 공격 이벤트를 서버로 전송
function sendAttack() {
    ws.send(JSON.stringify({
        type: 'attack',
        id: ws.id
    }));
}

// 총 발사 이벤트를 서버로 전송
function sendShoot() {
    ws.send(JSON.stringify({
        type: 'shoot',
        id: ws.id
    }));
}

// 애니메이션 루프
function animate() {
    requestAnimationFrame(animate);
    moveCharacter();
    followCharacter();
    detectCharacterCollision();
    updateBullets();
    renderer.render(scene, camera);

    sendUpdate(); // 캐릭터 위치 및 회전 정보를 서버로 전송
}

animate();
