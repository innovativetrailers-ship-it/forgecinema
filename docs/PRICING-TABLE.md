# Pricing table

Generated from packages/core/src/pricing/falCosts.ts. Verified 2026-10-14.
Charge = ceil(fal USD × 1.5 / 0.0165). The floor is the lowest plan: Ultimate $99 / 6000 credits.
AUD column uses 1 USD = 1.4331 AUD on 2026-10-13 (Frankfurter).
A 5s, 10s, or 15s row uses the seconds fal actually bills when that length is shorter or snapped.

| Model | Asked | Billed | Fal USD | Credits | Ultimate margin | Studio margin | Pro margin | Below rule | Fal AUD |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| veo-3.1 | 5s | 6s | 1.2000 | 110 | 33.9% | 55.5% | 71.3% | no | 1.72 |
| veo-3.1 | 10s | 8s | 1.6000 | 146 | 33.6% | 55.3% | 71.2% | no | 2.29 |
| veo-3.1 | 15s | 8s | 1.6000 | 146 | 33.6% | 55.3% | 71.2% | no | 2.29 |
| kling-3.0 | 5s | 5s | 0.5600 | 51 | 33.5% | 55.2% | 71.1% | no | 0.80 |
| kling-3.0 | 10s | 10s | 1.1200 | 102 | 33.5% | 55.2% | 71.1% | no | 1.61 |
| kling-3.0 | 15s | 15s | 1.6800 | 153 | 33.5% | 55.2% | 71.1% | no | 2.41 |
| seedance-2.0 | 5s | 5s | 1.5170 | 138 | 33.4% | 55.1% | 71.1% | no | 2.17 |
| seedance-2.0 | 10s | 10s | 3.0340 | 276 | 33.4% | 55.1% | 71.1% | no | 4.35 |
| seedance-2.0 | 15s | 15s | 4.5510 | 414 | 33.4% | 55.1% | 71.1% | no | 6.52 |
| grok-imagine-video | 5s | 5s | 0.7000 | 64 | 33.7% | 55.4% | 71.2% | no | 1.00 |
| grok-imagine-video | 10s | 10s | 1.4000 | 128 | 33.7% | 55.4% | 71.2% | no | 2.01 |
| grok-imagine-video | 15s | 15s | 2.1000 | 191 | 33.4% | 55.1% | 71.1% | no | 3.01 |
| wan-2.7 | 5s | 5s | 0.5000 | 46 | 34.1% | 55.6% | 71.4% | no | 0.72 |
| wan-2.7 | 10s | 10s | 1.0000 | 91 | 33.4% | 55.1% | 71.1% | no | 1.43 |
| wan-2.7 | 15s | 15s | 1.5000 | 137 | 33.6% | 55.3% | 71.2% | no | 2.15 |
| ltx-2.3-fast | 5s | 6s | 0.3600 | 33 | 33.9% | 55.5% | 71.3% | no | 0.52 |
| ltx-2.3-fast | 10s | 10s | 0.6000 | 55 | 33.9% | 55.5% | 71.3% | no | 0.86 |
| ltx-2.3-fast | 15s | 16s | 0.9600 | 88 | 33.9% | 55.5% | 71.3% | no | 1.38 |
| gemini-omni | 5s | 5s | 0.5000 | 46 | 34.1% | 55.6% | 71.4% | no | 0.72 |
| gemini-omni | 10s | 10s | 1.0000 | 91 | 33.4% | 55.1% | 71.1% | no | 1.43 |
| gemini-omni | 15s | 10s | 1.0000 | 91 | 33.4% | 55.1% | 71.1% | no | 1.43 |
| pixverse-v5.6 | 5s | 5s | 0.4500 | 41 | 33.5% | 55.2% | 71.1% | no | 0.64 |
| pixverse-v5.6 | 10s | 10s | 0.9900 | 90 | 33.3% | 55.1% | 71.1% | no | 1.42 |
| pixverse-v5.6 | 15s | 10s | 0.9900 | 90 | 33.3% | 55.1% | 71.1% | no | 1.42 |
| wan-3.0 | 5s | 5s | 0.5000 | 46 | 34.1% | 55.6% | 71.4% | no | 0.72 |
| wan-3.0 | 10s | 10s | 1.0000 | 91 | 33.4% | 55.1% | 71.1% | no | 1.43 |
| wan-3.0 | 15s | 15s | 1.5000 | 137 | 33.6% | 55.3% | 71.2% | no | 2.15 |
| hailuo-02 | 5s | 6s | 0.4800 | 44 | 33.9% | 55.5% | 71.3% | no | 0.69 |
| hailuo-02 | 10s | 6s | 0.4800 | 44 | 33.9% | 55.5% | 71.3% | no | 0.69 |
| hailuo-02 | 15s | 6s | 0.4800 | 44 | 33.9% | 55.5% | 71.3% | no | 0.69 |
| happyhorse-1.0 | 5s | 5s | 1.4000 | 128 | 33.7% | 55.4% | 71.2% | no | 2.01 |
| happyhorse-1.0 | 10s | 10s | 2.8000 | 255 | 33.5% | 55.2% | 71.1% | no | 4.01 |
| happyhorse-1.0 | 15s | 15s | 4.2000 | 382 | 33.4% | 55.1% | 71.1% | no | 6.02 |

