import * as THREE from 'three';
import { FireRing } from './fire_ring';
import { FirePot } from './fire_pot';
import { AABB } from './player_charlie';
import { createVoxelSmallRing, createVoxelMoneyBag } from '../graphics/voxel_models';

export interface Poolable {
  isActive: boolean;
  reset?(...args: unknown[]): void;
}

/**
 * 泛型高效能物件池（Generic Entity Pool）
 * 管理可用佇列（freeList）與啟用清單（activeList），杜絕執行期記憶體頻繁配置造成 GC 停頓
 */
export class EntityPool<T extends Poolable> {
  private readonly freeList: T[] = [];
  private readonly activeList: T[] = [];
  private readonly factory: () => T;
  private readonly resetFn?: (item: T) => void;

  constructor(factory: () => T, resetFn?: (item: T) => void, initialCapacity: number = 0) {
    this.factory = factory;
    this.resetFn = resetFn;
    if (initialCapacity > 0) {
      this.prewarm(initialCapacity);
    }
  }

  /**
   * 預先熱機，配置指定數量之物件進入 freeList
   */
  public prewarm(count: number): void {
    for (let i = 0; i < count; i++) {
      const item = this.factory();
      item.isActive = false;
      this.freeList.push(item);
    }
  }

  /**
   * 自物件池取得物件，若池中無可用物件則調用工廠即時擴充
   */
  public acquire(): T {
    let item = this.freeList.pop();
    if (!item) {
      item = this.factory();
    }
    item.isActive = true;
    this.activeList.push(item);
    return item;
  }

  /**
   * 釋放物件歸還至物件池
   */
  public release(item: T): void {
    const idx = this.activeList.indexOf(item);
    if (idx !== -1) {
      this.activeList.splice(idx, 1);
    }
    if (this.resetFn) {
      this.resetFn(item);
    } else if (typeof item.reset === 'function') {
      item.reset();
    }
    item.isActive = false;
    this.freeList.push(item);
  }

  /**
   * 重置整座物件池，將所有啟用中物件全數歸還至 freeList
   */
  public reset(): void {
    while (this.activeList.length > 0) {
      const item = this.activeList.pop()!;
      if (this.resetFn) {
        this.resetFn(item);
      } else if (typeof item.reset === 'function') {
        item.reset();
      }
      item.isActive = false;
      this.freeList.push(item);
    }
  }

  public getActive(): readonly T[] {
    return this.activeList;
  }

  public get activeCount(): number {
    return this.activeList.length;
  }

  public get freeCount(): number {
    return this.freeList.length;
  }

  public get totalCount(): number {
    return this.activeList.length + this.freeList.length;
  }
}

/**
 * 小火圈實體（附 3D 體素與碰撞窗口）
 */
export class SmallRing implements Poolable {
  public x: number;
  public groundY: number = 32;
  public width: number = 20;
  public height: number = 56;
  public moveSpeed: number = 50;

  public readonly safeYMin: number = 44;
  public readonly safeYMax: number = 76;

  public isActive: boolean = true;
  public passed: boolean = false;
  public hasBag: boolean = true;
  public bagCollected: boolean = false;

  public mesh: THREE.Group | null = null;

  constructor(x: number = 280) {
    this.x = x;
  }

  public initMesh(): THREE.Group {
    if (!this.mesh) {
      this.mesh = createVoxelSmallRing();
      this.updateMeshPosition();
    }
    return this.mesh;
  }

  public update(dt: number, extraSpeed: number = 0): void {
    if (!this.isActive) return;
    this.x -= (this.moveSpeed + extraSpeed) * dt;
    this.updateMeshPosition();
  }

  public updateMeshPosition(): void {
    if (this.mesh) {
      this.mesh.position.set(this.x, this.groundY, 0);
      this.mesh.visible = this.isActive;
    }
  }

  public checkCollision(playerAABB: AABB): boolean {
    if (!this.isActive) return false;
    const ringMinX = this.x - this.width / 2;
    const ringMaxX = this.x + this.width / 2;
    const overlapX = playerAABB.maxX > ringMinX && playerAABB.minX < ringMaxX;
    if (!overlapX) return false;

    // 上火焰：Y: [76, 88]，下火焰：Y: [32, 44]
    const lowerHit = playerAABB.minY < this.safeYMin && playerAABB.maxY > this.groundY;
    const upperHit = playerAABB.maxY > this.safeYMax && playerAABB.minY < this.groundY + this.height;
    return lowerHit || upperHit;
  }

