import { useEffect, useState, useRef, useLayoutEffect } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Grid2 as Grid,
  TextField,
  Typography,
} from "@mui/material";
import { CopyAll } from "@mui/icons-material";
import Head from "next/head";
import { keyframes } from "@mui/system";
import Link from "next/link";
import OutBoundLink from "@/component/OutboundLink";
import NumberField from "@/component/NumberField";

type LetterOption = {
  letter: string;
  weight: number;
  afterTu?: number;
  afterN?: number;
  notFirst?: boolean;
  notLast?: boolean;
  notAfter?: string[];
  minor?: boolean;
};

const vowelMap = [
  ["あ", "ぁ", "か", "が", "さ", "ざ", "た", "だ", "な", "は", "ば", "ぱ", "ま", "や", "ゃ", "ら", "わ"],
  ["い", "ぃ", "き", "ぎ", "し", "じ", "ち", "ぢ", "に", "ひ", "び", "ぴ", "み", "り"],
  ["う", "ぅ", "ゔ", "く", "ぐ", "す", "ず", "つ", "づ", "ぬ", "ふ", "ぶ", "ぷ", "む", "ゆ", "ゅ", "る"],
  ["え", "ぇ", "け", "げ", "せ", "ぜ", "て", "で", "ね", "へ", "べ", "ぺ", "め", "れ"],
  ["お", "ぉ", "こ", "ご", "そ", "ぞ", "と", "ど", "の", "ほ", "ぼ", "ぽ", "も", "よ", "ょ", "ろ"],
];

