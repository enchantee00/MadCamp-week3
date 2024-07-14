// main.js

// 씬, 카메라, 렌더러 초기화
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let cameraMode = 0; // 0: 현재 시점, 1: 1인칭 시점, 2: 3인칭 뒷통수 시점
camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 바닥 추가
const floorGeometry = new THREE.PlaneGeometry(20, 20);
const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x808080 });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = - Math.PI / 2;
scene.add(floor);

// 벽 추가
const wallMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

const backWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 10), wallMaterial);
backWall.position.set(0, 5, -10);
scene.add(backWall);

const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 10), wallMaterial);
frontWall.position.set(0, 5, 10);
frontWall.rotation.y = Math.PI;
scene.add(frontWall);

const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 10), wallMaterial);
leftWall.position.set(-10, 5, 0);
leftWall.rotation.y = Math.PI / 2;
scene.add(leftWall);

const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 10), wallMaterial);
rightWall.position.set(10, 5, 0);
rightWall.rotation.y = -Math.PI / 2;
scene.add(rightWall);

// 책상과 의자 추가
const desks = [];
function createDesk(x, z) {
    const deskGeometry = new THREE.BoxGeometry(2, 1, 1);
    const deskMaterial = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
    const desk = new THREE.Mesh(deskGeometry, deskMaterial);
    desk.position.set(x, 0.5, z);
    scene.add(desk);
    desk.updateWorldMatrix(true, false);
    desks.push(desk);

    const chairGeometry = new THREE.BoxGeometry(1, 0.5, 1);
    const chairMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    const chair = new THREE.Mesh(chairGeometry, chairMaterial);
    chair.position.set(x, 0.25, z - 1.5);
    scene.add(chair);
    chair.updateWorldMatrix(true, false);
}

// 책상과 의자 배치
for (let i = -4; i <= 4; i += 2) {
    for (let j = -8; j <= 8; j += 4) {
        createDesk(i, j);
    }
}

// 문 추가
const doorGeometry = new THREE.PlaneGeometry(2, 5);
const doorMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const door = new THREE.Mesh(doorGeometry, doorMaterial);
door.position.set(0, 2.5, 9.9);
scene.add(door);
door.updateWorldMatrix(true, false);

// 키보드 입력 처리
window.addEventListener('keydown', (event) => {
    keyState[event.code] = true;

    if (event.code === 'KeyQ') {
        switchItem();
    }

    if (event.code === 'KeyV') {
        cameraMode = (cameraMode + 1) % 3;
    }

    if (event.code === 'Space') {
        if (hasGun) {
            shoot();
        } else {
            attack();
        }
    }
});

window.addEventListener('keyup', (event) => {
    keyState[event.code] = false;
});

// 캐릭터 간 충돌 감지 함수
function detectCharacterCollision() {
    if (localCharacter) {
        const localBox = new THREE.Box3().setFromObject(localCharacter);
        for (const id in players) {
            const player = players[id];
            if (player) {
                const playerBox = new THREE.Box3().setFromObject(player);
                if (localBox.intersectsBox(playerBox)) {
                    console.log('충돌!');
                }
            }
        }
    }
}

// 카메라가 로컬 캐릭터를 따라가도록 설정
function followCharacter() {
    if (!localCharacter) return;

    if (cameraMode === 0) {
        // 기본 시점
        camera.position.x = localCharacter.position.x;
        camera.position.z = localCharacter.position.z + 10;
        camera.position.y = localCharacter.position.y + 5;
        camera.lookAt(localCharacter.position);
    } else if (cameraMode === 1) {
        // 1인칭 시점
        const direction = new THREE.Vector3();
        localCharacter.getWorldDirection(direction);
        camera.position.copy(localCharacter.position).add(new THREE.Vector3(0, 1.6, 0));
        camera.position.add(direction.multiplyScalar(0.5));
        camera.lookAt(localCharacter.position.clone().add(direction.multiplyScalar(7)));
    } else if (cameraMode === 2) {
        // 3인칭 뒷통수 시점
        const direction = new THREE.Vector3();
        localCharacter.getWorldDirection(direction);
        camera.position.copy(localCharacter.position).add(new THREE.Vector3(0, 1.5, 0).sub(direction.multiplyScalar(2)));
        camera.lookAt(localCharacter.position);
    }
}

// 애니메이션 루프
function animate() {
    requestAnimationFrame(animate);
    moveCharacter(); // 로컬 캐릭터 이동
    followCharacter(); // 카메라가 로컬 캐릭터를 따라가도록 설정
    detectCharacterCollision(); // 캐릭터 간 충돌 감지
    updateBullets(); // 총알 업데이트
    renderer.render(scene, camera);
}
animate();

// 창 크기 조절 대응
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});
