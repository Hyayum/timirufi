export interface Chord {
  memo?: string;
  bpm?: number;
  key?: number;
  bass: number;
  shape: string;
  accd?: number[];
  beats: number;
};

export interface ChordForUtils {
  memo?: string;
  bpm: number;
  key: number;
  bass: number;
  shape: string;
  accd?: number[];
  beats: number;
};
  
export const keyOptions = [
  { label: "C", value: 0 },
  { label: "D♭", value: -5 },
  { label: "D", value: 2 },
  { label: "E♭", value: -3 },
  { label: "E", value: 4 },
  { label: "F", value: -1 },
  { label: "G♭", value: -6 },
  { label: "G", value: 1 },
  { label: "A♭", value: -4 },
  { label: "A", value: 3 },
  { label: "B♭", value: -2 },
  { label: "B", value: 5 },
];

export const defaultChord: Chord = {
  bass: 1,
  shape: "135",
  beats: 2,
};

const hsvToRgb = (h: number, s: number, v: number) => {
  const high = Math.round(255 * v / 100);
  const low = Math.round(255 * v * (100 - s) / 10000);
  const getMid = (h: number) => {
    return Math.round((high - low) * h / 60 + low);
  };
  const getStr = (nums: number[]) => {
    return `#${nums.map((n) => n.toString(16)).join("")}`;
  };
  if (0 <= h && h < 60) { return getStr([high, getMid(h), low]); }
  if (60 <= h && h < 120) { return getStr([getMid(120 - h), high, low]); }
  if (120 <= h && h < 180) { return getStr([low, high, getMid(h - 120)]); }
  if (180 <= h && h < 240) { return getStr([low, getMid(240 - h), high]); }
  if (240 <= h && h < 300) { return getStr([getMid(h - 240), low, high]); }
  if (300 <= h && h <= 360) { return getStr([high, low, getMid(360 - h)]); }
};

export const keyColors = Array(12).fill(0).reduce((obj, z, i)=> ({
  ...obj,
  [i]: hsvToRgb((60 - 30 * i + 360) % 360, 20, 100),
}), {});