import {
  Avatar,
  Box,
  Button,
  Grid2 as Grid,
  Typography
} from "@mui/material";
import { ArrowForward } from "@mui/icons-material";
import OutboundLink from "@/component/OutboundLink";
import { ICON_URL } from "@/config/config";
import { platforms } from "@/config/menu";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();

  const profile = `ボカロ曲、東方アレンジ、インストオリジナル曲を作ってます。
  ペユドチな曲を作ってます。
  動画・イラスト等もほとんど自分で作っています。
  依頼は受け付けていません。
  楽曲は基本的に自由に使っていいことになっていますが一応下のガイドラインを確認しておいてください。`;

  const topSongUrls = [
    { url: "https://www.youtube.com/embed/1HKPSUHxAaU", desc: "明るいボカロ曲1" },
    { url: "https://www.youtube.com/embed/I2BG-iv_cSs", desc: "明るいボカロ曲2" },
    { url: "https://www.youtube.com/embed/-wCyuesn_qU", desc: "かわいいボカロ曲" },
    { url: "https://www.youtube.com/embed/h3AyHy71MHs", desc: "ペユドチ" },
    { url: "https://www.youtube.com/embed/IiytA5GeXQQ", desc: "ネタ曲" },
    { url: "https://www.youtube.com/embed/MmawkU8f710", desc: "たのしいインスト曲" },
    { url: "https://www.youtube.com/embed/5F51itLv2sU", desc: "BGMっぽい曲" },
    { url: "https://www.youtube.com/embed/9SFArfJn-7s", desc: "東方アレンジ" },
  ];

  return (
    <Box>
      <Grid container spacing={5} sx={{ p: 5, pb: 10, minWidth: 800 }}>
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
          <Button variant="text" onClick={() => router.push("/guideline")}>
            楽曲使用のガイドライン
          </Button>
        </Grid>

        <Grid size="grow">
          <Typography variant="h5">
            Links
          </Typography>
          {platforms.map((link) => (
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
        <Grid container spacing={3} size={12}>
          <Grid size={12}>
            <Typography variant="h5">
              こんな曲作ってます
            </Typography>
          </Grid>
          {topSongUrls.map((song) => (
            <Grid key={song.url} size={{ xs: 6, lg: 4 }}>
              <Typography variant="body1">
                {song.desc}
              </Typography>
              <iframe
                src={song.url}
                width={352}
                height={198}
                allow="accelerometer;  autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture;"
                allowFullScreen
                style={{ border: "none" }}
              />
            </Grid>
          ))}
          <Grid size={12}>
            <Button
              variant="text"
              size="large"
              onClick={() => router.push("/list")}
              startIcon={<ArrowForward />}
            >
              もっと見る (一覧へ)
            </Button>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}

