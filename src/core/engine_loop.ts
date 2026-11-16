/**
 * 60 Hz 固定時間步長累加器引擎循環（Fixed Timestep Loop with Accumulator）
 * 確保物理模擬在不同螢幕更新率（60Hz、120Hz、144Hz 等）皆維持精確確定性
 */
export class EngineLoop {
  public readonly fixedDelta: number = 1 / 60; // 60 Hz 物理模擬週期 (約 0.01667 秒)
  private readonly maxFrameTime: number = 0.25; // 累加器上限，防止標籤頁凍結切回引發死亡螺旋
  private accumulator: number = 0;
  private lastTimestamp: number = 0;
  private isRunning: boolean = false;
  private animationFrameId: number | null = null;

  constructor(
    private updatePhysics: (dt: number) => void,
    private render: (alpha: number) => void
  ) {}

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTimestamp = 0;
    this.accumulator = 0;

    const frameCallback = (timestamp: number) => {
      if (!this.isRunning) return;
      this.tick(timestamp);
      this.animationFrameId = requestAnimationFrame(frameCallback);
    };

    this.animationFrameId = requestAnimationFrame(frameCallback);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public tick(timestamp: number): void {
    if (!this.lastTimestamp) {
      this.lastTimestamp = timestamp;
      return;
    }

    let frameTime = (timestamp - this.lastTimestamp) / 1000;
    if (frameTime > this.maxFrameTime) {
      frameTime = this.maxFrameTime;
    }
    this.lastTimestamp = timestamp;
    this.accumulator += frameTime;

    while (this.accumulator >= this.fixedDelta) {
      this.updatePhysics(this.fixedDelta);
      this.accumulator -= this.fixedDelta;
    }

    const alpha = this.accumulator / this.fixedDelta;
    this.render(alpha);
  }

  /**
   * 手動以固定步長推進時間（供單元測試與無頭模擬使用）
   */
  public step(deltaTime: number, updateFn?: (fixedDt: number) => void): void {
    let frameTime = deltaTime;
    if (frameTime > this.maxFrameTime) {
      frameTime = this.maxFrameTime;
    }
    this.accumulator += frameTime;
    const callback = updateFn ?? this.updatePhysics;
    while (this.accumulator >= this.fixedDelta) {
      callback(this.fixedDelta);
      this.accumulator -= this.fixedDelta;
    }
  }

  /**
   * 重置累加器與時間戳記
   */
  public reset(): void {
    this.accumulator = 0;
    this.lastTimestamp = 0;
  }

  /**
   * 取得當前累加器殘餘時間
   */
  public getAccumulator(): number {
    return this.accumulator;
  }

  public get running(): boolean {
    return this.isRunning;
  }
}
