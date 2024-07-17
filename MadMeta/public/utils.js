function createWall(scene, width, height, color, x, y, z, rotationY = 0) {
    const wallGeometry = new THREE.PlaneGeometry(width, height);
    const wallMaterial = new THREE.MeshLambertMaterial({ color }); // 안정적인 렌더링을 위해 LambertMaterial 사용
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.set(x, y, z);
    wall.rotation.y = rotationY;
    scene.add(wall);
    return wall;
}

function createDoor(scene, x, y, z, rotationY = 0) {
    const doorGeometry = new THREE.PlaneGeometry(4, 10);
    const doorMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 }); // 안정적인 렌더링을 위해 LambertMaterial 사용
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(x, y, z);
    // door.rotation.y = rotationY;
    scene.add(door);
    return door;
}

function createDesk(scene, x, y, z) {
    const deskGeometry = new THREE.BoxGeometry(4, 2, 2);
    const deskMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // 안정적인 렌더링을 위해 LambertMaterial 사용
    const desk = new THREE.Mesh(deskGeometry, deskMaterial);
    desk.position.set(x, y + 1, z);
    scene.add(desk);

    const chairGeometry = new THREE.BoxGeometry(2, 1, 2);
    const chairMaterial = new THREE.MeshLambertMaterial({ color: 0x0000ff }); // 안정적인 렌더링을 위해 LambertMaterial 사용
    const chair = new THREE.Mesh(chairGeometry, chairMaterial);
    chair.position.set(x, y + 0.5, z - 3);
    scene.add(chair);

    return desk;
}

function createTree(scene, x, y, z) {
    const trunkGeometry = new THREE.CylinderGeometry(1, 1, 6, 12);
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // 안정적인 렌더링을 위해 LambertMaterial 사용
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, y + 3, z);
    scene.add(trunk);

    const foliageGeometry = new THREE.SphereGeometry(4, 12, 12);
    const foliageMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 }); // 안정적인 렌더링을 위해 LambertMaterial 사용
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliage.position.set(x, y + 9, z);
    scene.add(foliage);
}

function createBench(scene, x, y, z) {
    const seatGeometry = new THREE.BoxGeometry(6, 0.4, 2);
    const seatMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // 안정적인 렌더링을 위해 LambertMaterial 사용
    const seat = new THREE.Mesh(seatGeometry, seatMaterial);
    seat.position.set(x, y + 1.2, z);
    scene.add(seat);

    const legGeometry = new THREE.BoxGeometry(0.2, 1.2, 0.2);
    const legMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 }); // 안정적인 렌더링을 위해 LambertMaterial 사용
    const leg1 = new THREE.Mesh(legGeometry, legMaterial);
    leg1.position.set(x - 2.8, y + 0.6, z - 0.8);
    scene.add(leg1);

    const leg2 = new THREE.Mesh(legGeometry, legMaterial);
    leg2.position.set(x + 2.8, y + 0.6, z - 0.8);
    scene.add(leg2);

    const leg3 = new THREE.Mesh(legGeometry, legMaterial);
    leg3.position.set(x - 2.8, y + 0.6, z + 0.8);
    scene.add(leg3);

    const leg4 = new THREE.Mesh(legGeometry, legMaterial);
    leg4.position.set(x + 2.8, y + 0.6, z + 0.8);
    scene.add(leg4);
}

function createLamp(scene, x, y, z) {
    const poleGeometry = new THREE.CylinderGeometry(0.4, 0.4, 10, 12);
    const poleMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 }); // 안정적인 렌더링을 위해 LambertMaterial 사용
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(x, y + 5, z);
    scene.add(pole);

    const lightGeometry = new THREE.SphereGeometry(1, 12, 12);
    const lightMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00 }); // 안정적인 렌더링을 위해 LambertMaterial 사용
    const light = new THREE.Mesh(lightGeometry, lightMaterial);
    light.position.set(x, y + 10, z);
    scene.add(light);
}

