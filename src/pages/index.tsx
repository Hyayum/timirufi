import {
  Avatar,
  Box,
  Button,
  Grid2 as Grid,
  Typography
} from "@mui/material";
import { ArrowForward, CheckCircle, List, MusicNote, SentimentSatisfiedAlt } from "@mui/icons-material";
import OutboundLink from "@/component/OutboundLink";
import { BASE_PATH, ICON_URL } from "@/config/config";
import { platforms } from "@/config/menu";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();

  const profile = `主なジャンル：ボカロ曲、東方アレンジ、インストオリジナル曲 など
主な曲調：明るめ、かわいめ、4536多め、ペユドチ など
　
動画・イラスト等もほとんど自分で作っています。
依頼は受け付けていません。
楽曲の使用は基本的に自由です。一応下のガイドラインを確認しておいてください。`;

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

  const topMenu = [
    { label: "楽曲使用のガイドライン", url: "/guideline", icon: <CheckCircle /> },
    { label: "楽曲リスト", url: "/list", icon: <List /> },
    { label: "てぃみらりー（BGM置き場）", url: "/timillery", icon: <MusicNote /> },
    { label: "ペユドチ", url: "/tools/peyudochi", icon: <SentimentSatisfiedAlt /> },
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
            ↑かわいいアイコン（『サイエイキラリティ』の動画の絵）
          </Typography>
          {profile.split("\n").map((line, i) => (
            <Typography variant="body2" key={i}>
              {line}
            </Typography>
          ))}
          <a href={BASE_PATH + "/guideline"}>
            <Button variant="text">
              楽曲使用のガイドライン
            </Button>
          </a>
        </Grid>

        <Grid size="grow">
          <Typography variant="h5">
            Menu
          </Typography>
          {topMenu.map((menu) => (
            <Box key={menu.label}>
              <a href={BASE_PATH + menu.url}>
                <Button variant="text" startIcon={menu.icon}>
                  {menu.label}
                </Button>
              </a>
            </Box>
          ))}
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
            <a href={BASE_PATH + "/list"}>
              <Button
                variant="text"
                size="large"
                startIcon={<ArrowForward />}
              >
                もっと見る (一覧へ)
              </Button>
            </a>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}

