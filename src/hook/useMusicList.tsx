import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/router";
import { MusicDbData } from "@/music/model";
import { API_URL } from "@/config/config";

type Context = {
  musicList: MusicDbData[];
  loading: boolean;
  reload: () => void;
};

const defaultContext: Context = {
  musicList: [],
  loading: false,
  reload: () => {},
};

const MusicListContext = createContext(defaultContext);

export const MusicListProvider = ({ children }: { children: React.ReactNode }) => {
  const [musicList, setMusicList] = useState<MusicDbData[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_URL, { cache: "no-cache" });
      const data = await response.json();
      setMusicList(data);
    } catch (e) {
      console.log(e);
    }
    setLoading(false);
  };

  const usedPages = ["/list", "/timillery", "/lyrics"];

  useEffect(() => {
    if (router.isReady && usedPages.includes(router.pathname)) {
      fetchData();
    }
  }, [router.isReady && router.pathname]);

  return (
    <MusicListContext.Provider value={{ musicList, loading, reload: fetchData }}>
      {children}
    </MusicListContext.Provider>
  );
};

export const useMusicList = () => {
  const context = useContext(MusicListContext);
  return context;
};