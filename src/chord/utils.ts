import { Chord, ChordForUtils } from "@/chord/model";
import { fifthCircleIndex, fifthCircle, accdMarks, halfAndThirdCircleIndex } from "@/chord/scale";

export const accdNumToSf = (n: number) => {
  if (n > 0) return `${n}＃`;
  else if (n < 0) return `${-n}♭`;
  else return `${n}`;
};

export const fitRange = (n: number, min: number, width: number) => {
  return ((n - min) % width + width) % width + min;
};

export const applyAccd = (arr: number[], accd: number[], inc: number) => {
  return arr.map((n, i) => 
    accd.includes(i + 1) ? n + inc :
    accd.includes(-i - 1) ? n - inc : n
  );
};

export const getChordsForUtils = (chords: Chord[], key: number, bpm: number, beats: number): ChordForUtils[] => {
  const chordsForMidi = [];
  let currentKey = key;
  let currentBpm = bpm;
  for (const chord of chords) {
    currentKey = (chord.key !== undefined && chord.key != 12) ? chord.key : currentKey;
    currentBpm = chord.bpm ? chord.bpm : currentBpm;
    chordsForMidi.push({
      ...chord,
      key: currentKey,
      bpm: currentBpm,
      beats: chord.beats || beats,
    });
  }
  return chordsForMidi;
};

export const calcMainFunc = (bass: number, shape: string) => {
  const arr = Array.from(shape).map((n) => Number(n));
  const points = arr.map((n) => {
    let p = 0;
    if (n == 1) { p += 2; }
    if (arr.includes((n + 1) % 7 + 1)) { p += 2; }
    if (arr.includes((n + 3) % 7 + 1)) { p += 3; }
    if (arr.includes((n + 5) % 7 + 1)) { p += 1; }
    return { num: n, point: p };
  });
  const maxPoint = points.reduce((max, val) => Math.max(val.point, max), 0);
  const firstMainFunc = points.filter((p) => p.point == maxPoint).map((p) => (p.num + bass - 2) % 7 + 1);
  const secondMainFunc = points.filter((p) => p.point == maxPoint - 1).map((p) => (p.num + bass - 2) % 7 + 1);
  return { first: firstMainFunc, second: secondMainFunc };
};

export const mainFuncToStr = (mainFunc: { first: number[], second: number[] }) => {
  return `${mainFunc.first.join(",")}${mainFunc.second.length ? "/" + mainFunc.second.join(",") : ""}`;
};

export const calcScaleLevel = (accd: number[] = []) => {
  const circle = applyAccd(fifthCircleIndex, accd, 7);
  const range = Math.max(...circle) - Math.min(...circle);
  if (range == 6) { return "-"; }
  return `${accdMarks[range % 7]}${Math.floor((range - 7) / 7) > 0 ? Math.floor((range - 7) / 7) + 1 : ""}`;
};

export const calcRealname = (key: number, bass: number, shape: string, accd: number[] = []) => {
  const locations = applyAccd(fifthCircleIndex, accd, 7).map((n) => n + key);
  const notes = Array.from(shape).map((n) => Number(n) + bass - 1).map((n) => {
    const location = locations[(n - 1) % 7];
    const name = fifthCircle[fitRange(location, 0, 7)];
    const sf = location > 0 ? Array(Math.floor(location / 7)).fill("#").join("").replace(/##/g, "×") : 
      location < 0 ? Array(-Math.floor(location / 7)).fill("b").join("") : "";
    return `${name}${sf}`;
  });
  const numToName: { [k: number]: string } = Array.from(shape).reduce((obj, n, i) => ({ ...obj, [Number(n)]: notes[i] }), {});
  return Array(7).fill(0).map((z, i) => numToName[i + 1] || " ").join("");
};

const circleAverage = (values: { value: number, weight: number }[], min: number, width: number) => {
  const xs = [];
  const ys = [];
  for (const v of values) {
    xs.push(Math.cos(v.value * 2 * Math.PI / width) * v.weight);
    ys.push(Math.sin(v.value * 2 * Math.PI / width) * v.weight);
  }
  const xSum = xs.reduce((sum, n) => sum + n, 0);
  const ySum = ys.reduce((sum, n) => sum + n, 0);
  const result = width * Math.atan2(ySum, xSum) / (2 * Math.PI);
  return fitRange(result, min, width);
};

export const calcChordProg = (prev: Chord | ChordForUtils, current: Chord | ChordForUtils) => {
  const prevMainFunc = calcMainFunc(prev.bass, prev.shape);
  const currentMainFunc = calcMainFunc(current.bass, current.shape);
  const prevHalfAndThird = applyAccd(halfAndThirdCircleIndex, prev.accd || [], 1);
  const currentHalfAndThird = applyAccd(halfAndThirdCircleIndex, current.accd || [], 1);

  const prevFuncs = [
    ...prevMainFunc.first.map((f) => ({ func: prevHalfAndThird[f - 1], rank: 1 })),
    ...prevMainFunc.second.map((f) => ({ func: prevHalfAndThird[f - 1], rank: 2 })),
  ];
  const currentFuncs = [
    ...currentMainFunc.first.map((f) => ({ func: currentHalfAndThird[f - 1], rank: 1 })),
    ...currentMainFunc.second.map((f) => ({ func: currentHalfAndThird[f - 1], rank: 2 })),
  ];
  const keyDiff = fitRange((current.key ?? 0) - (prev.key ?? 0), -6, 12) * 7
  const diffs = [];
  for (const pre of prevFuncs) {
    for (const cur of currentFuncs) {
      diffs.push({ value: fitRange(cur.func - pre.func + keyDiff, -12, 24), weight: 1 / (cur.rank * pre.rank) });
    }
  }
  const diff = Math.round(10 * circleAverage(diffs, -12, 24)) / 10;
  return diff > 0 ? `u${diff}` : diff < 0 ? `d${-diff}` : "0";
};