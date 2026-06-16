# Prompt 模板

LLM 把用户选的「风格 / 配器 / 情绪」按钮 + 自由文字,拼成下面这类 caption 再喂 ACE-Step。

## 选项词表
- 风格:Indie Pop / City Pop / Lo-fi / Electronic / Cinematic / Rock / R&B / Ambient / Post-rock / Full Band
- 配器:Piano / Guitar / Synth / Strings / Drums / Bass / Full Arrangement
- 情绪:Hopeful / Nostalgic / Dark / Dreamy / Energetic / Intimate / Melancholic / Lonely

## Ghost(次,cover 低 strength,纯氛围回声)
`ghostly ambient reinterpretation, fragile, distant, reverb-heavy, dreamy, emotional and unfinished, preserving the original mood`

## Resurrect(主,complete 续写)
模板:`Revive this unfinished idea into a {style} {instrumental? "instrumental"} demo, keeping the emotional core, adding {instruments}, {mood} atmosphere`
示例(City Pop):`nostalgic city pop, warm electric piano, smooth bassline, soft drums, night city atmosphere`
示例(Post-rock 纯器乐):`post-rock instrumental, melancholic and lonely, fingerpicked guitar intro, slow emotional build, layered reverb electric guitars, swelling crescendo, no vocals`

## Grow into full piece(主,text2music + ref_audio)
同上风格描述,但作为完整曲式规划的引导;`ref_audio` 传动机,`audio_cover_strength≈0.3`。

## Remix(主,先拼/混 A+B 再 complete/text2music)
`fuse these unfinished ideas into one coherent piece, combining the melodic quality of the first with the rhythmic texture of the second, {mood}`

## 纯音乐 / 人声
- 纯器乐:`lyrics` 留空 + prompt 加 `instrumental only, no vocals`
- 带人声:`lyrics` 填词,`vocal_language` 设语言(en/zh/...)
