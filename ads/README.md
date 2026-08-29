# Meta ad creatives

4:5 (1080×1350) creatives for the Mexico and Brazil campaigns, rendered from the brand
system and the client's own event photography — no stock, no Canva round-trip.

## Rebuilding

```bash
python3 ads/build.py          # reads ads/creatives.json -> ads/creatives/*.png
```

`ads/creatives.json` is a list of objects:

| key | meaning |
| --- | --- |
| `market` | `MX` or `BR` |
| `n` | order in the set, used in the filename |
| `id` | short kebab id, e.g. `free-trip` |
| `variant` | `a` photo + dark gradient · `b` photo over a yellow panel · `c` dark editorial with a framed photo |
| `photo` | `group`, `mascot`, `auditorium`, `winners`, `exam`, `london`, `certificates`, `corridor` |
| `badge` | small eyebrow chip |
| `headline` | the big line — wrap a phrase in `\|pipes\|` to paint it yellow |
| `subhead` | supporting line |
| `proof` | credibility chip |
| `cta` | button text |

Three variants exist so a set of five does not read as one ad shown five times, which is
what makes Meta's delivery collapse onto a single creative.

Rendering is done by headless Chrome at exactly 1080×1350 with Poppins embedded, so output
is byte-stable and needs no network.
