import * as THREE from 'three';
import { PALETTE } from '../../../src/assets/pixel_palette';

export interface VoxelSpec {
  x: number;
  y: number;
  z: number;
  w?: number;
  h?: number;
  d?: number;
  color: string;
}

/**
 * 建立單一體素立方體網格
 */
export function createVoxelCube(spec: VoxelSpec): THREE.Mesh {
  const w = spec.w ?? 2;
  const h = spec.h ?? 2;
  const d = spec.d ?? 2;
  const geometry = new THREE.BoxGeometry(w, h, d);
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(spec.color),
    roughness: 0.8,
    metalness: 0.1,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(spec.x, spec.y, spec.z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * 查理 3D 體素模型
 */
export function createVoxelCharlie(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'VoxelCharlie';

  const specs: VoxelSpec[] = [
    // 腿部與藍色褲子
    { x: -2, y: 4, z: 0, w: 3, h: 6, d: 4, color: PALETTE.CHARLIE_BLUE },
    { x: 2, y: 4, z: 0, w: 3, h: 6, d: 4, color: PALETTE.CHARLIE_BLUE },
    // 紅色身體與燕尾服
    { x: 0, y: 10, z: 0, w: 8, h: 7, d: 5, color: PALETTE.CHARLIE_RED },
    // 白色領結
    { x: 0, y: 12, z: 2.6, w: 3, h: 2, d: 1, color: PALETTE.CHARLIE_WHITE },
    // 頭部與膚色臉部
    { x: 0, y: 16, z: 0, w: 6, h: 5, d: 5, color: PALETTE.CHARLIE_SKIN },
    // 棕色頭髮與禮帽
    { x: 0, y: 19, z: 0, w: 7, h: 3, d: 6, color: PALETTE.CHARLIE_HAIR },
    { x: 0, y: 21, z: 0, w: 5, h: 4, d: 4, color: PALETTE.CHARLIE_BLUE },
  ];

  for (const s of specs) {
    group.add(createVoxelCube(s));
  }
  return group;
}

/**
 * 獅子 3D 體素模型
 */
export function createVoxelLion(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'VoxelLion';

  const specs: VoxelSpec[] = [
    // 軀幹
    { x: 0, y: 8, z: 0, w: 20, h: 10, d: 8, color: PALETTE.LION_ORANGE },
    // 腹部
    { x: 0, y: 4, z: 0, w: 16, h: 3, d: 6, color: PALETTE.LION_BELLY },
    // 四肢
    { x: -7, y: 2, z: -3, w: 3, h: 5, d: 3, color: PALETTE.LION_ORANGE },
    { x: -7, y: 2, z: 3, w: 3, h: 5, d: 3, color: PALETTE.LION_ORANGE },
    { x: 7, y: 2, z: -3, w: 3, h: 5, d: 3, color: PALETTE.LION_ORANGE },
    { x: 7, y: 2, z: 3, w: 3, h: 5, d: 3, color: PALETTE.LION_ORANGE },
    // 鬃毛
    { x: 8, y: 11, z: 0, w: 8, h: 12, d: 10, color: PALETTE.LION_MANE },
    // 獅頭與鼻子
    { x: 11, y: 10, z: 0, w: 5, h: 6, d: 6, color: PALETTE.LION_ORANGE },
    { x: 13, y: 9, z: 0, w: 2, h: 2, d: 2, color: PALETTE.LION_NOSE },
    // 尾巴
    { x: -10, y: 11, z: 0, w: 4, h: 3, d: 2, color: PALETTE.LION_ORANGE },
  ];

  for (const s of specs) {
    group.add(createVoxelCube(s));
  }
  return group;
}

/**
 * 大火圈 3D 體素模型（前後分離深度與火焰階層）
 */
export function createVoxelBigRing(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'VoxelBigRing';

  // 分為後層 (z = -4) 與前層 (z = +4)
  const backGroup = new THREE.Group();
  backGroup.name = 'RingBackHalf';
  const frontGroup = new THREE.Group();
  frontGroup.name = 'RingFrontHalf';

  // 底部烈焰體素
  const bottomFlames: VoxelSpec[] = [
    { x: 0, y: 4, z: -4, w: 6, h: 8, d: 2, color: PALETTE.FIRE_RED },
    { x: 0, y: 6, z: -4, w: 4, h: 6, d: 2, color: PALETTE.FIRE_ORANGE },
    { x: 0, y: 7, z: -4, w: 2, h: 4, d: 2, color: PALETTE.FIRE_YELLOW },
    { x: 0, y: 4, z: 4, w: 6, h: 8, d: 2, color: PALETTE.FIRE_RED },
    { x: 0, y: 6, z: 4, w: 4, h: 6, d: 2, color: PALETTE.FIRE_ORANGE },
    { x: 0, y: 7, z: 4, w: 2, h: 4, d: 2, color: PALETTE.FIRE_YELLOW },
  ];

  // 頂部烈焰體素
  const topFlames: VoxelSpec[] = [
    { x: 0, y: 56, z: -4, w: 6, h: 8, d: 2, color: PALETTE.FIRE_RED },
    { x: 0, y: 54, z: -4, w: 4, h: 6, d: 2, color: PALETTE.FIRE_ORANGE },
    { x: 0, y: 53, z: -4, w: 2, h: 4, d: 2, color: PALETTE.FIRE_YELLOW },
    { x: 0, y: 56, z: 4, w: 6, h: 8, d: 2, color: PALETTE.FIRE_RED },
    { x: 0, y: 54, z: 4, w: 4, h: 6, d: 2, color: PALETTE.FIRE_ORANGE },
    { x: 0, y: 53, z: 4, w: 2, h: 4, d: 2, color: PALETTE.FIRE_YELLOW },
  ];

  for (const s of bottomFlames) {
    if (s.z < 0) backGroup.add(createVoxelCube(s));
    else frontGroup.add(createVoxelCube(s));
  }
  for (const s of topFlames) {
    if (s.z < 0) backGroup.add(createVoxelCube(s));
    else frontGroup.add(createVoxelCube(s));
  }

  group.add(backGroup);
  group.add(frontGroup);
  return group;
}

/**
 * 小火圈 3D 體素模型
 */
export function createVoxelSmallRing(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'VoxelSmallRing';

  const specs: VoxelSpec[] = [
    // 底部較窄火焰
    { x: 0, y: 4, z: -3, w: 4, h: 6, d: 2, color: PALETTE.FIRE_RED },
    { x: 0, y: 4, z: 3, w: 4, h: 6, d: 2, color: PALETTE.FIRE_RED },
    { x: 0, y: 5, z: 0, w: 3, h: 4, d: 4, color: PALETTE.FIRE_ORANGE },
    // 頂部火焰
    { x: 0, y: 44, z: -3, w: 4, h: 6, d: 2, color: PALETTE.FIRE_RED },
    { x: 0, y: 44, z: 3, w: 4, h: 6, d: 2, color: PALETTE.FIRE_RED },
    { x: 0, y: 43, z: 0, w: 3, h: 4, d: 4, color: PALETTE.FIRE_ORANGE },
  ];

  for (const s of specs) {
    group.add(createVoxelCube(s));
  }
  return group;
}

/**
 * 地面火壺 3D 體素模型
 */
export function createVoxelFirePot(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'VoxelFirePot';

  const specs: VoxelSpec[] = [
    // 壺身基座
    { x: 0, y: 2, z: 0, w: 14, h: 4, d: 8, color: PALETTE.POT_DARK_RED },
    { x: 0, y: 6, z: 0, w: 12, h: 5, d: 7, color: PALETTE.POT_DARK_RED },
    { x: 0, y: 9, z: 0, w: 10, h: 3, d: 6, color: PALETTE.POT_HIGHLIGHT },
    // 壺口噴出的烈焰
    { x: 0, y: 12, z: 0, w: 8, h: 5, d: 4, color: PALETTE.FIRE_RED },
    { x: 0, y: 15, z: 0, w: 6, h: 4, d: 3, color: PALETTE.FIRE_ORANGE },
    { x: 0, y: 18, z: 0, w: 3, h: 3, d: 2, color: PALETTE.FIRE_YELLOW },
  ];

  for (const s of specs) {
    group.add(createVoxelCube(s));
  }
  return group;
}

/**
 * 空中金幣錢袋 3D 體素模型
 */
export function createVoxelMoneyBag(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'VoxelMoneyBag';

  const specs: VoxelSpec[] = [
    // 錢袋本體
    { x: 0, y: 0, z: 0, w: 8, h: 8, d: 6, color: PALETTE.MONEY_BAG_BLUE },
    // 束口繩
    { x: 0, y: 5, z: 0, w: 6, h: 2, d: 5, color: PALETTE.MONEY_STRING },
    // 袋口荷葉邊
    { x: 0, y: 7, z: 0, w: 7, h: 2, d: 5, color: PALETTE.MONEY_BAG_BLUE },
    // 金幣標記 (中央金黃色)
    { x: 0, y: 0, z: 3.1, w: 4, h: 4, d: 1, color: PALETTE.MONEY_BAG_GOLD },
  ];

  for (const s of specs) {
    group.add(createVoxelCube(s));
  }
  return group;
}

/**
 * 0m 終點跳台 3D 體素模型
 */
export function createVoxelPodium(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'VoxelPodium';

  const specs: VoxelSpec[] = [
    // 底座階梯
    { x: 0, y: 2, z: 0, w: 36, h: 4, d: 16, color: PALETTE.GROUND_BROWN },
    { x: 0, y: 6, z: 0, w: 28, h: 5, d: 14, color: PALETTE.TENT_BLUE },
    // 頂層跳台 (Y: 10 ~ 14)
    { x: 0, y: 11, z: 0, w: 22, h: 6, d: 12, color: PALETTE.RAILING_RED },
    // 金色飾邊
    { x: 0, y: 14, z: 0, w: 20, h: 1, d: 10, color: PALETTE.MONEY_BAG_GOLD },
  ];

  for (const s of specs) {
    group.add(createVoxelCube(s));
  }
  return group;
}

/**
 * 里程碑標記看板 3D 體素模型
 */
export function createVoxelMilestone(distanceM: number): THREE.Group {
  const group = new THREE.Group();
  group.name = `VoxelMilestone_${distanceM}m`;

  const specs: VoxelSpec[] = [
    // 立柱
    { x: 0, y: 8, z: -2, w: 3, h: 16, d: 2, color: PALETTE.RAILING_WHITE },
    // 看板本體
    { x: 0, y: 20, z: -2, w: 16, h: 10, d: 2, color: PALETTE.TENT_BLUE },
    // 邊框
    { x: 0, y: 20, z: -1.8, w: 18, h: 12, d: 0.5, color: PALETTE.RAILING_RED },
  ];

  for (const s of specs) {
    group.add(createVoxelCube(s));
  }
  return group;
}

/**
 * 建立具備微角度與定向陰影光之 3D 體素場景
 */
export function setupVoxelScene(): {
  scene: THREE.Scene;
  directionalLight: THREE.DirectionalLight;
  ambientLight: THREE.AmbientLight;
  camera: THREE.OrthographicCamera;
} {
  const scene = new THREE.Scene();

  // 環境光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  ambientLight.name = 'AmbientLight';
  scene.add(ambientLight);

  // 定向平行光（帶微視角陰影）
  const directionalLight = new THREE.DirectionalLight(0xfff8e7, 1.2);
  directionalLight.name = 'SunLight';
  directionalLight.position.set(50, 100, 50);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 512;
  directionalLight.shadow.mapSize.height = 512;
  scene.add(directionalLight);

  // 正交微角度鏡頭（模擬 2D 捲軸但保留 3D 體素邊緣厚度）
  const camera = new THREE.OrthographicCamera(-128, 128, 112, -112, 0.1, 1000);
  camera.position.set(128, 112, 120);
  camera.lookAt(128, 112, 0);

  return { scene, directionalLight, ambientLight, camera };
}
