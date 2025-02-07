import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import Head from "next/head";
import { useState } from "react";
import {
  createTheme,
  ThemeProvider,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemText,
} from "@mui/material";
import { ChevronLeft, Menu } from "@mui/icons-material";
import { MusicListProvider } from "@/hook/useMusicList";

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
  },
});

const menuLinks = [
  { name: "TOP", path: "/", desc: "" },
  { name: "楽曲リスト", path: "/list", desc: "今まで作ってきた曲リスト" },
  { name: "てぃみらりー", path: "/timillery", desc: "BGMとして使えそうな曲" },
  { name: "ペユドチ生成機", path: "/tools/peyudochi", desc: "だれでもペユドチができるツール (文字ごとに確率を設定してランダムに文字列を生成できるツール)" },
  { name: "#てぃみ式 コードエディタ", path: "/tools/chord_editor", desc: "独自の音楽理論「#てぃみ式」を基にコードの情報を入力して再生したり解析したりできるツール" },
];

const Layout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleClickLink = (path: string) => {
    setDrawerOpen(false);
    router.push(path);
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
        {menuLinks.map((link) => (
          <List
            key={link.path}
            onClick={() => handleClickLink(link.path)}
            sx={{
              cursor: "pointer",
              px: 2,
              bgcolor: router.pathname == link.path ? "#f0f0f0" : "#fff",
              "&:hover": { bgcolor: "#e0e0e0" },
            }}
          >
            <ListItemText primary={link.name} secondary={link.desc} slotProps={{ secondary: { fontSize: 12, color: "#999" } }} />
          </List>
        ))}
      </Drawer>
      <Box>
        {children}
      </Box>
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
