import { describe, expect, it } from "vitest";
import {
  COLOR_GRID_COLS,
  COLOR_GRID_ROWS,
  buildChromaticGrid,
  buildGrayscaleRow,
  hexToHsl,
  hexToRgb,
  hslToHex,
  hslToRgb,
  isPresetColor,
  rgbToHex,
  rgbToHsl,
  toHexColor,
} from "./color";

/** `#rrggbb`（小文字）の形式。 */
const HEX6_PATTERN = /^#[0-9a-f]{6}$/;

describe("toHexColor", () => {
  it("6 桁はそのまま小文字にする", () => {
    expect(toHexColor("#ABCDEF")).toBe("#abcdef");
  });

  it("3 桁は 6 桁に展開する", () => {
    expect(toHexColor("#F0a")).toBe("#ff00aa");
  });

  it("前後の空白を無視する", () => {
    expect(toHexColor("  #123456 ")).toBe("#123456");
  });

  it("解釈できないときは既定の fallback を小文字で返す", () => {
    expect(toHexColor("red")).toBe("#32cd32");
    expect(toHexColor("#12345")).toBe("#32cd32");
  });

  it("fallback を指定したときはそれを小文字で返す", () => {
    expect(toHexColor("", "#ABC")).toBe("#abc");
  });
});

describe("isPresetColor", () => {
  const presets = ["#FFFFFF", "#ff0000"] as const;

  it("大文字・小文字や 3 桁表記の違いを無視して一致を判定する", () => {
    expect(isPresetColor("#fff", presets)).toBe(true);
    expect(isPresetColor("#FF0000", presets)).toBe(true);
  });

  it("プリセットにない色は false", () => {
    expect(isPresetColor("#000000", presets)).toBe(false);
  });

  it("解釈できない色は、プリセットの fallback 色とも一致しない", () => {
    expect(isPresetColor("red", ["#32cd32"])).toBe(false);
  });
});

describe("hexToRgb / rgbToHex", () => {
  it("16 進を RGB に変換する", () => {
    expect(hexToRgb("#ff8000")).toEqual({ r: 255, g: 128, b: 0 });
    expect(hexToRgb("#0f0")).toEqual({ r: 0, g: 255, b: 0 });
  });

  it("解釈できない 16 進は黒として扱う", () => {
    expect(hexToRgb("oops")).toEqual({ r: 0, g: 0, b: 0 });
  });

  it("RGB を 16 進に変換する", () => {
    expect(rgbToHex({ r: 255, g: 128, b: 0 })).toBe("#ff8000");
  });

  it("範囲外は 0〜255 に収め、小数は四捨五入する", () => {
    expect(rgbToHex({ r: 300, g: -5, b: 127.6 })).toBe("#ff0080");
  });
});

describe("rgbToHsl / hslToRgb", () => {
  it("純色を HSL に変換する", () => {
    expect(rgbToHsl({ r: 255, g: 0, b: 0 })).toEqual({ h: 0, s: 100, l: 50 });
    expect(rgbToHsl({ r: 0, g: 0, b: 255 })).toEqual({
      h: 240,
      s: 100,
      l: 50,
    });
  });

  it("無彩色は色相・彩度を 0 にする", () => {
    const hsl = rgbToHsl({ r: 128, g: 128, b: 128 });
    expect(hsl.h).toBe(0);
    expect(hsl.s).toBe(0);
    expect(hsl.l).toBeCloseTo(50.196, 3);
  });

  it("HSL を RGB に変換する", () => {
    expect(hslToRgb({ h: 120, s: 100, l: 50 })).toEqual({
      r: 0,
      g: 255,
      b: 0,
    });
  });

  it("色相は 360 度で折り返し、負の値も扱う", () => {
    expect(hslToRgb({ h: -240, s: 100, l: 50 })).toEqual(
      hslToRgb({ h: 120, s: 100, l: 50 }),
    );
    expect(hslToRgb({ h: 480, s: 100, l: 50 })).toEqual(
      hslToRgb({ h: 120, s: 100, l: 50 }),
    );
  });

  it("彩度・明度は 0〜100 に収める", () => {
    expect(hslToRgb({ h: 0, s: 100, l: 150 })).toEqual({
      r: 255,
      g: 255,
      b: 255,
    });
    expect(hslToRgb({ h: 0, s: -20, l: 50 })).toEqual({
      r: 128,
      g: 128,
      b: 128,
    });
  });
});

describe("hexToHsl / hslToHex", () => {
  it.each(["#ff8000", "#32cd32", "#1e90ff", "#ffffff", "#000000", "#808080"])(
    "%s は HSL を経由しても同じ色に戻る",
    (hex) => {
      expect(hslToHex(hexToHsl(hex))).toBe(hex);
    },
  );
});

describe("buildGrayscaleRow", () => {
  it("列数ぶん、白から黒へ並べる", () => {
    const row = buildGrayscaleRow();
    expect(row).toHaveLength(COLOR_GRID_COLS);
    expect(row[0]).toBe("#ffffff");
    expect(row[COLOR_GRID_COLS - 1]).toBe("#000000");
  });

  it("右へ行くほど暗くなる", () => {
    const lightness = buildGrayscaleRow().map((hex) => hexToHsl(hex).l);
    for (let i = 1; i < lightness.length; i += 1) {
      expect(lightness[i]).toBeLessThan(lightness[i - 1]);
    }
  });
});

describe("buildChromaticGrid", () => {
  it("行数 × 列数の `#rrggbb` を返す", () => {
    const grid = buildChromaticGrid();
    expect(grid).toHaveLength(COLOR_GRID_ROWS);
    for (const row of grid) {
      expect(row).toHaveLength(COLOR_GRID_COLS);
      for (const hex of row) {
        expect(hex).toMatch(HEX6_PATTERN);
      }
    }
  });

  it("下の行ほど明るくなる", () => {
    const grid = buildChromaticGrid();
    for (let col = 0; col < COLOR_GRID_COLS; col += 1) {
      const lightness = grid.map((row) => hexToHsl(row[col]).l);
      for (let i = 1; i < lightness.length; i += 1) {
        expect(lightness[i]).toBeGreaterThan(lightness[i - 1]);
      }
    }
  });
});
