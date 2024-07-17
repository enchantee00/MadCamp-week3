let localCharacter = null; // 로컬 캐릭터 변수
const players = {}; // 모든 플레이어들을 저장할 객체
let weapon = null;
let gun = null;
let currentWeapon = null;

let hasSword = false;
let hasGun = false;
let isAttacking = false;
let isShooting = false;
let isJumping = false;
let jumpStartTime = null;

// navigator.mediaDevices.getUserMedia({ audio: true })
//     .then(stream => {
//         localStream = stream;
//     })
//     .catch(error => {
//         console.error('Error accessing audio stream', error);
//     });


// HP 바 생성 함수
function createHPBar(character) {
    const barGeometry = new THREE.PlaneGeometry(1, 0.1);
    const barMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const bar = new THREE.Mesh(barGeometry, barMaterial);
    bar.position.set(0, 2.0, 0);
    character.add(bar);

    return bar;
}

// HP 바 업데이트 함수
function updateHPBar(character) {
    const hpPercentage = character.hp / character.maxHP;
    const bar = character.children.find(child => child.geometry instanceof THREE.PlaneGeometry && child.material.color.getHex() === 0xff0000);
    if (bar) {
        bar.scale.x = hpPercentage;
    }
}

// 캐릭터 추가 함수
function createCharacter(id,isLocal = false) {
    const character = new THREE.Group();

    // 몸통 추가
    const bodyGeometry = new THREE.BoxGeometry(0.6, 0.7, 0.3);
    const bodyMaterial = new THREE.MeshBasicMaterial({ color: 0xffc0cb });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.4;
    character.add(body);

    // 머리 추가
    const headGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.6); // 머리 크기를 몸통 너비에 맞춤
    const headMaterial = new THREE.MeshBasicMaterial({ color: 0xffe0bd });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.1; // 목과 몸통 사이 공간 없앰
    character.add(head);

    // 눈썹 추가
    const eyebrowGeometry = new THREE.BoxGeometry(0.4, 0.1, 0.02); // 눈썹 길이를 줄임
    const eyebrowMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const leftEyebrow = new THREE.Mesh(eyebrowGeometry, eyebrowMaterial);
    leftEyebrow.position.set(-0.15, 1.25, 0.31); // 얼굴에 맞게 위치 조정
    character.add(leftEyebrow);

    const rightEyebrow = new THREE.Mesh(eyebrowGeometry, eyebrowMaterial);
    rightEyebrow.position.set(0.15, 1.25, 0.31); // 얼굴에 맞게 위치 조정
    character.add(rightEyebrow);

    // 눈 추가
    const eyeGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.15, 1.1, 0.3); // 얼굴에 맞게 위치 조정
    character.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.15, 1.1, 0.3); // 얼굴에 맞게 위치 조정
    character.add(rightEye);

    // 입 추가
    const mouthGeometry = new THREE.BoxGeometry(0.2, 0.1, 0.02);
    const mouthMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
    mouth.position.set(0, 0.95, 0.3); // 얼굴에 맞게 위치 조정
    character.add(mouth);

    // 팔 추가
    const armGeometry = new THREE.BoxGeometry(0.2, 0.6, 0.2);
    const armMaterial = new THREE.MeshBasicMaterial({ color: 0xffe0bd });
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.4, 1, 0);
    leftArm.geometry.translate(0, -0.3, 0); // 팔의 중심을 어깨쪽으로 이동
    leftArm.name = "leftArm"; // 왼팔에 이름 추가
    character.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.4, 1, 0);
    rightArm.geometry.translate(0, -0.3, 0); // 팔의 중심을 어깨쪽으로 이동
    rightArm.name = "rightArm"; // 오른팔에 이름 추가
    character.add(rightArm);

    // 다리 추가
    const legGeometry = new THREE.BoxGeometry(0.3, 0.6, 0.3);
    const legMaterial = new THREE.MeshBasicMaterial({ color: 0xffc0cb });
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.15, 0.3, 0);
    leftLeg.geometry.translate(0, -0.3, 0); // 다리의 중심을 고관절쪽으로 이동
    character.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.15, 0.3, 0);
    rightLeg.geometry.translate(0, -0.3, 0); // 다리의 중심을 고관절쪽으로 이동
    character.add(rightLeg);

    // HP 설정
    character.maxHP = 100;
    character.hp = 100;
    createHPBar(character);

    // 텍스트 스프라이트 추가
    const textSprite = createTextSprite(id);
    textSprite.position.set(0, 2.0, 0); // HP 바 위에 텍스트 위치
    character.add(textSprite);

    // 초기 위치 설정
    character.position.set(0,0.6,0);

    scene.add(character);
    character.updateWorldMatrix(true, false);

    // 로컬 캐릭터와 플레이어 구분
    if (isLocal) {
        localCharacter = character;
    }
    // } else {
    players[id] = character;
    if (players[id].weapon) {
        updatePlayerWeapon(character, players[id].weapon);
    }
    


    return character;
}

