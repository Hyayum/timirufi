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
};

const vowelMap = [
  ["あ", "ぁ", "か", "が", "さ", "ざ", "た", "だ", "な", "は", "ば", "ぱ", "ま", "や", "ゃ", "ら", "わ"],
  ["い", "ぃ", "き", "ぎ", "し", "じ", "ち", "ぢ", "に", "ひ", "び", "ぴ", "み", "り"],
  ["う", "ぅ", "ゔ", "く", "ぐ", "す", "ず", "つ", "づ", "ぬ", "ふ", "ぶ", "ぷ", "む", "ゆ", "る"],
  ["え", "ぇ", "け", "げ", "せ", "ぜ", "て", "で", "ね", "へ", "べ", "ぺ", "め", "れ"],
  ["お", "ぉ", "こ", "ご", "そ", "ぞ", "と", "ど", "の", "ほ", "ぼ", "ぽ", "も", "よ", "ょ", "ろ"],
];

const defaultOptions: LetterOption[] = [
  { letter: "あ", weight: 22, afterN: 5, notAfter: ["っ"] },
  { letter: "い", weight: 26, afterN: 5, notAfter: ["っ"] },
  { letter: "う", weight: 20, afterN: 5, notAfter: ["っ"] },
  { letter: "え", weight: 24, afterN: 5, notAfter: ["っ"] },
  { letter: "お", weight: 20, afterN: 5, notAfter: ["っ"] },
  { letter: "や", weight: 5, afterN: 4, notAfter: ["っ"] },
  { letter: "ゆ", weight: 8, afterN: 4, notAfter: ["っ"] },
  { letter: "いぇ", weight: 2, afterN: 2, notAfter: ["っ"] },
  { letter: "よ", weight: 5, afterN: 4, notAfter: ["っ"] },
  { letter: "わ", weight: 4, afterN: 2, notAfter: ["っ"] },
  { letter: "うぃ", weight: 2, afterN: 1, notAfter: ["っ"] },
  { letter: "うぇ", weight: 2, afterN: 1, notAfter: ["っ"] },
  { letter: "うぉ", weight: 2, afterN: 1, notAfter: ["っ"] },
  { letter: "は", weight: 10, afterN: 3, notAfter: ["っ"] },
  { letter: "ひ", weight: 8, afterN: 3, notAfter: ["っ"] },
  { letter: "へ", weight: 4, afterN: 2, notAfter: ["っ"] },
  { letter: "ほ", weight: 4, afterN: 2, notAfter: ["っ"] },
  { letter: "ひゃ", weight: 1, afterN: 1, notAfter: ["っ"] },
  { letter: "ひゅ", weight: 1, afterN: 1, notAfter: ["っ"] },
  { letter: "ひぇ", weight: 1, afterN: 1, notAfter: ["っ"] },
  { letter: "ひょ", weight: 1, afterN: 1, notAfter: ["っ"] },
  { letter: "か", weight: 10 },
  { letter: "き", weight: 7 },
  { letter: "く", weight: 10 },
  { letter: "け", weight: 5 },
  { letter: "こ", weight: 5 },
  { letter: "きゃ", weight: 1 },
  { letter: "きゅ", weight: 1 },
  { letter: "きょ", weight: 1 },
  { letter: "くぁ", weight: 1 },
  { letter: "くぃ", weight: 1 },
  { letter: "くぇ", weight: 1 },
  { letter: "くぉ", weight: 1 },
  { letter: "が", weight: 5, afterTu: 2 },
  { letter: "ぎ", weight: 5, afterTu: 2 },
  { letter: "ぐ", weight: 5, afterTu: 2 },
  { letter: "げ", weight: 2, afterTu: 2 },
  { letter: "ご", weight: 2, afterTu: 2 },
  { letter: "ぎゃ", weight: 1, afterTu: 1 },
  { letter: "ぎゅ", weight: 1, afterTu: 1 },
  { letter: "ぎょ", weight: 1, afterTu: 1 },
  { letter: "ぐぁ", weight: 1, afterTu: 1 },
  { letter: "ぐぃ", weight: 1, afterTu: 1 },
  { letter: "ぐぇ", weight: 1, afterTu: 1 },
  { letter: "ぐぉ", weight: 1, afterTu: 1 },
  { letter: "ぱ", weight: 5 },
  { letter: "ぴ", weight: 5 },
  { letter: "ぷ", weight: 3 },
  { letter: "ぺ", weight: 3 },
  { letter: "ぽ", weight: 3 },
  { letter: "ぴゃ", weight: 1 },
  { letter: "ぴゅ", weight: 1 },
  { letter: "ぴょ", weight: 1 },
  { letter: "ば", weight: 2, afterTu: 3 },
  { letter: "び", weight: 3, afterTu: 3 },
  { letter: "ぶ", weight: 1, afterTu: 3 },
  { letter: "べ", weight: 1, afterTu: 2 },
  { letter: "ぼ", weight: 1, afterTu: 2 },
  { letter: "びゃ", weight: 1, afterTu: 1 },
  { letter: "びゅ", weight: 1, afterTu: 1 },
  { letter: "びょ", weight: 1, afterTu: 1 },
  { letter: "た", weight: 4 },
  { letter: "てぃ", weight: 8 },
  { letter: "とぅ", weight: 7 },
  { letter: "て", weight: 5 },
  { letter: "と", weight: 4 },
  { letter: "てゃ", weight: 1 },
  { letter: "てゅ", weight: 1 },
  { letter: "てょ", weight: 1 },
  { letter: "だ", weight: 3, afterTu: 2 },
  { letter: "でぃ", weight: 6, afterTu: 2 },
  { letter: "どぅ", weight: 3, afterTu: 2 },
  { letter: "で", weight: 3, afterTu: 2 },
  { letter: "ど", weight: 3, afterTu: 2 },
  { letter: "でゅ", weight: 1, afterTu: 1 },
  { letter: "さ", weight: 10 },
  { letter: "すぃ", weight: 7 },
  { letter: "す", weight: 10 },
  { letter: "せ", weight: 5 },
  { letter: "そ", weight: 5 },
  { letter: "すゅ", weight: 1 },
  { letter: "ざ", weight: 5, afterTu: 1 },
  { letter: "ずぃ", weight: 6, afterTu: 1 },
  { letter: "ず", weight: 7, afterTu: 1 },
  { letter: "ぜ", weight: 5, afterTu: 1 },
  { letter: "ぞ", weight: 5, afterTu: 1 },
  { letter: "ずゅ", weight: 1, afterTu: 1 },
  { letter: "つぁ", weight: 2 },
  { letter: "つぃ", weight: 2 },
  { letter: "つ", weight: 1 },
  { letter: "つぇ", weight: 1 },
  { letter: "つぉ", weight: 1 },
  { letter: "つゅ", weight: 1 },
  { letter: "しゃ", weight: 3 },
  { letter: "し", weight: 2 },
  { letter: "しゅ", weight: 3 },
  { letter: "しぇ", weight: 3 },
  { letter: "しょ", weight: 3 },
  { letter: "じゃ", weight: 2, afterTu: 1 },
  { letter: "じ", weight: 3, afterTu: 1 },
  { letter: "じゅ", weight: 4, afterTu: 1 },
  { letter: "じぇ", weight: 2, afterTu: 1 },
  { letter: "じょ", weight: 2, afterTu: 1 },
  { letter: "ちゃ", weight: 4 },
  { letter: "ち", weight: 5 },
  { letter: "ちゅ", weight: 4 },
  { letter: "ちぇ", weight: 3 },
  { letter: "ちょ", weight: 3 },
  { letter: "ふぁ", weight: 3 },
  { letter: "ふぃ", weight: 3 },
  { letter: "ふ", weight: 8 },
  { letter: "ふぇ", weight: 3 },
  { letter: "ふぉ", weight: 3 },
  { letter: "ふゃ", weight: 1 },
  { letter: "ふゅ", weight: 1 },
  { letter: "ふょ", weight: 1 },
  { letter: "ゔぁ", weight: 1, afterTu: 1 },
  { letter: "ゔぃ", weight: 2, afterTu: 1 },
  { letter: "ゔ", weight: 4, afterTu: 1 },
  { letter: "ゔぇ", weight: 1, afterTu: 1 },
  { letter: "ゔぉ", weight: 1, afterTu: 1 },
  { letter: "ゔゅ", weight: 1, afterTu: 1 },
  { letter: "な", weight: 10, notAfter: ["っ"] },
  { letter: "に", weight: 7, notAfter: ["っ"] },
  { letter: "ぬ", weight: 5, notAfter: ["っ"] },
  { letter: "ね", weight: 8, notAfter: ["っ"] },
  { letter: "の", weight: 8, notAfter: ["っ"] },
  { letter: "にゃ", weight: 1, notAfter: ["っ"] },
  { letter: "にゅ", weight: 1, notAfter: ["っ"] },
  { letter: "にぇ", weight: 1, notAfter: ["っ"] },
  { letter: "にょ", weight: 1, notAfter: ["っ"] },
  { letter: "ま", weight: 6, notAfter: ["っ"] },
  { letter: "み", weight: 7, notAfter: ["っ"] },
  { letter: "む", weight: 5, notAfter: ["っ"] },
  { letter: "め", weight: 7, notAfter: ["っ"] },
  { letter: "も", weight: 7, notAfter: ["っ"] },
  { letter: "みゃ", weight: 1, notAfter: ["っ"] },
  { letter: "みゅ", weight: 1, notAfter: ["っ"] },
  { letter: "みぇ", weight: 1, notAfter: ["っ"] },
  { letter: "みょ", weight: 1, notAfter: ["っ"] },
  { letter: "ら", weight: 10, notAfter: ["っ"] },
  { letter: "り", weight: 8, notAfter: ["っ"] },
  { letter: "る", weight: 12, notAfter: ["っ"] },
  { letter: "れ", weight: 8, notAfter: ["っ"] },
  { letter: "ろ", weight: 5, notAfter: ["っ"] },
  { letter: "りゃ", weight: 1, notAfter: ["っ"] },
  { letter: "りゅ", weight: 1, notAfter: ["っ"] },
  { letter: "りょ", weight: 1, notAfter: ["っ"] },
  { letter: "っ", weight: 30, notAfter: ["っ", "ん", "ー"], notFirst: true, notLast: true },
  { letter: "ん", weight: 25, notAfter: ["っ", "ん"], notFirst: true },
  { letter: "ー", weight: 12, notAfter: ["っ", "ん", "ー"], notFirst: true },
  { letter: "～", weight: 10, notAfter: ["っ", "ん", "ー", "～"], notFirst: true },
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
    if (row.includes(letter)) {
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
  const [result, setResult] = useState<string[]>([]);
  const [letters, setLetters] = useState(7);
  const [outputs, setOutputs] = useState(100);
  const [katakana, setKatakana] = useState(false);
  const [share, setShare] = useState("");
  
  const changeOption = (letter: string, weight: number) => {
    const index = options.findIndex((opt) => opt.letter == letter);
    options[index] = { ...options[index], weight: weight };
    setOptions([...options]);
  };

  const makeLetterList = (prev: string, isFirst: boolean, isLast: boolean ) => {
    const letterList = [];
    for (const opt of options) {
      if (opt.notAfter && opt.notAfter.includes(prev)) continue;
      if (isFirst && opt.notFirst) continue;
      if (isLast && opt.notLast) continue;
      const weight = prev == "っ" ? (opt.afterTu || opt.weight) :
                     prev == "ん" ? (opt.afterN || opt.weight) : opt.weight;
      for (let i = 0; i < weight; i++) {
        letterList.push(opt.letter);
      }
    }
    return letterList;
  };

  const peyudochi = () => {
    const results = [];
    for (let i = 0; i < outputs; i++) {
      let prevLetter = "";
      const res = [];
      for (let j = 0; j < letters; j++) {
        const letterList = makeLetterList(prevLetter, j == 0, j == letters - 1);
        const pickedLetter = randomPick(letterList);
        const letter = prevLetter == "っ" ? replaceLetters(pickedLetter, ZA_ROW, DZA_ROW) : 
                       pickedLetter == "～" ? getSmallVowel(prevLetter) : pickedLetter;
        prevLetter = letter;
        res.push(letter);
      }
      const resStr = katakana ? replaceLetters(res.join(""), HIRA, KATA) : res.join("");
      results.push(resStr);
    }
    setResult(results);
  };
  
  const shareText = `${share}${"\n"}#だれでもペユドチ${"\n"}https://hyayum.github.io/kunerei/peyudochi`;
  const shareQuery = new URLSearchParams({ text: shareText });

  return (
    <Grid container spacing={5} sx={{ m: 5, mb: 20, minWidth: 800 }}>
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
              <Grid size={{ xs: 2, md: 1.5, lg: 1 }} key={opt.letter}>
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
              <Typography variant="body1" onClick={() => setShare(res)}>
                {res}
              </Typography>
            </Grid>
          ))}
        </Grid>
      </Grid>
      <Grid size={12}>
        <Typography variant="body1" sx={{ mb: 1 }}>
          気に入った単語をクリックしてシェア！少しいじってもOK！
        </Typography>
        <Box sx={{ display: "flex" }}>
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