# makefun-cooking-game

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/phothan26/makefun-cooking-game/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/phothan26/makefun-cooking-game/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

WARUNG RASA — Midnight Kitchen Rush: a complete, original cooking game that plays offline in a desktop browser from its own files. You run a late-night Indonesian street-food warung: customers pin orders to the board, you grab ingredients from the counter, cook them at the wok, grill, pot or glass, assemble dishes on plates, and serve before patience runs out. Four dishes (Nasi Goreng, Sate Ayam, Mie Ayam, Es Teh), a 3-minute shift, rising rush, combos and tips for fast service.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. No network request, no build step — the game is plain static files under `game/`.

## How to play

- Click an ingredient bin (or press 1–8) to pick it up.
- Click a station (Wok, Grill, Panci, Gelas) to cook it; click again when it is done.
- Click a plate to add the food. Cabai goes straight on the plate, raw.
- When a plate matches a recipe it glows SIAP SAJI — click the matching order ticket to serve.
- Serve fast for bigger tips; food left too long on a station burns. M mutes, Esc drops what you carry.

## Files

- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to the output and writes `dossier.json`.
- `game/` — the playable game: `index.html` plus `src/` (data, state, cook, render, input, audio, shots, main).
- `screenshots/` — 4 real renders of the game, staged from the live rules with `?shot=cover|rush|serve|results`.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.

---

<sub>Entered on [make.fun](https://make.fun/?ref=t7e39kme&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
