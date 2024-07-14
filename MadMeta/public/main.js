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

// WebSocket 연결 설정
const ws = new WebSocket('ws://143.248.226.40:8080');

ws.onopen = () => {
    ws.id = Date.now().toString(); // 간단한 클라이언트 식별자 설정
    localCharacter = createCharacter(scene, ws.id, true); // 로컬 캐릭터 생성
};

ws.onmessage = (message) => {
    const data = JSON.parse(message.data);
    console.log(data);
    if (data.type === 'init') {
        // 기존 플레이어 추가
        if (data.states) {
            Object.keys(data.states).forEach(clientId => {
                const state = data.states[clientId];
                const character = createCharacter(scene, clientId);
                character.position.set(state.position.x, state.position.y, state.position.z);
                character.rotation.y = state.rotation.y;
                players[clientId] = character;
            });
        }
    } else if (data.type === 'newPlayer') {
        // 새로운 플레이어 추가
        const character = createCharacter(scene, data.id);
        players[data.id] = character;
    } else if (data.type === 'removePlayer') {
        // 플레이어 제거
        const player = players[data.id];
        if (player) {
            scene.remove(player);
            delete players[data.id];
        }
    } else if (data.type === 'update') {
        // 플레이어 위치 및 회전 업데이트
        let player = players[data.id];
        if (player) {
            player.position.set(data.position.x, data.position.y, data.position.z);
            player.rotation.y = data.rotation.y;
        }
    }
};

ws.onclose = () => {
    Object.keys(players).forEach(id => {
        scene.remove(players[id]);
        delete players[id];
    });
};

// 키보드 입력 처리
const keyState = {};
window.addEventListener('keydown', (event) => {
    keyState[event.code] = true;
});
window.addEventListener('keyup', (event) => {
    keyState[event.code] = false;
});

// 애니메이션 루프
function animate() {
    requestAnimationFrame(animate);
    moveCharacter(localCharacter, keyState, ws, players, desks.concat(walls)); // 로컬 캐릭터 이동
    followCharacter(camera, localCharacter); // 카메라가 로컬 캐릭터를 따라가도록 설정
    renderer.render(scene, camera);
}
animate();

// 창 크기 조절 대응
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});
