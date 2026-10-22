import * as THREE from 'three'
import { Sky } from 'three/addons/objects/Sky.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

// =============================================
// СЦЕНА
// =============================================
const scene = new THREE.Scene()

// =============================================
// ТУМАН
// =============================================
scene.fog = new THREE.FogExp2('#04343f', 0.08)

// =============================================
// КАМЕРА
// =============================================
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    100
)
camera.position.set(6, 3, 8)
scene.add(camera)

// =============================================
// РЕНДЕРЕР
// =============================================
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
document.body.appendChild(renderer.domElement)

// =============================================
// ORBIT CONTROLS (щоб можна було крутити камеру)
// =============================================
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true

// =============================================
// ТЕКСТУРИ (зроблені програмно через canvas)
// =============================================

// Функція для створення текстури з canvas
function makeTexture(drawFn, width = 512, height = 512) {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    drawFn(ctx, width, height)
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    return texture
}

// Текстура цегли (для стін)
const wallTexture = makeTexture((ctx, w, h) => {
    ctx.fillStyle = '#8B5E3C'
    ctx.fillRect(0, 0, w, h)
    const bW = 64, bH = 32
    for (let row = 0; row < h / bH; row++) {
        for (let col = -1; col < w / bW + 1; col++) {
            const offset = row % 2 === 0 ? 0 : bW / 2
            ctx.fillStyle = '#6B3A1F'
            ctx.fillRect(col * bW - offset + 2, row * bH + 2, bW - 4, bH - 4)
        }
    }
})
wallTexture.repeat.set(2, 1)

// Текстура трави (для землі)
const groundTexture = makeTexture((ctx, w, h) => {
    ctx.fillStyle = '#2D5A1B'
    ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 3000; i++) {
        const x = Math.random() * w
        const y = Math.random() * h
        ctx.fillStyle = Math.random() > 0.5 ? '#1E3D12' : '#3A7024'
        ctx.fillRect(x, y, 3, 3)
    }
})
groundTexture.repeat.set(8, 8)

// Текстура для дверей (дерево)
const doorTexture = makeTexture((ctx, w, h) => {
    ctx.fillStyle = '#5C3317'
    ctx.fillRect(0, 0, w, h)
    // Горизонтальні дошки
    ctx.fillStyle = '#3B2010'
    for (let row = 0; row < h / 40; row++) {
        ctx.fillRect(0, row * 40, w, 2)
    }
    // Завіси
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(20, h * 0.2, 20, 20)
    ctx.fillRect(20, h * 0.7, 20, 20)
})

// Текстура даху (черепиця)
const roofTexture = makeTexture((ctx, w, h) => {
    ctx.fillStyle = '#4a1a1a'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = '#3a0f0f'
    for (let row = 0; row < h / 20; row++) {
        for (let col = 0; col < w / 30 + 1; col++) {
            const offset = row % 2 === 0 ? 0 : 15
            ctx.strokeStyle = '#2a0a0a'
            ctx.strokeRect(col * 30 - offset, row * 20, 30, 20)
        }
    }
})
roofTexture.repeat.set(3, 1)

// =============================================
// ЗЕМЛЯ
// =============================================
const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.MeshStandardMaterial({ map: groundTexture })
)
ground.rotation.x = -Math.PI / 2
ground.receiveShadow = true
scene.add(ground)

// =============================================
// БУДИНОК
// =============================================
const house = new THREE.Group()
scene.add(house)

// -- Стіни --
const walls = new THREE.Mesh(
    new THREE.BoxGeometry(4, 2.5, 4),
    new THREE.MeshStandardMaterial({ map: wallTexture })
)
walls.position.y = 2.5 / 2
walls.castShadow = true
walls.receiveShadow = true
house.add(walls)

// -- Дах --
const roof = new THREE.Mesh(
    new THREE.ConeGeometry(3.2, 1.5, 4),
    new THREE.MeshStandardMaterial({ map: roofTexture })
)
roof.position.y = 2.5 + 0.75
roof.rotation.y = Math.PI / 4
roof.castShadow = true
house.add(roof)

// -- Двері --
const door = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1.8),
    new THREE.MeshStandardMaterial({ map: doorTexture })
)
door.position.set(0, 1.8 / 2, 2.001)
house.add(door)

// -- Вікна (прості квадрати) --
const windowMaterial = new THREE.MeshStandardMaterial({
    color: '#ffdd88',
    emissive: '#ffaa00',
    emissiveIntensity: 0.3,
})
const windowGeometry = new THREE.PlaneGeometry(0.7, 0.7)

const windowLeft = new THREE.Mesh(windowGeometry, windowMaterial)
windowLeft.position.set(-1.2, 1.4, 2.001)
house.add(windowLeft)

const windowRight = new THREE.Mesh(windowGeometry, windowMaterial)
windowRight.position.set(1.2, 1.4, 2.001)
house.add(windowRight)

// =============================================
// ПАРКАН
// =============================================
const fenceMaterial = new THREE.MeshStandardMaterial({ color: '#5c3d1e' })

