export type MusicListData = {
  number: number;
  origin: string[];
  title: string;
  titlePronounce: string;
  vocal: string[];
  url: {
    niconico: string;
    commons: string;
    youtube: string;
    offvocal: string;
  };
  bpm: string;
  length: string;
  createdAt: string;
  uploadedAt: string;
  tag: string[];
  show: {
    trial: boolean;
    lyrics: boolean;
    list: boolean;
    mq: boolean;
    timillery: boolean;
  };
  lyrics: string;
  description: {
    mq: string;
    timillery: string;
  },
};

export type MusicDbData = {
  number: number;
  numberDecimal: number;
  origin: string;   // string[] -> .join("　")
  title: string;
  titlePronounce: string;
  vocal: string;    // string[] -> .join("　")
  niconicoUrl: string;
  commonsUrl: string;
  youtubeUrl: string;
  soundCloudUrl: string;
  // piaproUrl: string;
  offVocalUrl: string;
  // tiktokUrl: string;
  bpm: string;
  length: string;
  createdAt: string;  // yyyy.MM○
  uploadedAt: string; // yyyy.MM.dd
  typeCode: string;   
  // explanation: string;
  showTrial: number;  // boolean -> 0,1
  showAtList: number;
  showAtMq: number;
  showAtTm: number;
  showLyrics: number;
  mqDescription: string;
  tmDescription: string;
  lyrics: string;
};

export const defaultMusicDbData: MusicDbData = {
  number: 0,
  numberDecimal: 0,
  origin: "",
  title: "",
  titlePronounce: "",
  vocal: "",
  niconicoUrl: "",
  commonsUrl: "",
  youtubeUrl: "",
  soundCloudUrl: "",
  offVocalUrl: "",
  bpm: "",
  length: "",
  createdAt: "",
  uploadedAt: "",
  typeCode: "",
  showTrial: 0,
  showAtList: 0,
  showAtMq: 0,
  showAtTm: 0,
  showLyrics: 0,
  mqDescription: "",
  tmDescription: "",
  lyrics: "",
};

export type MusicPostData = MusicDbData & {
  where: {
    number: number | "new";
    decimal: number;
  };
  token: string;
};