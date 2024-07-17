// 씬, 카메라, 렌더러 초기화
const scene = new THREE.Scene();

// 카메라 설정
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let cameraMode = 0; // 0: 현재 시점, 1: 1인칭 시점, 2: 3인칭 뒷통수 시점
camera.position.set(0, 30, 100); // 카메라 위치를 변경하여 광장과 강의실을 모두 볼 수 있게 설정
// camera.lookAt(0, 0, 0);


// 렌더러 설정
const renderer = new THREE.WebGLRenderer({ antialias: true }); // 안티앨리어싱을 켬
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// const controls = new THREE.OrbitControls(camera, renderer.domElement);
// controls.listenToKeyEvents( window ); // optional
// //controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)

// controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
// controls.dampingFactor = 0.05;
// controls.screenSpacePanning = false;
// controls.minDistance = 10;
// controls.maxDistance = 500;
// controls.maxPolarAngle = Math.PI / 2;


const collisionObjects = [];

// 광원 추가
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // 주변 광원
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // 방향성 광원
directionalLight.position.set(10, 10, 10);
scene.add(directionalLight);

scene.background = new THREE.Color(0x87CEEB); // 하늘색 배경 설정

// 바닥 추가 (광장)
const floorGeometry = new THREE.PlaneGeometry(200, 150); // 광장을 더 작게 설정
const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x228B22 }); // 광장을 잔디색으로 설정
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);



let inputBox, inputText, submitText, questionBox, confirmButton, nameInputContainer, nameInput, submitName, chatInputContainer, chatInput, sendChat, chatMessages;
let gameControlsEnabled = true;
let playerName = '';
let playerId = '';
let chatBubbles = {};

function init() {
    inputBox = document.getElementById('inputBox');
    inputText = document.getElementById('inputText');
    submitText = document.getElementById('submitText');
    questionBox = document.getElementById('questionBox');
    confirmButton = document.getElementById('confirmButton');
    nameInputContainer = document.getElementById('nameInputContainer');
    nameInput = document.getElementById('nameInput');
    submitName = document.getElementById('submitName');
    chatInputContainer = document.getElementById('chatInputContainer');
    chatInput = document.getElementById('chatInput');
    sendChat = document.getElementById('sendChat');
    chatMessages = document.getElementById('chatMessages');


    submitText.addEventListener('click', () => {
        const text = inputText.value;
        if (currentWhiteboard) {
            sendWhiteboard(currentWhiteboard, text);
        }
        inputBox.style.display = 'none';
        enableGameControls();
    });

    confirmButton.addEventListener('click', () => {
        questionBox.style.display = 'none';
        inputBox.style.display = 'block';
        disableGameControls();
    });

    document.addEventListener('keydown', (event) => {
        if (inputBox.style.display === 'block') {
            // 입력 상자가 표시된 상태에서는 특정 키 입력을 무시
            disableGameControls();
            if (event.key === 'Enter') {
                console.log('Enter')
                const text = inputText.value;
                if (currentWhiteboard) {
                    sendWhiteboard(currentWhiteboard, text);
                }
                inputBox.style.display = 'none';
                enableGameControls();
            } else if (event.key === 'Escape') {
                console.log('escape');
                inputBox.style.display = 'none';
                enableGameControls();
            } else if (event.key === 'Backspace') {
                event.preventDefault(); // 기본 동작을 막음
                inputText.value = inputText.value.slice(0, -1);
            } else {
                inputText.focus();
            }
        }
        // enableGameControls();

    });

    submitName.addEventListener('click', () => {
        playerName = nameInput.value.trim();
        if (playerName) {
            nameInputContainer.style.display = 'none';
            sendCharacterName(playerName); // 플레이어 생성
        }
    });

    // 페이지 로드 시 이름 입력 창 표시
    window.onload = () => {
        nameInputContainer.style.display = 'flex';
    };

    sendChat.addEventListener('click', () => {
        const message = chatInput.value;
        if (message && ws) {

            sendMessage(playerId, message);
            // ws.send(JSON.stringify({ type: 'chat', name: playerName, message }));
            // addChatMessage(playerName, message); // 로컬로도 바로 추가
            chatInput.value = '';
        }
    });

    chatInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            sendChat.click();
        }
    });

}

