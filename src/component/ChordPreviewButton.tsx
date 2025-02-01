import { Box, Button } from "@mui/material";
import { Stop, PlayArrow } from "@mui/icons-material";
import { useEffect, useState, useRef } from "react";
import { ChordForUtils } from "@/chord/model";
import { getChordPlayer } from "@/chord/midi";
import NumberField from "@/component/NumberField";

interface Props {
  chords: ChordForUtils[];
  setIndex: (i: number) => void;
  setLoading: (i: boolean) => void;
};

export default function ChordPreviewButton(props: Props) {
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