import { useState } from "react";
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
  ["う", "ぅ", "ゔ", "く", "ぐ", "す", "ず", "つ", "づ", "ぬ", "ふ", "ぶ", "ぷ", "む", "ゆ", "る"],
  ["え", "ぇ", "け", "げ", "せ", "ぜ", "て", "で", "ね", "へ", "べ", "ぺ", "め", "れ"],
  ["お", "ぉ", "こ", "ご", "そ", "ぞ", "と", "ど", "の", "ほ", "ぼ", "ぽ", "も", "よ", "ょ", "ろ"],
];

const defaultOptions: LetterOption[] = [
  { letter: "あ", weight: 28, afterN: 5, notAfter: ["っ"] },
  { letter: "い", weight: 30, afterN: 5, notAfter: ["っ"] },
  { letter: "う", weight: 25, afterN: 5, notAfter: ["っ"] },
  { letter: "え", weight: 28, afterN: 5, notAfter: ["っ"] },
  { letter: "お", weight: 24, afterN: 5, notAfter: ["っ"] },
  { letter: "や", weight: 5, afterN: 4, notAfter: ["っ"] },
  { letter: "ゆ", weight: 8, afterN: 4, notAfter: ["っ"] },
  { letter: "いぇ", weight: 4, afterN: 2, notAfter: ["っ"] },
  { letter: "よ", weight: 5, afterN: 4, notAfter: ["っ"] },
  { letter: "わ", weight: 4, afterN: 2, notAfter: ["っ"] },
  { letter: "うぃ", weight: 3, afterN: 1, notAfter: ["っ"] },
  { letter: "うぇ", weight: 3, afterN: 1, notAfter: ["っ"] },
  { letter: "うぉ", weight: 3, afterN: 1, notAfter: ["っ"] },
  { letter: "は", weight: 10, afterN: 3, notAfter: ["っ"] },
  { letter: "ひ", weight: 8, afterN: 3, notAfter: ["っ"] },
  { letter: "ほぅ", weight: 2, afterN: 2, notAfter: ["っ"], minor: true },
  { letter: "へ", weight: 4, afterN: 2, notAfter: ["っ"] },
  { letter: "ほ", weight: 4, afterN: 2, notAfter: ["っ"] },
  { letter: "ひゃ", weight: 1, afterN: 1, notAfter: ["っ"] },
  { letter: "ひゅ", weight: 1, afterN: 1, notAfter: ["っ"] },
  { letter: "ひぇ", weight: 1, afterN: 1, notAfter: ["っ"] },
  { letter: "ひょ", weight: 1, afterN: 1, notAfter: ["っ"] },
  { letter: "ほぁ", weight: 0.5, afterN: 0.5, notAfter: ["っ"], minor: true },
  { letter: "ほぃ", weight: 0.5, afterN: 0.5, notAfter: ["っ"], minor: true },
  { letter: "ほぇ", weight: 0.5, afterN: 0.5, notAfter: ["っ"], minor: true },
  { letter: "ほぅぉ", weight: 0.5, afterN: 0.5, notAfter: ["っ"], minor: true },
  { letter: "か", weight: 10 },
  { letter: "き", weight: 7 },
  { letter: "く", weight: 10 },
  { letter: "け", weight: 6 },
  { letter: "こ", weight: 6 },
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
  { letter: "げ", weight: 3, afterTu: 2 },
  { letter: "ご", weight: 3, afterTu: 2 },
  { letter: "ぎゃ", weight: 1, afterTu: 1 },
  { letter: "ぎゅ", weight: 1, afterTu: 1 },
  { letter: "ぎぇ", weight: 1, afterTu: 1, minor: true },
  { letter: "ぎょ", weight: 1, afterTu: 1 },
  { letter: "ぐぁ", weight: 1, afterTu: 1 },
  { letter: "ぐぃ", weight: 1, afterTu: 1 },
  { letter: "ぐぇ", weight: 1, afterTu: 1 },
  { letter: "ぐぉ", weight: 1, afterTu: 1 },
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
  { letter: "ぷぃ", weight: 0.5, minor: true },
  { letter: "ぷぇ", weight: 0.5, minor: true },
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
  { letter: "ぶぃ", weight: 0.5, afterTu: 0.5, minor: true },
  { letter: "ぶぇ", weight: 0.5, afterTu: 0.5, minor: true },
  { letter: "ぶぉ", weight: 0.5, afterTu: 0.5, minor: true },
  { letter: "た", weight: 6 },
  { letter: "てぃ", weight: 8 },
  { letter: "とぅ", weight: 7 },
  { letter: "て", weight: 5 },
  { letter: "と", weight: 5 },
  { letter: "てゃ", weight: 0.5, minor: true },
  { letter: "てゅ", weight: 1 },
  { letter: "てぃぇ", weight: 0.5, minor: true },
  { letter: "てょ", weight: 0.5, minor: true },
  { letter: "とぁ", weight: 0.5, minor: true },
  { letter: "とぃ", weight: 0.5, minor: true },
  { letter: "とぇ", weight: 0.5, minor: true },
  { letter: "とぅぉ", weight: 0.5, minor: true },
  { letter: "だ", weight: 5, afterTu: 2 },
  { letter: "でぃ", weight: 6, afterTu: 2 },
  { letter: "どぅ", weight: 5, afterTu: 2 },
  { letter: "で", weight: 5, afterTu: 2 },
  { letter: "ど", weight: 5, afterTu: 2 },
  { letter: "でゃ", weight: 0.5, afterTu: 0.5, minor: true },
  { letter: "でゅ", weight: 1, afterTu: 1 },
  { letter: "でぃぇ", weight: 0.5, afterTu: 0.5, minor: true },
  { letter: "でょ", weight: 0.5, afterTu: 0.5, minor: true },
  { letter: "どぁ", weight: 0.5, afterTu: 0.5, minor: true },
  { letter: "どぃ", weight: 0.5, afterTu: 0.5, minor: true },
  { letter: "どぇ", weight: 0.5, afterTu: 0.5, minor: true },
  { letter: "どぅぉ", weight: 0.5, afterTu: 0.5, minor: true },
  { letter: "さ", weight: 10 },
  { letter: "すぃ", weight: 8 },
  { letter: "す", weight: 12 },
  { letter: "せ", weight: 6 },
  { letter: "そ", weight: 6 },
  { letter: "すゃ", weight: 0.5, minor: true },
  { letter: "すゅ", weight: 1, minor: true },
  { letter: "すぃぇ", weight: 0.5, minor: true },
  { letter: "すょ", weight: 0.5, minor: true },
  { letter: "すぁ", weight: 0.5, minor: true },
  { letter: "すぅぃ", weight: 0.5, minor: true },
  { letter: "すぇ", weight: 0.5, minor: true },
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
  { letter: "ずぅぃ", weight: 0.5, afterTu: 0.5, minor: true },
  { letter: "ずぇ", weight: 0.5, afterTu: 0.5, minor: true },
  { letter: "ずぉ", weight: 0.5, afterTu: 0.5, minor: true },
  { letter: "つぁ", weight: 3 },
  { letter: "つぃ", weight: 3 },
  { letter: "つ", weight: 2 },
  { letter: "つぇ", weight: 2 },
  { letter: "つぉ", weight: 2 },
  { letter: "つゃ", weight: 0.5, minor: true },
  { letter: "つゅ", weight: 1, minor: true },
  { letter: "つぃぇ", weight: 0.5, minor: true },
  { letter: "つょ", weight: 0.5, minor: true },
  { letter: "つぅぁ", weight: 0.5, minor: true },
  { letter: "つぅぃ", weight: 0.5, minor: true },
  { letter: "つぅぇ", weight: 0.5, minor: true },
  { letter: "つぅぉ", weight: 0.5, minor: true },
  { letter: "しゃ", weight: 3 },
  { letter: "し", weight: 3 },
  { letter: "しゅ", weight: 3 },
  { letter: "しぇ", weight: 3 },
  { letter: "しょ", weight: 3 },
  { letter: "しゅぁ", weight: 0.5, minor: true },
  { letter: "しゅぃ", weight: 0.5, minor: true },
  { letter: "しゅぇ", weight: 0.5, minor: true },
  { letter: "しゅぉ", weight: 0.5, minor: true },
  { letter: "じゃ", weight: 3, afterTu: 1 },
  { letter: "じ", weight: 3, afterTu: 1 },
  { letter: "じゅ", weight: 4, afterTu: 1 },
  { letter: "じぇ", weight: 3, afterTu: 1 },
  { letter: "じょ", weight: 3, afterTu: 1 },
  { letter: "じゅぁ", weight: 0.5, minor: true },
  { letter: "じゅぃ", weight: 0.5, minor: true },
  { letter: "じゅぇ", weight: 0.5, minor: true },
  { letter: "じゅぉ", weight: 0.5, minor: true },
  { letter: "ちゃ", weight: 4 },
  { letter: "ち", weight: 5 },
  { letter: "ちゅ", weight: 4 },
  { letter: "ちぇ", weight: 4 },
  { letter: "ちょ", weight: 4 },
  { letter: "ちゅぁ", weight: 0.5, minor: true },
  { letter: "ちゅぃ", weight: 0.5, minor: true },
  { letter: "ちゅぇ", weight: 0.5, minor: true },
  { letter: "ちゅぉ", weight: 0.5, minor: true },
  { letter: "ふぁ", weight: 4 },
  { letter: "ふぃ", weight: 4 },
  { letter: "ふ", weight: 8 },
  { letter: "ふぇ", weight: 4 },
  { letter: "ふぉ", weight: 4 },
  { letter: "ふゃ", weight: 1, minor: true },
  { letter: "ふゅ", weight: 1 },
  { letter: "ふぃぇ", weight: 0.5, minor: true },
  { letter: "ふょ", weight: 1, minor: true },
  { letter: "ふぅぁ", weight: 0.5, minor: true },
  { letter: "ふぅぃ", weight: 0.5, minor: true },
  { letter: "ふぅぇ", weight: 0.5, minor: true },
  { letter: "ふぅぉ", weight: 0.5, minor: true },
  { letter: "ゔぁ", weight: 2, afterTu: 1 },
  { letter: "ゔぃ", weight: 2, afterTu: 1 },
  { letter: "ゔ", weight: 4, afterTu: 1 },
  { letter: "ゔぇ", weight: 2, afterTu: 1 },
  { letter: "ゔぉ", weight: 2, afterTu: 1 },
  { letter: "ゔゃ", weight: 1, afterTu: 1, minor: true },
  { letter: "ゔゅ", weight: 1, afterTu: 1 },
  { letter: "ゔぃぇ", weight: 0.5, afterTu: 0.5, minor: true },
  { letter: "ゔょ", weight: 1, afterTu: 1, minor: true },
  { letter: "ゔぅぁ", weight: 0.5, afterTu: 0.5, minor: true },
  { letter: "ゔぅぃ", weight: 0.5, afterTu: 0.5, minor: true },
  { letter: "ゔぅぇ", weight: 0.5, afterTu: 0.5, minor: true },
  { letter: "ゔぅぉ", weight: 0.5, afterTu: 0.5, minor: true },
  { letter: "な", weight: 10, notAfter: ["っ"] },
  { letter: "に", weight: 7, notAfter: ["っ"] },
  { letter: "ぬ", weight: 6, notAfter: ["っ"] },
  { letter: "ね", weight: 8, notAfter: ["っ"] },
  { letter: "の", weight: 8, notAfter: ["っ"] },
  { letter: "にゃ", weight: 1, notAfter: ["っ"] },
  { letter: "にゅ", weight: 1, notAfter: ["っ"] },
  { letter: "にぇ", weight: 1, notAfter: ["っ"] },
  { letter: "にょ", weight: 1, notAfter: ["っ"] },
  { letter: "ぬぁ", weight: 0.5, notAfter: ["っ"], minor: true },
  { letter: "ぬぃ", weight: 0.5, notAfter: ["っ"], minor: true },
  { letter: "ぬぇ", weight: 0.5, notAfter: ["っ"], minor: true },
  { letter: "ぬぉ", weight: 0.5, notAfter: ["っ"], minor: true },
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
  { letter: "むぃ", weight: 0.5, notAfter: ["っ"], minor: true },
  { letter: "むぇ", weight: 0.5, notAfter: ["っ"], minor: true },
  { letter: "むぉ", weight: 0.5, notAfter: ["っ"], minor: true },
  { letter: "ら", weight: 10, notAfter: ["っ"] },
  { letter: "り", weight: 8, notAfter: ["っ"] },
  { letter: "る", weight: 14, notAfter: ["っ"] },
  { letter: "れ", weight: 8, notAfter: ["っ"] },
  { letter: "ろ", weight: 7, notAfter: ["っ"] },
  { letter: "りゃ", weight: 1, notAfter: ["っ"] },
  { letter: "りゅ", weight: 1, notAfter: ["っ"] },
  { letter: "りぇ", weight: 1, notAfter: ["っ"], minor: true },
  { letter: "りょ", weight: 1, notAfter: ["っ"] },
  { letter: "るぁ", weight: 0.5, notAfter: ["っ"], minor: true },
  { letter: "るぃ", weight: 0.5, notAfter: ["っ"], minor: true },
  { letter: "るぇ", weight: 0.5, notAfter: ["っ"], minor: true },
  { letter: "るぉ", weight: 0.5, notAfter: ["っ"], minor: true },
  { letter: "っ", weight: 34, notAfter: ["っ", "ん", "ー"], notFirst: true, notLast: true },
  { letter: "ん", weight: 30, notAfter: ["っ", "ん"], notFirst: true },
  { letter: "ー", weight: 16, notAfter: ["っ", "ん", "ー"], notFirst: true },
  { letter: "～", weight: 16, notAfter: ["っ", "ん", "ー", "～"], notFirst: true },
];

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