  public isSafeThrough(playerAABB: AABB): boolean {
    const ringMinX = this.x - this.width / 2;
    const ringMaxX = this.x + this.width / 2;
    const withinX = playerAABB.maxX <= ringMaxX + 4 && playerAABB.minX >= ringMinX - 4;
    const withinY = playerAABB.minY >= this.safeYMin && playerAABB.maxY <= this.safeYMax;
    return withinX && withinY;
  }

  public reset(x?: number): void {
    if (x !== undefined) {
      this.x = x;
    }
    this.isActive = true;
    this.passed = false;
    this.hasBag = true;
    this.bagCollected = false;
    this.updateMeshPosition();
  }
}

/**
 * 空中金幣錢袋實體（附 3D 體素與拾取判定）
 */
export class MoneyBag implements Poolable {
  public id: string;
  public x: number;
  public y: number;
  public width: number = 12;
  public height: number = 12;
  public collected: boolean = false;
  public isActive: boolean = true;

  public mesh: THREE.Group | null = null;

  constructor(x: number = 280, y: number = 60) {
    this.id = `bag_${Math.random().toString(36).substring(2, 9)}`;
    this.x = x;
    this.y = y;
  }

  public initMesh(): THREE.Group {
    if (!this.mesh) {
      this.mesh = createVoxelMoneyBag();
      this.updateMeshPosition();
    }
    return this.mesh;
  }

  public getAABB(): AABB {
    return {
      minX: this.x - this.width / 2,
      maxX: this.x + this.width / 2,
      minY: this.y - this.height / 2,
      maxY: this.y + this.height / 2,
    };
  }

  public update(dt: number, speed: number = 0): void {
    if (!this.isActive || this.collected) return;
    if (speed !== 0) {
      this.x -= speed * dt;
      this.updateMeshPosition();
    }
  }

  public updateMeshPosition(): void {
    if (this.mesh) {
      this.mesh.position.set(this.x, this.y, 0);
      this.mesh.visible = this.isActive && !this.collected;
    }
  }

  public checkCollision(playerAABB: AABB): boolean {
    if (!this.isActive || this.collected) return false;
    const bagBox = this.getAABB();
    const overlapX = playerAABB.maxX > bagBox.minX && playerAABB.minX < bagBox.maxX;
    const overlapY = playerAABB.maxY > bagBox.minY && playerAABB.minY < bagBox.maxY;
    return overlapX && overlapY;
  }

  public collect(): void {
    this.collected = true;
    if (this.mesh) {
      this.mesh.visible = false;
    }
  }

  public reset(x?: number, y?: number): void {
    if (x !== undefined) this.x = x;
    if (y !== undefined) this.y = y;
    this.isActive = true;
    this.collected = false;
    this.updateMeshPosition();
  }
}

/**
 * 大火圈專用物件池
 */
export class FireRingPool extends EntityPool<FireRing> {
  constructor(initialCapacity: number = 4) {
    super(
      () => new FireRing(),
      (ring) => ring.reset(280),
      initialCapacity
    );
  }
}

/**
 * 地面火壺專用物件池
 */
export class FirePotPool extends EntityPool<FirePot> {
  constructor(initialCapacity: number = 4) {
    super(
      () => new FirePot(),
      (pot) => pot.reset(280),
      initialCapacity
    );
  }
}

/**
 * 小火圈專用物件池
 */
export class SmallRingPool extends EntityPool<SmallRing> {
  constructor(initialCapacity: number = 4) {
    super(
      () => new SmallRing(),
      (ring) => ring.reset(280),
      initialCapacity
    );
  }
}

/**
 * 空中錢袋專用物件池
 */
export class MoneyBagPool extends EntityPool<MoneyBag> {
  constructor(initialCapacity: number = 4) {
    super(
      () => new MoneyBag(),
      (bag) => bag.reset(280, 60),
      initialCapacity
    );
  }
}
