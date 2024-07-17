// Voice WebSocket
const voiceWs = new WebSocket('wss://localhost:8081');
const peerConnections = {};
const audioElements = {};
let localStream = null;

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
