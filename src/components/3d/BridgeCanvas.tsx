import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { 
  BridgeGeometry, 
  BridgeStructural, 
  WindParameters, 
  ModeShapeData, 
  SensorData,
  CameraPreset 
} from '../../types/bridge';

interface BridgeCanvasProps {
  geometry: BridgeGeometry;
  structural: BridgeStructural;
  wind: WindParameters;
  activeMode: ModeShapeData;
  vibrationAmplitude: number; // in meters
  vortexFrequency: number;
  magnification: number;      // 1x, 2x, 5x, 10x, 20x
  engineeringView: boolean;
  sensors: SensorData[];
  selectedSensorId: string | null;
  onSelectSensor: (sensorId: string) => void;
  cameraPreset: CameraPreset;
  onResetPreset?: () => void;
  showVortices?: boolean;
}

export const BridgeCanvas: React.FC<BridgeCanvasProps> = ({
  geometry,
  structural,
  wind,
  activeMode,
  vibrationAmplitude,
  vortexFrequency,
  magnification,
  engineeringView,
  sensors,
  selectedSensorId,
  onSelectSensor,
  cameraPreset,
  showVortices = true
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  // References to dynamic meshes & objects
  const deckMeshRef = useRef<THREE.Mesh | null>(null);
  const deckBaseGeomRef = useRef<Float32Array | null>(null);
  const trussLinesRef = useRef<THREE.LineSegments | null>(null);
  const trussBaseGeomRef = useRef<Float32Array | null>(null);
  const leftCableRef = useRef<THREE.Line | null>(null);
  const rightCableRef = useRef<THREE.Line | null>(null);
  const hangersRef = useRef<THREE.LineSegments | null>(null);
  const hangersBaseRef = useRef<Float32Array | null>(null);
  const windParticlesRef = useRef<THREE.Points | null>(null);
  const vortexParticlesRef = useRef<THREE.Points | null>(null);
  const sensorGroupRef = useRef<THREE.Group | null>(null);
  const engineeringGroupRef = useRef<THREE.Group | null>(null);

  // Animation and camera target refs
  const timeRef = useRef<number>(0);
  const cameraTargetRef = useRef<{ pos: THREE.Vector3; lookAt: THREE.Vector3 }>({
    pos: new THREE.Vector3(120, 65, 140),
    lookAt: new THREE.Vector3(0, 15, 0)
  });
  const currentLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 15, 0));

  // Mouse interaction state for camera orbit/pan
  const isDraggingRef = useRef<boolean>(false);
  const dragButtonRef = useRef<number>(0); // 0 = left orbit, 2 = right pan
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const sphericalRef = useRef<{ radius: number; theta: number; phi: number }>({
    radius: 190,
    theta: Math.PI / 4,
    phi: Math.PI / 3
  });

  // Calculate total bridge length and towers positioning
  const totalLength = geometry.span1 + geometry.mainSpan1 + geometry.mainSpan2 + geometry.span4;
  const halfLen = totalLength / 2;
  const tower1X = -halfLen + geometry.span1;
  const tower2X = tower1X + geometry.mainSpan1;
  const tower3X = tower2X + geometry.mainSpan2;
  const deckWidth = geometry.deckWidth;
  const halfWidth = deckWidth / 2;
  const towerH = geometry.towerHeight;
  const sag = geometry.cableSag;

  // Handle camera presets smoothly
  useEffect(() => {
    const target = cameraTargetRef.current;
    switch (cameraPreset) {
      case 'overview':
        target.pos.set(130, 75, 150);
        target.lookAt.set(0, 15, 0);
        break;
      case 'main_span':
        target.pos.set(0, 25, 45);
        target.lookAt.set(0, 18, 0);
        break;
      case 'tower':
        target.pos.set(tower2X + 35, towerH + 10, 40);
        target.lookAt.set(tower2X, towerH * 0.7, 0);
        break;
      case 'deck':
        target.pos.set(-halfLen + 15, 18.5, 0);
        target.lookAt.set(0, 18.5, 0);
        break;
      case 'sensors':
        target.pos.set(30, 85, 95);
        target.lookAt.set(10, 15, 0);
        break;
      case 'harvester':
        target.pos.set(-5, 8, -25);
        target.lookAt.set(0, 14, 0);
        break;
      case 'resonance':
        target.pos.set(0, 30, 180);
        target.lookAt.set(0, 20, 0);
        break;
    }
  }, [cameraPreset, halfLen, tower1X, tower2X, towerH]);

  // Main Scene Initialization
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x060913); // Deep engineering dark navy/black
    scene.fog = new THREE.FogExp2(0x060913, 0.0018);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 2000);
    camera.position.set(130, 75, 150);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 1. Lighting
    const ambientLight = new THREE.AmbientLight(0x1a2639, 1.8);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff5e6, 2.2);
    sunLight.position.set(120, 180, 100);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 450;
    sunLight.shadow.camera.left = -160;
    sunLight.shadow.camera.right = 160;
    sunLight.shadow.camera.top = 140;
    sunLight.shadow.camera.bottom = -140;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x00e5ff, 0.6); // Cyan engineering accent light
    fillLight.position.set(-140, 80, -90);
    scene.add(fillLight);

    // 2. Water / Estuary Ground Plane
    const waterGeom = new THREE.PlaneGeometry(1200, 1200, 48, 48);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x07111e,
      roughness: 0.15,
      metalness: 0.85,
      wireframe: false
    });
    const water = new THREE.Mesh(waterGeom, waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = -6;
    water.receiveShadow = true;
    scene.add(water);

    // Subtle water engineering grid
    const waterGrid = new THREE.GridHelper(1000, 50, 0x00e5ff, 0x112233);
    waterGrid.position.y = -5.8;
    waterGrid.material.opacity = 0.15;
    waterGrid.material.transparent = true;
    scene.add(waterGrid);

    // 3. Realistic Suspension Bridge Construction
    const bridgeGroup = new THREE.Group();
    scene.add(bridgeGroup);

    // --- Concrete Foundations & Piers ---
    const pierMat = new THREE.MeshStandardMaterial({
      color: 0x222a36,
      roughness: 0.7,
      metalness: 0.2
    });
    const towerMat = new THREE.MeshStandardMaterial({
      color: 0xff7a00, // Signature VortexBridge industrial safety orange
      roughness: 0.35,
      metalness: 0.65
    });
    const darkSteelMat = new THREE.MeshStandardMaterial({
      color: 0x1b2430,
      roughness: 0.4,
      metalness: 0.8
    });

    const towerPositions = [tower1X, tower2X, tower3X];

    towerPositions.forEach((tx) => {
      // Pier Base in water
      const pierGeom = new THREE.BoxGeometry(16, 26, deckWidth + 12);
      const pier = new THREE.Mesh(pierGeom, pierMat);
      pier.position.set(tx, 4, 0);
      pier.castShadow = true;
      pier.receiveShadow = true;
      bridgeGroup.add(pier);

      // Pylon Legs (Left & Right)
      const pylonH = towerH;
      const legGeom = new THREE.BoxGeometry(3.2, pylonH, 3.6);

      const leftLeg = new THREE.Mesh(legGeom, towerMat);
      leftLeg.position.set(tx, 16 + pylonH / 2, halfWidth + 1.8);
      leftLeg.castShadow = true;
      bridgeGroup.add(leftLeg);

      const rightLeg = new THREE.Mesh(legGeom, towerMat);
      rightLeg.position.set(tx, 16 + pylonH / 2, -halfWidth - 1.8);
      rightLeg.castShadow = true;
      bridgeGroup.add(rightLeg);

      // Upper Cross Bracing & Saddle Crown
      const crossBeamGeom = new THREE.BoxGeometry(3.0, 2.5, deckWidth + 7.2);
      const crossBeam1 = new THREE.Mesh(crossBeamGeom, darkSteelMat);
      crossBeam1.position.set(tx, 16 + pylonH * 0.55, 0);
      crossBeam1.castShadow = true;
      bridgeGroup.add(crossBeam1);

      const crossBeamTop = new THREE.Mesh(crossBeamGeom, darkSteelMat);
      crossBeamTop.position.set(tx, 16 + pylonH - 2, 0);
      crossBeamTop.castShadow = true;
      bridgeGroup.add(crossBeamTop);

      // Saddle caps
      const capGeom = new THREE.CylinderGeometry(2.0, 2.2, 3.0, 16);
      const capLeft = new THREE.Mesh(capGeom, darkSteelMat);
      capLeft.position.set(tx, 16 + pylonH + 1.5, halfWidth + 1.8);
      capLeft.rotation.z = Math.PI / 2;
      bridgeGroup.add(capLeft);

      const capRight = new THREE.Mesh(capGeom, darkSteelMat);
      capRight.position.set(tx, 16 + pylonH + 1.5, -halfWidth - 1.8);
      capRight.rotation.z = Math.PI / 2;
      bridgeGroup.add(capRight);
    });

    // Abutments / Anchorages at both ends
    const anchorGeom = new THREE.BoxGeometry(22, 28, deckWidth + 16);
    const leftAnchor = new THREE.Mesh(anchorGeom, pierMat);
    leftAnchor.position.set(-halfLen - 10, 4, 0);
    bridgeGroup.add(leftAnchor);

    const rightAnchor = new THREE.Mesh(anchorGeom, pierMat);
    rightAnchor.position.set(halfLen + 10, 4, 0);
    bridgeGroup.add(rightAnchor);

    // --- Dynamic Deck Mesh ---
    const deckSegments = 160;
    const deckGeom = new THREE.PlaneGeometry(totalLength, deckWidth, deckSegments, 8);
    deckGeom.rotateX(-Math.PI / 2);
    deckGeom.translate(0, 17, 0);

    // Store un-deformed base vertex positions for modal superposition
    const deckPosAttr = deckGeom.attributes.position;
    const deckBasePos = new Float32Array(deckPosAttr.array.length);
    deckBasePos.set(deckPosAttr.array);
    deckBaseGeomRef.current = deckBasePos;

    // Deck Material: Asphalt road with subtle metallic sheen & concrete curb edges
    const deckMat = new THREE.MeshStandardMaterial({
      color: 0x181e28,
      roughness: 0.8,
      metalness: 0.2,
      side: THREE.DoubleSide
    });
    const deckMesh = new THREE.Mesh(deckGeom, deckMat);
    deckMesh.castShadow = true;
    deckMesh.receiveShadow = true;
    bridgeGroup.add(deckMesh);
    deckMeshRef.current = deckMesh;

    // Road markings (lane lines and curb barriers)
    const markingsGeom = new THREE.PlaneGeometry(totalLength, 0.4, 80, 1);
    markingsGeom.rotateX(-Math.PI / 2);
    markingsGeom.translate(0, 17.06, 0);
    const markingsMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.7 });
    const centerLine = new THREE.Mesh(markingsGeom, markingsMat);
    bridgeGroup.add(centerLine);

    // --- Deck Structural Truss Beams ---
    const trussLinePositions: number[] = [];
    for (let i = 0; i <= deckSegments; i++) {
      const x = -halfLen + (i / deckSegments) * totalLength;
      // Cross floor beams under deck
      trussLinePositions.push(x, 17, -halfWidth, x, 17, halfWidth);
      // Vertical truss posts
      trussLinePositions.push(x, 17, -halfWidth, x, 14.5, -halfWidth);
      trussLinePositions.push(x, 17, halfWidth, x, 14.5, halfWidth);
      // Bottom chord connection
      trussLinePositions.push(x, 14.5, -halfWidth, x, 14.5, halfWidth);
    }
    // Longitudinal bottom chords
    trussLinePositions.push(-halfLen, 14.5, -halfWidth, halfLen, 14.5, -halfWidth);
    trussLinePositions.push(-halfLen, 14.5, halfWidth, halfLen, 14.5, halfWidth);

    const trussGeom = new THREE.BufferGeometry();
    trussGeom.setAttribute('position', new THREE.Float32BufferAttribute(trussLinePositions, 3));
    const trussBase = new Float32Array(trussLinePositions);
    trussBaseGeomRef.current = trussBase;

    const trussMat = new THREE.LineBasicMaterial({ color: 0x4a5d78, transparent: true, opacity: 0.85 });
    const trussLines = new THREE.LineSegments(trussGeom, trussMat);
    bridgeGroup.add(trussLines);
    trussLinesRef.current = trussLines;

    // --- Main Suspension Cables (Catenary Sag Geometry) ---
    const cablePointsCount = 240;
    const leftCablePositions = new Float32Array(cablePointsCount * 3);
    const rightCablePositions = new Float32Array(cablePointsCount * 3);

    function getCableY(x: number): number {
      const saddleY = 16 + towerH;
      const deckY = 17;
      // Span 1: anchor to tower 1
      if (x < tower1X) {
        const u = (x - (-halfLen)) / (tower1X - (-halfLen));
        return 4 + u * (saddleY - 4);
      }
      // Main Span 1: tower 1 to tower 2
      if (x >= tower1X && x < tower2X) {
        const mid = (tower1X + tower2X) / 2;
        const halfSpan = (tower2X - tower1X) / 2;
        const norm = (x - mid) / halfSpan;
        return saddleY - sag * (1 - norm * norm);
      }
      // Main Span 2: tower 2 to tower 3
      if (x >= tower2X && x < tower3X) {
        const mid = (tower2X + tower3X) / 2;
        const halfSpan = (tower3X - tower2X) / 2;
        const norm = (x - mid) / halfSpan;
        return saddleY - sag * (1 - norm * norm);
      }
      // Span 4: tower 3 to anchor
      const u = (x - tower3X) / (halfLen - tower3X);
      return saddleY - u * (saddleY - 4);
    }

    for (let i = 0; i < cablePointsCount; i++) {
      const x = -halfLen + (i / (cablePointsCount - 1)) * totalLength;
      const y = getCableY(x);
      leftCablePositions[i * 3] = x;
      leftCablePositions[i * 3 + 1] = y;
      leftCablePositions[i * 3 + 2] = halfWidth + 1.8;

      rightCablePositions[i * 3] = x;
      rightCablePositions[i * 3 + 1] = y;
      rightCablePositions[i * 3 + 2] = -halfWidth - 1.8;
    }

    const cableMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
    const leftCableGeom = new THREE.BufferGeometry();
    leftCableGeom.setAttribute('position', new THREE.BufferAttribute(leftCablePositions, 3));
    const leftCable = new THREE.Line(leftCableGeom, cableMat);
    bridgeGroup.add(leftCable);
    leftCableRef.current = leftCable;

    const rightCableGeom = new THREE.BufferGeometry();
    rightCableGeom.setAttribute('position', new THREE.BufferAttribute(rightCablePositions, 3));
    const rightCable = new THREE.Line(rightCableGeom, cableMat);
    bridgeGroup.add(rightCable);
    rightCableRef.current = rightCable;

    // --- Vertical Hanger Cables ---
    const hangerCount = 80;
    const hangerLinesPos: number[] = [];
    for (let i = 1; i < hangerCount; i++) {
      const x = -halfLen + (i / hangerCount) * totalLength;
      // Skip right at tower piers
      if (Math.abs(x - tower1X) < 3.5 || Math.abs(x - tower2X) < 3.5 || Math.abs(x - tower3X) < 3.5) continue;
      const topY = getCableY(x);
      const botY = 17;
      if (topY > botY + 0.5) {
        // Left hanger
        hangerLinesPos.push(x, botY, halfWidth + 1.8, x, topY, halfWidth + 1.8);
        // Right hanger
        hangerLinesPos.push(x, botY, -halfWidth - 1.8, x, topY, -halfWidth - 1.8);
      }
    }

    const hangerGeom = new THREE.BufferGeometry();
    hangerGeom.setAttribute('position', new THREE.Float32BufferAttribute(hangerLinesPos, 3));
    const hangerBase = new Float32Array(hangerLinesPos);
    hangersBaseRef.current = hangerBase;

    const hangerMat = new THREE.LineBasicMaterial({ color: 0x93a7c3, transparent: true, opacity: 0.65 });
    const hangers = new THREE.LineSegments(hangerGeom, hangerMat);
    bridgeGroup.add(hangers);
    hangersRef.current = hangers;

    // 4. Wind Streamlines Particle System
    const particleCount = 450;
    const windGeom = new THREE.BufferGeometry();
    const windPos = new Float32Array(particleCount * 3);
    const windColors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      windPos[i * 3] = (Math.random() - 0.5) * totalLength * 1.1;
      windPos[i * 3 + 1] = 6 + Math.random() * 38;
      windPos[i * 3 + 2] = -90 + Math.random() * 180;

      // Cyan to light blue particles
      windColors[i * 3] = 0.0;
      windColors[i * 3 + 1] = 0.8 + Math.random() * 0.2;
      windColors[i * 3 + 2] = 1.0;
    }
    windGeom.setAttribute('position', new THREE.BufferAttribute(windPos, 3));
    windGeom.setAttribute('color', new THREE.BufferAttribute(windColors, 3));

    const windMat = new THREE.PointsMaterial({
      size: 1.4,
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending
    });
    const windParticles = new THREE.Points(windGeom, windMat);
    scene.add(windParticles);
    windParticlesRef.current = windParticles;

    // 5. Vortex Shedding Swirling Particles
    const vortexCount = 200;
    const vortexGeom = new THREE.BufferGeometry();
    const vortexPos = new Float32Array(vortexCount * 3);
    const vortexColors = new Float32Array(vortexCount * 3);

    for (let i = 0; i < vortexCount; i++) {
      vortexPos[i * 3] = (Math.random() - 0.5) * totalLength * 0.9;
      vortexPos[i * 3 + 1] = 17 + (Math.random() - 0.5) * 8;
      vortexPos[i * 3 + 2] = halfWidth + 4 + Math.random() * 35; // Downwind of deck

      // Amber / Orange vortex core glow
      vortexColors[i * 3] = 1.0;
      vortexColors[i * 3 + 1] = 0.45;
      vortexColors[i * 3 + 2] = 0.05;
    }
    vortexGeom.setAttribute('position', new THREE.BufferAttribute(vortexPos, 3));
    vortexGeom.setAttribute('color', new THREE.BufferAttribute(vortexColors, 3));

    const vortexMat = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });
    const vortexParticles = new THREE.Points(vortexGeom, vortexMat);
    scene.add(vortexParticles);
    vortexParticlesRef.current = vortexParticles;

    // 6. Sensor Badges & 3D Markers Group
    const sensorGroup = new THREE.Group();
    scene.add(sensorGroup);
    sensorGroupRef.current = sensorGroup;

    // 7. Engineering Overlay Group
    const engineeringGroup = new THREE.Group();
    scene.add(engineeringGroup);
    engineeringGroupRef.current = engineeringGroup;

    // Coordinate Axes at bridge origin
    const axes = new THREE.AxesHelper(30);
    axes.position.set(0, 17.5, 0);
    engineeringGroup.add(axes);

    // Dimension lines
    const dimMat = new THREE.LineDashedMaterial({
      color: 0x00e5ff,
      dashSize: 3,
      gapSize: 1.5,
      transparent: true,
      opacity: 0.7
    });
    const dimGeom = new THREE.BufferGeometry();
    const dimPoints = [
      new THREE.Vector3(-halfLen, 2, halfWidth + 20),
      new THREE.Vector3(halfLen, 2, halfWidth + 20)
    ];
    dimGeom.setFromPoints(dimPoints);
    const dimLine = new THREE.Line(dimGeom, dimMat);
    dimLine.computeLineDistances();
    engineeringGroup.add(dimLine);

    // Resize Handler
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Mouse Drag & Wheel Event Handlers for smooth Orbit / Pan
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      dragButtonRef.current = e.button;
      mousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !cameraRef.current) return;
      const dx = e.clientX - mousePosRef.current.x;
      const dy = e.clientY - mousePosRef.current.y;
      mousePosRef.current = { x: e.clientX, y: e.clientY };

      if (dragButtonRef.current === 0) {
        // Left click: Orbit
        sphericalRef.current.theta -= dx * 0.006;
        sphericalRef.current.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.02, sphericalRef.current.phi - dy * 0.006));

        const r = sphericalRef.current.radius;
        const target = cameraTargetRef.current.lookAt;
        cameraTargetRef.current.pos.set(
          target.x + r * Math.sin(sphericalRef.current.phi) * Math.sin(sphericalRef.current.theta),
          target.y + r * Math.cos(sphericalRef.current.phi),
          target.z + r * Math.sin(sphericalRef.current.phi) * Math.cos(sphericalRef.current.theta)
        );
      } else if (dragButtonRef.current === 2 || dragButtonRef.current === 1) {
        // Right click: Pan
        const panSpeed = 0.15;
        cameraTargetRef.current.lookAt.x -= dx * panSpeed;
        cameraTargetRef.current.lookAt.y += dy * panSpeed;
        cameraTargetRef.current.pos.x -= dx * panSpeed;
        cameraTargetRef.current.pos.y += dy * panSpeed;
      }
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY * 0.12;
      sphericalRef.current.radius = Math.max(15, Math.min(450, sphericalRef.current.radius + zoomFactor));
      const r = sphericalRef.current.radius;
      const target = cameraTargetRef.current.lookAt;
      cameraTargetRef.current.pos.set(
        target.x + r * Math.sin(sphericalRef.current.phi) * Math.sin(sphericalRef.current.theta),
        target.y + r * Math.cos(sphericalRef.current.phi),
        target.z + r * Math.sin(sphericalRef.current.phi) * Math.cos(sphericalRef.current.theta)
      );
    };

    const onContextMenu = (e: MouseEvent) => e.preventDefault();

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('contextmenu', onContextMenu);

    // Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      timeRef.current += 0.016;

      // Smooth Camera Lerp
      if (cameraRef.current) {
        cameraRef.current.position.lerp(cameraTargetRef.current.pos, 0.06);
        currentLookAtRef.current.lerp(cameraTargetRef.current.lookAt, 0.06);
        cameraRef.current.lookAt(currentLookAtRef.current);
      }

      // Render Scene
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('contextmenu', onContextMenu);
      renderer.dispose();
      container.innerHTML = '';
    };
  }, [totalLength, halfLen, tower1X, tower2X, tower3X, deckWidth, halfWidth, towerH, sag]);

  // Update Dynamic Structural Modal Deformation & Cables Every Frame
  useEffect(() => {
    let animFrame: number;

    const updateBridgeDeformation = () => {
      animFrame = requestAnimationFrame(updateBridgeDeformation);
      const t = timeRef.current;

      // Calculate smooth harmonic modal deflection amplitude:
      // a(t) = vibrationAmplitude * sin(2 * pi * f * t) * magnification
      const effectiveFreq = vortexFrequency > 0 ? vortexFrequency : activeMode.frequency;
      const modalFactor = Math.sin(2 * Math.PI * effectiveFreq * t);
      // Actual displacement in meters magnified for visualization
      const currentDispM = vibrationAmplitude * modalFactor * magnification;

      // 1. Deform Deck Vertices
      if (deckMeshRef.current && deckBaseGeomRef.current) {
        const posAttr = deckMeshRef.current.geometry.attributes.position;
        const base = deckBaseGeomRef.current;
        const count = posAttr.count;

        for (let i = 0; i < count; i++) {
          const x = base[i * 3];
          const y = base[i * 3 + 1];
          const z = base[i * 3 + 2];

          // Normalized span x in [0, 1]
          const xNorm = (x + halfLen) / totalLength;
          const modeVal = activeMode.shapeFunction(xNorm);

          // If Mode 2 (Torsional), deflection depends on lateral z offset
          const isTorsional = activeMode.type === 'Torsional';
          const torsionMod = isTorsional ? (z / halfWidth) : 1.0;

          // New Y position with smooth modal deformation
          posAttr.setY(i, y + modeVal * currentDispM * torsionMod);
        }
        posAttr.needsUpdate = true;
      }

      // 2. Deform Truss Beams Vertices
      if (trussLinesRef.current && trussBaseGeomRef.current) {
        const posAttr = trussLinesRef.current.geometry.attributes.position;
        const base = trussBaseGeomRef.current;
        const count = posAttr.count;

        for (let i = 0; i < count; i++) {
          const x = base[i * 3];
          const y = base[i * 3 + 1];
          const z = base[i * 3 + 2];

          const xNorm = (x + halfLen) / totalLength;
          const modeVal = activeMode.shapeFunction(xNorm);
          const isTorsional = activeMode.type === 'Torsional';
          const torsionMod = isTorsional ? (z / halfWidth) : 1.0;

          posAttr.setY(i, y + modeVal * currentDispM * torsionMod);
        }
        posAttr.needsUpdate = true;
      }

      // 3. Deform Hanger Cables (lower connection follows deck deflection)
      if (hangersRef.current && hangersBaseRef.current) {
        const posAttr = hangersRef.current.geometry.attributes.position;
        const base = hangersBaseRef.current;
        const count = posAttr.count;

        for (let i = 0; i < count; i += 2) {
          // Bottom vertex connects to deck
          const xBot = base[i * 3];
          const yBot = base[i * 3 + 1];
          const zBot = base[i * 3 + 2];

          const xNorm = (xBot + halfLen) / totalLength;
          const modeVal = activeMode.shapeFunction(xNorm);
          const isTorsional = activeMode.type === 'Torsional';
          const torsionMod = isTorsional ? (zBot / halfWidth) : 1.0;

          posAttr.setY(i, yBot + modeVal * currentDispM * torsionMod);
          // Top vertex remains attached to main cable
        }
        posAttr.needsUpdate = true;
      }

      // 4. Update Wind Streamline Particles
      if (windParticlesRef.current) {
        const posAttr = windParticlesRef.current.geometry.attributes.position;
        const count = posAttr.count;
        const speed = (wind.speed / 18) * 1.4;

        for (let i = 0; i < count; i++) {
          let z = posAttr.getZ(i);
          z += speed;
          if (z > 90) {
            z = -90;
            posAttr.setX(i, (Math.random() - 0.5) * totalLength * 1.1);
            posAttr.setY(i, 6 + Math.random() * 38);
          }
          posAttr.setZ(i, z);
        }
        posAttr.needsUpdate = true;
      }

      // 5. Update Vortex Shedding Swirling Particles
      if (vortexParticlesRef.current) {
        vortexParticlesRef.current.visible = showVortices && wind.speed > 3;
        if (showVortices) {
          const posAttr = vortexParticlesRef.current.geometry.attributes.position;
          const count = posAttr.count;
          const vortexSpeed = (wind.speed / 18) * 1.1;

          for (let i = 0; i < count; i++) {
            let z = posAttr.getZ(i);
            let y = posAttr.getY(i);
            const x = posAttr.getX(i);

            z += vortexSpeed;

            // Swirl motion around vortex cores with alternating rotation (+/-)
            const phase = (x / 20) + t * (2 * Math.PI * vortexFrequency);
            const swirl = Math.sin(phase) * 0.18;
            y += swirl;

            if (z > halfWidth + 40) {
              z = halfWidth + 2;
              y = 17 + (Math.random() - 0.5) * 5;
            }
            posAttr.setZ(i, z);
            posAttr.setY(i, y);
          }
          posAttr.needsUpdate = true;
        }
      }
    };

    updateBridgeDeformation();
    return () => cancelAnimationFrame(animFrame);
  }, [
    activeMode, 
    vibrationAmplitude, 
    magnification, 
    vortexFrequency, 
    halfLen, 
    totalLength, 
    halfWidth, 
    wind.speed, 
    showVortices
  ]);

  // Update 3D Virtual Sensors Pins
  useEffect(() => {
    const group = sensorGroupRef.current;
    if (!group) return;

    // Clear existing sensor pin meshes
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    sensors.forEach((s) => {
      const sensorSub = new THREE.Group();
      // Physical coordinate mapping: xPos in [0..1] mapped to [-halfLen, halfLen]
      const realX = -halfLen + s.xPos * totalLength;
      const realY = 17 + s.yPos;
      const realZ = s.zPos;

      const isSelected = s.id === selectedSensorId;

      // Pin base geometry (octahedron / diamond beacon)
      const pinGeom = new THREE.OctahedronGeometry(isSelected ? 2.4 : 1.5, 0);
      let pinColor = 0x00e5ff; // Cyan
      if (s.type === 'piezoelectric') pinColor = 0xff7a00; // Orange energy harvester
      if (s.status === 'offline') pinColor = 0xef4444; // Red
      if (s.status === 'degraded') pinColor = 0xf59e0b; // Amber

      const pinMat = new THREE.MeshStandardMaterial({
        color: pinColor,
        emissive: pinColor,
        emissiveIntensity: isSelected ? 0.9 : 0.4,
        roughness: 0.2,
        metalness: 0.8
      });
      const pinMesh = new THREE.Mesh(pinGeom, pinMat);
      sensorSub.add(pinMesh);

      // Vertical marker stalk to deck
      const stalkGeom = new THREE.CylinderGeometry(0.15, 0.15, 3.5, 8);
      const stalkMat = new THREE.MeshBasicMaterial({ color: pinColor, transparent: true, opacity: 0.8 });
      const stalk = new THREE.Mesh(stalkGeom, stalkMat);
      stalk.position.y = -1.75;
      sensorSub.add(stalk);

      sensorSub.position.set(realX, realY + 3.5, realZ);

      // Allow click raycast identification
      sensorSub.userData = { sensorId: s.id };
      group.add(sensorSub);
    });
  }, [sensors, selectedSensorId, halfLen, totalLength]);

  // Click Handler for Sensor Selection
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const onPointerDown = (e: MouseEvent) => {
      if (e.button !== 0 || !cameraRef.current || !sensorGroupRef.current) return;

      const rect = container.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);

      const intersects = raycaster.intersectObjects(sensorGroupRef.current.children, true);
      if (intersects.length > 0) {
        let obj: THREE.Object3D | null = intersects[0].object;
        while (obj && !obj.userData?.sensorId && obj.parent) {
          obj = obj.parent;
        }
        if (obj && obj.userData?.sensorId) {
          onSelectSensor(obj.userData.sensorId);
        }
      }
    };

    container.addEventListener('pointerdown', onPointerDown);
    return () => container.removeEventListener('pointerdown', onPointerDown);
  }, [onSelectSensor]);

  // Toggle Engineering Overlay Group
  useEffect(() => {
    if (engineeringGroupRef.current) {
      engineeringGroupRef.current.visible = engineeringView;
    }
  }, [engineeringView]);

  return (
    <div className="relative w-full h-full select-none overflow-hidden">
      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Engineering View Status Tag */}
      {engineeringView && (
        <div className="absolute top-4 left-4 pointer-events-none z-10 flex items-center gap-2 bg-[#090e17]/80 backdrop-blur-md border border-cyan-500/30 px-3 py-1.5 text-xs font-mono text-cyan-400">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>ENGINEERING GRID &amp; STRUCTURAL AXES ACTIVE</span>
        </div>
      )}

      {/* Motion Magnification Watermark */}
      {magnification > 1 && (
        <div className="absolute bottom-6 left-6 pointer-events-none z-10 bg-[#090e17]/85 backdrop-blur-md border border-amber-500/40 px-3 py-1.5 font-mono text-xs text-amber-400 flex items-center gap-2">
          <span className="font-bold">{magnification}x</span>
          <span>VISUALIZATION MAGNIFICATION (Physics Unaltered)</span>
        </div>
      )}
    </div>
  );
};
