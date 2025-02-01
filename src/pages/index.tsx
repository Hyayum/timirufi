import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Avatar,
  Box,
  Button,
  Checkbox,
  Dialog,
  FormControlLabel,
  FormGroup,
  Grid2 as Grid,
  LinearProgress,
  Paper,
  Popper,
  Typography
} from "@mui/material";
import { YouTube, Google, X } from "@mui/icons-material";
import Link from "next/link";
import { MaterialReactTable, useMaterialReactTable, type MRT_ColumnDef } from "material-react-table";
import OutboundLink from "@/component/OutboundLink";
import AudioPlayer from "@/component/AudioPlayer";
import { Niconico } from "@/component/icons";
import { API_URL, SOUND_URL, GUIDELINE_URL, ICON_URL } from "@/config/config";
import { MusicListData } from "@/music/model";

const getBgColor = (tag: string[]) => {
  if (tag.includes("東方")) {
    return "#fff0e8";
  } else if (tag.includes("ボカロ(広義)")) {
    return "#e8fcff";
  } else {
    return "#e8fff4";
  }
};

export default function Home() {
  const [musicData, setMusicData] = useState<MusicListData[]>([]);
  const flags: { [k: number]: boolean } = {};
  for (const music of musicData) {
    if (music.show.trial) {
      flags[music.number] = false;
    }
  }
  const searchParams = useSearchParams();
  const [playFlags, setPlayFlags] = useState(flags);
  const [continuous, setContinuous] = useState(false);
  const [showLyrics, setShowLyrics] = useState(Number(searchParams.get("lyrics")) || -1);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_URL, { cache: "no-cache" });
      const data = await response.json();
      setMusicData(data);
    } catch (e) {
      console.log(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChangeFlag = (n: number) => {
    const flag = !playFlags[n];
    if (flag) {
      const flags: { [k: number]: boolean } = {};
      for (const { number } of musicData) {
        flags[number] = n == number ? true : false;
      }
      setPlayFlags(flags);
    } else {
      playFlags[n] = flag;
      setPlayFlags({...playFlags});
    }
  };

  const handlePlayEnded = (n: number) => {
    if (!continuous) return;
    const playerIds = table.getSortedRowModel().rows
                           .filter((row) => row.original.show.trial)
                           .map((row) => row.original.number);
    const nextId = playerIds[playerIds.indexOf(n) + 1];
    if (nextId) {
      handleChangeFlag(nextId);
    }
  };

  const columns: MRT_ColumnDef<MusicListData>[] = [
    {
      header: "No.",
      accessorKey: "number",
      Cell: ({ cell }) => (
        <Box sx={{ textAlign: "center" }}>
          {cell.row.original.number}
        </Box>
      ),
    },
    {
      header: "サムネ",
      Cell: ({ cell }) => {
        const { url, title } = cell.row.original;
        const youtubeId = url.youtube.split("/").pop();
        const thumbnailUrl = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg` : "";
        return thumbnailUrl ? (
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <img
              src={thumbnailUrl}
              alt={title}
              loading="lazy"
              width={100}
            />
          </Box>
        ) : (
          <></>
        );
      },
    },
    {
      header: "試聴",
      Cell: ({ cell }) => {
        const { number, show } = cell.row.original;
        const filename = number.toString().padStart(3, "0").replace(".", "_");
        const url = `${SOUND_URL}/trial/${filename}.mp3`;
        return (
          <>
            {show.trial ? (
              <AudioPlayer 
                src={url}
                playing={playFlags[number]}
                onClick={() => handleChangeFlag(number)}
                onEnded={() => handlePlayEnded(number)}
              />
            ) : (
              <></>
            )}
          </>
        );
      },
    },
    {
      header: "Title",
      Cell: ({ cell }) => {
        const { title, titlePronounce } = cell.row.original;
        return (
          <TitlePopper title={title} pronounce={titlePronounce} />
        );
      },
      minSize: 130,
    },
    {
      header: "Links",
      size: 100,
      Cell: ({ cell }) => {
        const { niconico, youtube, offvocal } = cell.row.original.url;
        return (
          <>
            {niconico && (
              <OutboundLink href={niconico}>
                <Button variant="text" startIcon={<Niconico />}>
                  ニコニコ
                </Button>
              </OutboundLink>
            )}
            {youtube && (
              <OutboundLink href={youtube}>
                <Button variant="text" startIcon={<YouTube />}>
                  YouTube
                </Button>
              </OutboundLink>
            )}
            {offvocal && (
              <OutboundLink href={offvocal}>
                <Button variant="text" startIcon={<Google />}>
                  off vocal
                </Button>
              </OutboundLink>
            )}
          </>
        );
      },
    },
    {
      header: "Vocal",
      accessorFn: (cell) => cell.vocal.join("・"),
      minSize: 75,
    },
    {
      header: "原曲",
      Cell: ({ cell }) => (
        <Box sx={{ whiteSpace: "pre-wrap" }}>
          {cell.row.original.origin.join("\n")}
        </Box>
      ),
      minSize: 100,
    },
    {
      header: "歌詞",
      Cell: ({ cell }) => {
        const { show, lyrics, number } = cell.row.original;
        return (
          <>
            {show.lyrics && lyrics && (
              <Button
                size="small"
                variant="outlined"
                onClick={() => setShowLyrics(number)}
              >
                歌詞
              </Button>
            )}
          </>
        );
      },
    },
    {
      header: "BPM",
      accessorKey: "bpm",
      grow: false,
    },
    {
      header: "長さ",
      accessorKey: "length",
      grow: false,
    },
    {
      header: "制作時期",
      accessorKey: "createdAt",
      grow: false,
    },
    {
      header: "初公開日",
      accessorKey: "uploadedAt",
      grow: false,
    },
    {
      header: "タグ",
      accessorFn: (cell) => cell.tag.join(", "),
    },
  ];

  const table = useMaterialReactTable({
    columns,
    data: musicData.filter((m) => m.show.list && (m.url.niconico || m.url.youtube))
                   .sort((a, b) => b.number - a.number),
    enablePagination: false,
    enableColumnActions: false,
    muiTableBodyRowProps: { hover: false },
    muiTableBodyCellProps: (props) => ({
      style: {
        backgroundColor: getBgColor(props.row.original.tag),
        padding: 10,
      },
    }),
    muiTableHeadCellProps: { style: { paddingRight: 10, paddingLeft: 10 } },
    muiBottomToolbarProps: { style: { zIndex: 0 } },
    muiTopToolbarProps: { style: { zIndex: 0 } },
    muiTableContainerProps: { sx: { maxHeight: 800 } },
    defaultColumn: { size: 0 },
    renderBottomToolbar: false,
  });

  const links = [
    {
      label: "ニコニコ１(主に東方)",
      url: "http://www.nicovideo.jp/user/51008840",
      icon: <Niconico />
    },
    {
      label: "ニコニコ２(主にボカロ)",
      url: "http://www.nicovideo.jp/user/119635362",
      icon: <Niconico />
    },
    {
      label: "ニコニ・コモンズ",
      url: "http://commons.nicovideo.jp/user/upload/3346494",
      icon: <Niconico />
    },
    {
      label: "YouTube",
      url: "https://www.youtube.com/c/MiLfy6o6_mei",
      icon: <YouTube />
    },
    {
      label: "Twitter",
      url: "https://twitter.com/Timirufi",
      icon: <X />
    },
  ];

  const profile = `ボカロ曲、東方アレンジ、インストオリジナル曲を作ってます。
  ペユドチな曲を作ってます。
  動画・イラスト等もほとんど自分で作っています。
  依頼は受け付けていません。
  楽曲は基本的に自由に使っていいことになっていますが一応下のガイドラインを確認しておいてください。
  (要約の条件(「二次創作の場合やBGMとして使う場合」)に当てはまっていれば要約の部分だけ見れば大丈夫です)`;

  return (
    <>
      <Grid container spacing={5} sx={{ m: 5, mb: 10, minWidth: 800 }}>
        <Grid size={12}>
          <Typography variant="h4" sx={{ textAlign: "center" }}>
            てぃみ*れの / みるふぃ のページ（元Locossic）
          </Typography>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Typography variant="h5">
            プロフィール
          </Typography>
          <Avatar src={ICON_URL} />
          <Typography variant="body2" sx={{ mb: 1 }}>
            ↑現在使用中のアイコン
          </Typography>
          {profile.split("\n").map((line, i) => (
            <Typography variant="body2" key={i}>
              {line}
            </Typography>
          ))}
          <OutboundLink href={GUIDELINE_URL}>
            <Button variant="text">
              楽曲使用のガイドライン
            </Button>
          </OutboundLink>
        </Grid>

        <Grid size="grow">
          <Typography variant="h5">
            Links
          </Typography>
          {links.map((link) => (
            <Box key={link.label}>
              <OutboundLink href={link.url}>
                <Button variant="text" startIcon={link.icon}>
                  {link.label}
                </Button>
              </OutboundLink>
            </Box>
          ))}
        </Grid>

        <Grid size={12}>
          <Typography variant="h5" sx={{ mb: 1 }}>
            名義の使い分け
          </Typography>
          <Typography variant="body1">
            てぃみ*れの：主にボカロ曲で使っているHN
          </Typography>
          <Typography variant="body1">
            みるふぃ：主に東方アレンジで使っているHN
          </Typography>
        </Grid>

        <Grid size={12}>
          <Typography variant="h5" sx={{ mb: 1 }}>
            楽曲リスト
          </Typography>
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox checked={continuous} onClick={() => setContinuous(!continuous)} />
              }
              label="連続再生"
            />
          </FormGroup>
          <MaterialReactTable table={table} />
          {loading && (<LinearProgress sx={{ width: "100%" }} />)}
        </Grid>
      </Grid>
      <Lyrics
        open={showLyrics > 0}
        onClose={() => setShowLyrics(-1)}
        lyrics={musicData.find((m) => m.number == showLyrics)?.lyrics || ""}
      />
    </>
  );
}

const TitlePopper = ({ title, pronounce }: { title: string, pronounce: string }) => {
  const textRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  return (
    <>
      <Popper
        open={open}
        anchorEl={textRef.current}
        placement="top-start"
      >
        <Paper elevation={3} sx={{ p: 1 }}>
          <Typography variant="body2">
            {pronounce}
          </Typography>
        </Paper>
      </Popper>
      <Box
        ref={textRef}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        {title}
      </Box>
    </>
  );
};

const Lyrics = ({
  open,
  onClose,
  lyrics,
}: {
  open: boolean,
  onClose: (b: boolean) => void,
  lyrics: string,
}) => {
  const [show, setShow] = useState<{ [k: string]: boolean }>({
    mk: true,
    vc: true,
    rb: true
  });
  const lyricsParts = lyrics.split(/(\/\-.+?\-\-[\s\S]+?\-\/)/);
  return (
    <Dialog open={open} onClose={onClose}>
      <Grid container spacing={2} sx={{ p: 3, whiteSpace: "pre-wrap" }}>
        <Grid size={12}>
          {open && (
            <>
              <FormGroup>
                <FormControlLabel
                  control={<Checkbox checked={show.mk} onClick={() => setShow({ ...show, mk: !show.mk })} />}
                  label="マーカー(【Aメロ】など)を表示"
                />
              </FormGroup>
              <FormGroup>
                <FormControlLabel
                  control={<Checkbox checked={show.vc} onClick={() => setShow({ ...show, vc: !show.vc })} />}
                  label="パート分け(●◆など)を表示"
                />
              </FormGroup>
              <FormGroup>
                <FormControlLabel
                  control={<Checkbox checked={show.rb} onClick={() => setShow({ ...show, rb: !show.rb })} />}
                  label="ルビを表示"
                />
              </FormGroup>
            </>
          )}
        </Grid>
        <Grid size={12}>
          {lyricsParts.map((part, i) => {
            const match = part.match(/\/\-(.*?)\-\-([\s\S]*?)\-\//);
            let flag = true;
            let style = {};
            let text = match?.[2] || part;
            if (match && match[1] == "mk") {
              flag = show.mk;
              text = "\n" + text;
            } else if (match && match[1] == "rb") {
              flag = show.rb;
              style = { fontSize: 11 };
            } else if (match && match[1] == "wh") {
              style = { color: "#fffff0" }
            } else if (match) {
              flag = show[match[1]];
            }
            return flag && (<span style={style} key={i}>{text}</span>);
          })}
        </Grid>
      </Grid>
    </Dialog>
  );
};