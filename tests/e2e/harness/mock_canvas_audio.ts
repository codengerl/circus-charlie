/**
 * 輕量化無頭環境模擬樁（Mock Canvas & Web Audio API）
 * 供 Node.js / Vitest 環境秒級執行 Three.js 與音訊邏輯，無需安裝第三方 C++ 套件
 */

export interface CapturedAudioEvent {
  type: 'sfx' | 'bgm';
  name: string;
  time: number;
  frame: number;
  parameters?: Record<string, unknown>;
}

export class AudioSpy {
  private events: CapturedAudioEvent[] = [];

  public record(event: CapturedAudioEvent): void {
    this.events.push(event);
  }

  public getEvents(): CapturedAudioEvent[] {
    return [...this.events];
  }

  public getSfxNames(): string[] {
    return this.events.filter(e => e.type === 'sfx').map(e => e.name);
  }

  public hasTriggered(name: string): boolean {
    return this.events.some(e => e.name === name);
  }

  public count(name: string): number {
    return this.events.filter(e => e.name === name).length;
  }

  public filterByType(type: 'sfx' | 'bgm'): CapturedAudioEvent[] {
    return this.events.filter(e => e.type === type);
  }

  public clear(): void {
    this.events = [];
  }
}

export const globalAudioSpy = new AudioSpy();

export function setupHeadlessEnvironment(): void {
  if (typeof globalThis.window !== 'undefined' && (globalThis.window as unknown as Record<string, unknown>).__is_headless_mocked) {
    return;
  }

  // 1. Mock 2D Canvas Context
  const mockContext2D = {
    imageSmoothingEnabled: false,
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    fillRect: () => {},
    clearRect: () => {},
    getImageData: () => ({ data: new Uint8ClampedArray(4) }),
    putImageData: () => {},
    drawImage: () => {},
    beginPath: () => {},
    closePath: () => {},
    arc: () => {},
    fill: () => {},
    stroke: () => {},
    measureText: () => ({ width: 8 }),
  };

  // 2. Mock WebGL Context
  const mockWebGLContext = {
    canvas: {},
    drawingBufferWidth: 256,
    drawingBufferHeight: 224,
    getExtension: () => null,
    getParameter: () => 0,
    createProgram: () => ({}),
    createShader: () => ({}),
    shaderSource: () => {},
    compileShader: () => {},
    getShaderParameter: () => true,
    createBuffer: () => ({}),
    bindBuffer: () => {},
    bufferData: () => {},
    createTexture: () => ({}),
    bindTexture: () => {},
    texParameteri: () => {},
    texImage2D: () => {},
    viewport: () => {},
    clear: () => {},
    clearColor: () => {},
    enable: () => {},
    disable: () => {},
    blendFunc: () => {},
    cullFace: () => {},
    depthFunc: () => {},
    frontFace: () => {},
    pixelStorei: () => {},
    useProgram: () => {},
    getUniformLocation: () => ({}),
    getAttribLocation: () => 0,
    enableVertexAttribArray: () => {},
    vertexAttribPointer: () => {},
    drawArrays: () => {},
    drawElements: () => {},
  };

  // 3. Mock Canvas Element
  class MockHTMLCanvasElement {
    public width = 256;
    public height = 224;
    public style: Record<string, string> = {};
    public getContext(type: string) {
      if (type === '2d') return mockContext2D;
      if (type === 'webgl' || type === 'webgl2') return mockWebGLContext;
      return null;
    }
    public addEventListener() {}
    public removeEventListener() {}
    public getBoundingClientRect() {
      return { left: 0, top: 0, width: 256, height: 224, right: 256, bottom: 224 };
    }
  }

  // 4. Mock Web Audio Context
  class MockAudioParam {
    public value: number = 0;
    public setValueAtTime(val: number, _t: number) { this.value = val; }
    public linearRampToValueAtTime(val: number, _t: number) { this.value = val; }
    public exponentialRampToValueAtTime(val: number, _t: number) { this.value = val; }
  }

  class MockAudioNode {
    public connect(_dest: unknown) {}
    public disconnect() {}
  }

  class MockOscillatorNode extends MockAudioNode {
    public type: string = 'sine';
    public frequency = new MockAudioParam();
    public start(_t?: number) {}
    public stop(_t?: number) {}
  }

  class MockGainNode extends MockAudioNode {
    public gain = new MockAudioParam();
  }

  class MockBiquadFilterNode extends MockAudioNode {
    public type: string = 'lowpass';
    public frequency = new MockAudioParam();
    public Q = new MockAudioParam();
  }

  class MockAudioContext {
    public state: 'suspended' | 'running' | 'closed' = 'running';
    public currentTime: number = 0;
    public destination = new MockAudioNode();

    public resume(): Promise<void> {
      this.state = 'running';
      return Promise.resolve();
    }

    public close(): Promise<void> {
      this.state = 'closed';
      return Promise.resolve();
    }

    public createOscillator(): MockOscillatorNode {
      return new MockOscillatorNode();
    }

    public createGain(): MockGainNode {
      return new MockGainNode();
    }

    public createBiquadFilter(): MockBiquadFilterNode {
      return new MockBiquadFilterNode();
    }

    public createBuffer(): unknown {
      return { getChannelData: () => new Float32Array(1024) };
    }
  }

  // 注入全域變數
  const target = globalThis as unknown as Record<string, unknown>;
  target.HTMLCanvasElement = MockHTMLCanvasElement;
  target.AudioContext = MockAudioContext;
  target.document = {
    createElement: (tag: string) => {
      if (tag === 'canvas') return new MockHTMLCanvasElement();
      return { style: {}, addEventListener: () => {}, removeEventListener: () => {}, appendChild: () => {} };
    },
    getElementById: () => new MockHTMLCanvasElement(),
    body: { appendChild: () => {} },
  };
  target.window = {
    AudioContext: MockAudioContext,
    addEventListener: () => {},
    removeEventListener: () => {},
    innerWidth: 800,
    innerHeight: 600,
    devicePixelRatio: 1,
    requestAnimationFrame: (cb: (t: number) => void) => setTimeout(() => cb(Date.now()), 16),
    cancelAnimationFrame: (id: number | ReturnType<typeof setTimeout>) => clearTimeout(id as unknown as number),
    __is_headless_mocked: true,
  };
}
