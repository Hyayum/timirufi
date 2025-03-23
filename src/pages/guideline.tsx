import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Grid2 as Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import {
  Block,
  Check,
  CheckCircle,
  Edit,
  ExpandMore,
  Mood,
  Warning,
} from "@mui/icons-material";

export default function Guideline() {
  const ruleType = {
    ok: 0,
    warn: 1,
    prohibit: 2,
    require: 3,
    glad: 4,
  }

  const cases = [
    {
      title: "個人の範囲での使用",
      caseExamples: [
        "外部に公開せず自分だけで使用する場合",
        "特定範囲内にのみ公開する場合",
      ],
      rules: [
        { type: ruleType.prohibit, rule: "故意に楽曲について虚偽の情報を示すこと（自作発言等）は禁止。" },
        { type: ruleType.ok, rule: "用途にかかわらず自由に使用OK。（許可不要）" },
      ],
    },
    {
      title: "作品への補助的使用",
      caseExamples: [
        "BGMとして使用する場合など",
        "使用した楽曲を別の楽曲に置き換えても特に作品として致命的な影響がない場合",
      ],
      rules: [
        { type: ruleType.prohibit, rule: "故意に楽曲について虚偽の情報を示すこと（自作発言等）は禁止。" },
        { type: ruleType.ok, rule: "作品のジャンルにかかわらず自由に使用OK。（許可不要）" },
        { type: ruleType.ok, rule: "楽曲の改変（切り抜き・テンポの変更・Remix等）OK。" },
        { type: ruleType.ok, rule: "ここに書いてあることを守った上で作品の頒布・販売・収益化等してOK。" },
        { type: ruleType.warn, rule: "使用する楽曲が二次創作作品である場合（特に東方アレンジ）、元作品のガイドライン等にも留意すること。" },
        { type: ruleType.glad, rule: "使用した楽曲のクレジットを書いてくれるとうれしいです。" },
        { type: ruleType.glad, rule: "大きな改変をした場合、改変したということがわかるようにしてくれるとありがたいです。" },
      ],
    },
    {
      title: "二次創作的使用",
      caseExamples: [
        "楽曲をベースにして作品を作る場合",
        "歌みた、カバー、演奏、アレンジ、創作譜面、MAD、メドレーなど",
      ],
      rules: [
        { type: ruleType.prohibit, rule: "故意に楽曲について虚偽の情報を示すこと（自作発言等）は禁止。" },
        { type: ruleType.require, rule: "楽曲のクレジットを明記すること。" },
        { type: ruleType.ok, rule: "作品のジャンルにかかわらず自由に使用OK。（許可不要）" },
        { type: ruleType.ok, rule: "楽曲の改変（切り抜き・テンポの変更・Remix等）OK。" },
        { type: ruleType.ok, rule: "ここに書いてあることを守った上で作品の頒布・販売・収益化等してOK。" },
        { type: ruleType.warn, rule: "使用する楽曲が二次創作作品である場合（特に東方アレンジ）、元作品のガイドライン等にも留意すること。" },
        { type: ruleType.glad, rule: "大きな改変をした場合、改変したということがわかるようにしてくれるとありがたいです。" },
      ],
    },
    {
      title: "転載",
      caseExamples: [
        "元となる作品以外に創作性(作者オリジナルの要素)がない場合",
      ],
      rules: [
        { type: ruleType.prohibit, rule: "収益化禁止。" },
        { type: ruleType.prohibit, rule: "故意に楽曲について虚偽の情報を示すこと（自作発言等）は禁止。" },
        { type: ruleType.require, rule: "投稿するサイトが、作者が利用していないサイト、またはTwitterやSNSであること。（利用しているサイトはメニューにリンクがあります）" },
        { type: ruleType.require, rule: "転載元のクレジットを明記すること。" },
        { type: ruleType.require, rule: "ネット上で誰でも視聴できる形であること。（配布の形でないこと）" },
        { type: ruleType.require, rule: "転載であることがすぐにわかること。（ツイートの場合はタイトル・リンク・感想など(いずれか)を含めるだけなども可）" },
        { type: ruleType.warn, rule: "使用する楽曲が二次創作作品である場合（特に東方アレンジ）、元作品のガイドライン等にも留意すること。" },
        { type: ruleType.glad, rule: "クレジットに元楽曲(本人投稿)のリンクを含めることを推奨。" },
      ],
    },
  ];

  return (
    <Box>
      <Grid container spacing={2} sx={{ p: 5, pb: 10, minWidth: 800 }}>
        <Grid size={12}>
          <Typography variant="h4" sx={{ textAlign: "center" }}>
            楽曲使用のガイドライン
          </Typography>
        </Grid>
        <Grid size={12}>
          <Typography variant="h6">
            クレジットの書き方
          </Typography>
          <Typography variant="body1" sx={{ my: 1 }}>
            作者または作品を特定できる情報を何か1つ以上記載すること
          </Typography>
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
            例：作者名、曲名、動画URL(※本人投稿のもの)、てぃみらりーのURL など{"\n"}
            ※条件として「クレジットを明記すること」と書かれている場合のみ必須{"\n"}
            （「特定できる」といっても同じ作品名が～とかは気にしなくてOK）
          </Typography>
        </Grid>
        <Grid size={12}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            用途別ガイドライン
          </Typography>
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mb: 1 }}>
            用途別に分けています。{"\n"}
            旧HPにあったのと内容はほぼ同じですが、あまり使わなそうな部分は削除したり言い方をわかりやすくしたりしました。
          </Typography>
          {cases.map((c) => (
            <Accordion key={c.title}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Grid container spacing={1}>
                  <Grid size={12}>
                    <Typography variant="h5" sx={{ pl: 2 }}>
                      {c.title}
                    </Typography>
                  </Grid>
                  <Grid size={12}>
                    <List>
                      {c.caseExamples.map((ex, i) => (
                        <ListItem key={"example" + i} sx={{ py: 0 }}>
                          <ListItemIcon><Check /></ListItemIcon>
                          <ListItemText primary={ex} />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                </Grid>
              </AccordionSummary>
              <AccordionDetails>
                <List sx={{ py: 0 }}>
                  {c.rules.map((rule, i) => (
                    <ListItem key={"rule" + i} sx={{ py: 0 }}>
                      <ListItemIcon>
                        {
                          rule.type == ruleType.ok ? (<CheckCircle />) :
                          rule.type == ruleType.warn ? (<Warning />) :
                          rule.type == ruleType.prohibit ? (<Block />) :
                          rule.type == ruleType.require ? (<Edit />) :
                          rule.type == ruleType.glad ? (<Mood />) : (<></>)
                        }
                      </ListItemIcon>
                      <ListItemText primary={rule.rule} />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          ))}
        </Grid>
        <Grid size={12}>
          <Typography variant="h6">
            変更履歴
          </Typography>
          <List>
            <ListItemText primary="2025.03.24 旧HPから移行ついでに構造を大幅変更（内容には大きな変更点なし）" />
          </List>
        </Grid>
      </Grid>
    </Box>
  );
}

