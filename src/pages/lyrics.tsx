import { useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Grid2 as Grid,
  Typography,
} from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import { useMusicList } from "@/hook/useMusicList";
import Lyrics from "@/component/Lyrics";

export default function LyricsPage() {
  const { musicList, loading } = useMusicList();
  const router = useRouter();
  const searchParams = useSearchParams();
  const filteredMusicList = musicList.filter((m) => m.showLyrics).sort((a, b) => b.number - a.number);
  const musicNumber = searchParams.get("n");
  const isValidNumber = !!(musicNumber && !Number.isNaN(Number(musicNumber)) && filteredMusicList.some((m) => m.number == Number(musicNumber)));
  const showingMusicList = isValidNumber ? [filteredMusicList.find((m) => m.number == Number(musicNumber))!] : filteredMusicList;

  const ExtLink = ({ url, text }: { url: string, text: string }) => (
    <a
      href={url}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        window.open(url, "_blank", "noopener,noreferrer");
      }}
      style={{ textDecoration: "none", padding: 4 }}
    >
      <Typography color="primary" variant="subtitle1">
        {text}
      </Typography>
    </a>
  );

  return (
    <Grid container spacing={5} sx={{ p: 5, pb: 10, minWidth: 800 }}>
      <Grid container spacing={2}>
        <Grid size={12}>
          <Typography variant="h4">歌詞</Typography>
        </Grid>
        {loading ? (
          <Typography sx={{ color: "#888" }}>Loading...</Typography>
        ) : (
          <>
            {isValidNumber && <Button onClick={() => router.push(`/lyrics`)}>全ての曲を表示</Button>}
            {showingMusicList.map((m) => {
              const youtubeId = m.youtubeUrl.split("/").pop();
              const thumbnailUrl = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg` : "";
              return (
                <Accordion key={m.number} sx={{ width: "100%" }} defaultExpanded={isValidNumber}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Grid size={12} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      {thumbnailUrl ? (
                        <img
                          src={thumbnailUrl}
                          alt={m.title}
                          loading="lazy"
                          width={100}
                        />
                      ) : (
                        <div style={{ width: 100 }}></div>
                      )}
                      <Box>
                        <Typography variant="h5" sx={{ pl: 2 }}>
                          {m.title}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 2 }}>
                          {m.niconicoUrl && (
                            <ExtLink url={m.niconicoUrl} text="ニコニコ" />
                          )}
                          {m.youtubeUrl && (
                            <ExtLink url={m.youtubeUrl} text="YouTube" />
                          )}
                        </Box>
                      </Box>
                    </Grid>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Lyrics lyrics={m.lyrics} />
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </>
        )}
      </Grid>
    </Grid>
  );
}