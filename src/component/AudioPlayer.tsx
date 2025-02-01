import { useRef, useEffect, useState } from "react";
import { Box, CircularProgress, IconButton, LinearProgress } from "@mui/material";
import { PlayArrow, Pause } from "@mui/icons-material";

type Props = {
  src: string;
  playing: boolean;
  onClick: () => void;
  onEnded: () => void;
};

const AudioPlayer = ({ src, playing, onClick, onEnded }: Props) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLElement>(null);
  const playingRef = useRef(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const progressWidth = 80;

  const handleEnded = () => {
    onClick();
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
    onEnded();
  };

  const handleClickProgress = (e: React.MouseEvent) => {
    const clickedX = e.clientX;
    const elementX = progressBarRef.current?.getBoundingClientRect().left || 0;
    const x = clickedX - elementX;
    const time = (audioRef.current?.duration || 0) * x / progressWidth;
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  useEffect(() => {
    if (playing) {
      setLoading(true);
      audioRef.current?.play().then(() => setLoading(false));
    } else {
      audioRef.current?.pause();
    }
    playingRef.current = playing;
    setCurrentTime(audioRef.current?.currentTime || 0);
  }, [playing]);

  useEffect(() => {
    setInterval(() => {
      if (playingRef.current) {
        setCurrentTime(audioRef.current?.currentTime || 0);
      }
    }, 500);
  }, [])

  return (
    <>
      <audio
        src={src}
        preload="none"
        ref={audioRef}
        style={{ display: "none" }}
        onEnded={handleEnded}
      />
      <Box sx={{ display: "flex" }}>
        <Box sx={{ ml: -2, width: 35 }}>
          <IconButton onClick={() => {if (!loading) onClick();}}>
            <>
              {loading ? (
                <CircularProgress size={20} />
              ) : playing ? (
                <Pause />
              ) : (
                <PlayArrow />
              )}
            </>
          </IconButton>
        </Box>
        <Box ref={progressBarRef}>
          <LinearProgress
            variant="determinate"
            value={100 * currentTime / (audioRef.current?.duration || 1)}
            sx={{ width: progressWidth, height: 8, mt: 2 }}
            onClick={handleClickProgress}
          />
        </Box>
      </Box>
    </>
  );
};

export default AudioPlayer;