let bullets = [];
const keyState = {};
// const peerConnections = {};
// const audioElements = {};
// const localStream = await navigator.mediaDevices.getUserMedia({ audio: true });

let lastPosition = new THREE.Vector3();
let lastRotationY = 0;

//start button
let startButton;

// WebSocket 연결 설정

const ws = new WebSocket('ws://143.248.226.153:8080');

function init(){
    document.addEventListener('DOMContentLoaded', () => {
        // 새 버튼 요소 가져오기
        const startButton = document.getElementById('startButton');
    
        // 클릭 이벤트 리스너 추가
        startButton.addEventListener('click', () => {
            console.log('Start Button Clicked');
            // 여기에 버튼 클릭 시 실행할 코드를 추가합니다.
            ws.send(JSON.stringify({
                type: 'gameStart',
                id : ws.id
            }));
        });
    });
    

}
init();

ws.onopen = () => {
    console.log('WebSocket 연결이 열렸습니다.');
};

ws.onmessage = (message) => {
    const data = JSON.parse(message.data);
    // console.log(data);
    if (data.type === 'init') {
        // 기존 플레이어 추가 (현재 클라이언트 자신은 제외)
        if (data.states) {
            Object.keys(data.states).forEach(clientId => {
                const state = data.states[clientId];
                console.log("gameState init: clientId",clientId,"state: ",state);
                if (clientId !== ws.id) {
                    const character = createCharacter(clientId);
                    character.position.set(state.position.x, state.position.y, state.position.z);
                    character.rotation.y = state.rotation.y;
                    character.hp = state.hp || 100; // 초기 hp 설정
                    updateHPBar(character);
                    players[clientId] = character; 
                    if(state.weapon){
                        players[clientId].weapon = state.weapon;
                        updatePlayerWeapon(character,state.weapon);
                    } // 여기서 character 객체 추가

                }

            });
        }

        // 아이템 추가
        if (data.items) {
            Object.keys(data.items).forEach(itemId => {
                const item = data.items[itemId];
                createItem(itemId, item.type, item.position);
            });
        }
    } else if (data.type === 'connected') {
        // 서버에서 연결 확인 메시지를 받으면 로컬 캐릭터 생성
        ws.id = data.id;
        createCharacter(ws.id,true); // 로컬 캐릭터 생성
        // console.log("gameState: data->connected");
    } else if (data.type === 'newPlayer') {
        // 새로운 플레이어 추가 (현재 클라이언트 자신은 제외)
        if (data.id !== ws.id) {
            createCharacter(data.id);
        }
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
        console.log("gameState: damage");
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
    } else if (data.type === 'attack') {
        console.log("gameState: attack");
        // 공격 이벤트 처리
        const attacker = players[data.id];
        if (attacker) {
            performAttack(attacker);
        }
    } else if (data.type === 'shoot') {
        console.log("gameState: shoot");
        // 총 발사 이벤트 처리
        const shooter = players[data.id];
        if (shooter) {
            performShoot(shooter);
        }
    } else if (data.type === 'itemRemoved') {
        console.log("gameState: itemRemoved");
        // 아이템 제거 이벤트 처리
        removeItemFromScene(data.itemId);
    } else if (data.type === 'playerWeaponUpdate') {
        console.log("gameState: playerWeaponUpdate");
        // 플레이어 무기 상태 업데이트
        const player = players[data.playerId];
        if (player) {
            player.weapon = data.weapon;
            updatePlayerWeapon(player, data.weapon);
            console.log(`Player ${data.playerId} weapon updated to ${data.weapon}`);
        }
    //game start 이벤트 처리
    } else if (data.type ==="readyForGame"){
        console.log(data.state);

    }
};


ws.onclose = () => {
    Object.keys(players).forEach(id => {
        scene.remove(players[id]);
        delete players[id];
    });
};

function sendUpdate() {
    if (localCharacter) {
        const currentPosition = localCharacter.position;
        const currentRotationY = localCharacter.rotation.y;

        if (!currentPosition.equals(lastPosition) || currentRotationY !== lastRotationY) {
            ws.send(JSON.stringify({
                id: ws.id,
                position: {
                    x: currentPosition.x,
                    y: currentPosition.y,
                    z: currentPosition.z
                },
                rotation: {
                    y: currentRotationY
                }
            }));

            lastPosition.copy(currentPosition);
            lastRotationY = currentRotationY;
        }
    }
}