const defaultOptionsBase: LetterOption[] = [
  { letter: "あ", weight: 28, afterN: 5, notAfter: ["っ"] },
  { letter: "い", weight: 30, afterN: 5, notAfter: ["っ"] },
  { letter: "う", weight: 26, afterN: 5, notAfter: ["っ"] },
  { letter: "え", weight: 28, afterN: 5, notAfter: ["っ"] },
  { letter: "お", weight: 26, afterN: 5, notAfter: ["っ"] },
  { letter: "や", weight: 5, afterN: 4, notAfter: ["っ"] },
  { letter: "ゆ", weight: 7, afterN: 4, notAfter: ["っ"] },
  { letter: "いぇ", weight: 4, afterN: 2, notAfter: ["っ"] },
  { letter: "よ", weight: 5, afterN: 4, notAfter: ["っ"] },
  { letter: "わ", weight: 4, afterN: 2, notAfter: ["っ"] },
  { letter: "うぃ", weight: 3, afterN: 1, notAfter: ["っ"] },
  { letter: "うぇ", weight: 3, afterN: 1, notAfter: ["っ"] },
  { letter: "うぉ", weight: 3, afterN: 1, notAfter: ["っ"] },
  { letter: "か", weight: 9 },
  { letter: "き", weight: 7 },
  { letter: "く", weight: 9 },
  { letter: "け", weight: 7 },
  { letter: "こ", weight: 7 },
  { letter: "きゃ", weight: 1 },
  { letter: "きゅ", weight: 1 },
  { letter: "きぇ", weight: 1, minor: true },
  { letter: "きょ", weight: 1 },
  { letter: "くぁ", weight: 1 },
  { letter: "くぃ", weight: 1 },
  { letter: "くぇ", weight: 1 },
  { letter: "くぉ", weight: 1 },
  { letter: "が", weight: 5, afterTu: 2 },
  { letter: "ぎ", weight: 5, afterTu: 2 },
  { letter: "ぐ", weight: 5, afterTu: 2 },
  { letter: "げ", weight: 5, afterTu: 2 },
  { letter: "ご", weight: 5, afterTu: 2 },
  { letter: "ぎゃ", weight: 1, afterTu: 1 },
  { letter: "ぎゅ", weight: 1, afterTu: 1 },
  { letter: "ぎぇ", weight: 1, afterTu: 1, minor: true },
  { letter: "ぎょ", weight: 1, afterTu: 1 },
  { letter: "ぐぁ", weight: 1, afterTu: 1 },
  { letter: "ぐぃ", weight: 1, afterTu: 1 },
  { letter: "ぐぇ", weight: 1, afterTu: 1 },
  { letter: "ぐぉ", weight: 1, afterTu: 1 },
  { letter: "さ", weight: 9 },
  { letter: "すぃ", weight: 8 },
  { letter: "す", weight: 11 },
  { letter: "せ", weight: 8 },
  { letter: "そ", weight: 8 },
  { letter: "すゃ", weight: 0.5, minor: true },
  { letter: "すゅ", weight: 1, minor: true },
  { letter: "すぃぇ", weight: 0.5, minor: true },
  { letter: "すょ", weight: 0.5, minor: true },
  { letter: "すぁ", weight: 0.5, minor: true },
  { letter: "すぅぃ", weight: 1, minor: true },
  { letter: "すぇ", weight: 1, minor: true },
  { letter: "すぉ", weight: 0.5, minor: true },
  { letter: "ざ", weight: 5, afterTu: 1 },
  { letter: "ずぃ", weight: 6, afterTu: 1 },
  { letter: "ず", weight: 7, afterTu: 1 },
  { letter: "ぜ", weight: 5, afterTu: 1 },
  { letter: "ぞ", weight: 5, afterTu: 1 },
  { letter: "ずゃ", weight: 0.5, afterTu: 0.5, minor: true },
  { letter: "ずゅ", weight: 1, afterTu: 1, minor: true },
  { letter: "ずぃぇ", weight: 0.5, afterTu: 0.5, minor: true },
  { letter: "ずょ", weight: 0.5, afterTu: 0.5, minor: true },
  { letter: "ずぁ", weight: 0.5, afterTu: 0.5, minor: true },
  { letter: "ずぅぃ", weight: 1, afterTu: 1, minor: true },
  { letter: "ずぇ", weight: 1, afterTu: 1, minor: true },
  { letter: "ずぉ", weight: 0.5, afterTu: 0.5, minor: true },
  { letter: "しゃ", weight: 3 },
  { letter: "し", weight: 3 },
  { letter: "しゅ", weight: 3 },
  { letter: "しぇ", weight: 3 },
  { letter: "しょ", weight: 3 },
  { letter: "しゅぁ", weight: 0.5, minor: true },
  { letter: "しゅぃ", weight: 1, minor: true },
  { letter: "しゅぇ", weight: 1, minor: true },
  { letter: "しゅぉ", weight: 0.5, minor: true },
  { letter: "じゃ", weight: 3, afterTu: 1 },
  { letter: "じ", weight: 3, afterTu: 1 },
  { letter: "じゅ", weight: 4, afterTu: 1 },
  { letter: "じぇ", weight: 3, afterTu: 1 },
  { letter: "じょ", weight: 3, afterTu: 1 },
  { letter: "じゅぁ", weight: 0.5, minor: true },
  { letter: "じゅぃ", weight: 1, minor: true },
  { letter: "じゅぇ", weight: 1, minor: true },
  { letter: "じゅぉ", weight: 0.5, minor: true },
  { letter: "た", weight: 6 },
  { letter: "てぃ", weight: 7 },
  { letter: "とぅ", weight: 7 },
  { letter: "て", weight: 6 },
  { letter: "と", weight: 6 },
  { letter: "てゃ", weight: 1, minor: true },
  { letter: "てゅ", weight: 1 },
  { letter: "てぃぇ", weight: 0.5, minor: true },
  { letter: "てょ", weight: 1, minor: true },
  { letter: "とぁ", weight: 1, minor: true },
  { letter: "とぃ", weight: 1, minor: true },
  { letter: "とぇ", weight: 1, minor: true },
  { letter: "とぅぉ", weight: 0.5, minor: true },
  { letter: "だ", weight: 5, afterTu: 2 },
  { letter: "でぃ", weight: 5, afterTu: 2 },
  { letter: "どぅ", weight: 5, afterTu: 2 },
  { letter: "で", weight: 5, afterTu: 2 },
  { letter: "ど", weight: 5, afterTu: 2 },
  { letter: "でゃ", weight: 1, afterTu: 1, minor: true },
  { letter: "でゅ", weight: 1, afterTu: 1 },
  { letter: "でぃぇ", weight: 0.5, afterTu: 0.5, minor: true },
  { letter: "でょ", weight: 1, afterTu: 1, minor: true },
  { letter: "どぁ", weight: 1, afterTu: 1, minor: true },
  { letter: "どぃ", weight: 1, afterTu: 1, minor: true },
  { letter: "どぇ", weight: 1, afterTu: 1, minor: true },
  { letter: "どぅぉ", weight: 0.5, afterTu: 0.5, minor: true },
  { letter: "ちゃ", weight: 4 },
  { letter: "ち", weight: 5 },
  { letter: "ちゅ", weight: 4 },
  { letter: "ちぇ", weight: 4 },
  { letter: "ちょ", weight: 4 },
  { letter: "ちゅぁ", weight: 1, minor: true },
  { letter: "ちゅぃ", weight: 1, minor: true },
  { letter: "ちゅぇ", weight: 1, minor: true },
  { letter: "ちゅぉ", weight: 0.5, minor: true },
  { letter: "つぁ", weight: 3 },
  { letter: "つぃ", weight: 3 },
  { letter: "つ", weight: 3 },
  { letter: "つぇ", weight: 3 },
  { letter: "つぉ", weight: 3 },
  { letter: "つゃ", weight: 1, minor: true },
  { letter: "つゅ", weight: 1, minor: true },
  { letter: "つぃぇ", weight: 0.5, minor: true },
  { letter: "つょ", weight: 1, minor: true },
  { letter: "つぅぁ", weight: 1, minor: true },
  { letter: "つぅぃ", weight: 1, minor: true },
  { letter: "つぅぇ", weight: 1, minor: true },
  { letter: "つぅぉ", weight: 0.5, minor: true },
  { letter: "な", weight: 9, notAfter: ["っ"] },
  { letter: "に", weight: 7, notAfter: ["っ"] },
  { letter: "ぬ", weight: 7, notAfter: ["っ"] },
  { letter: "ね", weight: 8, notAfter: ["っ"] },
  { letter: "の", weight: 8, notAfter: ["っ"] },
  { letter: "にゃ", weight: 1, notAfter: ["っ"] },
  { letter: "にゅ", weight: 1, notAfter: ["っ"] },
  { letter: "にぇ", weight: 1, notAfter: ["っ"] },
  { letter: "にょ", weight: 1, notAfter: ["っ"] },
  { letter: "ぬぁ", weight: 0.5, notAfter: ["っ"], minor: true },
  { letter: "ぬぃ", weight: 1, notAfter: ["っ"], minor: true },
  { letter: "ぬぇ", weight: 1, notAfter: ["っ"], minor: true },
  { letter: "ぬぉ", weight: 0.5, notAfter: ["っ"], minor: true },
  { letter: "は", weight: 9, afterN: 3, afterTu: 1 },
  { letter: "ひ", weight: 8, afterN: 3, afterTu: 2 },
  { letter: "ほぅ", weight: 3, afterN: 3, afterTu: 1, minor: true },
  { letter: "へ", weight: 6, afterN: 2, afterTu: 1 },
  { letter: "ほ", weight: 6, afterN: 2, afterTu: 1 },
  { letter: "ひゃ", weight: 1, afterN: 1, afterTu: 2 },
  { letter: "ひゅ", weight: 1, afterN: 1, afterTu: 2 },
  { letter: "ひぇ", weight: 1, afterN: 1, afterTu: 1 },
  { letter: "ひょ", weight: 1, afterN: 1, afterTu: 2 },
  { letter: "ほぁ", weight: 0.5, afterN: 0.5, afterTu: 0.5, minor: true },
  { letter: "ほぃ", weight: 1, afterN: 1, afterTu: 1, minor: true },
  { letter: "ほぇ", weight: 1, afterN: 1, afterTu: 1, minor: true },
  { letter: "ほぅぉ", weight: 0.5, afterN: 0.5, afterTu: 0.5, minor: true },
  { letter: "ぱ", weight: 5 },
  { letter: "ぴ", weight: 5 },
  { letter: "ぷ", weight: 4 },
  { letter: "ぺ", weight: 4 },
  { letter: "ぽ", weight: 4 },
  { letter: "ぴゃ", weight: 1 },
  { letter: "ぴゅ", weight: 1 },
  { letter: "ぴぇ", weight: 0.5, minor: true },
  { letter: "ぴょ", weight: 1 },
  { letter: "ぷぁ", weight: 0.5, minor: true },
  { letter: "ぷぃ", weight: 1, minor: true },
  { letter: "ぷぇ", weight: 1, minor: true },
  { letter: "ぷぉ", weight: 0.5, minor: true },
  { letter: "ば", weight: 4, afterTu: 3 },
  { letter: "び", weight: 4, afterTu: 3 },
  { letter: "ぶ", weight: 3, afterTu: 3 },
  { letter: "べ", weight: 3, afterTu: 2 },
  { letter: "ぼ", weight: 3, afterTu: 2 },
  { letter: "びゃ", weight: 1, afterTu: 1 },
  { letter: "びゅ", weight: 1, afterTu: 1 },
  { letter: "びぇ", weight: 0.5, afterTu: 0.5, minor: true },
  { letter: "びょ", weight: 1, afterTu: 1 },
  { letter: "ぶぁ", weight: 0.5, afterTu: 0.5, minor: true },
  { letter: "ぶぃ", weight: 1, afterTu: 1, minor: true },
  { letter: "ぶぇ", weight: 1, afterTu: 1, minor: true },
  { letter: "ぶぉ", weight: 0.5, afterTu: 0.5, minor: true },
  { letter: "ふぁ", weight: 4 },
  { letter: "ふぃ", weight: 4 },
  { letter: "ふ", weight: 7 },
  { letter: "ふぇ", weight: 4 },
  { letter: "ふぉ", weight: 4 },
  { letter: "ふゃ", weight: 1, minor: true },
  { letter: "ふゅ", weight: 1 },
  { letter: "ふぃぇ", weight: 0.5, minor: true },
  { letter: "ふょ", weight: 1, minor: true },
  { letter: "ふぅぁ", weight: 0.5, minor: true },
  { letter: "ふぅぃ", weight: 1, minor: true },
  { letter: "ふぅぇ", weight: 1, minor: true },
  { letter: "ふぅぉ", weight: 0.5, minor: true },
  { letter: "ゔぁ", weight: 3, afterTu: 1 },
  { letter: "ゔぃ", weight: 3, afterTu: 1 },
  { letter: "ゔ", weight: 3, afterTu: 1 },
  { letter: "ゔぇ", weight: 3, afterTu: 1 },
  { letter: "ゔぉ", weight: 3, afterTu: 1 },
  { letter: "ゔゃ", weight: 1, afterTu: 1, minor: true },
  { letter: "ゔゅ", weight: 1, afterTu: 1 },
  { letter: "ゔぃぇ", weight: 0.5, afterTu: 0.5, minor: true },
  { letter: "ゔょ", weight: 1, afterTu: 1, minor: true },
  { letter: "ゔぅぁ", weight: 0.5, afterTu: 0.5, minor: true },
  { letter: "ゔぅぃ", weight: 1, afterTu: 1, minor: true },
  { letter: "ゔぅぇ", weight: 1, afterTu: 1, minor: true },
  { letter: "ゔぅぉ", weight: 0.5, afterTu: 0.5, minor: true },
  { letter: "ま", weight: 6, notAfter: ["っ"] },
  { letter: "み", weight: 7, notAfter: ["っ"] },
  { letter: "む", weight: 6, notAfter: ["っ"] },
  { letter: "め", weight: 7, notAfter: ["っ"] },
  { letter: "も", weight: 7, notAfter: ["っ"] },
  { letter: "みゃ", weight: 1, notAfter: ["っ"] },
  { letter: "みゅ", weight: 1, notAfter: ["っ"] },
  { letter: "みぇ", weight: 1, notAfter: ["っ"] },
  { letter: "みょ", weight: 1, notAfter: ["っ"] },
  { letter: "むぁ", weight: 0.5, notAfter: ["っ"], minor: true },
  { letter: "むぃ", weight: 1, notAfter: ["っ"], minor: true },
  { letter: "むぇ", weight: 1, notAfter: ["っ"], minor: true },
  { letter: "むぉ", weight: 0.5, notAfter: ["っ"], minor: true },
  { letter: "ら", weight: 9, afterTu: 2 },
  { letter: "り", weight: 8, afterTu: 2 },
  { letter: "る", weight: 12, afterTu: 2 },
  { letter: "れ", weight: 8, afterTu: 2 },
  { letter: "ろ", weight: 8, afterTu: 2 },
  { letter: "りゃ", weight: 1, afterTu: 1 },
  { letter: "りゅ", weight: 1, afterTu: 1 },
  { letter: "りぇ", weight: 1, afterTu: 0.5, minor: true },
  { letter: "りょ", weight: 1, afterTu: 1 },
  { letter: "るぁ", weight: 0.5, afterTu: 0.5, minor: true },
  { letter: "るぃ", weight: 1, afterTu: 0.5, minor: true },
  { letter: "るぇ", weight: 1, afterTu: 0.5, minor: true },
  { letter: "るぉ", weight: 0.5, afterTu: 0.5, minor: true },
  { letter: "っ", weight: 34, notAfter: ["っ", "ん", "ー"], notFirst: true, notLast: true },
  { letter: "ん", weight: 30, notAfter: ["っ", "ん"], notFirst: true },
  { letter: "ー", weight: 16, notAfter: ["っ", "ん", "ー", "ぁ", "ぃ", "ぅ", "ぇ", "ぉ"], notFirst: true },
  { letter: "～", weight: 16, notAfter: ["っ", "ん", "ー", "～", "ぁ", "ぃ", "ぅ", "ぇ", "ぉ"], notFirst: true },
];