## What a credit balance buys

Counts are whole clips at a 5-second ask (billed length may be longer).

| Model | 50 trial | Pro 500 | Studio 2000 | Ultimate 6000 |
| --- | --- | --- | --- | --- |
| veo-3.1 | 0 | 4 | 18 | 54 |
| kling-3.0 | 0 | 9 | 39 | 117 |
| seedance-2.0 | 0 | 3 | 14 | 43 |
| grok-imagine-video | 0 | 7 | 31 | 93 |
| wan-2.7 | 1 | 10 | 43 | 130 |
| ltx-2.3-fast | 1 | 15 | 60 | 181 |
| gemini-omni | 1 | 10 | 43 | 130 |
| pixverse-v5.6 | 1 | 12 | 48 | 146 |
| wan-3.0 | 1 | 10 | 43 | 130 |
| hailuo-02 | 1 | 11 | 45 | 136 |
| happyhorse-1.0 | 0 | 3 | 15 | 46 |

The free trial is 50 credits and is unchanged. The dearest single clip those credits can start costs about $0.50 at fal. A signup cannot start a clip whose quote is above 50 credits.

## Rows with no fal price

- runway-gen4 (runway-gen4): Fal does not publish this endpoint. No usdPerSecond and no usdPerVideo, so it is not sellable.

## Notes from the model pages

- veo-3.1: 720p and 1080p are $0.20/s with audio off and $0.40/s with audio on. 4k is $0.40/s off and $0.60/s on. Forge sends audio off. Duration snaps to 4, 6, or 8 seconds. Source: https://fal.ai/models/fal-ai/veo3.1/llms.txt
- kling-3.0: Pro endpoint. Audio off $0.112/s, audio on $0.168/s, voice control $0.196/s. No resolution field. Forge sends audio off. Source: https://fal.ai/models/fal-ai/kling-video/v3/pro/text-to-video/llms.txt
- seedance-2.0: 720p $0.3034/s, 1080p $0.682/s. The token line on the same page equals those rates; it is not added again. Audio does not change the price. Forge default resolution is 720p. Source: https://fal.ai/models/bytedance/seedance-2.0/text-to-video/llms.txt
- grok-imagine-video: 480p $0.08/s, 720p $0.14/s, 1080p $0.25/s. Audio is part of the model. Forge text default is 720p. Source: https://fal.ai/models/xai/grok-imagine-video/v1.5/text-to-video/llms.txt
- wan-2.7: 720p $0.10/s, 1080p $0.15/s. The page default is 1080p. Forge snaps a missing resolution to 720p, so the charge uses $0.10/s. Source: https://fal.ai/models/fal-ai/wan/v2.7/text-to-video/llms.txt
- ltx-2.3-fast: 1080p $0.06/s, 1440p $0.12/s, 2160p $0.24/s. No 480p price and no 480p enum. Forge sends 1080p. A 5s ask bills 6s; a 15s ask bills 16s. Source: https://fal.ai/models/fal-ai/ltx-2.3/text-to-video/fast/llms.txt
- gemini-omni: 360p $0.03/s, 720p $0.10/s, 1080p $0.15/s, 4k $0.30/s. No audio switch. Duration is 3 to 10 seconds, so 15s bills 10s. Source: https://fal.ai/models/google/gemini-omni-flash/v1.1/text-to-video/llms.txt
- pixverse-v5.6: Priced per clip, not per second. 720p silent: 5s $0.45, 8s $0.90, 10s $0.99. Audio adds $0.45 at 720p. 1080p silent is $0.75 for 5s and is not offered at 10s. Source: https://fal.ai/models/fal-ai/pixverse/v5.6/text-to-video/llms.txt
- wan-3.0: 480p $0.05/s, 720p $0.10/s, 1080p $0.20/s. The page says pricing can change. Not in the default council. Source: https://fal.ai/models/alibaba/wan-3.0/text-to-video/llms.txt
- hailuo-02: The input has no duration field. The page prices $0.08/s and gives a 6s clip as $0.48, so every request is billed as 6 seconds. Source: https://fal.ai/models/fal-ai/minimax/hailuo-02/pro/text-to-video/llms.txt
- happyhorse-1.0: 720p $0.14/s, 1080p $0.28/s. The page default is 1080p. Stays out of the council until one clean generation. Source: https://fal.ai/models/alibaba/happy-horse/text-to-video/llms.txt
- runway-gen4: Fal does not publish this endpoint. No usdPerSecond and no usdPerVideo, so it is not sellable. Source: registry provider is runway, not a fal model page
