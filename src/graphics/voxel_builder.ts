import * as THREE from 'three';

export interface VoxelSpec {
  x: number;
  y: number;
  z: number;
  w?: number;
  h?: number;
  d?: number;
  color: string;
}

export interface VoxelCubeOptions {
  castShadow?: boolean;
  receiveShadow?: boolean;
}

/**
 * 全域材質快取池（Material Cache）
 * 複用 MeshStandardMaterial，避免重複實例化與著色器重編譯
 */
const materialCache: Map<string, THREE.MeshStandardMaterial> = new Map();

/**
 * 全域幾何體快取池（Geometry Cache）
 * 依尺寸複用 BoxGeometry，消除記憶體碎片與幾何配置開銷
 */
const geometryCache: Map<string, THREE.BoxGeometry> = new Map();

/**
 * 取得或建立材質快取
 */
export function getVoxelMaterial(colorHex: string): THREE.MeshStandardMaterial {
  const normalizedHex = colorHex.toLowerCase();
  let material = materialCache.get(normalizedHex);
  if (!material) {
    material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorHex),
      roughness: 0.8,
      metalness: 0.1,
    });
    materialCache.set(normalizedHex, material);
  }
  return material;
}

/**
 * 取得或建立長方體幾何快取
 */
export function getBoxGeometry(w: number, h: number, d: number): THREE.BoxGeometry {
  const key = `${w}_${h}_${d}`;
  let geom = geometryCache.get(key);
  if (!geom) {
    geom = new THREE.BoxGeometry(w, h, d);
    geometryCache.set(key, geom);
  }
  return geom;
}

/**
 * 建立單一體素長方體網格（支援快取與陰影）
 */
export function createVoxelCube(spec: VoxelSpec, options?: VoxelCubeOptions): THREE.Mesh {
  const w = spec.w ?? 2;
  const h = spec.h ?? 2;
  const d = spec.d ?? 2;

  const geometry = getBoxGeometry(w, h, d);
  const material = getVoxelMaterial(spec.color);

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(spec.x, spec.y, spec.z);
  mesh.castShadow = options?.castShadow ?? true;
  mesh.receiveShadow = options?.receiveShadow ?? true;

  return mesh;
}

/**
 * 建立單一宏觀長方體塊（Macro-Cuboid）
 */
export function createMacroCuboid(
  w: number,
  h: number,
  d: number,
  color: string,
  pos: { x: number; y: number; z: number },
  castShadow: boolean = true,
  receiveShadow: boolean = true
): THREE.Mesh {
  return createVoxelCube(
    { x: pos.x, y: pos.y, z: pos.z, w, h, d, color },
    { castShadow, receiveShadow }
  );
}

/**
 * 依據 VoxelSpec 陣列組合體素群組
 */
export function assembleVoxelGroup(specs: VoxelSpec[], groupName?: string): THREE.Group {
  const group = new THREE.Group();
  if (groupName) {
    group.name = groupName;
  }

  for (const spec of specs) {
    group.add(createVoxelCube(spec));
  }

  return group;
}

/**
 * 清除材質與幾何快取（主要供測試或重置使用）
 */
export function clearVoxelCaches(): void {
  for (const mat of materialCache.values()) {
    mat.dispose();
  }
  materialCache.clear();

  for (const geom of geometryCache.values()) {
    geom.dispose();
  }
  geometryCache.clear();
}
