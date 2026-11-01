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
import Lyrics from "@/component/Lyrics";
import { Niconico } from "@/component/icons";
import { MusicDbData } from "@/music/model";
import { getSoundUrl } from "@/music/utils";
import { useMusicList } from "@/hook/useMusicList";
import { BASE_PATH } from "@/config/config";

const getBgColor = (tag: string[]) => {
  if (tag.includes("東方")) {
    return "#fff0e8";
  } else if (tag.includes("ボカロ(広義)")) {
    return "#e8fcff";
  } else if (tag.includes("原神")) {
    return "#fff8e8";
  } else {
    return "#e8fff4";
  }
};

export default function List() {
  const { musicList, loading } = useMusicList();
  const flags = musicList.reduce((acc, music) => (
    music.showTrial ? { ...acc, [music.number]: false } : acc
  ), {} as { [k: number]: boolean });
  const searchParams = useSearchParams();
  const [playFlags, setPlayFlags] = useState(flags);
  const [continuous, setContinuous] = useState(false);
  const [showLyrics, setShowLyrics] = useState(-1);
  const lyrics = musicList.find((m) => m.number == showLyrics)?.lyrics || "";
  const lyricsTitle = musicList.find((m) => m.number == showLyrics)?.title || "";

  useEffect(() => {
    const param = searchParams.get("lyrics");
    if (param && !Number.isNaN(Number(param))) {
      window.location.href = `${BASE_PATH}/lyrics?n=${param}`;
    }
  }, [searchParams]);

  const handleChangeFlag = (n: number) => {
    const flag = !playFlags[n];
    if (flag) {
      const flags = musicList.reduce((acc, music) => (
        music.showTrial ? { ...acc, [music.number]: music.number == n } : acc
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
                           .filter((row) => row.original.showTrial)
                           .map((row) => row.original.number);
    const nextId = playerIds[playerIds.indexOf(n) + 1];
    if (nextId) {
      handleChangeFlag(nextId);
    }
  };

  const columns: MRT_ColumnDef<MusicDbData>[] = [
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
        const { youtubeUrl, title } = cell.row.original;
        const youtubeId = youtubeUrl.split("/").pop();
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
        const { number, showTrial } = cell.row.original;
        const url = getSoundUrl(number, "trial")
        return (
          <>
            {showTrial ? (
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
        const { niconicoUrl, youtubeUrl, offVocalUrl } = cell.row.original;
        return (
          <>
            {niconicoUrl && (
              <OutboundLink href={niconicoUrl}>
                <Button variant="text" startIcon={<Niconico />}>
                  ニコニコ
                </Button>
              </OutboundLink>
            )}
            {youtubeUrl && (
              <OutboundLink href={youtubeUrl}>
                <Button variant="text" startIcon={<YouTube />}>
                  YouTube
                </Button>
              </OutboundLink>
            )}
            {offVocalUrl && (
              <OutboundLink href={offVocalUrl}>
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
      accessorFn: (cell) => cell.vocal.split(", ").join("・"),
      minSize: 75,
    },
    {
      header: "原曲",
      Cell: ({ cell }) => (
        <Box sx={{ whiteSpace: "pre-wrap" }}>
          {cell.row.original.origin.split(", ").join("\n")}
        </Box>
      ),
      minSize: 100,
    },
    {
      header: "歌詞",
      Cell: ({ cell }) => {
        const { showLyrics, lyrics, number } = cell.row.original;
        return (
          <>
            {showLyrics && lyrics && (
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
      accessorFn: (cell) => cell.tag,
    },
  ];

  const table = useMaterialReactTable({
    columns,
    data: musicList.filter((m) => m.showAtList)
                   .sort((a, b) => b.number - a.number),
    enablePagination: false,
    enableColumnActions: false,
    muiTableBodyRowProps: { hover: false },
    muiTableBodyCellProps: (props) => ({
      style: {
        backgroundColor: getBgColor(props.row.original.tag.split(", ")),
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
      <LyricsModal
        open={showLyrics > 0}
        onClose={() => setShowLyrics(-1)}
        lyrics={lyrics}
        title={lyricsTitle}
        number={showLyrics}
      />
    </Grid>
  );
}

const LyricsModal = ({
  open,
  onClose,
  lyrics,
  title,
  number,
}: {
  open: boolean,
  onClose: (b: boolean) => void,
  lyrics: string,
  title: string,
  number: number,
}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <Grid container spacing={2} sx={{ p: 3, whiteSpace: "pre-wrap" }}>
        <Grid size={12}>
          <Typography variant="h5" sx={{ ml: 2 }}>
            {title}
          </Typography>
        </Grid>
        <a href={`${BASE_PATH}/lyrics?n=${number}`}>
          <Button size="small" variant="text">⇒ページとして表示</Button>
        </a>
        <Lyrics lyrics={lyrics} />
      </Grid>
    </Dialog>
  );
};