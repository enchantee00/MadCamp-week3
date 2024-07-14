const sprites = []; // 텍스트 스프라이트를 저장할 배열

export function createTextSprite(message) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = 'Bold 20px Arial';
    context.fillStyle = 'rgba(255, 255, 255, 1.0)';
    context.fillText(message, 0, 20);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(4, 2, 1); // 스프라이트 크기 조정
    sprites.push(sprite); // 스프라이트 배열에 추가
    return sprite;
}

export function createCharacter(scene, id, isLocal = false) {
    const character = new THREE.Group();

    const bodyGeometry = new THREE.BoxGeometry(1.2, 2.4, 0.6);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xffc0cb }); // 안정적인 렌더링을 위해 LambertMaterial 사용
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1.2;
    character.add(body);

    const headGeometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0xffe0bd }); // 안정적인 렌더링을 위해 LambertMaterial 사용
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 3;
    character.add(head);

    const leftEyeGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const leftEyeMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 }); // 안정적인 렌더링을 위해 LambertMaterial 사용
    const leftEye = new THREE.Mesh(leftEyeGeometry, leftEyeMaterial);
    leftEye.position.set(-0.3, 3.2, 0.6);
    character.add(leftEye);

    const rightEyeGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const rightEyeMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 }); // 안정적인 렌더링을 위해 LambertMaterial 사용
    const rightEye = new THREE.Mesh(rightEyeGeometry, rightEyeMaterial);
    rightEye.position.set(0.3, 3.2, 0.6);
    character.add(rightEye);

    const legGeometry = new THREE.BoxGeometry(0.4, 1.2, 0.4);
    const legMaterial = new THREE.MeshLambertMaterial({ color: 0x0000ff }); // 안정적인 렌더링을 위해 LambertMaterial 사용
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.4, 0.6, 0);
    character.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.4, 0.6, 0);
    character.add(rightLeg);

    // 텍스트 스프라이트 추가
    // const textSprite = createTextSprite(id);
    // textSprite.position.set(0, 5, 0);
    // character.add(textSprite);

    if (isLocal) {
        character.position.set(0, 1.2, 0); // 로컬 캐릭터 초기 위치 설정
    } else {
        character.position.set(0, 1.2, 0); // 다른 캐릭터 초기 위치 설정
    }
    scene.add(character);

    return character;
}

export function moveCharacter(character, keyState, ws, players, collidables) {
    if (!character) return;

    const speed = 0.2; // 캐릭터 속도 조정
    let direction = new THREE.Vector3();

    if (keyState['ArrowUp'] || keyState['KeyW']) {
        direction.z -= speed;
    }
    if (keyState['ArrowDown'] || keyState['KeyS']) {
        direction.z += speed;
    }
    if (keyState['ArrowLeft'] || keyState['KeyA']) {
        direction.x -= speed;
    }
    if (keyState['ArrowRight'] || keyState['KeyD']) {
        direction.x += speed;
    }

    if (direction.length() > 0) {
        character.position.add(direction);
        character.rotation.y = Math.atan2(direction.x, direction.z);

        // 충돌 감지 및 처리
        if (detectCollision(character, collidables) || detectCollision(character, Object.values(players).map(p => p.children[0])) || character.position.x < -200 || character.position.x > 200 || character.position.z < -200 || character.position.z > 200) {
            character.position.sub(direction);
        } else {
            ws.send(JSON.stringify({
                id: ws.id,
                position: {
                    x: character.position.x,
                    y: character.position.y,
                    z: character.position.z
                },
                rotation: {
                    y: character.rotation.y
                }
            }));
        }
    }
}

export function followCharacter(camera, character) {
    if (!character) return;

    camera.position.x = character.position.x;
    camera.position.z = character.position.z + 30; // 카메라 위치 조정
    camera.position.y = character.position.y + 20; // 카메라 위치 조정
    camera.lookAt(character.position);
}

export function detectCollision(object, targetArray) {
    const objectBox = new THREE.Box3().setFromObject(object);
    for (let i = 0; i < targetArray.length; i++) {
        const targetBox = new THREE.Box3().setFromObject(targetArray[i]);
        if (objectBox.intersectsBox(targetBox)) {
            return true;
        }
    }
    return false;
}
