let localCharacter = null; // 로컬 캐릭터 변수
const players = {}; // 모든 플레이어들을 저장할 객체
let weapon = null;
let gun = null;
let currentWeapon = null;
let hasWeapon = false;
let hasGun = false;
let isAttacking = false;
let isShooting = false;

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
    if (!hasWeapon || isAttacking) {
        console.log('무기가 없거나 공격 중입니다!');
        return;
    }

    isAttacking = true; // 공격 애니메이션 시작

    // 무기 휘두르기 애니메이션
    if (currentWeapon) {
        const rightArm = localCharacter.getObjectByName("rightArm");
        if (rightArm) {
            const originalRotation = rightArm.rotation.x;
            const attackMotion = { x: 0 };
            const swingUpSpeed = 0.2; // 팔을 올리는 속도
            const swingDownSpeed = 0.3; // 팔을 내리는 속도
            const maxSwing = 2 * Math.PI / 3; // 120도
            let hitDetected = false; // 히트 감지를 위한 변수

            const animateSwingUp = () => {
                rightArm.rotation.x = originalRotation - attackMotion.x;
                if (attackMotion.x < maxSwing) {
                    attackMotion.x += swingUpSpeed;
                    requestAnimationFrame(animateSwingUp);
                } else {
                    setTimeout(animateSwingDown, 50); // 잠시 멈춘 후 내려오는 애니메이션 시작
                }
            };

            const animateSwingDown = () => {
                rightArm.rotation.x = originalRotation - attackMotion.x;
                if (attackMotion.x > 0) {
                    attackMotion.x -= swingDownSpeed;
                    requestAnimationFrame(animateSwingDown);
                } else {
                    rightArm.rotation.x = originalRotation;
                    isAttacking = false; // 공격 애니메이션 종료
                }
            };

            // 공격 범위 설정 (칼을 휘두르는 궤적에 따라)
            const attackRange = new THREE.Sphere(new THREE.Vector3(), 1);
            attackRange.center.copy(localCharacter.position);

            // 적중 검사 함수
            const checkHit = () => {
                if (hitDetected) return; // 이미 적중한 경우 무시

                for (const id in players) {
                    const player = players[id];
                    if (player) {
                        player.updateWorldMatrix(true, false);
                        const playerBox = new THREE.Box3().setFromObject(player);
                        if (attackRange.intersectsBox(playerBox)) {
                            console.log('공격 적중!'); // 콘솔에 메시지 출력

                            // 피해 적용 (예: HP 감소)
                            player.hp -= 10; // 더미 캐릭터의 HP 감소 (예시)
                            updateHPBar(player);

                            if (player.hp <= 0) {
                                player.hp = 0;
                                // 캐릭터 쓰러짐
                                player.rotation.x = Math.PI / 2;
                            }

                            // 서버에 피해 이벤트 전송
                            ws.send(JSON.stringify({
                                type: 'damage',
                                targetId: id,
                                damage: 10
                            }));

                            hitDetected = true; // 적중 감지
                            break; // 한 번 적중하면 더 이상 검사하지 않음
                        }
                    }
                }
            };

            const animateSwing = () => {
                if (attackMotion.x < maxSwing) {
                    attackMotion.x += swingUpSpeed;
                    rightArm.rotation.x = originalRotation - attackMotion.x;
                    requestAnimationFrame(animateSwing);
                } else {
                    setTimeout(() => {
                        const animateReturn = () => {
                            if (attackMotion.x > 0) {
                                attackMotion.x -= swingDownSpeed;
                                rightArm.rotation.x = originalRotation - attackMotion.x;
                                requestAnimationFrame(animateReturn);
                            } else {
                                rightArm.rotation.x = originalRotation;
                                isAttacking = false;
                            }
                        };
                        animateReturn();
                    }, 50);
                }
                checkHit();
            };

            animateSwing();
        } else {
            console.error("오른팔을 찾을 수 없습니다.");
            isAttacking = false; // 오류 발생 시 공격 상태 초기화
        }
    }
}

// 총 발사 함수
function shoot() {
    if (!hasGun || isShooting) {
        console.log('총이 없거나 발사 중입니다!');
        return;
    }

    isShooting = true; // shooting 애니메이션 시작

    const rightArm = localCharacter.getObjectByName("rightArm");
    if (rightArm) {
        const originalRotation = rightArm.rotation.x;
        const shootMotion = { x: 0 };
        const shootUpSpeed = 0.2; // 팔을 올리는 속도
        const shootDownSpeed = 0.1; // 팔을 내리는 속도

        const animateShootUp = () => {
            rightArm.rotation.x = originalRotation - shootMotion.x;
            if (shootMotion.x < Math.PI / 2) {
                shootMotion.x += shootUpSpeed;
                requestAnimationFrame(animateShootUp);
            } else {
                setTimeout(shootBullet, 50); // 잠시 멈춘 후 총알 발사
            }
        };

        const animateShootDown = () => {
            rightArm.rotation.x = originalRotation - shootMotion.x;
            if (shootMotion.x > 0) {
                shootMotion.x -= shootDownSpeed;
                requestAnimationFrame(animateShootDown);
            } else {
                rightArm.rotation.x = originalRotation;
                isShooting = false; // shooting 애니메이션 종료
            }
        };

        const shootBullet = () => {
            const bullet = createBullet();
            const gunPosition = new THREE.Vector3(0, -0.3, 0); // 손 위치에 총구 위치 설정
            rightArm.localToWorld(gunPosition); // 총구 위치를 월드 좌표로 변환
            bullet.position.copy(gunPosition);
            bullet.quaternion.copy(localCharacter.quaternion);

            const direction = new THREE.Vector3();
            localCharacter.getWorldDirection(direction);
            bullet.userData.velocity = direction.multiplyScalar(0.2); // 총알 속도 설정
            bullet.userData.startPosition = bullet.position.clone(); // 총알의 초기 위치 저장

            animateShootDown(); // 총을 쏜 후 팔을 내리는 애니메이션 시작
        };

        animateShootUp();
    } else {
        console.error("오른팔을 찾을 수 없습니다.");
        isShooting = false; // 오류 발생 시 shooting 상태 초기화
    }
}

function moveCharacter() {
    if (!localCharacter) return;

    const speed = 0.08; // 이동 속도 조정
    const rotationSpeed = 0.05; // 회전 속도 조정
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
        if (rightArm) rightArm.rotation.x = walkCycle;
    }

    // 아이템 접근 감지
    detectItemPickup();
}
