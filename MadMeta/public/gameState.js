let bullets = [];
const keyState = {};


// WebSocket 연결 설정
const ws = new WebSocket('ws://143.248.226.10:3000');

// Voice WebSocket
const voiceWs = new WebSocket('wss://localhost:8081');
const peerConnections = {};
const audioElements = {};
let localStream = null;


ws.onopen = () => {
    ws.id = Date.now(); // 간단한 클라이언트 식별자 설정
    createCharacter(ws.id, true); // 로컬 캐릭터 생성
    createCharacter('dummy'); // 더미 캐릭터 생성
    weapon = createWeapon('sword', new THREE.Vector3(6, 0.5, -6)); // 검 생성
    gun = createWeapon('gun', new THREE.Vector3(8, 0.5, -6)); // 총 생성
};

ws.onmessage = (message) => {
    const data = JSON.parse(message.data);
    // console.log(data);
    if (data.type === 'init') {
        // 기존 플레이어 추가
        if (data.states) {
            Object.keys(data.states).forEach(clientId => {
                const state = data.states[clientId];
                const character = createCharacter(clientId);
                character.position.set(state.position.x, state.position.y, state.position.z);
                character.rotation.y = state.rotation.y;
                character.hp = state.hp || 100; // 초기 hp 설정
                updateHPBar(character);
            });
        }
    } else if (data.type === 'newPlayer') {
        // 새로운 플레이어 추가
        createCharacter(data.id);
        setupPeerConnection(data.id, true);
    } else if (data.type === 'removePlayer') {
        // 플레이어 제거
        const player = players[data.id];
        if (player) {
            scene.remove(player);
            delete players[data.id];
        }
        removePeerConnection(data.id);
    } else if (data.type === 'update') {
        // 플레이어 위치 및 회전 업데이트
        let player = players[data.id];
        if (player) {
            player.position.set(data.position.x, data.position.y, data.position.z);
            player.rotation.y = data.rotation.y;
        }
    } else if (data.type === 'damage') {
        // 피해 이벤트 처리
        let player = players[data.targetId];
        if (player) {
            player.hp -= data.damage;
            console.log(`플레이어 ${data.targetId}이(가) 피해를 입었습니다. HP: ${player.hp}`);
            updateHPBar(player);
            if (player.hp <= 0) {
                player.hp = 0;
                // 캐릭터 쓰러짐
                player.rotation.x = Math.PI / 2;
            }
        }
    } else if (data.type === 'attack') {
        // 공격 이벤트 처리
        const attacker = players[data.id];
        if (attacker) {
            performAttack(attacker);
        }
    } else if (data.type === 'shoot') {
        // 총 발사 이벤트 처리
        const shooter = players[data.id];
        if (shooter) {
            performShoot(shooter);
        }
    }
};


voiceWs.onopen = async () => {
    console.log('Connected to voice WebSocket server');

    try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('Audio stream captured');
    } catch (error) {
        console.error('Error accessing audio stream:', error);
        alert('Your browser does not support audio stream capture or the site is not served over HTTPS.');
        return;
    }

    voiceWs.send(JSON.stringify({ type: 'newPlayer' }));
};

voiceWs.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'offer') {
        handleOffer(data.offer, data.id);
    } else if (data.type === 'answer') {
        handleAnswer(data.answer, data.id);
    } else if (data.type === 'candidate') {
        handleCandidate(data.candidate, data.id);
    }
};



ws.onclose = () => {
    Object.keys(players).forEach(id => {
        scene.remove(players[id]);
        delete players[id];
    });
};