const defaultOptions: LetterOption[] = [...defaultOptionsBase];
for (const letter of ["ぁ", "ぃ", "ぅ", "ぇ", "ぉ"]) {
  const additionalNotAfter = defaultOptionsBase.filter(option => defaultOptionsBase.some(o => o.letter == `${option.letter}${letter}`)).map(option => option.letter);
  defaultOptions.push({ letter, weight: 2, notAfter: ["っ", "ん", "ー", "～", "ぁ", "ぃ", "ぅ", "ぇ", "ぉ", ...additionalNotAfter], notFirst: true, minor: true });
}

const randomPick = (list: string[]) => {
  const index = Math.floor(Math.random() * list.length);
  return list[index];
};

const replaceLetters = (input: string, prevLetters: string[], replaceLetters: string[]) => {
  let result = input;
  for (let i = 0; i < prevLetters.length; i++) {
    result = result.replace(new RegExp(prevLetters[i], "g"), replaceLetters[i]);
  }
  return result;
};

const getSmallVowel = (letter: string) => {
  for (const row of vowelMap) {
    if (row.includes(letter[letter.length - 1])) {
      return row[1];
    }
  }
  return "";
};

const makeLetterList = (options: LetterOption[], prev: string, isFirst: boolean, isLast: boolean, easyMode: boolean) => {
  const letterList = [];
  for (const opt of options) {
    if (easyMode && opt.minor) continue;
    if (opt.notAfter && opt.notAfter.includes(prev)) continue;
    if (isFirst && opt.notFirst) continue;
    if (isLast && opt.notLast) continue;
    const weight = prev == "っ" ? (opt.afterTu || opt.weight) :
                   prev == "ん" ? (opt.afterN || opt.weight) : opt.weight;
    for (let i = 0; i < weight * 2; i++) {
      letterList.push(opt.letter);
    }
  }
  return letterList;
};