function sendAttack() {

    ws.send(JSON.stringify({
        type: 'attack',
        id: ws.id
    }));
}

function sendShoot() {

    ws.send(JSON.stringify({
        type: 'shoot',
        id: ws.id
    }));
}


let attackInProgress = false;
function animateAttack() {
    if (attackInProgress) {
        requestAnimationFrame(animateAttack);
    }
}

function performAttack(attacker) {
    console.log("performattack");
    if (!attacker || attackInProgress || !hasSword) {
        console.log("이미 공격중이거나 공격자가 없습니다.");
        return;
    }

    attackInProgress = true;
    //루프 시작
    animateAttack();
    // 공격 애니메이션 및 논리를 추가합니다.
    const rightArm = attacker.getObjectByName("rightArm");
    if (rightArm) {
        const originalRotation = rightArm.rotation.x;
        const attackMotion = { x: 0 };
        const swingUpSpeed = 0.2;
        const swingDownSpeed = 0.3;
        const maxSwing = 2 * Math.PI / 3;
        let hitDetected = false;

        const animateSwingUp = () => {
            return new Promise(resolve => {
                const swingUp = () => {
                    rightArm.rotation.x = originalRotation - attackMotion.x;
                    if (attackMotion.x < maxSwing) {
                        attackMotion.x += swingUpSpeed;
                        requestAnimationFrame(swingUp);
                    } else {
                        resolve();
                    }
                };
                swingUp();
            });
        };

        const animateSwingDown = () => {
            return new Promise(resolve => {
                const swingDown = () => {
                    rightArm.rotation.x = originalRotation - attackMotion.x;
                    if (attackMotion.x > 0) {
                        attackMotion.x -= swingDownSpeed;
                        requestAnimationFrame(swingDown);
                    } else {
                        rightArm.rotation.x = originalRotation;
                        resolve();
                    }
                };
                swingDown();
            });
        };

        const attackRange = new THREE.Sphere(new THREE.Vector3(), 1);
        attackRange.center.copy(attacker.position);

        const checkHit = () => {
            if (hitDetected) return;

            for (const id in players) {
                const player = players[id];
                if (player !== attacker) {
                    player.updateWorldMatrix(true, false);
                    const playerBox = new THREE.Box3().setFromObject(player);
                    if (attackRange.intersectsBox(playerBox)) {
                        console.log(id, '에게 공격 적중!');

                        player.hp -= 10;
                        updateHPBar(player);

                        if (player.hp <= 0) {
                            player.hp = 0;
                            player.rotation.x = Math.PI / 2;
                        }

                        ws.send(JSON.stringify({
                            type: 'damage',
                            targetId: id,
                            damage: 10
                        }));

                        hitDetected = true;
                        break;
                    }
                }
            }
        };

        const animateSwing = async () => {
            await animateSwingUp();
            checkHit();
            setTimeout(async () => {
                await animateSwingDown();
                attackInProgress = false;
            }, 50);
        };

        animateSwing();
    } else {
        attackInProgress = false;
    }
}
let shootingInProgress = false;

