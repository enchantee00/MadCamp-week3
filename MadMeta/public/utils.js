export function createWall(scene, width, height, color, x, y, z, rotationY = 0) {
    const wallGeometry = new THREE.PlaneGeometry(width, height);
    const wallMaterial = new THREE.MeshLambertMaterial({ color }); // 안정적인 렌더링을 위해 LambertMaterial 사용
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.set(x, y, z);
    wall.rotation.y = rotationY;
    scene.add(wall);
    return wall;
}

export function createDoor(scene, x, y, z, rotationY = 0) {
    const doorGeometry = new THREE.PlaneGeometry(4, 10);
    const doorMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 }); // 안정적인 렌더링을 위해 LambertMaterial 사용
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(x, y, z);
    // door.rotation.y = rotationY;
    scene.add(door);
    return door;
}

export function createDesk(scene, x, y, z) {
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

export function createTree(scene, x, y, z) {
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

export function createBench(scene, x, y, z) {
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

export function createLamp(scene, x, y, z) {
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