function createGazebo(x, z) {
    const roofGeometry = new THREE.CylinderGeometry(5, 5, 1, 6);
    const roofMaterial = new THREE.MeshBasicMaterial({ color: 0x8B0000 });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(x, 5, z);
    scene.add(roof);

    const pillarGeometry = new THREE.CylinderGeometry(0.2, 0.2, 5, 32);
    const pillarMaterial = new THREE.MeshBasicMaterial({ color: 0x696969 });
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
        pillar.position.set(x + Math.cos(angle) * 4.5, 2.5, z + Math.sin(angle) * 4.5);
        scene.add(pillar);
    }
}

function createStatue(x, z) {
    const baseGeometry = new THREE.BoxGeometry(2, 1, 2);
    const baseMaterial = new THREE.MeshBasicMaterial({ color: 0x696969 });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(x, 0.5, z);
    scene.add(base);

    const statueGeometry = new THREE.BoxGeometry(1, 3, 1);
    const statueMaterial = new THREE.MeshBasicMaterial({ color: 0x808080 });
    const statue = new THREE.Mesh(statueGeometry, statueMaterial);
    statue.position.set(x, 2, z);
    scene.add(statue);
}

function createFlowerBed(x, z) {
    const bedGeometry = new THREE.BoxGeometry(8, 0.5, 8);
    const bedMaterial = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
    const bed = new THREE.Mesh(bedGeometry, bedMaterial);
    bed.position.set(x, 0.25, z);
    scene.add(bed);

    const flowerGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1, 12);
    const flowerMaterial = new THREE.MeshBasicMaterial({ color: 0xFF69B4 });
    for (let i = -3; i <= 3; i++) {
        for (let j = -3; j <= 3; j++) {
            const flower = new THREE.Mesh(flowerGeometry, flowerMaterial);
            flower.position.set(x + i, 1, z + j);
            scene.add(flower);
        }
    }
}

function createPond(x, z) {
    const pondGeometry = new THREE.CylinderGeometry(10, 10, 1, 32);
    const pondMaterial = new THREE.MeshBasicMaterial({ color: 0x1E90FF });
    const pond = new THREE.Mesh(pondGeometry, pondMaterial);
    pond.position.set(x, 0.5, z);
    scene.add(pond);
}


// 충돌 감지 함수
function detectCollision(object, targetArray) {
    if (object) {
        const objectBox = new THREE.Box3().setFromObject(object);
        for (let i = 0; i < targetArray.length; i++) {
            const targetBox = new THREE.Box3().setFromObject(targetArray[i]);
            if (objectBox.intersectsBox(targetBox)) {
                return true;
            }
        }
    }
    return false;
}

// 텍스트 스프라이트 생성 함수
function createTextSprite(message) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = 'Bold 30px Arial';
    context.fillStyle = 'rgba(255, 255, 255, 1.0)';
    context.fillText(message, 0, 20);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(2, 1, 1);
    return sprite;
}

// 총알 생성 함수
function createBullet() {
    const bulletGeometry = new THREE.SphereGeometry(0.1, 8, 8); // 총알 모양 설정
    const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
    scene.add(bullet);
    bullets.push(bullet);
    return bullet;
}

// 총알 업데이트 함수
function updateBullets() {
    const maxBulletDistance = 50; // 총알의 최대 거리 설정

    bullets.forEach((bullet, index) => {
        bullet.position.add(bullet.userData.velocity);
        const distanceTravelled = bullet.position.distanceTo(bullet.userData.startPosition);

        if (distanceTravelled > maxBulletDistance) {
            scene.remove(bullet);
            bullets.splice(index, 1);
            return; // 현재 총알은 이미 제거되었으므로, 다음 총알로 넘어감
        }

        // 충돌 감지 및 처리
        Object.keys(players).forEach(id => {
            const player = players[id];
            if (player) {
                const playerBox = new THREE.Box3().setFromObject(player);
                const bulletBox = new THREE.Box3().setFromObject(bullet);
                if (bulletBox.intersectsBox(playerBox)) {
                    console.log('총알 적중!');
                    player.hp -= 10;
                    updateHPBar(player);
                    if (player.hp <= 0) {
                        player.hp = 0;
                        player.rotation.x = Math.PI / 2;
                    }
                    scene.remove(bullet);
                    bullets.splice(index, 1);
                }
            }
        });
    });
}