const ZA_ROW = ["ざ", "じ", "ず", "ぜ", "ぞ"];
const DZA_ROW = ["づぁ", "ぢ", "づ", "づぇ", "づぉ"];
const HIRA = "あいうえおぁぃぅぇぉゔかきくけこがぎぐげごさしすせそざじずぜぞたちつてとっだぢづでどなにぬねのはひふへほばびぶべぼぱぴぷぺぽまみむめもやゆよゃゅょらりるれろわをん".split("");
const KATA = "アイウエオァィゥェォヴカキクケコガギグゲゴサシスセソザジズゼゾタチツテトッダヂヅデドナニヌネノハヒフヘホバビブベボパピプペポマミムメモヤユヨャュョラリルレロワヲン".split("");

export default function Peyudochi() {
  const [options, setOptions] = useState(defaultOptions);
  const [result, setResult] = useState<{ hiragana: string, katakana: string }[]>([]);
  const [letters, setLetters] = useState(8);
  const [outputs, setOutputs] = useState(100);
  const [katakana, setKatakana] = useState(false);
  const [share, setShare] = useState("");
  const [easyMode, setEasyMode] = useState(false);
  
  const changeOption = (letter: string, weight: number) => {
    const index = options.findIndex((opt) => opt.letter == letter);
    options[index] = { ...options[index], weight: weight };
    setOptions([...options]);
  };

  const makeLetterList = (prev: string, isFirst: boolean, isLast: boolean, easyMode: boolean) => {
    const letterList = [];
    for (const opt of options) {
      const notAfter = opt.notAfter && opt.notAfter.includes("～") ? [...opt.notAfter, "ぁ", "ぃ", "ぅ", "ぇ", "ぉ"] : opt.notAfter;
      if (easyMode && opt.minor) continue;
      if (notAfter && notAfter.includes(prev)) continue;
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

  const peyudochi = () => {
    const results: { hiragana: string, katakana: string }[] = [];
    for (let i = 0; i < outputs; i++) {
      let prevLetter = "";
      const res = [];
      for (let j = 0; j < letters; j++) {
        const letterList = makeLetterList(prevLetter, j == 0, j == letters - 1, easyMode);
        const pickedLetter = randomPick(letterList);
        const letter = prevLetter == "っ" ? replaceLetters(pickedLetter, ZA_ROW, DZA_ROW) : 
                       pickedLetter == "～" ? getSmallVowel(prevLetter) : pickedLetter;
        prevLetter = letter;
        res.push(letter);
      }
      const hiragana = res.join("");
      results.push({ hiragana, katakana: replaceLetters(hiragana, HIRA, KATA) });
    }
    setResult(results);
  };
  
  const shareText = `${share}${"\n"}#だれでもペユドチ${"\n"}https://hyayum.github.io/kunerei/peyudochi`;
  const shareQuery = new URLSearchParams({ text: shareText });

  return (
    <Grid container spacing={5} sx={{ p: 5, pb: 20, minWidth: 800 }}>
      <Grid size={12}>
        <Typography variant="h4" sx={{ textAlign: "center" }}>
          ペユドチ生成機
        </Typography>
      </Grid>
      <Grid size={12}>
        <Accordion sx={{ mb: 1 }}>
          <AccordionSummary id="options">
            確率の設定 (基礎確率のみ)
          </AccordionSummary>
          <AccordionDetails sx={{ display: "flex" }}>
            <Grid container spacing={1}>
            {options.map((opt) => (
              <Grid size={{ xs: 2, md: 1.5, lg: 1, xl: 0.75 }} key={opt.letter}>
                <NumberField
                  label={opt.letter == "～" ? "小文字母音" : opt.letter}
                  value={opt.weight}
                  variant="outlined"
                  size="small"
                  onChange={(e) => changeOption(opt.letter, Math.max(Number(e.target.value), 0))}
                  fullWidth
                />
              </Grid>
            ))}
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Grid>
      <Grid size={12} sx={{ display: "flex" }}>
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
        <FormGroup sx={{ ml: 1 }}>
          <FormControlLabel
            control={
              <Checkbox checked={katakana} onClick={() => setKatakana(!katakana)} />
            }
            label="片仮名で出力"
          />
        </FormGroup>
        <FormGroup sx={{ ml: 1 }}>
          <FormControlLabel
            control={
              <Checkbox checked={easyMode} onClick={() => setEasyMode(!easyMode)} />
            }
            label="簡単ペユドチ（マイナーな発音を除外）"
          />
        </FormGroup>
      </Grid>
      <Grid size={12}>
        <Button
          variant="contained"
          size="large"
          color="success"
          onClick={peyudochi}
        >
          ペユドチ
        </Button>
      </Grid>
      <Grid size={12}>
        <Typography variant="h5" sx={{ mb: 1 }}>
          結果
        </Typography>
        <Grid container spacing={2}>
          {result.map((res, i) => (
            <Grid size={{ xs: 4, sm: 3, lg: 2 }} key={i}>
              <Typography variant="body1" onClick={() => setShare(katakana ? res.katakana : res.hiragana)}>
                {katakana ? res.katakana : res.hiragana}
              </Typography>
            </Grid>
          ))}
        </Grid>
      </Grid>
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
    </Grid>
  );
}