import { createWall, createDoor, createDesk, createTree, createBench, createLamp } from './utils.js';
import { createCharacter, moveCharacter, followCharacter, detectCollision } from './characters.js';

const scene = new THREE.Scene();

// 카메라 설정
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 30, 100); // 카메라 위치 조정

// 렌더러 설정
const renderer = new THREE.WebGLRenderer({ antialias: true }); // 안티앨리어싱을 켬
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 조명 추가
const ambientLight = new THREE.AmbientLight(0x404040); // 주변 광원
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5); // 방향 광원
directionalLight.position.set(1, 1, 1).normalize();
scene.add(directionalLight);

// 바닥 추가 (전체 바닥)
const floorGeometry = new THREE.PlaneGeometry(400, 400);
const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x808080 });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

const desks = []; // 책상 배열
const walls = []; // 벽 배열

// 강의실 생성 함수
function createClassroom(x, y, z) {
    // 벽 생성
    const backWall = createWall(scene, 40, 20, 0xffffff, x, y + 10, z - 20); // 뒷벽
    const frontWall = createWall(scene, 40, 20, 0xffffff, x, y + 10, z + 20, Math.PI); // 앞벽
    const leftWall = createWall(scene, 40, 20, 0xffffff, x - 20, y + 10, z, Math.PI / 2); // 왼쪽벽
    const rightWall = createWall(scene, 40, 20, 0xffffff, x + 20, y + 10, z, -Math.PI / 2); // 오른쪽벽

    walls.push(backWall, frontWall, leftWall, rightWall);

    // 책상 생성
    for (let i = -8; i <= 8; i += 4) {
        for (let j = -16; j <= 16; j += 8) {
            const desk = createDesk(scene, x + i, y, z - j);
            desks.push(desk);
        }
    }

    // 문 생성
    const door = createDoor(scene, x, y + 2.5, z + 20, Math.PI);
    walls.push(door); // 문이 있는 벽도 충돌 감지
}

// 강의실 4개 생성 (일렬로 배치하고 공원 배치)
createClassroom(-120, 0, -60);
createClassroom(-40, 0, -60);
createClassroom(40, 0, -60);
createClassroom(120, 0, -60);

// 공원 장식 추가
createTree(scene, -90, 0, 10);
createTree(scene, -30, 0, 10);
createTree(scene, 30, 0, 10);
createTree(scene, 90, 0, 10);

createBench(scene, -60, 0, 20);
createBench(scene, 60, 0, 20);

createLamp(scene, -90, 0, 20);
createLamp(scene, 90, 0, 20);

const sprites = []; // 텍스트 스프라이트를 저장할 배열

let localCharacter = null; // 로컬 캐릭터 변수
const players = {}; // 다른 플레이어들을 저장할 객체


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
        // 모든 캐릭터의 HP 바가 카메라를 향하도록 업데이트
        Object.values(players).forEach(player => {
            const bar = player.children.find(child => child.geometry instanceof THREE.PlaneGeometry && child.material.color.getHex() === 0xff0000);
            if (bar) {
                bar.lookAt(camera.position);
            }
        });
    
        if (localCharacter) {
            const localBar = localCharacter.children.find(child => child.geometry instanceof THREE.PlaneGeometry && child.material.color.getHex() === 0xff0000);
            if (localBar) {
                localBar.lookAt(camera.position);
            }
        }
    
    renderer.render(scene, camera);

}
animate();

// 창 크기 조절 대응
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});