// 아이템 생성 함수
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
function pickUpItem(itemId) {
    ws.send(JSON.stringify({
        type: 'pickup',
        itemId: itemId,
        playerId: ws.id
    }));
}
// 아이템 접근 감지 및 서버로 전송
function detectItemPickup() {
    if (!localCharacter) return;

    // 로컬 캐릭터의 박스를 가져옵니다.
    const localBox = new THREE.Box3().setFromObject(localCharacter);

    // 씬에 있는 모든 아이템을 검사합니다.
    scene.children.forEach(child => {
        if (child.itemId) {
            const itemBox = new THREE.Box3().setFromObject(child);
            if (localBox.intersectsBox(itemBox)) {
                // 아이템을 주웠음을 서버에 알립니다.
                pickUpItem(child.itemId);
            }
        }
    });
}

// 무기 공격 함수
function attack() {
    if (!hasSword ) {
        console.log("hasSword:",hasSword,'무기가 없거나 공격 중입니다!');
        console.log(isAttacking);
        return;
    }

    // isAttacking = true; // 공격 애니메이션 시작
    sendAttack(localCharacter);

}

function detectCharacterCollision() {
    if (localCharacter) {
        const localBox = new THREE.Box3().setFromObject(localCharacter);
        for (const id in players) {
            const player = players[id];
            if (player) {
                const playerBox = new THREE.Box3().setFromObject(player);
                if (localBox.intersectsBox(playerBox)) {
                    console.log('충돌!');
                    if (!peerConnections[id]) {
                        console.log('peer')
                        setupPeerConnection(id, true);
                    }
                } else {
                    if (peerConnections[id]) {
                        removePeerConnection(id);
                    }
                }
            }
        }
    }
}


// 총 발사 함수
function shoot() {
    if (!hasGun || isShooting) {
        console.log(hasGun,"isShooting", isShooting);
        console.log('총이 없거나 발사 중입니다!');
        return;
    }
    sendShoot(localCharacter);
}



function moveCharacter() {
    if (!localCharacter || isInputBlocked) return;

    const speed = 0.3; // 이동 속도 조정
    const rotationSpeed = 0.1; // 회전 속도 조정
    let direction = new THREE.Vector3();

    if (keyState['ArrowUp'] || keyState['KeyW']) {
        direction.z += speed;
    }
    if (keyState['ArrowLeft'] || keyState['KeyA']) {
        localCharacter.rotation.y += rotationSpeed;
    }
    if (keyState['ArrowRight'] || keyState['KeyD']) {
        localCharacter.rotation.y -= rotationSpeed;
    }
    if(keyState["ArrowDown"]||keyState['KeyS']){
        direction.z -= speed;
    }

    // L 키가 눌렸을 때 점프 애니메이션 시작
    if (keyState["KeyL"] && !isJumping) {
        isJumping = true;
        jumpStartTime = Date.now();
    }

    // 점프 애니메이션 처리
    if (isJumping) {
        const elapsedTime = Date.now() - jumpStartTime;
        const duration = 500; // 0.5초

        if (elapsedTime < duration / 2) {
            localCharacter.position.y = 2 * (elapsedTime / (duration / 2)) + 0.6; // 첫 0.25초 동안 y 값을 1로 증가
        } else if (elapsedTime < duration) {
            localCharacter.position.y = 2 * (1 - (elapsedTime - duration / 2) / (duration / 2))+0.6;  // 다음 0.25초 동안 y 값을 1에서 0으로 감소
        } else {
            localCharacter.position.y = 0.6; // 애니메이션 완료 후 초기화
            isJumping = false; // 애니메이션 완료 후 상태 초기화ㅈㅈㅈ
        }
    }
    if (direction.length() > 0) {
        direction.applyQuaternion(localCharacter.quaternion);
        localCharacter.position.add(direction);

        // 충돌 감지 및 처리
        if (detectCollision(localCharacter, collisionObjects)) {
            localCharacter.position.sub(direction);
        } else {
            ws.send(JSON.stringify({
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

        // 걷는 모션 추가
        const walkCycle = Math.sin(Date.now() / 100) * 0.2;
        const leftLeg = localCharacter.children.find(child => child.geometry instanceof THREE.BoxGeometry && child.material.color.getHex() === 0xffc0cb && child.position.x < 0);
        const rightLeg = localCharacter.children.find(child => child.geometry instanceof THREE.BoxGeometry && child.material.color.getHex() === 0xffc0cb && child.position.x > 0);
        const leftArm = localCharacter.children.find(child => child.geometry instanceof THREE.BoxGeometry && child.material.color.getHex() === 0xffe0bd && child.position.x < 0);
        const rightArm = localCharacter.children.find(child => child.geometry instanceof THREE.BoxGeometry && child.material.color.getHex() === 0xffe0bd && child.position.x > 0);

        if (leftLeg) leftLeg.rotation.x = walkCycle;
        if (rightLeg) rightLeg.rotation.x = -walkCycle;
        if (leftArm) leftArm.rotation.x = -walkCycle;
        if (rightArm&&!(attackInProgress||shootingInProgress)) rightArm.rotation.x = walkCycle;
    }

    // 아이템 접근 감지
    detectItemPickup();

    // requestAnimationFrame(moveCharacter);
}