// 이 함수는 캐릭터가 총을 발사하는 로직을 실행합니다.
async function performShoot(shooter) {
    console.log("performShoot");
    if (!shooter || shootingInProgress || !hasGun) {
        console.log("hasGun:", hasGun, '무기가 없거나 공격 중입니다!');
        return;
    }

    shootingInProgress = true;
    const rightArm = shooter.getObjectByName("rightArm");
    if (rightArm) {
        const originalRotation = rightArm.rotation.x;
        const shootMotion = { x: 0 };
        const shootUpSpeed = 0.2;
        const shootDownSpeed = 0.1;

        const animateShootUp = () => {
            return new Promise(resolve => {
                const shootUp = () => {
                    rightArm.rotation.x = originalRotation - shootMotion.x;
                    if (shootMotion.x < Math.PI / 2) {
                        shootMotion.x += shootUpSpeed;
                        requestAnimationFrame(shootUp);
                    } else {
                        resolve();
                    }
                };
                shootUp();
            });
        };

        const animateShootDown = () => {
            return new Promise(resolve => {
                const shootDown = () => {
                    rightArm.rotation.x = originalRotation - shootMotion.x;
                    if (shootMotion.x > 0) {
                        shootMotion.x -= shootDownSpeed;
                        requestAnimationFrame(shootDown);
                    } else {
                        rightArm.rotation.x = originalRotation;
                        resolve();
                    }
                };
                shootDown();
            });
        };

        const shootBullet = () => {
            const bullet = createBullet();
            const gunPosition = new THREE.Vector3(0, -2, 0);
            rightArm.localToWorld(gunPosition);
            bullet.position.copy(gunPosition);
            bullet.quaternion.copy(shooter.quaternion);

            const direction = new THREE.Vector3();
            shooter.getWorldDirection(direction);
            bullet.userData.velocity = direction.multiplyScalar(0.2);
            bullet.userData.startPosition = bullet.position.clone();
        };

        await animateShootUp();
        shootBullet();
        await animateShootDown();
    } else {
        console.error("오른팔을 찾을 수 없습니다.");
    }

    shootingInProgress = false;
}

function createBullet() {
    const bulletGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
    scene.add(bullet);
    bullets.push(bullet);
    return bullet;
}

function updateBullets() {
    bullets.forEach(bullet => {
        bullet.position.add(bullet.userData.velocity);
        const distance = bullet.userData.startPosition.distanceTo(bullet.position);

        // 총알이 플레이어와 충돌했는지 검사
        for (const id in players) {
            // if(id == ws.id){continue;}
            const player = players[id];
            const playerBox = new THREE.Box3().setFromObject(player);
            const bulletBox = new THREE.Box3().setFromObject(bullet);

            if (bulletBox.intersectsBox(playerBox)) {
                console.log(`총알이 플레이어 ${id}에 맞았습니다!`);
                ws.send(JSON.stringify({
                    type: 'damage',
                    targetId: id,
                    damage: 10
                }));
                scene.remove(bullet);
                bullets = bullets.filter(b => b !== bullet);
                break;
            }
        }

        // 총알이 일정 거리 이상 이동하면 삭제
        if (distance > 20) {
            scene.remove(bullet);
            bullets = bullets.filter(b => b !== bullet);
        }
    });
}

function createItem(itemId, type, position) {
    let itemGeometry, itemMaterial;
    if (type === 'sword') {
        itemGeometry = new THREE.BoxGeometry(0.1, 1, 0.1);
        itemMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    } else if (type === 'gun') {
        itemGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.6);
        itemMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    }
    const item = new THREE.Mesh(itemGeometry, itemMaterial);
    item.position.set(position.x, position.y, position.z);
    item.itemId = itemId;
    scene.add(item);
    return item;
}

function removeItemFromScene(itemId) {
    const item = scene.children.find(obj => obj.itemId === itemId);
    if (item) {
        scene.remove(item);
    }
}

// 무기 업데이트 함수
function updatePlayerWeapon(player, weapon) {
    console.log(player, weapon,"updatePlayerWeapon");
    const rightArm = player.getObjectByName("rightArm");
    if (rightArm) {
        // 기존 무기를 제거
        const existingWeapon = rightArm.children.find(child => child.isMesh);
        if (existingWeapon) {
        
            rightArm.remove(existingWeapon);
        }
        // 새로운 무기를 추가
        let weaponGeometry, weaponMaterial;
        if (weapon === 'sword') {
            weaponGeometry = new THREE.BoxGeometry(0.1, 1, 0.1);
            weaponMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            hasGun = false;
            hasSword = true;
        } else if (weapon === 'gun') {
            weaponGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.6);
            weaponMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
            hasGun = true;
            hasSword = false;
        }
        const newWeapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
        rightArm.add(newWeapon);
        newWeapon.position.set(0, -1, 0.4); // 손 위치에 아이템 배치
        newWeapon.rotation.set(Math.PI / 2, 0, 0);
        console.log(`Weapon ${weapon} added to player ${player.id}'s hand`);

    }
}


