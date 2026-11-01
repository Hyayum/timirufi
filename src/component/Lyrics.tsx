import { useState } from "react";
import {
  Grid2 as Grid,
  Typography,
  Dialog,
  Checkbox,
  FormGroup,
  FormControlLabel,
} from "@mui/material";

export default function Lyrics({ lyrics }: { lyrics: string }) {
  const [show, setShow] = useState<{ [k: string]: boolean }>({
    mk: true,
    vc: true,
    rb: true
  });
  const lyricsParts = lyrics.split(/(\/\-.+?\-\-[\s\S]+?\-\/)/);
  const tagExists = (tag: string) => {
    const regex = new RegExp(`\\/\\-${tag}\\-\\-([\\s\\S]*?)\\-\\/`)
    return lyricsParts.some(p => p.match(regex));
  };
  return (
    <Grid container spacing={2}>
      <Grid size={12}>
        {tagExists("mk") && (
          <FormGroup>
            <FormControlLabel
              control={<Checkbox checked={show.mk} onClick={() => setShow({ ...show, mk: !show.mk })} />}
              label="マーカー(【Aメロ】など)を表示"
            />
          </FormGroup>
        )}
        {tagExists("vc") && (
          <FormGroup>
            <FormControlLabel
              control={<Checkbox checked={show.vc} onClick={() => setShow({ ...show, vc: !show.vc })} />}
              label="パート分け(●◆など)を表示"
            />
          </FormGroup>
        )}
        {tagExists("rb") && (
          <FormGroup>
            <FormControlLabel
              control={<Checkbox checked={show.rb} onClick={() => setShow({ ...show, rb: !show.rb })} />}
              label="ルビを表示"
            />
          </FormGroup>
        )}
      </Grid>
      <Grid size={12} sx={{ whiteSpace: "pre-wrap" }}>
        {lyricsParts.map((part, i) => {
          const match = part.match(/\/\-(.*?)\-\-([\s\S]*?)\-\//);
          let flag = true;
          let style = {};
          let text = match?.[2] || part;
          if (match && match[1] == "mk") {
            flag = show.mk;
            text = "\n" + text;
          } else if (match && match[1] == "rb") {
            flag = show.rb;
            style = { fontSize: 11 };
          } else if (match && match[1] == "wh") {
            style = { color: "#fffff0" }
          } else if (match) {
            flag = show[match[1]];
          }
          return flag && (<span style={style} key={i}>{text}</span>);
        })}
      </Grid>
    </Grid>
  );
}