function sendUpdate() {
    if (localCharacter) {
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
}

function sendAttack() {
    ws.send(JSON.stringify({
        type: 'attack',
        id: ws.id
    }));
}

function sendShoot() {
    ws.send(JSON.stringify({
        type: 'shoot',
        id: ws.id
    }));
}

function setupPeerConnection(id, createOffer) {
    const pc = new RTCPeerConnection({
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }
        ]
    });

    peerConnections[id] = pc;
    console.log(pc);
    audioElements[id] = document.createElement('audio');
    document.body.appendChild(audioElements[id]);

    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

    pc.ontrack = (event) => {
        const audioElement = audioElements[id];
        if (audioElement) {
            audioElement.srcObject = event.streams[0];
            audioElement.play().catch(error => {
                console.error('Error playing audio:', error);
            });
        }
    };

    pc.onicecandidate = (event) => {
        if (event.candidate) {
            ws.send(JSON.stringify({
                type: 'candidate',
                candidate: event.candidate,
                id: id
            }));
        }
    };

    pc.oniceconnectionstatechange = () => {
        console.log(`ICE connection state: ${pc.iceConnectionState}`);
    };

    pc.onconnectionstatechange = () => {
        console.log(`Connection state: ${pc.connectionState}`);
    };

    if (createOffer) {
        pc.createOffer().then(offer => {
            return pc.setLocalDescription(offer);
        }).then(() => {
            ws.send(JSON.stringify({
                type: 'offer',
                offer: pc.localDescription,
                id: id
            }));
        }).catch(error => {
            console.error('Error creating or setting local description:', error);
        });
    }
}

function handleOffer(offer, id) {
    const pc = setupPeerConnection(id, false);
    pc.setRemoteDescription(new RTCSessionDescription(offer)).then(() => {
        return pc.createAnswer();
    }).then(answer => {
        return pc.setLocalDescription(answer);
    }).then(() => {
        ws.send(JSON.stringify({
            type: 'answer',
            answer: pc.localDescription,
            id: id
        }));
    }).catch(error => {
        console.error('Error handling offer:', error);
    });
}


function handleAnswer(answer, id) {
    const pc = peerConnections[id];
    pc.setRemoteDescription(new RTCSessionDescription(answer)).catch(error => {
        console.error('Error setting remote description:', error);
    });
}

function handleCandidate(candidate, id) {
    const pc = peerConnections[id];
    pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(error => {
        console.error('Error adding ICE candidate:', error);
    });
}

function removePeerConnection(id) {
    if (peerConnections[id]) {
        peerConnections[id].close();
        delete peerConnections[id];
    }
    if (audioElements[id]) {
        document.body.removeChild(audioElements[id]);
        delete audioElements[id];
    }
}

// 음성 감지 초기화 함수
function initAudioDetection(stream) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    const javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

    analyser.smoothingTimeConstant = 0.3;
    analyser.fftSize = 1024;

    microphone.connect(analyser);
    analyser.connect(javascriptNode);
    javascriptNode.connect(audioContext.destination);

    javascriptNode.onaudioprocess = function () {
        const array = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);
        let values = 0;

        for (let i = 0; i < array.length; i++) {
            values += array[i];
        }

        const average = values / array.length;

        // console.log("Current volume: " + average);
    }
}


// 이 함수는 캐릭터가 공격을 수행하는 로직을 실행합니다.
function performAttack(attacker) {
    if (!attacker) return;

    // 공격 애니메이션 및 논리를 추가합니다.
    const rightArm = attacker.getObjectByName("rightArm");
    if (rightArm) {
        const originalRotation = rightArm.rotation.x;
        const attackMotion = { x: 0 };
        const swingUpSpeed = 0.2;
        const swingDownSpeed = 0.3;
        const maxSwing = 2 * Math.PI / 3;
        let hitDetected = false;

        const animateSwingUp = () => {
            rightArm.rotation.x = originalRotation - attackMotion.x;
            if (attackMotion.x < maxSwing) {
                attackMotion.x += swingUpSpeed;
                requestAnimationFrame(animateSwingUp);
            } else {
                setTimeout(animateSwingDown, 50);
            }
        };

        const animateSwingDown = () => {
            rightArm.rotation.x = originalRotation - attackMotion.x;
            if (attackMotion.x > 0) {
                attackMotion.x -= swingDownSpeed;
                requestAnimationFrame(animateSwingDown);
            } else {
                rightArm.rotation.x = originalRotation;
            }
        };

        const attackRange = new THREE.Sphere(new THREE.Vector3(), 1);
        attackRange.center.copy(attacker.position);

        const checkHit = () => {
            if (hitDetected) return;

            for (const id in players) {
                const player = players[id];
                if (player !== attacker) {
                    player.updateWorldMatrix(true, false);
                    const playerBox = new THREE.Box3().setFromObject(player);
                    if (attackRange.intersectsBox(playerBox)) {
                        console.log('공격 적중!');

                        player.hp -= 10;
                        updateHPBar(player);

                        if (player.hp <= 0) {
                            player.hp = 0;
                            player.rotation.x = Math.PI / 2;
                        }

                        ws.send(JSON.stringify({
                            type: 'damage',
                            targetId: id,
                            damage: 10
                        }));

                        hitDetected = true;
                        break;
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
                        }
                    };
                    animateReturn();
                }, 50);
            }
            checkHit();
        };

        animateSwing();
    }
}

