# SongGraveyard 🎧🪦

> **Give every unfinished music idea a second life.**

📖 [中文版 README](README.zh-CN.md)

SongGraveyard is an AI music tool that turns your abandoned musical **motifs** —
hums, riffs, lyric fragments, voice memos, demos — into a living graveyard you can
browse, connect, and bring back to life.

Every creator has a graveyard of unfinished ideas. SongGraveyard gives each one a
resting place, links it to your other fragments, and uses **ACE-Step 1.5** to
resurrect it into something new.

> **How it differs from Suno:** Suno generates songs from a text prompt.
> SongGraveyard starts from *your own discarded material* — archiving, connecting
> and reviving it, so your scattered sparks slowly accumulate into a creative
> asset you can grow into an EP or concept album.

## ✨ What it does

- **Capture / Bury** — Upload a hum, riff or lyric with a photo, a note, mood &
  place. The system auto-writes a title and an *epitaph*, and lays it to rest as a
  node in your graveyard.
- **The Graveyard** — An Obsidian-style graph of your motifs. Fragments that share
  a mood, place or project (or were remixed together) are linked; nodes you nurture
  grow larger.
- **Bring it back** — Open any motif and choose how to revive it:
  - **Resurrect** → grow the fragment into a full demo (faithful continuation)
  - **Grow** → let it bloom into a complete, fully-arranged piece
  - **Ghost** → a short, fragile, reverb-drenched echo of the original
  - **Remix** → fuse two or more motifs into something new
- **Compare & keep** — Listen to the original next to every generated version,
  download or save the ones you love.

## 🎧 The vibe

Dark, poetic, dreamy — a *digital graveyard for music memories*, not a horror
house. Deep blue-black night, ghost-blue and moss glows, warm light on the ideas
worth reviving.

## 📚 Documentation

- **Product spec** — [`docs/PRD.md`](docs/PRD.md)
- **Engineering design & getting started** — [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md)
- **Roadmap & frozen API contract** — [`docs/PROGRESS.md`](docs/PROGRESS.md)

## 🛠️ Built with

Next.js · FastAPI · SQLite · **ACE-Step 1.5** (open-source, MIT, commercial-friendly)

## License

MIT — see [`LICENSE`](LICENSE). The audio engine, ACE-Step 1.5, is also MIT and
commercially usable.
