import { createContext, useContext, useState, useEffect } from "react";
import { MusicListData } from "@/music/model";
import { API_URL } from "@/config/config";

type Context = {
  musicList: MusicListData[];
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
  const [musicList, setMusicList] = useState<MusicListData[]>([]);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    fetchData();
  }, []);

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