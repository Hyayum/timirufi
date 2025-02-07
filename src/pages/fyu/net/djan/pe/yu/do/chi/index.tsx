import { useState, useEffect, CSSProperties } from "react";
import {
  Backdrop,
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  List,
  ListItemText,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import CryptoJS from "crypto-js";
import { useMusicList } from "@/hook/useMusicList";
import { MusicDbData, MusicPostData, defaultMusicDbData } from "@/music/model";
import NumberField from "@/component/NumberField";

const TOKEN_URL = "https://script.google.com/macros/s/AKfycbzWZrzdAPmRbxNRPdIFIkbi0LwsARcARUg5qRH1ugmEA-M03qC2L-cjuKczp4Yr5au_/exec";

const Fyunetdjan = () => {
  const [apiData, setApiData] = useState({ token: "", url: "" });
  const [loading, setLoading] = useState(false);
  const [inputId, setInputId] = useState("");
  const [inputPass, setInputPass] = useState("");

  const [editId, setEditId] = useState<number | "new">(0);
  const [formData, setFormData] = useState(defaultMusicDbData);
  const { musicList, reload } = useMusicList();

  const hiddenStyle: CSSProperties = {
    border: "none",
    backgroundColor: "#fff",
  };

  const getUrl = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(TOKEN_URL, {
        method: "POST",
        headers: {"Content-Type": "text/plain"},
        body: JSON.stringify({ token: token }),
      });
      const jsonData = await response.json();
      if (jsonData.url) {
        setApiData({ token: token, url: jsonData.url });
      }
    } catch (e) {
      console.log(e);
    }
    setLoading(false);
  };

  const onSubmit = async () => {
    if (!inputId || !inputPass) return;
    setLoading(true);
    try {
      const hashed = CryptoJS.SHA256(inputPass).toString(CryptoJS.enc.Base64);
      const response = await fetch(TOKEN_URL, {
        method: "POST",
        headers: {"Content-Type": "text/plain"},
        body: JSON.stringify({ id: inputId, pass: hashed }),
      });
      const jsonData = await response.json();
      if (jsonData.token && jsonData.url) {
        setApiData(jsonData);
        localStorage.setItem("token", jsonData.token);
      }
    } catch (e) {
      console.log(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    getUrl();
  }, []);

  const getMusicDetail = async () => {
    if (!apiData.url) return;
    setLoading(true);
    try {
      const response = await fetch(`${apiData.url}?id=${editId}`);
      const jsonData: MusicDbData = await response.json();
      setFormData(jsonData);
    } catch (e) {
      console.log(e);
      setApiData({ token: "", url: "" });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (editId && editId != "new") {
      getMusicDetail();
    } else if (editId == "new") {
      setFormData({ ...defaultMusicDbData, number: Math.floor(musicList.sort((m1, m2) => m2.number - m1.number)[0].number) + 1 });
    }
  }, [editId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target as { name: keyof MusicDbData, value: string, checked: boolean };
    if (name == "number" || name == "numberDecimal") {
      setFormData({ ...formData, [name]: Number(value) });
    } else if (name == "showAtList" || name == "showTrial" || name == "showLyrics" || name == "showAtMq" || name == "showAtTm") {
      setFormData({ ...formData, [name]: checked ? 1 : 0 });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const updateMusicData = async () => {
    if (!apiData.url || !apiData.token) return;
    const request: MusicPostData = {
      ...formData,
      where: editId == "new" ? { number: editId, decimal: 0 } :
        { number: Math.floor(editId), decimal: (10 * editId) % 10 },
      token: apiData.token,
    };
    setLoading(true);
    try {
      const response = await fetch(apiData.url, {
        method: "POST",
        headers: {"Content-Type": "text/plain"},
        body: JSON.stringify(request),
      });
      const jsonData = await response.json();
      if (jsonData.success) {
        setEditId(0);
        reload();
      }
    } catch (e) {
      console.log(e);
      setApiData({ token: "", url: "" });
    }
    setLoading(false);
  };

  return (
    <Box sx={{ p: 5, minWidth: 800 }}>
      {!(apiData.token && apiData.url) ? (
        <Box>
          <input
            value={inputId}
            onChange={(e) => setInputId(e.target.value)}
            style={{
              ...hiddenStyle,
              position: "absolute",
              top: 200,
              left: 50,
            }}
          />
          <input
            type="password"
            value={inputPass}
            onChange={(e) => setInputPass(e.target.value)}
            style={{
              ...hiddenStyle,
              position: "absolute",
              top: 80,
              left: 300,
            }}
          />
          <button
            style={{
              ...hiddenStyle,
              position: "absolute",
              top: 400,
              left: 200,
              fontSize: 40,
              color: "#ff3366",
            }}
            onClick={onSubmit}
          >
            にぇ
          </button>
        </Box>
      ) : !editId ? (
        <Box>
          <Button onClick={() => setEditId("new")}>新規作成</Button>
          <List>
            {musicList.sort((m1, m2) => m2.number - m1.number).map((music) => (
              <ListItemText
                key={music.number}
                primary={`${music.number} ${music.title}`}
                secondary={music.origin.join(" ") || music.vocal.join(" ")}
                onClick={() => setEditId(music.number)}
                sx={{ cursor: "pointer", "&:hover": { bgcolor: "#ddd" } }}
              />
            ))}
          </List>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Button onClick={() => setEditId(0)} variant="outlined" size="small">戻る</Button>
          <Box sx={{ display: "flex" }}>
            <NumberField size="small" value={formData.number} name="number" onChange={handleChange} />
            <NumberField size="small" value={formData.numberDecimal} name="numberDecimal" onChange={handleChange} />
          </Box>
          <TextField size="small" value={formData.title} name="title" label="タイトル" onChange={handleChange} />
          <TextField size="small" value={formData.titlePronounce} name="titlePronounce" label="タイトル読み" onChange={handleChange} />
          <TextField size="small" value={formData.origin} name="origin" label="原曲" onChange={handleChange} />
          <TextField size="small" value={formData.vocal} name="vocal" label="ボーカル" onChange={handleChange} />
          <TextField size="small" value={formData.niconicoUrl} name="niconicoUrl" label="ニコニコURL" onChange={handleChange} />
          <TextField size="small" value={formData.youtubeUrl} name="youtubeUrl" label="YouTube URL" onChange={handleChange} />
          <TextField size="small" value={formData.commonsUrl} name="commonsUrl" label="コモンズURL" onChange={handleChange} />
          <TextField size="small" value={formData.soundCloudUrl} name="soundCloudUrl" label="SoundCloud URL" onChange={handleChange} />
          <TextField size="small" value={formData.offVocalUrl} name="offVocalUrl" label="off vocal URL" onChange={handleChange} />
          <TextField size="small" value={formData.bpm} name="bpm" label="BPM" onChange={handleChange} />
          <TextField size="small" value={formData.length} name="length" label="長さ" onChange={handleChange} />
          <TextField size="small" value={formData.createdAt} name="createdAt" label="制作時期 (yyyy.MM○)" onChange={handleChange} />
          <TextField size="small" value={formData.uploadedAt} name="uploadedAt" label="初公開日 (yyyy.MM.dd)" onChange={handleChange} />
          <TextField size="small" value={formData.typeCode} name="typeCode" label="タイプ ((oi, ov, ti) + abq)" onChange={handleChange} />
          <FormControlLabel control={<Switch size="small" checked={!!formData.showAtList} name="showAtList" onChange={handleChange} />} label="リスト表示" />
          <FormControlLabel control={<Switch size="small" checked={!!formData.showTrial} name="showTrial" onChange={handleChange} />} label="試聴音源" />
          <FormControlLabel control={<Switch size="small" checked={!!formData.showLyrics} name="showLyrics" onChange={handleChange} />} label="歌詞表示" />
          <FormControlLabel control={<Switch size="small" checked={!!formData.showAtMq} name="showAtMq" onChange={handleChange} />} label="MeireQube掲載" />
          <FormControlLabel control={<Switch size="small" checked={!!formData.showAtTm} name="showAtTm" onChange={handleChange} />} label="てぃみらりー掲載" />
          <TextField size="small" value={formData.mqDescription} name="mqDescription" label="MeireQube説明文" onChange={handleChange} minRows={2} multiline />
          <TextField size="small" value={formData.tmDescription} name="tmDescription" label="てぃみらりー説明文" onChange={handleChange} minRows={2} multiline />
          <Typography variant="body2">ボタン例：/-0:20--A1-/</Typography>
          <TextField size="small" value={formData.lyrics} name="lyrics" label="歌詞" onChange={handleChange} minRows={2} multiline />
          <Typography variant="body2">/-mk--【Aメロ】-/ /-vc--●◆-/ /-rb--(そら)-/ /-rb--()-/</Typography>
          <Button onClick={updateMusicData} size="large" variant="contained">送信</Button>
        </Box>
      )}
      <Backdrop open={loading}>
        <CircularProgress sx={{ color: "white" }} />
      </Backdrop>
    </Box>
  );
};

export default Fyunetdjan;