function enableGameControls() {
    gameControlsEnabled = true;
}

function disableGameControls() {
    gameControlsEnabled = false;
}

function updateWhiteboardTexture(whiteboard, text) {
    const { canvas, context, texture } = whiteboard;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = 'black';
    context.font = '48px Arial';
    context.fillText(text, 50, 100);
    texture.needsUpdate = true; // 텍스처가 업데이트되었음을 알림

    console.log("화보 업데이트")
}


init();


classrooms = [];
// 강의실 생성 함수
function createClassroom(x, z, idx) {
    // 벽 추가
    const wallMaterial = new THREE.MeshBasicMaterial({ color: 0xefe7da });

    const backWall = new THREE.Mesh(new THREE.BoxGeometry(20, 10, 1), wallMaterial);
    backWall.position.set(x, 5, z - 10.5); // 두께 1을 고려하여 위치 조정
    scene.add(backWall);
    collisionObjects.push(backWall);

    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(1, 10, 26), wallMaterial);
    leftWall.position.set(x - 10.5, 5, z); // 두께 1을 고려하여 위치 조정
    scene.add(leftWall);
    collisionObjects.push(leftWall);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(1, 10, 26), wallMaterial);
    rightWall.position.set(x + 10.5, 5, z); // 두께 1을 고려하여 위치 조정
    scene.add(rightWall);
    collisionObjects.push(rightWall);

    // 책상과 의자 추가
    const desks = [];
    function createDesk(dx, dz) {
        const deskGeometry = new THREE.BoxGeometry(2, 1, 1);
        const deskMaterial = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
        const desk = new THREE.Mesh(deskGeometry, deskMaterial);
        desk.position.set(dx, 0.5, dz);
        scene.add(desk);
        desk.updateWorldMatrix(true, false);
        desks.push(desk);
        collisionObjects.push(desk);

        const chairGeometry = new THREE.BoxGeometry(1, 0.5, 1);
        const chairMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
        const chair = new THREE.Mesh(chairGeometry, chairMaterial);
        chair.position.set(dx, 0.25, dz - 1.5);
        scene.add(chair);
        chair.updateWorldMatrix(true, false);
    }

    // 책상과 의자 배치
    for (let i = -4; i <= 4; i += 2) {
        for (let j = -8; j <= 8; j += 4) {
            if (j === 8) continue;
            createDesk(x + i, z - j);
        }
    }

     // 단상 추가 (층이 있는 형태)
     function createPodium(px, pz) {
        const podiumGeometry1 = new THREE.BoxGeometry(6, 1, 3);
        const podiumMaterial1 = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
        const podium1 = new THREE.Mesh(podiumGeometry1, podiumMaterial1);
        podium1.position.set(px, 0.5, pz - 9);
        scene.add(podium1);
    }

    createPodium(x, z);

     // 화이트보드 추가 (Canvas 텍스처 사용)
     function createWhiteboard(wx, wz, idx) {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 512;
        const context = canvas.getContext('2d');
        context.fillStyle = 'white';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = 'black';
        context.font = '48px Arial';
        context.fillText('', 50, 100);

        const texture = new THREE.CanvasTexture(canvas);
        const whiteboardMaterial = new THREE.MeshBasicMaterial({ map: texture });
        const whiteboardGeometry = new THREE.PlaneGeometry(16, 8);
        const whiteboard = new THREE.Mesh(whiteboardGeometry, whiteboardMaterial);
        const whiteboardId = idx;
        whiteboard.position.set(wx, 5, wz - 9); // backWall에 부착
        scene.add(whiteboard);

        return { canvas, context, texture, whiteboard, whiteboardId };
    }

    const whiteboard = createWhiteboard(x, z, idx);

    // 강의실 정보 저장
    classrooms.push({
        whiteboard,
        idx
    });

}

// 4개의 강의실 생성
createClassroom(-60, -60, 1);
createClassroom(-20, -60, 2);
createClassroom(20, -60, 3);
createClassroom(60, -60, 4);


// 나무, 가로등, 벤치, 분수대 배치
createTree(-70, 20);
createTree(-50, 20);
createTree(50, 20);
createTree(70, 20);
createLamp(-60, 30);
createLamp(60, 30);
createBench(-40, 10);
createBench(40, 10);
createFountain(0, 30);


