import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  FormControlLabel,
  FormGroup,
  Grid2 as Grid,
  LinearProgress,
  Typography
} from "@mui/material";
import { YouTube, Google } from "@mui/icons-material";
import { MaterialReactTable, useMaterialReactTable, type MRT_ColumnDef } from "material-react-table";
import OutboundLink from "@/component/OutboundLink";
import AudioPlayer from "@/component/AudioPlayer";
import HoverPopper from "@/component/HoverPopper";
import { Niconico } from "@/component/icons";
import { MusicListData } from "@/music/model";
import { getSoundUrl } from "@/music/utils";
import { useMusicList } from "@/hook/useMusicList";

const getBgColor = (tag: string[]) => {
  if (tag.includes("東方")) {
    return "#fff0e8";
  } else if (tag.includes("ボカロ(広義)")) {
    return "#e8fcff";
  } else {
    return "#e8fff4";
  }
};

export default function List() {
  const { musicList, loading } = useMusicList();
  const flags = musicList.reduce((acc, music) => (
    music.show.trial ? { ...acc, [music.number]: false } : acc
  ), {} as { [k: number]: boolean });
  const searchParams = useSearchParams();
  const [playFlags, setPlayFlags] = useState(flags);
  const [continuous, setContinuous] = useState(false);
  const [showLyrics, setShowLyrics] = useState(-1);
  const lyrics = musicList.find((m) => m.number == showLyrics)?.lyrics || "";

  useEffect(() => {
    const param = searchParams.get("lyrics");
    if (param && !loading) {
      setShowLyrics(Number(param));
    }
  }, [loading]);

  const handleChangeFlag = (n: number) => {
    const flag = !playFlags[n];
    if (flag) {
      const flags = musicList.reduce((acc, music) => (
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
        const url = getSoundUrl(number, "trial")
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
          <HoverPopper text={titlePronounce}>
            {title}
          </HoverPopper>
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
    data: musicList.filter((m) => m.show.list && (m.url.niconico || m.url.youtube))
                   .sort((a, b) => b.number - a.number),
    enablePagination: false,
    enableColumnActions: false,
    muiTableBodyRowProps: { hover: false },
    muiTableBodyCellProps: (props) => ({
      style: {
        backgroundColor: getBgColor(props.row.original.tag),
        padding: 10,
        overflow: "visible",
      },
    }),
    muiTableHeadCellProps: { style: { paddingRight: 10, paddingLeft: 10 } },
    muiBottomToolbarProps: { style: { zIndex: 0 } },
    muiTopToolbarProps: { style: { zIndex: 0 } },
    muiTableContainerProps: { sx: { maxHeight: 900 } },
    defaultColumn: { size: 0 },
    renderBottomToolbar: false,
  });

  return (
    <Grid container spacing={5} sx={{ p: 5, pb: 10, minWidth: 800 }}>
      <Grid size={12}>
        <Typography variant="h4" sx={{ textAlign: "center" }}>
          楽曲リスト
        </Typography>
      </Grid>
      <Grid size={12}>
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
      <Lyrics
        open={showLyrics > 0}
        onClose={() => setShowLyrics(-1)}
        lyrics={lyrics}
      />
    </Grid>
  );
}

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