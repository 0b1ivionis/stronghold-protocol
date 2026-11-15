# Stronghold Protocol — Covenants & Operators

Live: **https://0b1ivionis.github.io/stronghold-protocol/**

A fan-made cheat sheet for **Arknights: Stronghold Protocol** (November 2026, "Thanks Celebration" Part 2), built as a static multi-page site. No build step needed to view it — open `index.html`, or serve the folder with any static server.

## Pages

- `index.html` — 10 core covenants (炎 / 萨尔贡 / 维多利亚 / 谢拉格 / 阿戈尔 / 叙拉古 / 卡西米尔 / 乌萨斯 / 伊比利亚 / 莱泰尼亚) with effects, activation rules and 6-operator bonuses
- `extra.html` — 16 extra covenants
- `ops.html` — all 143 operators by tier, with portraits, covenant tags, traits and trigger timing; search and filters (covenant / timing / tier)
- `notes.html` — quick mechanics notes
- `op.html?name=<operator>` — operator page: normal/elite trait split, quick facts, recommended 6-operator lineups, every covenant effect
- `cov.html?name=<covenant>` — covenant page: full effect text, activation, members grouped by tier

## Features

- **Normal / elite trait split** — the slash pair in the source text is expanded into two blocks; the raw line is kept under a disclosure for reference
- **Recommended lineups** — for each core covenant an operator belongs to, a 6-operator team including that operator, with three variants (all tiers / low-tier first / high-tier first)
- **Filters** — by covenant, trigger timing and tier; filter state is kept in the URL so links can be shared
- **Progressive list** — the operator list renders 60 rows at a time and loads more on scroll
- **Lightweight assets** — portraits are 128 px WebP files loaded lazily, so a page loads only the images it shows

## Data

Operator and covenant data was compiled from the [PRTS wiki](https://prts.wiki/w/卫戍协议·规程/PRTS盟约记录) (2026-11 season). Portraits are PRTS avatar images, downscaled to 128 px WebP.

## Notes

Unofficial fan project. Arknights and its assets © Hypergryph / Studio Montagne. Game text remains the property of its owners.
