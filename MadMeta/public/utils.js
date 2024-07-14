// utils.js

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
    context.font = 'Bold 20px Arial';
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
    bullets.forEach(bullet => {
        bullet.position.add(bullet.userData.velocity);
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