for (let i = -7; i <= 7; i++) {
    // Передній паркан (з проходом посередині)
    if (Math.abs(i) > 1) {
        const post = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, 1.2, 0.15),
            fenceMaterial
        )
        post.position.set(i, 0.6, 7)
        post.castShadow = true
        scene.add(post)
    }

    // Бічні паркани
    const postLeft = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 1.2, 0.15),
        fenceMaterial
    )
    postLeft.position.set(-7, 0.6, i)
    postLeft.castShadow = true
    scene.add(postLeft)

    const postRight = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 1.2, 0.15),
        fenceMaterial
    )
    postRight.position.set(7, 0.6, i)
    postRight.castShadow = true
    scene.add(postRight)
}

// =============================================
// МОГИЛИ
// =============================================
const graves = new THREE.Group()
scene.add(graves)

const graveGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.2)
const graveMaterial = new THREE.MeshStandardMaterial({ color: '#b2b6b1' })

for (let i = 0; i < 18; i++) {
    const angle = Math.random() * Math.PI * 2
    const radius = 4 + Math.random() * 4
    const x = Math.sin(angle) * radius
    const z = Math.cos(angle) * radius

    const grave = new THREE.Mesh(graveGeometry, graveMaterial)
    grave.position.set(x, 0.3, z)
    grave.rotation.y = (Math.random() - 0.5) * 0.5
    grave.rotation.z = (Math.random() - 0.5) * 0.15
    grave.castShadow = true
    grave.receiveShadow = true
    graves.add(grave)
}

// =============================================
// ДЕРЕВА (прості конуси + циліндри)
// =============================================
const treeTrunkMat = new THREE.MeshStandardMaterial({ color: '#5c3317' })
const treeTopMat = new THREE.MeshStandardMaterial({ color: '#1a4d1a' })

const treePositions = [
    [-9, 9], [9, 9], [-9, -9], [9, -9],
    [-11, 0], [11, 0], [0, 11], [0, -11],
]

for (const [x, z] of treePositions) {
    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.2, 1, 6),
        treeTrunkMat
    )
    trunk.position.set(x, 0.5, z)
    trunk.castShadow = true
    scene.add(trunk)

    const top = new THREE.Mesh(
        new THREE.ConeGeometry(0.8, 2, 6),
        treeTopMat
    )
    top.position.set(x, 2, z)
    top.castShadow = true
    scene.add(top)
}

// =============================================
// ОСВІТЛЕННЯ
// =============================================

// Навколишнє (слабке синє — нічне небо)
const ambientLight = new THREE.AmbientLight('#86cdff', 0.3)
scene.add(ambientLight)

// Місяць (направлене світло)
const moonLight = new THREE.DirectionalLight('#86cdff', 1.5)
moonLight.position.set(-5, 8, -5)
moonLight.castShadow = true
moonLight.shadow.mapSize.width = 1024
moonLight.shadow.mapSize.height = 1024
scene.add(moonLight)

// Світло біля дверей (жовтогаряче)
const doorLight = new THREE.PointLight('#ff7d46', 5, 7)
doorLight.position.set(0, 2.3, 2.8)
doorLight.castShadow = true
scene.add(doorLight)

// =============================================
// ПРИВИДИ (PointLight — без меша, просто світло)
// =============================================
const ghost1 = new THREE.PointLight('#8800ff', 6, 3)
scene.add(ghost1)

const ghost2 = new THREE.PointLight('#ff0088', 6, 3)
scene.add(ghost2)

const ghost3 = new THREE.PointLight('#ff0000', 6, 3)
scene.add(ghost3)

// =============================================
// НЕБО (Three.js Sky addon)
// =============================================
const sky = new Sky()
sky.scale.setScalar(100)
scene.add(sky)

const skyUniforms = sky.material.uniforms
skyUniforms['turbidity'].value = 10
skyUniforms['rayleigh'].value = 3
skyUniforms['mieCoefficient'].value = 0.1
skyUniforms['mieDirectionalG'].value = 0.95
// Сонце за горизонтом — нічна сцена
skyUniforms['sunPosition'].value.set(0.3, -0.038, -0.95)

// =============================================
// АНІМАЦІЯ
// =============================================
const clock = new THREE.Clock()

function animate() {
    const elapsed = clock.getElapsedTime()

    // --- Привиди літають по колу ---
    const ghost1Angle = elapsed * 0.5
    ghost1.position.x = Math.cos(ghost1Angle) * 4
    ghost1.position.z = Math.sin(ghost1Angle) * 4
    ghost1.position.y = Math.sin(elapsed * 2.34) + Math.sin(elapsed * 3.45)

    const ghost2Angle = -elapsed * 0.38
    ghost2.position.x = Math.cos(ghost2Angle) * 5
    ghost2.position.z = Math.sin(ghost2Angle) * 5
    ghost2.position.y = Math.sin(elapsed * 1.5) + Math.sin(elapsed * 2.5)

    const ghost3Angle = elapsed * 0.23
    ghost3.position.x = Math.cos(ghost3Angle) * 6
    ghost3.position.z = Math.sin(ghost3Angle) * 6
    ghost3.position.y = Math.sin(elapsed * 3) + Math.sin(elapsed * 1.5)

    // --- Миготіння світла біля дверей ---
    doorLight.intensity = 4 + Math.sin(elapsed * 8) * 1.5

    // --- Оновлення controls ---
    controls.update()

    renderer.render(scene, camera)
    requestAnimationFrame(animate)
}

animate()

// =============================================
// РЕСАЙЗ ВІКНА
// =============================================
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

