import { SOUND_URL } from "@/config/config";

export const getSoundUrl = (num: number, dir: string) => {
  const filename = num.toString().padStart(3, "0").replace(".", "_");
  return `${SOUND_URL}/${dir}/${filename}.mp3`;
};