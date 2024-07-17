let bullets = [];
const keyState = {};
let items = {}; // 로컬 아이템 관리

let myLocalCharacter = null;
let deadPosition ;
let focusCharacter=null;

let lastPosition = new THREE.Vector3();
let lastRotationY = 0;

//start button
let startButton, gameCountText;


let characterIndex = 0; // 현재 선택된 캐릭터 인덱스
let characters; // players 객체의 캐릭터 리스트
let isInputBlocked = false; // 입력을 막는 플래그


// WebSocket 연결 설정
const ws = new WebSocket('ws://143.248.226.140:8080');


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
            document.activeElement.blur();
        });
    });
    

}
init();

function toggleGameCount(show, text) {
    const gameCountText = document.getElementById('gameCountText');
    const gameCount = document.getElementById("gameCount");
    if(gameCountText){
        gameCountText.textContent=text;
    }

    if (show) {
        gameCount.classList.add('show');
    } else {
        gameCount.classList.remove('show');
    }
}
function showRemainingTime(show,time) {
    const countingBox = document.getElementById('countingBox');
    const remaingTime = document.getElementById("remainingTime");
    if (show) {
        countingBox.style.display = 'block';
        remaingTime.textContent = time;
    } else {
        countingBox.style.display = 'none';
    }
}

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
                    const character = createCharacter(clientId, state.name);
                    character.position.set(state.position.x, state.position.y, state.position.z);
                    character.rotation.y = state.rotation.y;
                    character.hp = state.hp || 100; // 초기 hp 설정
                    updateHPBar(character);
                    players[clientId] = character; 
                    players[clientId].weapon = state.weapon;
                    players[clientId].state = 'alive';
                    console.log(players[clientId].state);
                    updatePlayerWeapon(character,state.weapon);
                    // 여기서 character 객체 추가

                }
                // console.log(players[clientId]);

            });
        }
        if (data.whiteboard) {
            console.log("init", data.whiteboard);
            const whiteboards = data.whiteboard;
            
            for (const id in whiteboards) {
                if (classrooms[id-1]) {
                    console.log(id)
                    updateWhiteboardTexture(classrooms[id-1].whiteboard, whiteboards[id]);
                }
            }
       
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
        playerId = data.id;
        createCharacter(ws.id, data.name, true); // 로컬 캐릭터 생성
        players[ws.id] = localCharacter;
        // console.log("gameState: data->connected");
    } else if (data.type === 'newPlayer') {
        // 새로운 플레이어 추가 (현재 클라이언트 자신은 제외)
        if (data.id !== ws.id) {
            createCharacter(data.id, data.name);
        }
    } else if (data.type === 'removePlayer') {
        // 플레이어 제거
        const player = players[data.id];
        if (player) {
            scene.remove(player);
            delete players[data.id];
        }
        removePeerConnection(data.id);
    } else if (data.type === 'update') {
        // 플레이어 위치 및 회전 업데이트
        let player = players[data.id];
        if (player) {
            player.position.set(data.position.x, data.position.y, data.position.z);
            player.rotation.y = data.rotation.y;
                    // 걷는 모션 추가
        const walkCycle = Math.sin(Date.now() / 100) * 0.2;
        const leftLeg = player.children.find(child => child.geometry instanceof THREE.BoxGeometry && child.material.color.getHex() === 0xffc0cb && child.position.x < 0);
        const rightLeg = player.children.find(child => child.geometry instanceof THREE.BoxGeometry && child.material.color.getHex() === 0xffc0cb && child.position.x > 0);
        const leftArm = player.children.find(child => child.geometry instanceof THREE.BoxGeometry && child.material.color.getHex() === 0xffe0bd && child.position.x < 0);
        const rightArm = player.children.find(child => child.geometry instanceof THREE.BoxGeometry && child.material.color.getHex() === 0xffe0bd && child.position.x > 0);

        if (leftLeg) leftLeg.rotation.x = walkCycle;
        if (rightLeg) rightLeg.rotation.x = -walkCycle;
        if (leftArm) leftArm.rotation.x = -walkCycle;
        if (rightArm &&!attackInProgress&&!shootingInProgress) rightArm.rotation.x = walkCycle;
        }
    } else if (data.type === 'damage') {
        console.log("gameState: damage");
        // 피해 이벤트 처리
        let player = players[data.targetId];
        if (player) { 
            player.hp = data.remainHP;
            // console.log(`플레이어 ${data.targetId}이(가) 피해를 입었습니다. HP: ${player.hp}`);
            updateHPBar(player);
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
        console.log("weeapon: ",shooter.weapon);
        if (shooter) {
            console.log();
            performShoot(shooter);
        }
    }else if(data.type === "death"){
        const player = players[data.playerId];
        if(player){
            if(player == localCharacter){
                // console.log("내가 죽었어용!");
                //방향키에 따라 시점 변경 구현하기
                // myLocalCharacter = localCharacter;
                // deadPosition = localCharacter.position.clone();
                // console.log("deadPosition: ",deadPosition);
                blockInput(true);
            }
            showMessage(`Player ${data.playerId} is dead.`);

            // console.log(data.playerId);
            updatePlayerWeapon(player, null);
            player.state = "dead";
            player.hp = 0;
            updateHPBar(player);
            player.rotation.x = Math.PI /2 ;
        }
    }  else if (data.type === 'itemRemoved') {
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
    //death 이벤트 처리
    }
    
    else if (data.type ==="readyForGame"){
        hideElement();
        console.log(data.state);
        toggleGameCount(true, data.state);
    // gameStart! 아이템 시작;    
    } else if (data.type === "itemDistribution") {
        setTimeout(() => {
            // toggleGameCount(true, "Game Start!");
            
            // toggleGameCount(true)가 완료된 후 실행할 코드
            toggleGameCount(false);

            console.log(data.items);
            
            // 아이템 추가
            if (data.items) {
                Object.keys(data.items).forEach(itemId => {
                    const item = data.items[itemId];
                    createItem(itemId, item.type, item.position);
                });
            }
        }, 500);
    //gamecounting
    }else if(data.type === 'remainingTime'){
        console.log(data.time);
        hideElement();
        // console.log(data.remainingTime);
        showRemainingTime(true, data.time);
    
    }else if(data.type === "cantStartGame"){
        showMessage("Can't start the game. At least 2 players needed.");

    //game이 끝나면 모든 아이템 지우기
    } else if(data.type === "gameOver"){
        showElement();
        showRemainingTime(false);
        deleteAllItems();
        // const playersInServer = data.players;
        // console.log(playersInServer);
        // console.log(players);
        for (let clientId in players) {
            //플레이어들 상태 복귀시키기.
            if (players.hasOwnProperty(clientId)) {
              players[clientId].weapon = null;
              players[clientId].hp = 100;
              updateHPBar(players[clientId]);
              players[clientId].rotation.x = 0;
              players[clientId].position.y = 0.6;
              players[clientId].state = "alive";
              updatePlayerWeapon(players[clientId], null);
            }
        }

        // console.log("revival deadPosition:", deadPosition);
        // localCharacter.position.set(deadPosition.x,deadPosition.y,deadPosition.z);
        // deadPosition = null;
        // localCharacter.position.y = 0.6;

        blockInput(false);

        showMessage(`Winner is " ${data.winner.name}"  !`);
        
    } else if (data.type === 'whiteboardUpdate') {
        const { whiteboardId, text } = data;
        if (classrooms[whiteboardId]) {
            updateWhiteboardTexture(classrooms[whiteboardId-1].whiteboard, text);
        }
    } else if(data.type === 'chat') {
        createChatBubble(data.id, data.message);
        addChatMessage(data.id, data.message);
    }

};


