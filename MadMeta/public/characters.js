// characters.js

let localCharacter = null; // 로컬 캐릭터 변수
const players = {}; // 다른 플레이어들을 저장할 객체
let weapon = null;
let currentWeapon = null;
let hasWeapon = false;
let hasGun = false;

// HP 바 생성 함수
function createHPBar(character) {
    const barGeometry = new THREE.PlaneGeometry(1, 0.1);
    const barMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const bar = new THREE.Mesh(barGeometry, barMaterial);
    bar.position.set(0, 2.5, 0);
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
function createCharacter(id, isLocal = false) {
    const character = new THREE.Group();

    // 몸통 추가
    const bodyGeometry = new THREE.BoxGeometry(0.6, 1.2, 0.3);
    const bodyMaterial = new THREE.MeshBasicMaterial({ color: 0xffc0cb });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.6;
    character.add(body);

    // 머리 추가
    const headGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
    const headMaterial = new THREE.MeshBasicMaterial({ color: 0xffe0bd });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.5;
    character.add(head);

    // 눈썹 추가
    const eyebrowGeometry = new THREE.BoxGeometry(0.6, 0.1, 0.02);
    const eyebrowMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const leftEyebrow = new THREE.Mesh(eyebrowGeometry, eyebrowMaterial);
    leftEyebrow.position.set(-0.15, 1.8, 0.31);
    character.add(leftEyebrow);

    const rightEyebrow = new THREE.Mesh(eyebrowGeometry, eyebrowMaterial);
    rightEyebrow.position.set(0.15, 1.8, 0.31);
    character.add(rightEyebrow);

    // 눈 추가
    const eyeGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.15, 1.6, 0.3);
    character.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.15, 1.6, 0.3);
    character.add(rightEye);

    // 입 추가
    const mouthGeometry = new THREE.BoxGeometry(0.2, 0.1, 0.02);
    const mouthMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
    mouth.position.set(0, 1.4, 0.3);
    character.add(mouth);

    // 팔 추가
    const armGeometry = new THREE.BoxGeometry(0.2, 0.6, 0.2);
    const armMaterial = new THREE.MeshBasicMaterial({ color: 0xffe0bd });
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.5, 0.9, 0);
    character.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.5, 0.9, 0);
    character.add(rightArm);

    // 다리 추가
    const legGeometry = new THREE.BoxGeometry(0.2, 0.6, 0.2);
    const legMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.2, 0.3, 0);
    character.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.2, 0.3, 0);
    character.add(rightLeg);

    // HP 설정
    character.maxHP = 100;
    character.hp = 100;
    createHPBar(character);

    // 텍스트 스프라이트 추가
    const textSprite = createTextSprite(id);
    textSprite.position.set(0, 2.7, 0); // HP 바 위에 텍스트 위치
    character.add(textSprite);

    if (isLocal) {
        character.position.set(6, 0.6, -8); // 로컬 캐릭터 초기 위치 설정
    } else {
        character.position.set(4, 0.6, -8); // 더미 캐릭터 위치 설정
    }
    scene.add(character);
    character.updateWorldMatrix(true, false);

    if (isLocal) {
        localCharacter = character;
    } else {
        players[id] = character;
    }

    return character;
}

// 무기 생성 함수
function createWeapon(type, position) {
    let weaponGeometry, weaponMaterial;
    if (type === 'sword') {
        weaponGeometry = new THREE.BoxGeometry(0.1, 1, 0.1);
        weaponMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    } else if (type === 'gun') {
        weaponGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.6);
        weaponMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    }
    const weapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
    weapon.position.copy(position);
    scene.add(weapon);
    weapon.updateWorldMatrix(true, false);
    return weapon;
}

// 무기 교체 함수
function switchWeapon() {
    if (currentWeapon) {
        localCharacter.remove(currentWeapon);
        scene.remove(currentWeapon);
        currentWeapon = null;
        hasWeapon = false;
        hasGun = false;
    }

    // 근처에 무기가 있으면 무기 줍기
    if (!hasWeapon && !hasGun && weapon) {
        pickupWeapon();
    } else if (!hasWeapon && !hasGun && gun) {
        pickupGun();
    }
}