// // 현재 시간을 나타내는 텍스트 생성 및 업데이트
// const fontLoader = new THREE.FontLoader();

// let timeText;
// fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
//     const textGeometry = new THREE.TextGeometry(getCurrentTime(), {
//         font: font,
//         size: 5,
//         height: 1,
//         curveSegments: 12,
//         bevelEnabled: false
//     });

//     const textMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
//     timeText = new THREE.Mesh(textGeometry, textMaterial);
//     timeText.position.set(0, 15, 30);
//     scene.add(timeText);

//     setInterval(updateTimeText, 1000);
// });



// 키보드 입력 처리
window.addEventListener('keydown', (event) => {
    if (!gameControlsEnabled) return; // 게임 컨트롤이 비활성화된 경우 이벤트 무시

    keyState[event.code] = true;

    if (event.code === 'KeyQ') {
        switchItem();
    }

    if (event.code === 'KeyV') {
        cameraMode = (cameraMode + 1) % 3;
    }

    if (event.code === 'Space') {
        if (localCharacter.weapon === "gun") {
            shoot();
        } else {
            attack();
        }
    }
});


window.addEventListener('keyup', (event) => {
    if (!gameControlsEnabled) return; // 게임 컨트롤이 비활성화된 경우 이벤트 무시

    keyState[event.code] = false;
});

// 캐릭터 간 충돌 감지 함수
function detectCharacterCollision() {
    if (localCharacter) {
        const localBox = new THREE.Box3().setFromObject(localCharacter);
        Object.keys(players).forEach(id => {
            const player = players[id];
            if (player) {
                const playerBox = new THREE.Box3().setFromObject(player);
                if (localBox.intersectsBox(playerBox)) {
                    // console.log('충돌!');
                }
            }
        });
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
    // controls.target.copy(localCharacter.position);
}

function updateChatBubbles() {
    Object.keys(chatBubbles).forEach(playerId => {
        if (!players[playerId] || !players[playerId].character) return;
        const player = players[playerId].character;
        const chatBubble = chatBubbles[playerId].element;
        const vector = new THREE.Vector3();
        player.getWorldPosition(vector);
        vector.project(camera);

        const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
        const y = (vector.y * -0.5 + 0.5) * window.innerHeight;
        chatBubble.style.left = `${x}px`;
        chatBubble.style.top = `${y - 50}px`; // 말풍선 위치 조정
    });
}


function animate() {
    requestAnimationFrame(animate);
    moveCharacter(); // 로컬 캐릭터 이동
    followCharacter(); // 카메라가 로컬 캐릭터를 따라가도록 설정
    detectCharacterCollision(); // 캐릭터 간 충돌 감지
    updateBullets(); // 총알 업데이트
    // controls.update(); // OrbitControls 업데이트
    updateChatBubbles();



    let characterNearWhiteboard = false;

    
    classrooms.forEach(classroom => {
    
        for (const id in players) {
            const player = players[id];

            if(localCharacter && player) {
                // 화이트보드 가까이 있는지 확인
                if (player.position.distanceTo(classroom.whiteboard.whiteboard.position) < 5 || localCharacter.position.distanceTo(classroom.whiteboard.whiteboard.position) < 5) {
                    characterNearWhiteboard = true;
                    currentWhiteboard = classroom.whiteboard;
                }
                break;
            }
        }
    });
    
    // 화이트보드 가까이 있을 때 입력 창 표시
    if (characterNearWhiteboard) {
        questionBox.style.display = 'block';

    } else {
        questionBox.style.display = 'none';
    }

    // 모든 캐릭터의 HP 바가 카메라를 향하도록 업데이트
    Object.values(players).forEach(player => {
        const bar = player.children.find(child => child.geometry instanceof THREE.PlaneGeometry && child.material.color.getHex() === 0xff0000);
        if (bar) {
            bar.lookAt(camera.position);
        }
    });

    // if (localCharacter) {
    //     const localBar = localCharacter.children.find(child => child.geometry instanceof THREE.PlaneGeometry && child.material.color.getHex() === 0xff0000);
    //     if (localBar) {
    //         localBar.lookAt(camera.position);
    //     }
    // }

    renderer.render(scene, camera);
    sendUpdate();
}

animate();


// 창 크기 조절 대응
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});