ws.onclose = () => {
    Object.keys(players).forEach(id => {
        scene.remove(players[id]);
        delete players[id];
    });
};


    function hideElement() {
        const element = document.getElementById('startBox');
        if (element) {
            element.style.display = 'none';
        } else {
            console.error('Element with id "myButton" not found');
        }
    }

    function showElement() {
        const element = document.getElementById('startBox');
        if (element) {
            element.style.display = 'block';
        } else {
            console.error('Element with id "myButton" not found');
        }
    }



function showMessage(message) {
    const messageBox = document.getElementById("message-box");
    messageBox.textContent = message;
    messageBox.style.display = "block";
    
    // 3초 후에 메시지 박스를 숨깁니다.
    setTimeout(() => {
        messageBox.style.display = "none";
    }, 3000);
}


// 키보드 입력을 처리하는 함수
function handleKeydown(event) {
    const key = event.key.toLowerCase();
    keyState[event.code] = true;

    if (isInputBlocked) {
        if (key === 'arrowleft') {
            // 왼쪽 방향키를 누르면 이전 캐릭터로 변경
            changeCharacter(-1);
        } else if (key === 'arrowright') {
            // 오른쪽 방향키를 누르면 다음 캐릭터로 변경
            changeCharacter(1);
        } else {
            event.preventDefault();
            // console.log(`${key.toUpperCase()} key pressed but no action defined.`);
        }
    }
}