const ZA_ROW = ["ざ", "じ", "ず", "ぜ", "ぞ"];
const DZA_ROW = ["づぁ", "ぢ", "づ", "づぇ", "づぉ"];
const HIRA = "あいうえおぁぃぅぇぉゔかきくけこがぎぐげごさしすせそざじずぜぞたちつてとっだぢづでどなにぬねのはひふへほばびぶべぼぱぴぷぺぽまみむめもやゆよゃゅょらりるれろわをん".split("");
const KATA = "アイウエオァィゥェォヴカキクケコガギグゲゴサシスセソザジズゼゾタチツテトッダヂヅデドナニヌネノハヒフヘホバビブベボパピプペポマミムメモヤユヨャュョラリルレロワヲン".split("");

export default function Peyudochi() {
  const [options, setOptions] = useState(defaultOptions);
  const [result, setResult] = useState<{ hiragana: string, katakana: string }[]>([]);
  const [letters, setLetters] = useState(8);
  const [outputs, setOutputs] = useState(60);
  const [katakana, setKatakana] = useState(false);
  const [share, setShare] = useState("");
  const [easyMode, setEasyMode] = useState(false);

  useEffect(() => {
    document.title = "ペユドチ生成機";
  }, []);
  
  const changeOption = (letter: string, weight: number) => {
    const index = options.findIndex((opt) => opt.letter == letter);
    options[index] = { ...options[index], weight: weight };
    setOptions([...options]);
  };

  const peyudochi = () => {
    const results: { hiragana: string, katakana: string }[] = [];
    for (let i = 0; i < outputs; i++) {
      let prevLetter = "";
      const res = [];
      for (let j = 0; j < letters; j++) {
        const letterList = makeLetterList(options, prevLetter, j == 0, j == letters - 1, easyMode);
        const pickedLetter = randomPick(letterList);
        const letter = prevLetter == "っ" ? replaceLetters(pickedLetter, ZA_ROW, DZA_ROW) : 
                       pickedLetter == "～" ? getSmallVowel(prevLetter) : pickedLetter;
        prevLetter = pickedLetter;
        res.push(letter);
      }
      const hiragana = res.join("");
      results.push({ hiragana, katakana: replaceLetters(hiragana, HIRA, KATA) });
    }
    setResult(results);
  };
  
  const shareText = `${share}${"\n"}#だれでもペユドチ${"\n"}https://hyayum.github.io/timirufi/peyudochi`;
  const shareQuery = new URLSearchParams({ text: shareText });

  const rainbowColorString = (hover: boolean) => {
    const light = hover ? "ff" : "ee";
    const dark = hover ? "88" : "66";
    const gradation = Array.from({ length: 2 + 1 }).join(`#${light}${dark}${dark}, #${light}${light}${dark}, #${dark}${light}${dark}, #${dark}${light}${light}, #${dark}${dark}${light}, #${light}${dark}${light}, `) + `#${light}${dark}${dark}`
    return `linear-gradient(45deg, ${gradation})`;
  };
  const rainbowKeyframe = keyframes`
    0%   { background-position: 0% 100%; }
    100% { background-position: 100% 0%; }
  `;
  const animationProps = {
    backgroundSize: "200% 200%",
    animation: `${rainbowKeyframe} 1.5s linear infinite`,
  };

  return (
    <Grid container spacing={5} sx={{ p: 5, pb: 20, minWidth: 800 }}>
      <Head>
        <meta property="og:image" content="https://hyayum.github.io/timirufi/peyu.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@Timirufi" />
        <meta name="twitter:title" content="ペユドチ生成機" />
        <meta name="twitter:description" content="だれでもペユドチができるツール (文字ごとに確率を設定してランダムに文字列を生成できるツール)" />
        <meta name="twitter:image" content="https://hyayum.github.io/timirufi/peyu.png" />
      </Head>
      <Grid size={12}>
        <Typography variant="h4" sx={{ textAlign: "center" }}>
          ペユドチ生成機
        </Typography>
      </Grid>
      <Grid size={12}>
        <Accordion sx={{ mb: 1 }}>
          <AccordionSummary id="options">
            確率の設定
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" sx={{ mb: 3 }}>文字(音)ごとの確率の比重を0.5単位で設定できます</Typography>
            <Grid container spacing={1} sx={{ display: "flex" }}>
              {options.map((opt) => easyMode && opt.minor ? null : (
                <Grid size={{ xs: 2, md: 1.5, lg: 1, xl: 0.75 }} key={opt.letter}>
                  <NumberField
                    label={opt.letter == "～" ? "小文字伸" : opt.letter}
                    value={opt.weight}
                    variant="outlined"
                    size="small"
                    onChange={(e) => changeOption(opt.letter, Math.max(Number(e.target.value), 0))}
                    fullWidth
                  />
                </Grid>
              ))}
            </Grid>
            <Typography variant="body2" sx={{ mt: 3 }}>合計：{options.reduce((sum, opt) => sum + (easyMode && opt.minor ? 0 : opt.weight), 0)}</Typography>
          </AccordionDetails>
        </Accordion>
      </Grid>
      <Grid size={12} sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Box sx={{display: "flex"}}>
          <Box sx={{ width: 150 }}>
            <NumberField
              label="1ブロックの文字数"
              value={letters}
              variant="outlined"
              size="small"
              onChange={(e) => setLetters(Math.max(Number(e.target.value), 0))}
              fullWidth
            />
          </Box>
          <Box sx={{ width: 150 }}>
            <NumberField
              label="出力数"
              value={outputs}
              variant="outlined"
              size="small"
              onChange={(e) => setOutputs(Math.max(Number(e.target.value), 0))}
              fullWidth
            />
          </Box>
        </Box>
        <Box sx={{display: "flex"}}>
          <FormGroup sx={{ ml: 1 }}>
            <FormControlLabel
              control={
                <Checkbox checked={katakana} onClick={() => setKatakana(!katakana)} />
              }
              label="片仮名で表示"
            />
          </FormGroup>
          <FormGroup sx={{ ml: 1 }}>
            <FormControlLabel
              control={
                <Checkbox checked={easyMode} onClick={() => setEasyMode(!easyMode)} />
              }
              label="簡単ペユドチ（一般的な音のみ）"
            />
          </FormGroup>
        </Box>
      </Grid>
      <Grid size={12} sx={{ display: "flex", justifyContent: "center" }}>
        <Button
          variant="contained"
          size="large"
          color="success"
          onClick={peyudochi}
          sx={{
            width: 320,
            height: 80,
            fontSize: 40,
            background: rainbowColorString(false),
            "&:hover": { background: rainbowColorString(true), ...animationProps },
            ...animationProps,
          }}
        >
          ペユドチ
        </Button>
      </Grid>
      <Grid size={12}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          結果
        </Typography>
        <Grid container spacing={1.5}>
          {result.length > 0 ? result.map((res, i) => (
            <Grid size={{ xs: 4, sm: 3, lg: 2 }} key={i}>
              <Typography variant="body1" onClick={() => setShare(katakana ? res.katakana : res.hiragana)}>
                {katakana ? res.katakana : res.hiragana}
              </Typography>
            </Grid>
          )) : (
            <Typography variant="body1" sx={{ color: "#888", height: 300 }}>
              上の「ペユドチ」ボタンをクリック！
            </Typography>
          )}
        </Grid>
      </Grid>

      {/*
      <Grid size={12}>
        <Typography variant="body1" sx={{ mb: 1 }}>
          気に入った単語をクリックしてシェア！少しいじってもOK！
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <TextField
            size="small"
            variant="outlined"
            value={share}
            onChange={(e) => setShare(e.target.value)}
          />
          <OutBoundLink href={`https://twitter.com/intent/tweet?${shareQuery.toString()}`}>
            <Button
              size="large"
              variant="text"
            >
              Xにシェア
            </Button>
          </OutBoundLink>
        </Box>
      </Grid>
      */}

      <Grid size={12}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          ペユドチとは？
        </Typography>
        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
          ランダムに文字列を生成してその中からいい感じの部分を拾ってオリジナルの単語を作るツールです。{"\n"}
          それっぽい単語になりやすいように確率調整したり無理な発音になりにくいように調整してます。{"\n"}
          <span style={{ textDecoration: "underline" }}><OutBoundLink href="http://www.nicovideo.jp/watch/sm39674066">「フュネッヂャンってペユドチですよね」</OutBoundLink></span>という曲で思いっきりこの方法を使ったのと、毎回「ランダムに文字列生成して単語作るやつ」って言うのもめんどいので「ペユドチ」という言い方になりました。{"\n"}
          詳しいことは<span style={{ textDecoration: "underline" }}><OutBoundLink href="https://note.com/timireno/n/n07602604dacb">こちら(note)</OutBoundLink></span>
        </Typography>
      </Grid>

      <Grid size={12}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          エンドレスペユドチ
        </Typography>
        <EndlessPeyudochi options={options} easyMode={easyMode} katakana={katakana} />
      </Grid>
    </Grid>
  );
}

