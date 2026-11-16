import * as THREE from 'three';

export const VIRTUAL_WIDTH = 256;
export const VIRTUAL_HEIGHT = 224;
export const GROUND_Y = 32;

/**
 * Three.js 3D 體素正交微角度攝影機、平行光影與 WebGLRenderer 初始化設置
 */
export class RendererSetup {
  public scene: THREE.Scene;
  public camera: THREE.OrthographicCamera;
  public renderer: THREE.WebGLRenderer;
  public directionalLight: THREE.DirectionalLight;
  public ambientLight: THREE.AmbientLight;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();

    // 建立 256x224 微俯角正交攝影機（pitch ~5.7°），視野涵蓋 X:[0, 256], Y:[0, 224]
    this.camera = new THREE.OrthographicCamera(
      -VIRTUAL_WIDTH / 2,   // -128
      VIRTUAL_WIDTH / 2,    // 128
      VIRTUAL_HEIGHT / 2,   // 112
      -VIRTUAL_HEIGHT / 2,  // -112
      0.1,                  // near
      1000                  // far
    );
    // 鏡頭稍微抬高 12 單位 (112 + 12 = 124)，對準中心 (128, 112, 0)，形成 ~5.71° 俯角
    this.camera.position.set(128, 124, 120);
    this.camera.lookAt(128, 112, 0);

    // 初始化像素完美 WebGLRenderer 並啟用 PCFSoftShadowMap 陰影
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance',
    });

    this.renderer.setSize(VIRTUAL_WIDTH, VIRTUAL_HEIGHT, false);
    this.renderer.setPixelRatio(1); // 鎖定像素比 1 防止 Retina 螢幕模糊
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 建立環境光（AmbientLight）
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.ambientLight.name = 'AmbientLight';
    this.scene.add(this.ambientLight);

    // 建立主平行光（SunLight / DirectionalLight 具投影效果）
    this.directionalLight = new THREE.DirectionalLight(0xfff8e7, 1.2);
    this.directionalLight.name = 'SunLight';
    this.directionalLight.position.set(50, 100, 50);
    this.directionalLight.castShadow = true;
    this.directionalLight.shadow.mapSize.width = 512;
    this.directionalLight.shadow.mapSize.height = 512;
    this.directionalLight.shadow.bias = -0.0005;
    this.scene.add(this.directionalLight);

    // 監聽螢幕縮放
    this.setupResizeHandler();
  }

  private setupResizeHandler(): void {
    if (typeof window === 'undefined') return;

    const onResize = () => {
      // 保持 256 / 224 之長寬比例，透過 CSS 縮放，WebGL 內部 buffer 維持 256x224
      this.renderer.setSize(VIRTUAL_WIDTH, VIRTUAL_HEIGHT, false);
    };

    window.addEventListener('resize', onResize);
  }

  public render(): void {
    this.renderer.render(this.scene, this.camera);
  }
}
