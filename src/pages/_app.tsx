import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import Head from "next/head";
import { useState, useTransition } from "react";
import {
  createTheme,
  ThemeProvider,
  Backdrop,
  Box,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { ChevronLeft, Menu } from "@mui/icons-material";
import { MusicListProvider } from "@/hook/useMusicList";
import { platforms } from "@/config/menu";
import OutboundLink from "@/component/OutboundLink";

const theme = createTheme({
  typography: {
    button: {
      textTransform: "none",
    },
    h5: {
      "&::before": {
        content: '""',
        backgroundColor: "#d6a2f8",
        position: "relative",
        top: 21,
        left: -18,
        width: 12,
        height: 12,
        display: "block",
        transform: "rotate(45deg)",
      },
    },
    h6: {
      "::before": {
        content: '""',
        backgroundColor: "#84aaf8",
        position: "relative",
        top: 21,
        left: -18,
        width: 10,
        height: 10,
        borderRadius: 5,
        display: "block",
      },
    },
  },
  components: {
    MuiCheckbox: {
      styleOverrides: {
        root: {
          padding: 4,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          backgroundColor: "#fff",
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: 35,
        },
      },
    },
  },
});

const menuLinks = [
  { name: "TOP", path: "/", desc: "" },
  { name: "楽曲使用のガイドライン", path: "/guideline", desc: "楽曲を使用する時はここを確認" },
  { name: "楽曲リスト", path: "/list", desc: "今まで作ってきた曲リスト" },
  { name: "てぃみらりー", path: "/timillery", desc: "BGMとして使えそうな曲" },
  { name: "ペユドチ生成機", path: "/tools/peyudochi", desc: "だれでもペユドチができるツール (文字ごとに確率を設定してランダムに文字列を生成できるツール)" },
  { name: "#てぃみ式 コードエディタ", path: "/tools/chord_editor", desc: "独自の音楽理論「#てぃみ式」を基にコードの情報を入力して再生したり解析したりできるツール" },
];

const outboundLinks = [
  { name: "つぃみぐの", url: "https://hyayum.github.io/tsimiguno/", desc: "機械学習を利用して効率的にペユドチできるようにしたツール" },
];

const Layout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleClickLink = (path: string) => {
    setDrawerOpen(false);
    startTransition(() => {
      router.push(path);
    });
  };

  return (
    <Box>
      <IconButton
        size="large"
        sx={{ position: "fixed", top: 10, left: 10, bgcolor: "#bbb5", zIndex: 1000 }}
        onClick={(e) => setDrawerOpen(true)}
      >
        <Menu />
      </IconButton>
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} PaperProps={{ sx: { maxWidth: 300 } }}>
        <Box sx={{ p: 1, display: "flex", justifyContent: "right" }}>
          <IconButton onClick={() => setDrawerOpen(false)}>
            <ChevronLeft />
          </IconButton>
        </Box>
        <List>
          {menuLinks.map((link) => (
            <ListItemText
              primary={link.name}
              secondary={link.desc}
              slotProps={{ secondary: { fontSize: 12, color: "#999" } }}
              key={link.path}
              onClick={() => handleClickLink(link.path)}
              sx={{
                cursor: "pointer",
                m: 0,
                px: 2,
                py: 1,
                bgcolor: router.pathname == link.path ? "#f0f0f0" : "#fff",
                "&:hover": { bgcolor: "#e0e0e0" },
              }}
            /> 
          ))}
          {outboundLinks.map((link) => (
            <OutboundLink href={link.url} key={link.url}>
              <ListItemText
                primary={link.name}
                secondary={link.desc}
                slotProps={{ secondary: { fontSize: 12, color: "#999" } }}
                sx={{
                  cursor: "pointer",
                  m: 0,
                  px: 2,
                  py: 1,
                  "&:hover": { bgcolor: "#e0e0e0" },
                }}
              />
            </OutboundLink>
          ))}
        </List>
        <Divider />
        <List>
          {platforms.map((link) => (
            <OutboundLink href={link.url} key={link.url}>
              <ListItemButton
                sx={{
                  cursor: "pointer",
                  px: 2,
                  "&:hover": { bgcolor: "#e0e0e0" },
                }}
              >
                <ListItemIcon>{link.icon}</ListItemIcon>
                <ListItemText primary={link.label} />
              </ListItemButton>
            </OutboundLink>
          ))}
        </List>
      </Drawer>
      <Box>
        {children}
      </Box>
      <Backdrop open={isPending}>
        <CircularProgress sx={{ color: "white" }} />
      </Backdrop>
    </Box>
  );
};

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider theme={theme}>
      <MusicListProvider>
        <Head>
          <title>てぃみ*れの / みるふぃ</title>
          <link rel="icon" href="/timirufi/favicon.ico" />
        </Head>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </MusicListProvider>
    </ThemeProvider>
  );
}
