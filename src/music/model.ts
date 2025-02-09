export type MusicDbData = {
  number: number;
  origin: string;   // string[] -> .join(", ")
  title: string;
  titlePronounce: string;
  vocal: string;    // string[] -> .join(", ")
  niconicoUrl: string;
  commonsUrl: string;
  youtubeUrl: string;
  // soundCloudUrl: string;
  // piaproUrl: string;
  offVocalUrl: string;
  // tiktokUrl: string;
  bpm: string;
  length: string;
  createdAt: string;  // yyyy.MM○
  uploadedAt: string; // yyyy.MM.dd
  tag: string;   // string[] -> .join(", ")   
  showTrial: boolean;
  showAtList: boolean;
  showAtMq: boolean;
  showAtTm: boolean;
  showLyrics: boolean;
  mqDescription: string;
  tmDescription: string;
  lyrics: string;
};

export const defaultMusicDbData: MusicDbData = {
  number: 0,
  origin: "",
  title: "",
  titlePronounce: "",
  vocal: "",
  niconicoUrl: "",
  commonsUrl: "",
  youtubeUrl: "",
  offVocalUrl: "",
  bpm: "",
  length: "",
  createdAt: "",
  uploadedAt: "",
  tag: "",
  showTrial: false,
  showAtList: false,
  showAtMq: false,
  showAtTm: false,
  showLyrics: false,
  mqDescription: "",
  tmDescription: "",
  lyrics: "",
};

export type MusicPostData = MusicDbData & {
  where: number | "new";
  token: string;
};