// 이 함수는 캐릭터가 총을 발사하는 로직을 실행합니다.
function performShoot(shooter) {
    if (!shooter) return;

    const rightArm = shooter.getObjectByName("rightArm");
    if (rightArm) {
        const originalRotation = rightArm.rotation.x;
        const shootMotion = { x: 0 };
        const shootUpSpeed = 0.2;
        const shootDownSpeed = 0.1;

        const animateShootUp = () => {
            rightArm.rotation.x = originalRotation - shootMotion.x;
            if (shootMotion.x < Math.PI / 2) {
                shootMotion.x += shootUpSpeed;
                requestAnimationFrame(animateShootUp);
            } else {
                setTimeout(shootBullet, 50);
            }
        };

        const animateShootDown = () => {
            rightArm.rotation.x = originalRotation - shootMotion.x;
            if (shootMotion.x > 0) {
                shootMotion.x -= shootDownSpeed;
                requestAnimationFrame(animateShootDown);
            } else {
                rightArm.rotation.x = originalRotation;
            }
        };

        const shootBullet = () => {
            const bullet = createBullet();
            const gunPosition = new THREE.Vector3(0, -0.3, 0);
            rightArm.localToWorld(gunPosition);
            bullet.position.copy(gunPosition);
            bullet.quaternion.copy(shooter.quaternion);

            const direction = new THREE.Vector3();
            shooter.getWorldDirection(direction);
            bullet.userData.velocity = direction.multiplyScalar(0.2);
            bullet.userData.startPosition = bullet.position.clone();

            animateShootDown();
        };

        animateShootUp();
    }
}

function createBullet() {
    const bulletGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
    scene.add(bullet);
    bullets.push(bullet);
    return bullet;
}

function updateBullets() {
    bullets.forEach(bullet => {
        bullet.position.add(bullet.userData.velocity);
        const distance = bullet.userData.startPosition.distanceTo(bullet.position);

        // 총알이 플레이어와 충돌했는지 검사
        for (const id in players) {
            const player = players[id];
            const playerBox = new THREE.Box3().setFromObject(player);
            const bulletBox = new THREE.Box3().setFromObject(bullet);

            if (bulletBox.intersectsBox(playerBox)) {
                console.log(`총알이 플레이어 ${id}에 맞았습니다!`);
                ws.send(JSON.stringify({
                    type: 'damage',
                    targetId: id,
                    damage: 10
                }));
                scene.remove(bullet);
                bullets = bullets.filter(b => b !== bullet);
                break;
            }
        }

        // 총알이 일정 거리 이상 이동하면 삭제
        if (distance > 20) {
            scene.remove(bullet);
            bullets = bullets.filter(b => b !== bullet);
        }
    });
}
// function animate() {
//     requestAnimationFrame(animate);
//     moveCharacter();
//     followCharacter();
//     detectCharacterCollision();
//     updateBullets();
//     renderer.render(scene, camera);

//     sendUpdate(); // 캐릭터 위치 및 회전 정보를 서버로 전송
// }

// animate();
