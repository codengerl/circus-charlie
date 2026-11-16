import { describe, it, expect } from 'vitest';
import {
  EntityPool,
  Poolable,
  FireRingPool,
  FirePotPool,
  SmallRingPool,
  MoneyBagPool,
} from '../src/entities/object_pool';

class TestEntity implements Poolable {
  public isActive: boolean = false;
  public resetCount: number = 0;
  public value: number = 0;

  public reset(): void {
    this.resetCount++;
    this.value = 0;
  }
}

describe('EntityPool (Generic Object Pool & GC-Free Recycling)', () => {
  it('1. 建構子預先熱機（prewarm）配置正確容量', () => {
    const pool = new EntityPool(() => new TestEntity(), undefined, 5);
    expect(pool.totalCount).toBe(5);
    expect(pool.freeCount).toBe(5);
    expect(pool.activeCount).toBe(0);
  });

  it('2. acquire() 從可用佇列取出物件並標記為啟用', () => {
    const pool = new EntityPool(() => new TestEntity(), undefined, 3);
    const item1 = pool.acquire();

    expect(item1.isActive).toBe(true);
    expect(pool.activeCount).toBe(1);
    expect(pool.freeCount).toBe(2);
    expect(pool.totalCount).toBe(3);

    const item2 = pool.acquire();
    expect(item2.isActive).toBe(true);
    expect(pool.activeCount).toBe(2);
    expect(pool.freeCount).toBe(1);
  });

  it('3. 當可用佇列耗盡時，acquire() 動態擴充實例', () => {
    const pool = new EntityPool(() => new TestEntity(), undefined, 1);
    pool.acquire();
    expect(pool.freeCount).toBe(0);

    const item2 = pool.acquire();
    expect(item2).toBeInstanceOf(TestEntity);
    expect(item2.isActive).toBe(true);
    expect(pool.activeCount).toBe(2);
    expect(pool.totalCount).toBe(2);
  });

  it('4. release() 歸還物件並呼叫 reset，清除啟用狀態', () => {
    const pool = new EntityPool(() => new TestEntity(), undefined, 2);
    const item = pool.acquire();
    item.value = 999;

    pool.release(item);
    expect(item.isActive).toBe(false);
    expect(item.resetCount).toBe(1);
    expect(item.value).toBe(0);
    expect(pool.activeCount).toBe(0);
    expect(pool.freeCount).toBe(2);
  });

  it('5. 支援自定義 resetFn 重置回呼', () => {
    let customResetCalled = false;
    const pool = new EntityPool(
      () => new TestEntity(),
      (ent) => {
        customResetCalled = true;
        ent.reset();
      },
      1
    );

    const item = pool.acquire();
    pool.release(item);
    expect(customResetCalled).toBe(true);
    expect(item.resetCount).toBe(1);
  });

  it('6. reset() 一次性回收所有啟用中物件', () => {
    const pool = new EntityPool(() => new TestEntity(), undefined, 4);
    const a = pool.acquire();
    const b = pool.acquire();
    const c = pool.acquire();

    expect(pool.activeCount).toBe(3);
    expect(pool.freeCount).toBe(1);

    pool.reset();

    expect(pool.activeCount).toBe(0);
    expect(pool.freeCount).toBe(4);
    expect(a.isActive).toBe(false);
    expect(b.isActive).toBe(false);
    expect(c.isActive).toBe(false);
  });

  it('7. getActive() 返回唯讀啟用清單', () => {
    const pool = new EntityPool(() => new TestEntity(), undefined, 2);
    const item1 = pool.acquire();
    const item2 = pool.acquire();

    const activeList = pool.getActive();
    expect(activeList.length).toBe(2);
    expect(activeList).toContain(item1);
    expect(activeList).toContain(item2);
  });

  it('8. 特化物件池工廠初始化與實體複用檢驗', () => {
    // FireRingPool
    const ringPool = new FireRingPool(2);
    expect(ringPool.totalCount).toBe(2);
    const ring = ringPool.acquire();
    expect(ring.isActive).toBe(true);
    ringPool.release(ring);
    expect(ring.isActive).toBe(false);

    // FirePotPool
    const potPool = new FirePotPool(2);
    expect(potPool.totalCount).toBe(2);
    const pot = potPool.acquire();
    expect(pot.isActive).toBe(true);
    potPool.release(pot);
    expect(pot.isActive).toBe(false);

    // SmallRingPool
    const smallRingPool = new SmallRingPool(2);
    expect(smallRingPool.totalCount).toBe(2);
    const smallRing = smallRingPool.acquire();
    expect(smallRing.isActive).toBe(true);
    smallRingPool.release(smallRing);
    expect(smallRing.isActive).toBe(false);

    // MoneyBagPool
    const bagPool = new MoneyBagPool(2);
    expect(bagPool.totalCount).toBe(2);
    const bag = bagPool.acquire();
    expect(bag.isActive).toBe(true);
    bagPool.release(bag);
    expect(bag.isActive).toBe(false);
  });
});