// 키보드 입력을 해제하는 함수
function handleKeyup(event) {
    keyState[event.code] = false;
}

// localCharacter를 변경하는 함수

function changeCharacter(direction) {
    // hideCharacter(myLocalCharacter);
    // myLocalCharacter.position.set(deadPosition.x,deadPosition.y,deadPosition.z);
    characters = Object.values(players).filter(character => (character != myLocalCharacter) && (character.state == 'alive'));
    // console.log(characters);
    characterIndex = (characterIndex + direction + characters.length) % characters.length;
    focusCharacter = characters[characterIndex];
    // console.log("Changed character to: ", characters,"+", players,"+", Object.values(players));
    console.log("fo");

}
// 키보드 이벤트 리스너 추가
document.addEventListener('keydown', handleKeydown);
document.addEventListener('keyup', handleKeyup);

// 입력을 막는 함수
function blockInput(block) {
    isInputBlocked = block;
}

function hideCharacter(character) {
    if (!character.originalMaterials) {
        character.originalMaterials = {};
    }

    character.traverse(child => {
        if (child instanceof THREE.Mesh) {
            // 원래 재질을 저장
            character.originalMaterials[child.uuid] = child.material;

            // 투명하게 만들어서 안 보이게 함
            child.material = new THREE.MeshBasicMaterial({ 
                color: child.material.color, 
                transparent: true, 
                opacity: 0 
            });
        } else if (child.isSprite) {
            // TextSprite를 숨김
            child.visible = false;
        }
    });
}
function showCharacter(character) {
    if (!character.originalMaterials) {
        console.warn("No original materials found for this character.");
        return;
    }
    console.log("showCharacter");
    character.traverse(child => {
        if (child instanceof THREE.Mesh) {
            // 원래 재질로 복구
            if (character.originalMaterials[child.uuid]) {
                child.material = character.originalMaterials[child.uuid];
                child.material.opacity = 1;
            }
        } else if (child.isSprite) {
            // TextSprite를 보이게 함
            child.visible = true;
        }
    });

    // 원래 재질 정보를 제거하여 메모리 누수를 방지
    delete character.originalMaterials;
}






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
    if (!attacker || attackInProgress) {
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
    console.log("performShoot: ", shooter);
    if (!shooter || shootingInProgress) {
        // console.log("hasGun:", hasGun, '무기가 없거나 공격 중입니다!');
        return;
    }

    shootingInProgress = true;
    const rightArm = shooter.getObjectByName("rightArm");
    if (rightArm) {
        const originalRotation = rightArm.rotation.x;
        const shootMotion = { x: 0 };
        const shootUpSpeed = 0.2;
        const shootDownSpeed = 0.2;

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
            bullet.userData.velocity = direction.multiplyScalar(0.1);
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

    items[itemId] = item;
    return item;
}
function deleteAllItems() {
    // 저장된 모든 아이템 삭제
    for (let itemId in items) {
        if (items.hasOwnProperty(itemId)) {
            scene.remove(items[itemId]);
            delete items[itemId];
        }
    }
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
    if(!player) return;
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
        } else if (weapon === 'gun') {
            weaponGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.6);
            weaponMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });

        }
        const newWeapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
        rightArm.add(newWeapon);
        newWeapon.position.set(0, -1, 0.4); // 손 위치에 아이템 배치
        newWeapon.rotation.set(Math.PI / 2, 0, 0);
        console.log(`Weapon ${weapon} added to player ${player.id}'s hand`);

    }
}

//칠판 업데이트 함수
// 화이트보드 텍스처 업데이트 함수
function sendWhiteboard(whiteboard, text) {
    // 서버로 화이트보드 업데이트 메시지 전송
    ws.send(JSON.stringify({
        type: 'whiteboardUpdate',
        whiteboard: whiteboard,
        text: text
    }));
}

function sendCharacterName(name) {
    ws.send(JSON.stringify({
        type: 'characterName',
        text: name
    }));
}

function sendMessage(playerId, message) {
    ws.send(JSON.stringify({
        type: 'chat',
        id: playerId,
        text: message
    }));
}