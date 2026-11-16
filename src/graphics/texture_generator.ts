import * as THREE from 'three';
import { PALETTE } from '../assets/pixel_palette';

/**
 * 像素矩陣轉 CanvasTexture 產生器
 * 產出符合 NearestFilter、無 Mipmap 的銳利 8-bit 點陣紋理
 */
export function createPixelTexture(
  matrix: string[],
  colorMap: Record<string, string>
): THREE.CanvasTexture {
  const height = matrix.length;
  const width = matrix[0].length;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('無法取得 2D Canvas 渲染上下文');
  }

  ctx.imageSmoothingEnabled = false;

  for (let y = 0; y < height; y++) {
    const row = matrix[y];
    for (let x = 0; x < width; x++) {
      const char = row[x];
      const color = colorMap[char];
      if (color && color !== PALETTE.TRANSPARENT) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

/**
 * 程序化像素精靈圖庫（Sprite Generator）
 * 包含查理騎獅（跑動、跳躍、受傷）、大火圈（前後雙層、雙影格）、地面火壺、獎勵錢袋、跑道與背景
 */
export class SpriteGenerator {
  // 查理騎獅配色字元映射表
  private static readonly CHARLIE_LION_COLORS: Record<string, string> = {
    '.': PALETTE.TRANSPARENT,
    'S': PALETTE.CHARLIE_SKIN,
    'R': PALETTE.CHARLIE_RED,
    'B': PALETTE.CHARLIE_BLUE,
    'H': PALETTE.CHARLIE_HAIR,
    'W': PALETTE.WHITE,
    'O': PALETTE.LION_ORANGE,
    'M': PALETTE.LION_MANE,
    'Y': PALETTE.LION_BELLY,
    'N': PALETTE.LION_NOSE,
    'K': PALETTE.BLACK,
  };

  /**
   * 查理騎獅奔跑影格 1 (32x32)
   */
  public static createCharlieLionRunFrame1(): THREE.CanvasTexture {
    const map = [
      // 0-7: 查理頭部與帽子
      "................................",
      "............RRRR................",
      "...........RRRRRR...............",
      "...........HHHHHH...............",
      "...........SSSKSS...............",
      "...........SSSSSS...............",
      "...........RRRRRR...............",
      "..........RRRRRRRR..............",
      // 8-15: 查理軀幹、手臂與獅頭
      "..........RRBBRRRR..............",
      "..........BBBBBBBB..MMMM........",
      ".........BBBBBBBB.MMOOOO........",
      ".........SSSS...MMMOOOKO........",
      "........MMMMMMMMMMMOOOOO........",
      ".......MMMMMMMMMMMOOOOOO........",
      "......MMMOOOOOOOOOOOOOON........",
      ".....MMMOOOOOOOOOOOOOOOO........",
      // 16-23: 獅身與腹部
      "....MMMOOOOOYYYYYYYYOOOO........",
      "...MMMOOOOOOYYYYYYYYOOOO........",
      "...MMOOOOOOOYYYYYYYYOOOO........",
      "...MOOOOOOOOYYYYYYYYOOOO........",
      "....OOOOOOOOYYYYYYYYOOOO........",
      "....OOOOOOOOYYYYYYYYOOOO........",
      ".....OOOOOOOOOOOOOOOOOO.........",
      ".....OOOOOOOOOOOOOOOOOO.........",
      // 24-31: 四肢伸展姿態（跑動 1：前腿向前伸、後腿向後蹬）
      "....OOOO..OOO....OOOO..OOO......",
      "...OOOO....OOO..OOOO....OOO.....",
      "...OOO......OO..OOO......OO.....",
      "..OOO........O.OOO........O.....",
      "..WWW........W.WWW........W.....",
      "..WWW........W.WWW........W.....",
      "................................",
      "................................"
    ];
    return createPixelTexture(map, this.CHARLIE_LION_COLORS);
  }

  /**
   * 查理騎獅奔跑影格 2 (32x32)
   */
  public static createCharlieLionRunFrame2(): THREE.CanvasTexture {
    const map = [
      "................................",
      "............RRRR................",
      "...........RRRRRR...............",
      "...........HHHHHH...............",
      "...........SSSKSS...............",
      "...........SSSSSS...............",
      "...........RRRRRR...............",
      "..........RRRRRRRR..............",
      "..........RRBBRRRR..............",
      "..........BBBBBBBB..MMMM........",
      ".........BBBBBBBB.MMOOOO........",
      ".........SSSS...MMMOOOKO........",
      "........MMMMMMMMMMMOOOOO........",
      ".......MMMMMMMMMMMOOOOOO........",
      "......MMMOOOOOOOOOOOOOON........",
      ".....MMMOOOOOOOOOOOOOOOO........",
      "....MMMOOOOOYYYYYYYYOOOO........",
      "...MMMOOOOOOYYYYYYYYOOOO........",
      "...MMOOOOOOOYYYYYYYYOOOO........",
      "...MOOOOOOOOYYYYYYYYOOOO........",
      "....OOOOOOOOYYYYYYYYOOOO........",
      "....OOOOOOOOYYYYYYYYOOOO........",
      ".....OOOOOOOOOOOOOOOOOO.........",
      ".....OOOOOOOOOOOOOOOOOO.........",
      // 四肢收縮微縮姿態
      "......OOOO........OOOO..........",
      "......OOOO........OOOO..........",
      ".......OOO........OOO...........",
      ".......OOO........OOO...........",
      ".......WWW........WWW...........",
      ".......WWW........WWW...........",
      "................................",
      "................................"
    ];
    return createPixelTexture(map, this.CHARLIE_LION_COLORS);
  }

  /**
   * 查理騎獅跳躍影格 (32x32)
   */
  public static createCharlieLionJumpFrame(): THREE.CanvasTexture {
    const map = [
      "................................",
      "............RRRR................",
      "...........RRRRRR...............",
      "...........HHHHHH...............",
      "...........SSSKSS...............",
      "...........SSSSSS...............",
      "...........RRRRRR...............",
      "..........RRRRRRRR..............",
      "..........RRBBRRRR..............",
      "..........BBBBBBBB..MMMM........",
      ".........BBBBBBBB.MMOOOO........",
      ".........SSSS...MMMOOOKO........",
      "........MMMMMMMMMMMOOOOO........",
      ".......MMMMMMMMMMMOOOOOO........",
      "......MMMOOOOOOOOOOOOOON........",
      ".....MMMOOOOOOOOOOOOOOOO........",
      "....MMMOOOOOYYYYYYYYOOOO........",
      "...MMMOOOOOOYYYYYYYYOOOO........",
      "...MMOOOOOOOYYYYYYYYOOOO........",
      "...MOOOOOOOOYYYYYYYYOOOO........",
      "....OOOOOOOOYYYYYYYYOOOO........",
      "....OOOOOOOOYYYYYYYYOOOO........",
      ".....OOOOOOOOOOOOOOOOOO.........",
      ".....OOOOOOOOOOOOOOOOOO.........",
      // 騰空四肢彎曲伸向前後
      "...OOOOO............OOOOO.......",
      "....OOOOO..........OOOOO........",
      ".....OOOO..........OOOO.........",
      "......OOO..........OOO..........",
      "......WWW..........WWW..........",
      "......WWW..........WWW..........",
      "................................",
      "................................"
    ];
    return createPixelTexture(map, this.CHARLIE_LION_COLORS);
  }

  /**
   * 查理騎獅受傷撞擊影格 (32x32)
   */
  public static createCharlieLionDeadFrame(): THREE.CanvasTexture {
    const map = [
      "................................",
      "....................RRRR........",
      "...................RRRRRR.......",
      "...................HHHHHH.......",
      "...................WKWKWK.......", // 眼冒星號/白眼
      "...................SSSSSS.......",
      "...................RRRRRR.......",
      ".................RRRRRRRR.......",
      ".................RRBBRRRR.......",
      ".................BBBBBBBB.......",
      "................BBBBBBBB........",
      "...............SSSS.............",
      "........MMMMMMMMMMMM............",
      ".......MMMMMMMMMMMMMOOOO........",
      "......MMMOOOOOOOOOOOOOKO........",
      ".....MMMOOOOOOOOOOOOOOOO........",
      "....MMMOOOOOYYYYYYYYOOOO........",
      "...MMMOOOOOOYYYYYYYYOOOO........",
      "...MMOOOOOOOYYYYYYYYOOOO........",
      "...MOOOOOOOOYYYYYYYYOOOO........",
      "....OOOOOOOOYYYYYYYYOOOO........",
      "....OOOOOOOOYYYYYYYYOOOO........",
      ".....OOOOOOOOOOOOOOOOOO.........",
      ".....OOOOOOOOOOOOOOOOOO.........",
      // 四肢四腳朝天癱倒
      "....OOO..OOO....OOO..OOO........",
      "...OOOO..OOOO..OOOO..OOOO.......",
      "..OOOOO..OOOOOOOOOO..OOOOO......",
      "..WWWWW..WWWWWWWWWW..WWWWW......",
      "................................",
      "................................",
      "................................",
      "................................"
    ];
    return createPixelTexture(map, this.CHARLIE_LION_COLORS);
  }

  // 火焰色彩字元映射表
  private static readonly FIRE_COLORS: Record<string, string> = {
    '.': PALETTE.TRANSPARENT,
    'R': PALETTE.FIRE_RED,
    'O': PALETTE.FIRE_ORANGE,
    'Y': PALETTE.FIRE_YELLOW,
    'W': PALETTE.FIRE_WHITE,
    'D': PALETTE.POT_DARK_RED,
    'H': PALETTE.POT_HIGHLIGHT,
  };

  /**
   * 大火圈前半部（明亮烈焰，Z = +5，覆蓋於角色前方）
   * 尺寸: 20x96
   * 結構: 上危險區 0-9 (10px), 中央安全通道 10-81 (72px), 下危險區 82-95 (14px)
   */
  public static createFireRingFrontTexture(frame: 1 | 2): THREE.CanvasTexture {
    const rows: string[] = [];
    const isFrame1 = frame === 1;

    for (let y = 0; y < 96; y++) {
      if (y < 10) {
        // 上部火焰 (燃燒弧線，10 列)
        if (y < 2) {
          rows.push("......RROOOORR......");
        } else if (y < 4) {
          rows.push(isFrame1 ? "....RROOYYYYOORR...." : "....RROYYYYYYOORR...");
        } else if (y < 7) {
          rows.push(isFrame1 ? "...RROOYYWWYYOORR..." : "...RROYYWWWWYYORR...");
        } else {
          rows.push("..RROOYY....YYOORR..");
        }
      } else if (y >= 10 && y < 82) {
        // 中央安全穿透通道 (兩側為環狀邊框火焰，中央為安全中空，72 列)
        if (isFrame1) {
          rows.push("..RROY........YORR..");
        } else {
          rows.push("..RRYO........OYRR..");
        }
      } else {
        // 下部火焰 (基座燃燒圓弧，14 列)
        if (y < 86) {
          rows.push("..RROOYY....YYOORR..");
        } else if (y < 90) {
          rows.push(isFrame1 ? "...RROOYYWWYYOORR..." : "...RROYYWWWWYYORR...");
        } else if (y < 93) {
          rows.push(isFrame1 ? "....RROOYYYYOORR...." : "....RROYYYYYYOORR...");
        } else {
          rows.push("......RROOOORR......");
        }
      }
    }

    return createPixelTexture(rows, this.FIRE_COLORS);
  }

  /**
   * 大火圈後半部（暗部烈焰，Z = -5，襯托於角色後方）
   * 尺寸: 20x96
   */
  public static createFireRingBackTexture(frame: 1 | 2): THREE.CanvasTexture {
    const rows: string[] = [];
    const isFrame1 = frame === 1;

    for (let y = 0; y < 96; y++) {
      if (y < 10) {
        if (y < 3) {
          rows.push("......RRRRRRRR......");
        } else if (y < 7) {
          rows.push(isFrame1 ? "....RRRROOOORRRR...." : "....RRROOOOOORRR....");
        } else {
          rows.push("...RRRRO....ORRRR...");
        }
      } else if (y >= 10 && y < 82) {
        rows.push("..RRRO........ORRR..");
      } else {
        if (y < 86) {
          rows.push("...RRRRO....ORRRR...");
        } else if (y < 90) {
          rows.push(isFrame1 ? "....RRRROOOORRRR...." : "....RRROOOOOORRR....");
        } else if (y < 93) {
          rows.push("....RRRRRRRRRRRR....");
        } else {
          rows.push("......RRRRRRRR......");
        }
      }
    }

    return createPixelTexture(rows, this.FIRE_COLORS);
  }

  /**
   * 地面火壺精靈 (16x24)
   */
  public static createFirePotTexture(frame: 1 | 2): THREE.CanvasTexture {
    const isFrame1 = frame === 1;
    const map = [
      // 0-7: 頂部竄動火苗
      "................",
      isFrame1 ? "......Y..Y......" : ".....YY..YY.....",
      isFrame1 ? ".....YY..YY....." : "....YYY..YYY....",
      isFrame1 ? "....YYYYYYYY...." : "....YYYYYYYY....",
      "....YYOWWOYY....",
      "...YYOOWWOOYY...",
      "...ROOOWWOOOR...",
      "...RROOOOOORR...",
      // 8-23: 陶壺壺身 (寬度 14x16)
      "...DDDDDDDDDD...",
      "..DDDDDDDDDDDD..",
      "..DHHHHHHHHHHD..",
      "..DDDDDDDDDDDD..",
      "..DDDDDDDDDDDD..",
      "..DDDDDDDDDDDD..",
      "..DDDDDDDDDDDD..",
      "..DDDDDDDDDDDD..",
      "..DDDDDDDDDDDD..",
      "..DDDDDDDDDDDD..",
      "..DDDDDDDDDDDD..",
      "..DDDDDDDDDDDD..",
      "..DDDDDDDDDDDD..",
      "..DDDDDDDDDDDD..",
      "..DDDDDDDDDDDD..",
      "...DDDDDDDDDD..."
    ];
    return createPixelTexture(map, this.FIRE_COLORS);
  }

  /**
   * 跑道地面連續紋理 (32x32)
   */
  public static createTrackGroundTexture(): THREE.CanvasTexture {
    const rows: string[] = [];
    for (let y = 0; y < 32; y++) {
      if (y < 2) {
        // 地表頂部草皮/綠線
        rows.push("GGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG");
      } else if (y < 4) {
        // 黃色分道界線
        rows.push("YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY");
      } else {
        // 泥土跑道主體
        if (y % 4 === 0) {
          rows.push("BBBBBBKBBBBBBBBBBBBBKBBBBBBBBBBB");
        } else if (y % 4 === 2) {
          rows.push("BBBBBBBBBBBKKBBBBBBBBBBBBBBKKBBB");
        } else {
          rows.push("BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB");
        }
      }
    }

    const groundColors: Record<string, string> = {
      'G': PALETTE.GROUND_GREEN,
      'Y': PALETTE.GROUND_YELLOW,
      'B': PALETTE.GROUND_BROWN,
      'K': '#5C3800'
    };

    const texture = createPixelTexture(rows, groundColors);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  /**
   * 馬戲團頂棚紋理 (32x16)
   */
  public static createTentTexture(): THREE.CanvasTexture {
    const rows: string[] = [];
    for (let y = 0; y < 16; y++) {
      if (y < 2) {
        rows.push("KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK");
      } else if (y < 14) {
        // 紅白相間垂直條紋
        rows.push("BBBBBBBBWWWWWWWWBBBBBBBBWWWWWWWW");
      } else {
        rows.push("WWWWWWWWBBBBBBBBWWWWWWWWBBBBBBBB");
      }
    }
    const tentColors: Record<string, string> = {
      'K': PALETTE.BLACK,
      'B': PALETTE.TENT_BLUE,
      'W': PALETTE.TENT_WHITE
    };
    const texture = createPixelTexture(rows, tentColors);
    texture.wrapS = THREE.RepeatWrapping;
    return texture;
  }

  /**
   * 觀眾席歡呼紋理 (32x16)
   */
  public static createCrowdTexture(): THREE.CanvasTexture {
    const rows = [
      "SSSS....SSSS....SSSS....SSSS....",
      "SSSS....SSSS....SSSS....SSSS....",
      "1111....2222....3333....1111....",
      "1111....2222....3333....1111....",
      "KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK",
      "....SSSS....SSSS....SSSS....SSSS",
      "....SSSS....SSSS....SSSS....SSSS",
      "....2222....3333....1111....2222",
      "....2222....3333....1111....2222",
      "KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK",
      "SSSS....SSSS....SSSS....SSSS....",
      "SSSS....SSSS....SSSS....SSSS....",
      "3333....1111....2222....3333....",
      "3333....1111....2222....3333....",
      "RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR",
      "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW"
    ];
    const crowdColors: Record<string, string> = {
      '.': PALETTE.BLACK,
      'S': PALETTE.CROWD_SKIN,
      '1': PALETTE.CROWD_SHIRT_1,
      '2': PALETTE.CROWD_SHIRT_2,
      '3': PALETTE.CROWD_SHIRT_3,
      'K': PALETTE.BLACK,
      'R': PALETTE.RAILING_RED,
      'W': PALETTE.RAILING_WHITE
    };
    const texture = createPixelTexture(rows, crowdColors);
    texture.wrapS = THREE.RepeatWrapping;
    return texture;
  }

  /**
   * 距離看板 (16x20)
   */
  public static createMeterPostTexture(text: string): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 20;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    // 棕色看板木質基座
    ctx.fillStyle = '#885400';
    ctx.fillRect(1, 0, 14, 14);
    ctx.fillStyle = '#5C3800';
    ctx.fillRect(0, 0, 1, 14);
    ctx.fillRect(15, 0, 1, 14);

    // 白色底標籤
    ctx.fillStyle = '#FCFCFC';
    ctx.fillRect(2, 1, 12, 12);

    // 黑色數字/文字
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 8, 7);

    // 下方立柱
    ctx.fillStyle = '#5C3800';
    ctx.fillRect(7, 14, 2, 6);

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    return texture;
  }
}