function createTree(x, z) {
    const trunkGeometry = new THREE.CylinderGeometry(1, 1, 6, 12);
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, 3, z);
    scene.add(trunk);

    const foliageGeometry = new THREE.SphereGeometry(4, 12, 12);
    const foliageMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliage.position.set(x, 9, z);
    scene.add(foliage);
}

// 가로등 생성 함수
function createLamp(x, z) {
    const poleGeometry = new THREE.CylinderGeometry(0.4, 0.4, 10, 12);
    const poleMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(x, 5, z);
    scene.add(pole);

    const lightGeometry = new THREE.SphereGeometry(1, 12, 12);
    const lightMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00 });
    const light = new THREE.Mesh(lightGeometry, lightMaterial);
    light.position.set(x, 10, z);
    scene.add(light);
}

// 벤치 생성 함수
function createBench(x, z) {
    const seatGeometry = new THREE.BoxGeometry(6, 0.4, 2);
    const seatMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const seat = new THREE.Mesh(seatGeometry, seatMaterial);
    seat.position.set(x, 1.2, z);
    scene.add(seat);

    const legGeometry = new THREE.BoxGeometry(0.2, 1.2, 0.2);
    const legMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
    const leg1 = new THREE.Mesh(legGeometry, legMaterial);
    leg1.position.set(x - 2.8, 0.6, z - 0.8);
    scene.add(leg1);

    const leg2 = new THREE.Mesh(legGeometry, legMaterial);
    leg2.position.set(x + 2.8, 0.6, z - 0.8);
    scene.add(leg2);

    const leg3 = new THREE.Mesh(legGeometry, legMaterial);
    leg3.position.set(x - 2.8, 0.6, z + 0.8);
    scene.add(leg3);

    const leg4 = new THREE.Mesh(legGeometry, legMaterial);
    leg4.position.set(x + 2.8, 0.6, z + 0.8);
    scene.add(leg4);
}

// 분수대 생성 함수
function createFountain(x, z) {
    const baseGeometry = new THREE.CylinderGeometry(5, 5, 1, 32);
    const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x87CEEB });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(x, 0.5, z);
    scene.add(base);

    const waterGeometry = new THREE.CylinderGeometry(4.5, 4.5, 0.5, 32);
    const waterMaterial = new THREE.MeshLambertMaterial({ color: 0x00BFFF, transparent: true, opacity: 0.7 });
    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.position.set(x, 1, z);
    scene.add(water);
}


function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString();
}

function updateTimeText() {
    if (timeText) {
        const newTimeGeometry = new THREE.TextGeometry(getCurrentTime(), {
            font: timeText.geometry.parameters.font,
            size: 5,
            height: 1,
            curveSegments: 12,
            bevelEnabled: false
        });
        timeText.geometry.dispose();
        timeText.geometry = newTimeGeometry;
    }
}

function addChatMessage(name, message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message';
    messageElement.textContent = `${name}: ${message}`;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}


function createChatBubble(playerId, message) {
    if (!players[playerId]) return;

    const player = players[playerId]
    let chatBubble = chatBubbles[playerId];
    console.log("chat player", player);

    if (!chatBubble) {
        const div = document.createElement('div');
        div.className = 'chat-bubble';
        div.style.position = 'absolute';
        div.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
        div.style.borderRadius = '5px';
        div.style.padding = '5px 10px';
        div.style.maxWidth = '200px';
        div.style.whiteSpace = 'pre-wrap';
        document.body.appendChild(div);
        chatBubble = { element: div, timeout: null };
        chatBubbles[playerId] = chatBubble;
    }

    console.log(chatBubble);

    chatBubble.element.textContent = message;
    chatBubble.element.style.display = 'block';

    // const playerPosition = players[playerId].position.clone();
    // const screenPosition = playerPosition.project(camera);

    // const screenX = (window.innerWidth / 2) * (screenPosition.x + 1);
    // const screenY = (window.innerHeight / 2) * (-screenPosition.y + 1);

    // chatBubble.element.style.left = `${screenX}px`;
    // chatBubble.element.style.top = `${screenY - 50}px`; // 말풍선이 캐릭터 머리 위에 위치하도록 조정


    if (chatBubble.timeout) clearTimeout(chatBubble.timeout);
    chatBubble.timeout = setTimeout(() => {
        chatBubble.element.style.display = 'none';
    }, 3000);
}