const EndlessPeyudochi = ({
  options,
  easyMode,
  katakana,
}: {
  options: LetterOption[],
  easyMode: boolean,
  katakana: boolean,
}) => {
  const [letters, setLetters] = useState<LetterOption[]>([]);
  const [selectedFrom, setSelectedFrom] = useState<number | null>(null);
  const [selectedTo, setSelectedTo] = useState<number | null>(null);
  const [hoveredOn, setHoveredOn] = useState<number | null>(null);
  const lettersBoxRef = useRef<HTMLDivElement | null>(null);
  const letterBlocksRef = useRef<(HTMLDivElement | null)[]>([]);
  const removedWidthRef = useRef(0);
  const LETTERS_LENGTH = 200;
  const REMOVE_DISTANCE = 150;
  const REMOVE_LENGTH = 2;
  const [copied, setCopied] = useState(false);
  const copiedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const toRichLetterObj = (letterStr: string) => {
    const obj = options.find((opt) => opt.letter == letterStr);
    if (!obj) throw Error(`LetterOption not found: ${letterStr}`);
    return obj;
  };

  const toDisplayLetter = (letter: LetterOption, prev?: LetterOption) => {
    let hira = letter.letter;
    if (prev && prev.letter == "っ") { hira = replaceLetters(letter.letter, ZA_ROW, DZA_ROW); }
    if (prev && letter.letter == "～") { hira = getSmallVowel(prev.letter); }
    return katakana ? replaceLetters(hira, HIRA, KATA) : hira;
  };

  const renewLetters = () => {
    let newLetters = letters.slice(REMOVE_LENGTH);
    let removedCount = Math.min(letters.length, REMOVE_LENGTH);
    while (newLetters[0] && newLetters[0].notFirst) {
      newLetters = newLetters.slice(1);
      removedCount += 1;
    }
    while (newLetters.length < LETTERS_LENGTH || newLetters[newLetters.length - 1]?.notLast) {
      const lettersForPick = makeLetterList(options, newLetters[newLetters.length - 1]?.letter || "", false, false, easyMode);
      const pickedLetter = randomPick(lettersForPick);
      newLetters.push(toRichLetterObj(pickedLetter));
    }

    if ((selectedFrom !== null && selectedFrom < removedCount) || (selectedTo !== null && selectedTo < removedCount)) {
      setSelectedFrom(null);
      setSelectedTo(null);
    } else {
      setSelectedFrom(selectedFrom !== null ? selectedFrom - removedCount : null);
      setSelectedTo(selectedTo !== null ? selectedTo - removedCount : null);
    }

    removedWidthRef.current = letterBlocksRef.current.slice(0, removedCount).reduce((sum, el) => sum + (el?.getBoundingClientRect().width || 0), 0);
    setLetters(newLetters);
  };

  useEffect(() => {
    renewLetters();
  }, []);

  useLayoutEffect(() => {
    if (lettersBoxRef.current) lettersBoxRef.current.scrollBy({ left: -removedWidthRef.current });
  }, [letters]);

  const onScroll = (e: React.UIEvent) => {
    const el = e.currentTarget;
    if (letterBlocksRef.current[REMOVE_DISTANCE] && el.scrollLeft > letterBlocksRef.current[REMOVE_DISTANCE].offsetLeft) {
      renewLetters();
    }
  };

  const onClickLetter = (index: number) => {
    if (selectedFrom !== null && selectedTo === null) {
      if (index <= selectedFrom) {
        setSelectedFrom(null);
        setSelectedTo(null);
        return;
      }
      while (index > 0 && letters[index].notLast) {
        index += 1;
      }
      setSelectedTo(index);
    } else {
      while (index < letters.length - 1 && letters[index].notFirst) {
        index -= 1;
      }
      setSelectedFrom(index);
      setSelectedTo(null);
      setHoveredOn(index);
    }
  };

  const letterBgColor = (index: number) => {
    const SELECTED = "#ffcccc";
    const HOVERED = "#ffeeee";
    const NOT_SELECTED = "transparent";
    if (selectedFrom !== null && selectedTo !== null) {
      return selectedFrom <= index && index <= selectedTo ? SELECTED : NOT_SELECTED;
    } else if (selectedFrom !== null && hoveredOn !== null) {
      return selectedFrom == index ? SELECTED :
        selectedFrom < index && index <= hoveredOn ? HOVERED : NOT_SELECTED;
    } else {
      return NOT_SELECTED;
    }
  };

  const displayLetters = letters.map((l, i) => toDisplayLetter(l, letters[i - 1]));
  const selectedLetters = selectedFrom !== null && selectedTo !== null && selectedFrom < selectedTo ? 
    letters.slice(selectedFrom, selectedTo + 1).map((l, i, ls) => toDisplayLetter(l, ls[i - 1])).join("") : "";

  const onClickCopy = async () => {
    await navigator.clipboard.writeText(selectedLetters);
    setCopied(true);
    copiedTimeoutRef.current = setTimeout(() => setCopied(false), 3000);
  };

  useEffect(() => {
    if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
    setCopied(false);
  }, [selectedFrom, selectedTo]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div
        ref={lettersBoxRef}
        style={{ width: 600, display: "flex", overflowX: "scroll", overflowY: "hidden", padding: "32px 0" }}
        onScroll={onScroll}
        onWheel={(e) => { e.currentTarget.scrollBy({ left: e.deltaY, behavior: "smooth" }); }}
      >
        {letters.map((l, i) => (
          <div
            key={`${i}`}
            ref={(el) => { letterBlocksRef.current[i] = el; }}
            style={{ backgroundColor: letterBgColor(i), whiteSpace: "nowrap", fontSize: 18, userSelect: "none" }}
            onClick={() => onClickLetter(i)}
            onMouseEnter={() => setHoveredOn(i)}
          >
            {displayLetters[i]}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 4, alignItems: "center", height: 30 }}>
        <div>{selectedLetters}</div>
        {selectedLetters && <CopyAll style={{ color: "#888", cursor: "pointer" }} onClick={onClickCopy} />}
        {selectedLetters && copied && <div style={{ fontSize: 10, color: "#4b4", backgroundColor: "#dfd", padding: "2px 5px", borderRadius: 5 }}>コピーしました</div>}
      </div>
    </div>
  );
};