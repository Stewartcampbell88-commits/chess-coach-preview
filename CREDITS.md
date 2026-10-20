# Credits and licences

Chess - Teacher bundles a few third-party pieces of work. Everything else (code, layout, icons, the coach avatar, sounds) was written for this app.

None of the app's art or sound comes from Chess.com. It uses no Chess.com logos, wordmarks, piece sets or sound files. The look is only *inspired by* the general style of mobile chess apps (dark theme, green board).

| What | Where | Author | Licence |
|---|---|---|---|
| Chess piece images ("cburnett" set) | `assets/pieces/cburnett/*.svg` | [Colin M.L. Burnett](https://en.wikipedia.org/wiki/User:Cburnett); files taken unmodified from the [Lichess](https://github.com/lichess-org/lila/tree/master/public/piece/cburnett) repository | GPLv2 or later ([full text](assets/pieces/cburnett/COPYING-GPL-2.0.txt)). Licence as listed in Lichess's `COPYING.md`. |
| chess.js 1.4.0 (move rules for legal-move dots and drag validation) | `js/vendor/chess.js` (ESM build, unmodified except the source-map comment was removed) | Jeff Hlywa and contributors, https://github.com/jhlywa/chess.js | BSD-2-Clause ([licence](assets/licenses/chess.js-LICENSE.txt)) |
| chess.js 1.4.0 (dev-only puzzle validator) | `tools/` (installed by npm, not served to the app) | as above | BSD-2-Clause |
| Stockfish 19 (npm `stockfish` 19.0.1, lite single-threaded WASM build) — dev-only, checks World 3 puzzles | `tools/` (installed by npm, never served to the app or bundled) | The Stockfish developers, https://stockfishchess.org; JS/WASM port by Nathan Rugg | GPL-3.0 |
| Lichess tablebase API (dev-only, checks endgame warm-ups) | queried by `tools/tablebase.mjs`; answers cached in `tools/cache/tablebase.json` | lichess.org, https://tablebase.lichess.ovh (Syzygy tables) | free public API |
| Puzzle positions (many World 2–3 puzzles; each has a `source: "lichess:<id>"` field) | `js/data/puzzles-w2.js`, `js/data/puzzles-w3.js` | Lichess open puzzle database, https://database.lichess.org | CC0 (public domain). Explanations and answer trees were rewritten/re-checked for this app. |

## Made for this app (no third-party licence)

- **Icons** (`js/ui/icons.js`): simple inline SVG shapes.
- **Coach avatar** (`js/ui/icons.js`, `COACH_AVATAR`): an original drawing of a round-headed pawn with glasses. It isn't based on any company's mascot.
- **Sounds** (`js/ui/sound.js`): made live with the Web Audio API (noise "knocks" and short tones). No audio files are bundled.
- **Board colours**: plain colour values (`#ebecd0` / `#739552`). Colours aren't copyrightable assets.

## Notes on the GPL piece set

The cburnett SVGs are distributed here under GPLv2+, alongside the licence text. If you redistribute the app, keep `assets/pieces/cburnett/` and `COPYING-GPL-2.0.txt` together, along with this credit. The GPL applies to those image files. A permissively licensed set (for example Apache-2.0 "chessnut") is a drop-in swap if a non-copyleft set is ever needed: change `PIECE_DIR` in `js/ui/board-markup.js`.
