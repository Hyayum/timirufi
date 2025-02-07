import {
  Avatar,
  Box,
  Button,
  Grid2 as Grid,
  Typography
} from "@mui/material";
import { YouTube, X, ArrowForward } from "@mui/icons-material";
import OutboundLink from "@/component/OutboundLink";
import { Niconico } from "@/component/icons";
import { GUIDELINE_URL, ICON_URL } from "@/config/config";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();
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
      <Grid container spacing={5} sx={{ m: 5, mb: 10, minWidth: 750 }}>
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

