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