// 무기 획득 함수
function pickupWeapon() {
    if (weapon && localCharacter && !hasWeapon) { // hasWeapon이 false일 때만 실행
        weapon.updateWorldMatrix(true, false);
        const weaponBox = new THREE.Box3().setFromObject(weapon);
        const characterBox = new THREE.Box3().setFromObject(localCharacter);
        if (weaponBox.intersectsBox(characterBox)) {
            console.log('무기 획득!');
            alert('무기를 주웠습니다!');
            hasWeapon = true;
            currentWeapon = weapon;
            localCharacter.add(weapon);
            weapon.position.set(0.3, 0.9, 0); // 캐릭터의 오른손 위치에 무기 배치
            weapon.rotation.set(0, 0, Math.PI / 2);
        }
    }
}

// 총 획득 함수
function pickupGun() {
    if (gun && localCharacter && !hasGun) {
        gun.updateWorldMatrix(true, false);
        const gunBox = new THREE.Box3().setFromObject(gun);
        const characterBox = new THREE.Box3().setFromObject(localCharacter);
        if (gunBox.intersectsBox(characterBox)) {
            console.log('총 획득!');
            alert('총을 주웠습니다!');
            hasGun = true;
            currentWeapon = gun;
            localCharacter.add(gun);
            gun.position.set(0.3, 0.9, 0); // 캐릭터의 오른손 위치에 총 배치
            gun.rotation.set(0, 0, Math.PI / 2);
        }
    }
}

// 무기 공격 함수
function attack() {
    if (!hasWeapon) {
        alert('무기가 없습니다!');
        return;
    }

    const attackRange = new THREE.Sphere(new THREE.Vector3(), 1); // 공격 범위 설정 (구)
    attackRange.center.copy(localCharacter.position);

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
            }
        }
    }

    // 무기 휘두르기 애니메이션
    if (weapon) {
        weapon.rotation.z -= Math.PI / 4; // 무기를 휘두르는 애니메이션 시작
        setTimeout(() => {
            weapon.rotation.z += Math.PI / 4; // 원래 위치로 되돌리기
        }, 100); // 100ms 후에 원래 위치로 되돌림
    }
}

// 총 발사 함수
function shoot() {
    if (hasGun) {
        const bullet = createBullet();
        bullet.position.copy(localCharacter.position);
        bullet.quaternion.copy(localCharacter.quaternion);

        const direction = new THREE.Vector3();
        localCharacter.getWorldDirection(direction);
        bullet.userData.velocity = direction.multiplyScalar(0.2); // 총알 속도 설정
    }
}

// 캐릭터 이동 함수
function moveCharacter() {
    if (!localCharacter) return;

    const speed = 0.05; // 이동 속도 조정
    const rotationSpeed = 0.02; // 회전 속도 조정
    let direction = new THREE.Vector3();

    if (keyState['ArrowUp'] || keyState['KeyW']) {
        direction.z -= speed;
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
        if (detectCollision(localCharacter, desks) || localCharacter.position.x < -9.5 || localCharacter.position.x > 9.5 || localCharacter.position.z < -9.5 || (localCharacter.position.z > 9.5 && localCharacter.position.z < 10.5 && Math.abs(localCharacter.position.x) > 1)) {
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
        localCharacter.children.find(child => child.geometry instanceof THREE.BoxGeometry && child.material.color.getHex() === 0x0000ff && child.position.x < 0).rotation.x = walkCycle;
        localCharacter.children.find(child => child.geometry instanceof THREE.BoxGeometry && child.material.color.getHex() === 0x0000ff && child.position.x > 0).rotation.x = -walkCycle;
    }

    pickupWeapon(); // 무기 획득 시도
    pickupGun(); // 총 획득 시도
}
