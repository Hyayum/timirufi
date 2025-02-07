import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  FormGroup,
  Grid2 as Grid,
  Typography
} from "@mui/material";
import { Download } from "@mui/icons-material";
import { MusicListData } from "@/music/model";
import { getSoundUrl } from "@/music/utils";
import { Niconico } from "@/component/icons";
import AudioPlayer from "@/component/AudioPlayer";
import HoverPopper from "@/component/HoverPopper";
import OutboundLink from "@/component/OutboundLink";
import { useMusicList } from "@/hook/useMusicList";


export default function Timillery() {
  const { musicList, loading } = useMusicList();
  const timilleryList = musicList.filter((music) => music.show.timillery).sort((m1, m2) => m2.number - m1.number);
  const flags = timilleryList.reduce((acc, music) => (
    music.show.timillery ? { ...acc, [music.number]: false } : acc
  ), {} as { [k: number]: boolean });
  const searchParams = useSearchParams();
  const [playFlags, setPlayFlags] = useState(flags);
  const [continuous, setContinuous] = useState(false);
  const [focused, setFocused] = useState(-1);

  useEffect(() => {
    const param = searchParams.get("id");
    if (param && !loading) {
      setFocused(Number(param));
      const element = document.getElementById(param);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [loading]);

  const handleChangeFlag = (n: number) => {
    const flag = !playFlags[n];
    if (flag) {
      const flags = timilleryList.reduce((acc, music) => (
        music.show.trial ? { ...acc, [music.number]: music.number == n } : acc
      ), {} as { [k: number]: boolean });;
      setPlayFlags(flags);
    } else {
      playFlags[n] = flag;
      setPlayFlags({...playFlags});
    }
  };

  const handlePlayEnded = (n: number) => {
    if (!continuous) return;
    const playerIds = Object.entries(playFlags).reduce((acc, [num, flag]) => [...acc, Number(num)], [] as number[]);
    const nextId = playerIds[playerIds.indexOf(n) - 1];
    if (nextId) {
      handleChangeFlag(nextId);
    }
  };

  return (
    <Grid container spacing={5} sx={{ m: 5, mb: 10, minWidth: 500 }}>
      <Grid size={12}>
        <Typography variant="h4" sx={{ textAlign: "center" }}>
          てぃみらりー
        </Typography>
      </Grid>
      <Grid size={12}>
        <Typography variant="h5" sx={{ mb: 1 }}>
          概要
        </Typography>
        <Typography variant="body2">
          オリジナルのインスト曲を中心に掲載しています。BGMとしても使えます。(ほとんどBGM用には作ってないけど)
        </Typography>
      </Grid>
      <Grid size={12}>
        <FormGroup sx={{ mb: 1 }}>
          <FormControlLabel
            control={
              <Checkbox checked={continuous} onClick={() => setContinuous(!continuous)} />
            }
            label="連続再生"
          />
        </FormGroup>
        <Grid container spacing={2}>
          {!loading ? timilleryList.map((music) => (
            <Grid size={12} key={music.number}>
              <TimilleryPlayer
                music={music}
                playing={playFlags[music.number]}
                onClick={() => handleChangeFlag(music.number)}
                onEnded={() => handlePlayEnded(music.number)}
                focused={focused == music.number}
              />
              <Divider sx={{ mt: 1 }} />
            </Grid>
          )) : (
            <Typography variant="subtitle1" sx={{ mt: 2 }}>
              Loading...
            </Typography>
          )}
        </Grid>
      </Grid>
    </Grid>
  );
}

const TimilleryPlayer = ({
  music,
  playing,
  onClick,
  onEnded,
  focused,
}: {
  music: MusicListData;
  playing: boolean;
  onClick: () => void;
  onEnded: () => void;
  focused: boolean;
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  const setCurrentTime = (param: string) => {
    const [m, s] = param.split(":");
    const seconds = Number(m) * 60 + Number(s);
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
    }
  };

  return (
    <Grid container id={String(music.number)} spacing={1} sx={{ px: 4, pb: 2, bgcolor: focused ? "#f0fffb" : "#fff", borderRadius: 2 }}>
      <Grid size={12}>
        <HoverPopper text={music.titlePronounce} placement="bottom-start">
          <Typography variant="h6">
            {music.title}
          </Typography>
        </HoverPopper>
      </Grid>
      <Grid size={12}>
        <Chip label={music.length} size="small" sx={{ mr: 1 }} />
        <Chip label={`BPM ${music.bpm}`} size="small" />
      </Grid>
      <Grid size={12}>
        <TextWithButton
          text={music.description.timillery}
          onClick={(param) => setCurrentTime(param)}
        />
      </Grid>
      <Grid size={12}>
        <AudioPlayer
          src={getSoundUrl(music.number, "timillery")}
          playing={playing}
          onClick={onClick}
          onEnded={onEnded}
          width={400}
          ref={audioRef}
        />
      </Grid>
      <Grid size={12} sx={{ display: "flex", gap: 2 }}>
        <OutboundLink href={getSoundUrl(music.number, "timillery")}>
          <Button variant="text" startIcon={<Download />}>
            直接DL
          </Button>
        </OutboundLink>
        {music.url.commons && (
          <OutboundLink href={music.url.commons}>
            <Button variant="text" startIcon={<Niconico />}>
              ニコニ・コモンズ
            </Button>
          </OutboundLink>
        )}
      </Grid>
    </Grid>
  );
};

const TextWithButton = ({
  text,
  onClick,
}: {
  text: string;
  onClick: (param: string) => void;
}) => {
  // /-(time)--(label)-/
  const parts = text.replace("<br>", "\n").split(/(\/\-.+?\-\-.+?\-\/)/);
  return (
    <Box sx={{ whiteSpace: "pre-wrap" }}>
      {parts.map((part, i) => {
        const match = part.match(/\/\-(.*?)\-\-(.*?)\-\//);
        return (part && (match ? (
          <Button
            key={i}
            variant="outlined"
            size="small"
            color="primary"
            onClick={() => onClick(match?.[1] || "")}
            sx={{
              mx: 0.5,
              "&.MuiButtonBase-root": {
                minWidth: 30,
                lineHeight: 1,
                minHeight: 25,
              },
            }}
          >
            {match?.[2]}
          </Button>
        ) : (
          <Typography key={i} variant="body2" sx={{ lineHeight: 1, mt: 1 }}>
            {part}
          </Typography>
        )));
      })}
    </Box>
  );
};