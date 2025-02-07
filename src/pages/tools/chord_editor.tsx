import {
  Backdrop,
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  Grid2 as Grid,
  IconButton,
  MenuItem,
  Paper,
  Popover,
  Radio,
  RadioGroup,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { PlayArrow, Stop } from "@mui/icons-material";
import { useRef, useState, useEffect, Component } from "react";
import NumberField from "@/component/NumberField";
import { getChordPlayer, createMidi } from "@/chord/midi";
import { getChordsForUtils, accdNumToSf, fitRange, calcMainFunc, mainFuncToStr, calcScaleLevel, calcRealname, calcChordProg } from "@/chord/utils";
import { Chord, ChordForUtils, keyOptions, defaultChord, keyColors } from "@/chord/model";
import Link from "next/link";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [filename, setFilename] = useState("chord");
  const [bpm, setBpm] = useState(160);
  const [key, setKey] = useState(0);
  const [beats, setBeats] = useState(2);
  const [chords, setChords] = useState<Chord[]>([defaultChord]);
  const [nowPlaying, setNowPlaying] = useState(0);

  const chordsRef = useRef<Chord[]>([]);
  useEffect(() => {
    const prevLength = chordsRef.current.length;
    chordsRef.current = chords;
    if (chordsRef.current.length == prevLength + 1) {
      window.scrollBy(0, 87);
    }
  }, [chords]);

  const chordsForUtils = getChordsForUtils(chords, key, bpm, beats);

  const onChangeChord = (chord: Chord, i: number) => {
    const newChords = [...chordsRef.current];
    newChords[i] = chord;
    setChords(newChords);
  };

  const addChord = (i: number) => {
    const newChords = [...chordsRef.current];
    if (i >= 0) {
      newChords.splice(i, 0, { ...defaultChord, beats: beats });
    } else {
      newChords.push({ ...defaultChord, beats: beats });
    }
    setChords(newChords);
  };

  const removeChord = (i: number) => {
    const newChords = [...chordsRef.current];
    newChords.splice(i, 1);
    setChords(newChords);
  };

  const downloadJson = () => {
    const dlData = {
      default_beats: beats,
      bgcolor: "#ffffff",
      color: "#88ccee",
      chords: chords,
    };
    if (!dlData.chords[0].bpm) { dlData.chords[0].bpm = bpm; }
    if ((dlData.chords[0].key ?? 12) == 12) { dlData.chords[0].key = key; }
    const element = document.createElement("a");
    element.style.display = "none";
    const file = new Blob([JSON.stringify(dlData, undefined, 2)], { type: "application/json" });
    element.href = URL.createObjectURL(file);
    element.download = `${filename}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleChangeFile = async (e: React.FormEvent<HTMLInputElement>) => {
    setLoading(true);
    try {
      const fileReader = new window.FileReader();
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file && file.type == "application/json") {
        fileReader.onload = function (event) {
          const text = String(event.target?.result);
          const jsonData = JSON.parse(text);
          setFilename(file.name.split(".json")[0]);
          if (jsonData.default_beats) setBeats(jsonData.default_beats);
          if (jsonData.chords?.[0]?.bpm) setBpm(jsonData.chords[0].bpm);
          if (jsonData.chords?.[0]?.key) setKey(jsonData.chords[0].key);
          setChords(jsonData.chords || []);
        }
        fileReader.readAsText(file);
      } else {
        throw new Error("File is invalid");
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    setLoading(false);
  }, [chords]);

  const downloadMidi = () => {
    const data = createMidi(chordsForUtils);
    const element = document.createElement("a");
    element.style.display = "none";
    const file = new Blob([data], { type: "audio/midi" });
    element.href = URL.createObjectURL(file);
    element.download = `${filename}.mid`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const preview = async (i: number) => {
    setNowPlaying(i);
    setLoading(true);
    const playChord = await getChordPlayer();
    setLoading(false);
    await playChord(chordsForUtils[i]);
  };

  const links = [
    { "url": "https://note.com/timireno/n/nd6f8b4b2fc65", label: "⓪概要" },
    { "url": "https://note.com/timireno/n/n6809f646a92d", label: "①コードの機能と進行と転調" },
    { "url": "https://note.com/timireno/n/n3e91d7162dcb", label: "②変位と調と音程" },
    { "url": "https://note.com/timireno/n/n53a2faf1ca37", label: "③和音の構成と主機能" },
  ];

  return (
    <>
      <Grid container spacing={3} sx={{ p: 5, minWidth: 1250 }}>
        <Grid size={12}>
          <Typography variant="h4" sx={{ mb: 2, textAlign: "center" }}>
            #てぃみ式 コードエディタ
          </Typography>
          <Typography variant="subtitle2">
            理論について：
          </Typography>
          <Box sx={{ ml: 1 }}>
            {links.map((link) => (
              <Typography variant="subtitle2" key={link.label}>
                <Link href={link.url} style={{ color: "green", marginLeft: 1, textDecoration: "underline" }}>
                  {link.label}
                </Link>
              </Typography>
            ))}
          </Box>
          <Typography variant="subtitle2">
            <Link href={"http://locossic.starfree.jp/memo_view?id=87"} style={{ color: "green", marginLeft: 1, textDecoration: "underline" }}>
              画面説明
            </Link>
          </Typography>
        </Grid>
        <Grid size={12}>
          <Box sx={{ display: "flex" }}>
            <Box sx={{ width: 100 }}>
              <NumberField
                id="bpm"
                label="初期BPM"
                size="small"
                value={bpm}
                onChange={(e) => setBpm(Math.max(Number(e.target.value), 0))}
                fullWidth
              />
            </Box>
            <Box sx={{ width: 100 }}>
              <TextField
                select
                id="key"
                label="初期キー"
                size="small"
                value={key}
                onChange={(e) => setKey(Number(e.target.value))}
                fullWidth
                slotProps={{
                  select: { 
                    MenuProps: { disableScrollLock: true },
                  },
                }}
              >
                {keyOptions.map((k) => (
                  <MenuItem key={k.value} value={k.value}>
                    {k.label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
            <Box sx={{ width: 120 }}>
              <NumberField
                id="beats"
                label="デフォルト拍数"
                size="small"
                value={beats}
                onChange={(e) => setBeats(Math.max(Number(e.target.value), 0))}
                fullWidth
              />
            </Box>

            <Box sx={{ width: 140 }}>
              <TextField
                id="filename"
                label="ファイル名 (.json)"
                size="small"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                fullWidth
              />
            </Box>
            <Button
              color="success"
              variant="contained"
              size="small"
              onClick={downloadJson}
              sx={{ mx: 1 }}
            >
              JSONダウンロード
            </Button>
            <input
              accept={".json"}
              value=""
              multiple
              type="file"
              style={{ display: "none" }}
              onInput={handleChangeFile}
              ref={inputRef}
            />
            <Button
              color="primary"
              variant="contained"
              size="large"
              sx={{ mx: 1 }}
              onClick={() => inputRef.current?.click()}
            >
              JSON読み込み
            </Button>
            <Button
              color="warning"
              variant="contained"
              size="small"
              onClick={downloadMidi}
              sx={{ mx: 1 }}
            >
              MIDI作成
            </Button>
          </Box>
        </Grid>
        <Grid size={12}>
          <ChordPreviewButton
            chords={chordsForUtils}
            setIndex={setNowPlaying}
            setLoading={setLoading}
          />
        </Grid>
        <Grid size={12}>
          {chords.map((chord, i) => (
            <Box sx={{ display: "flex" }} key={i}>
              <IconButton
                color={i == nowPlaying ? "warning" : "primary"}
                size="small"
                onClick={() => preview(i)}
                sx={{ mr: 1 }}
              >
                <PlayArrow />
              </IconButton>
              <ChordEditor
                index={i + 1}
                chord={chord}
                keySf={chordsForUtils[i].key}
                prevChord={i > 0 ? chordsForUtils[i - 1] : null}
                defaultBeats={beats}
                onChange={(c: Chord) => onChangeChord(c, i)}
                addChord={() => addChord(i)}
                removeChord={() => removeChord(i)}
              />
            </Box>
          ))}
        </Grid>
        <Grid size={12}>
          <Button
            color="primary"
            variant="contained"
            size="small"
            onClick={() => addChord(-1)}
          >
            追加
          </Button>
        </Grid>
      </Grid>
      <Backdrop open={loading}>
        <CircularProgress sx={{ color: "white" }} />
      </Backdrop>
    </>
  );
};


interface ChordEditorProps {
  index: number;
  chord: Chord;
  keySf: number;
  prevChord?: ChordForUtils | null;
  defaultBeats: number;
  onChange: (c: Chord) => void;
  addChord: () => void;
  removeChord: () => void;
};

const ChordEditorContent = (props: ChordEditorProps) => {
  const { index, chord = defaultChord, keySf: key, prevChord = null, defaultBeats, onChange, addChord, removeChord } = props;

  const [openShape, setOpenShape] = useState(false);
  const shapeRef = useRef<HTMLInputElement>(null);
  const handleCloseShape = () => {
    setOpenShape(false);
  };
  const [openAccd, setOpenAccd] = useState(false);
  const accdRef = useRef<HTMLInputElement>(null);
  const handleCloseAccd = () => {
    setOpenAccd(false);
  };

  const mainFunc = mainFuncToStr(calcMainFunc(chord.bass, chord.shape));
  const chordUd = prevChord ? calcChordProg(prevChord, { ...chord, key: key }) : "0";
  const udNum = Number(chordUd.replace(/[ud]/g, ""));
  const udColor = udNum > 10 ? "#f8f" :
    udNum && udNum < 2 ? "#dad" :
    chordUd.match(/^u/) ? "#f88" :
    chordUd.match(/^d/) ? "#88f" : "#ccc";

  return (
    <Paper elevation={2} sx={{ pl: 0, pr: 1, py: 0.1,  my: 0.1 }}>
      <Box sx={{ display: "flex" }}>
        <Box sx={{ width: 130 }}></Box>
        <Box sx={{ minWidth: 100 }}>
          <Typography variant="subtitle2" sx={{ textAlign: "center", color: "#aaa" }}>
            {Array.from(chord.shape).map((n) => (Number(n) + chord.bass - 2) % 7 + 1).join("")}
          </Typography>
        </Box>
        <Box sx={{ width: 80 }}>
          <Typography variant="subtitle2" sx={{ textAlign: "center", color: udColor }}>
            {chordUd}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: "flex" }}>
        <Box sx={{ width: 30 }}>
          <Typography variant="subtitle2" sx={{ color: "#aaa", textAlign: "center", mt: 1.1 }}>
            {index}
          </Typography>
        </Box>
        <Box sx={{ width: 100 }}>
          <TextField
            select
            id="bass"
            label="ベース"
            size="small"
            value={chord.bass}
            onChange={(e) => onChange({ ...chord, bass: Number(e.target.value) })}
            fullWidth
            slotProps={{
              select: { 
                MenuProps: { disableScrollLock: true },
              },
            }}
          >
            {Array(7).fill(0).map((z, b) => (
              <MenuItem key={b + 1} value={b + 1}>
                {b + 1}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        <Box sx={{ width: 100 }}>
          <TextField
            id="shape"
            label="和音"
            size="small"
            value={chord.shape}
            inputRef={shapeRef}
            onClick={() => setOpenShape(true)}
            inputProps={{ readOnly: true }}
            fullWidth
          />
        </Box>
        <ShapeSelector
          value={chord.shape}
          open={openShape}
          anchorEl={shapeRef.current}
          onChange={(s) => { onChange({ ...chord, shape: s }); handleCloseShape(); }}
          onClose={handleCloseShape}
        />

        <Box sx={{ width: 80, bgcolor: keyColors[fitRange(key, 0, 12)], borderRadius: 3 }}>
          <Typography variant="subtitle1" sx={{ color: "#555", fontSize: "1.25rem", textAlign: "center", my: 0.4 }}>
            {mainFunc}
          </Typography>
        </Box>

        <Box sx={{ width: 150 }}>
          <TextField
            id="accd"
            label="変位"
            size="small"
            value={chord.accd?.sort().map(accdNumToSf).join(", ") || ""}
            inputRef={accdRef}
            onClick={() => setOpenAccd(true)}
            inputProps={{ readOnly: true }}
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
            fullWidth
          />
        </Box>
        <AccdSelector
          value={chord.accd}
          open={openAccd}
          anchorEl={accdRef.current}
          onChange={(a) => { onChange({ ...chord, accd: a }); }}
          onClose={handleCloseAccd}
        />

        <Box sx={{ width: 60 }}>
          <Typography variant="subtitle1" sx={{ color: "#555", fontSize: "1.25rem", textAlign: "center", my: 0.5 }}>
            {calcScaleLevel(chord.accd)}
          </Typography>
        </Box>

        <Box sx={{ width: 100 }}>
          <TextField
            select
            id="key"
            label="キー変更"
            size="small"
            value={chord.key ?? 12}
            onChange={(e) => onChange({ ...chord, key: Number(e.target.value) })}
            fullWidth
            slotProps={{
              inputLabel: {
                shrink: true,
              },
              select: { 
                MenuProps: { disableScrollLock: true },
              },
            }}
          >
            <MenuItem value={12}>
              -
            </MenuItem>
            {keyOptions.map((k) => (
              <MenuItem key={k.value} value={k.value}>
                {k.label}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        <Box sx={{ width: 80 }}>
          <NumberField
            id="beats"
            label="拍数"
            size="small"
            value={chord.beats ?? defaultBeats}
            onChange={(e) => onChange({ ...chord, beats: Math.max(Number(e.target.value), 0) })}
            fullWidth
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
          />
        </Box>

        <Box sx={{ width: 150 }}>
          <TextField
            id="memo"
            label="メモ"
            size="small"
            value={chord.memo || ""}
            onChange={(e) => onChange({ ...chord, memo: e.target.value })}
            fullWidth
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
          />
        </Box>

        <Box sx={{ width: 150 }}>
          <NumberField
            id="bpm"
            label="BPM変更 (未設定: 0)"
            size="small"
            value={chord.bpm || 0}
            onChange={(e) => onChange({ ...chord, bpm: Math.max(Number(e.target.value), 0) })}
            fullWidth
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
          />
        </Box>
        <Button
          color="primary"
          variant="contained"
          size="small"
          onClick={addChord}
          sx={{ mx: 1 }}
        >
          上に追加
        </Button>
        <Button
          color="error"
          variant="contained"
          size="small"
          onClick={removeChord}
          sx={{ mx: 1 }}
        >
          削除
        </Button>
      </Box>

      <Box sx={{ display: "flex" }}>
        <Box sx={{ width: 130 }}></Box>
        <Box sx={{ minWidth: 100, whiteSpace: "pre-wrap" }}>
          <Typography variant="subtitle2" sx={{ textAlign: "center", color: "#888" }}>
            {calcRealname(key, chord.bass, chord.shape, chord.accd)}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};


const ShapeSelector = ({
  value,
  open,
  anchorEl,
  onChange,
  onClose,
}: {
  value: string;
  open: boolean;
  anchorEl: HTMLInputElement | null;
  onChange: (s: string) => void;
  onClose: () => void;
}) => {
  
  const basicShapes = [
    ["135", "137", "157", "123", "125"],
    ["1357", "1235", "1345", "1457", "1567"],
    ["12357", "13457", "12345"],
    ["1", "13", "15", "17", "123457", "1234567"]
  ];
  const semiBasicShapes = ["156", "145", "13567", "123567", "134567"];
  const basicShapesWithSemi = basicShapes.reduce((arr, val) => arr.concat(val), []).concat(semiBasicShapes)

  const defaultTabValue = Math.abs(basicShapes.findIndex((shapes) => shapes.includes(value)));
  const [tabValue, setTabValue] = useState(defaultTabValue);

  const convertShape = (shape: string, b: number) => {
    const arr = Array.from(shape);
    return arr.map((n) => (Number(n) - (b - 1) + 6) % 7 + 1).sort().join("");
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      onClose={onClose}
      disableScrollLock
    >
      <Paper elevation={3} sx={{ p: 1 }}>
        <Tabs value={tabValue} onChange={(e, n) => setTabValue(n)}>
          <Tab label="3和音" value={0} />
          <Tab label="4和音" value={1} />
          <Tab label="5和音" value={2} />
          <Tab label="その他" value={3} />
        </Tabs>
        <Box sx={{ m: 1 }}>
          <Box sx={{ display: "flex", my: 1 }}>
            {[1,7,6,5,4,3,2].map((n) => (
              <Box sx={{ width: 70 }} key={n}>
                <Typography variant="subtitle2" sx={{ textAlign: "center" }}>
                  {n}
                </Typography>
              </Box>
            ))}
          </Box>
          {basicShapes[tabValue].map((basic) => (
            <Box sx={{ display: "flex" }} key={basic}>
              {Array(7).fill(0).map((z, n) => {
                const shape = convertShape(basic, n + 1);
                const mainFunc = mainFuncToStr(calcMainFunc(1, shape));
                return (
                  <Box sx={{ width: 70, my: 0.2 }} key={n}>
                    {basic.includes(String(n + 1)) && !(basic == "1234567" && n > 0) && (
                      <>
                        <Button
                          color={
                            value == shape ? "error"
                            : basicShapesWithSemi.includes(shape) ? "success"
                            : "primary"
                          }
                          variant="contained"
                          size="small"
                          onClick={() => onChange(shape)}
                          sx={{ mx: 0.2 }}
                        >
                          {shape}
                        </Button>
                        <Typography variant="subtitle2" sx={{ textAlign: "center", color: "#888" }}>
                          {mainFunc}
                        </Typography>
                      </>
                    )}
                  </Box>
                )
              })}
            </Box>
          ))}
        </Box>
      </Paper> 
    </Popover>
  );
};


const AccdSelector = ({
  value = [],
  open,
  anchorEl,
  onChange,
  onClose,
}: {
  value?: number[];
  open: boolean;
  anchorEl: HTMLInputElement | null;
  onChange: (a: number[]) => void;
  onClose: () => void;
}) => {

  const handleClickRadio = (n: number, v: number) => {
    const newAccd = [...value].filter((a) => Math.abs(a) != n);
    if (v == 1) newAccd.push(n);
    if (v == -1) newAccd.push(-n);
    onChange(newAccd);
  };
  
  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      onClose={onClose}
      disableScrollLock
    >
      <Paper elevation={3} sx={{ p: 1 }}>
        <Box sx={{ display: "flex" }}>
          {Array(7).fill(0).map((z, n) => (
            <RadioGroup
              key={n}
              value={value.includes(n + 1) ? 1 : value.includes(-n - 1) ? -1 : 0}
              sx={{ mx: 1 }}
            >
              <FormControlLabel label={`${n + 1}＃`} value={1} control={<Radio />} onClick={() => handleClickRadio(n + 1, 1)} />
              <FormControlLabel label={`${n + 1}♮`} value={0} control={<Radio />} onClick={() => handleClickRadio(n + 1, 0)} />
              <FormControlLabel label={`${n + 1}♭`} value={-1} control={<Radio />} onClick={() => handleClickRadio(n + 1, -1)} />
            </RadioGroup>
          ))}
        </Box>
      </Paper>
    </Popover>
  );
};

interface PreviewButtonProps {
  chords: ChordForUtils[];
  setIndex: (i: number) => void;
  setLoading: (i: boolean) => void;
};

const ChordPreviewButton = (props: PreviewButtonProps) => {
  const { chords, setIndex, setLoading } = props;
  const [playing, setPlaying] = useState(false);
  const playingRef = useRef(playing);
  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);
  const [startFrom, setStartFrom] = useState(1);

  const previewAll = async () => {
    setLoading(true);
    const playChord = await getChordPlayer();
    setLoading(false);
    setPlaying(true);
    for (let i = Math.max(startFrom - 1, 0); i < chords.length; i++) {
      setIndex(i);
      await playChord(chords[i]);
      if (!playingRef.current) break;
    }
    setPlaying(false);
  };

  const stopPlayer = () => {
    setPlaying(false);
  };

  return (
    <Box sx={{ mr: 2, display: "flex" }}>
      {!playing && (
        <Button
          color="warning"
          variant="contained"
          size="small"
          startIcon={<PlayArrow />}
          onClick={previewAll}
          sx={{ mr: 1, width: 120 }}
        >
          全て再生
        </Button>
      )}
      {playing && (
        <Button
          color="warning"
          variant="contained"
          size="small"
          startIcon={<Stop />}
          onClick={stopPlayer}
          sx={{ mr: 1, width: 120 }}
        >
          停止
        </Button>
      )}
      <Box sx={{ width: 100 }}>
        <NumberField
          id="startFrom"
          label="開始位置"
          size="small"
          value={startFrom}
          onChange={(e) => setStartFrom(Math.max(Number(e.target.value), 0))}
          fullWidth
        />
      </Box>
    </Box>
  );
};

class ChordEditor extends Component {
  props: ChordEditorProps;

  constructor(props: ChordEditorProps) {
    super(props);
    this.props = props;
  };

  shouldComponentUpdate(nextProps: Readonly<ChordEditorProps>): boolean {
    return this.props.index != nextProps.index ||
      JSON.stringify(this.props.chord) != JSON.stringify(nextProps.chord) ||
      this.props.keySf != nextProps.keySf ||
      JSON.stringify(this.props.prevChord) != JSON.stringify(nextProps.prevChord) ||
      this.props.defaultBeats != nextProps.defaultBeats;
  };

  render() {
    return (
      <ChordEditorContent {...this.props} />
    );
  };
};