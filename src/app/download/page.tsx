'use client'

// Forge Extreme (V3 desktop app) download page — Ultimate subscribers + admins.
// Tier is read from the shared useUserTier hook (no extra endpoint needed).

import { useEffect, useState } from 'react'
import { Monitor, Apple, CheckCircle2, Lock } from 'lucide-react'
import { useUserTier } from '@/hooks/useUserTier'
import { UpgradeModal } from '@/components/ui/UpgradeModal'

function detectPlatform(): 'mac' | 'windows' | 'unknown' {
  if (typeof navigator === 'undefined') return 'unknown'
  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes('mac')) return 'mac'
  if (ua.includes('win')) return 'windows'
  return 'unknown'
}

// Placeholder release URLs — update when the V3 desktop builds are published.
const DOWNLOAD_URLS = {
  mac_arm:   'https://releases.forgecinema.app/v3/latest/CinematicForge-arm64.dmg',
  mac_intel: 'https://releases.forgecinema.app/v3/latest/CinematicForge-x64.dmg',
  windows:   'https://releases.forgecinema.app/v3/latest/CinematicForge-Setup.exe',
}

const FEATURES = [
  'Full NLE editor — replaces Adobe Premiere Pro',
  'Professional colour science — replaces DaVinci Resolve',
  'Node compositor — replaces After Effects',
  'Complete audio DAW — replaces Logic Pro / Fairlight',
  'Forge Spectrum EQ — 20-band professional equalizer',
  'Forge Master Suite — 9-stage mastering chain',
  '200+ pre-rendered VFX effects library',
  'ForgeFlow — replaces Autodesk ShotGrid ($800/seat/yr)',
  'ForgeReview — replaces Adobe Frame.io ($15/seat/mo)',
  '21 AI video models — routed per shot automatically',
  'Offline-first — edit without internet',
  'API keys in OS keychain — enterprise security',
]

export default function DownloadPage() {
  const [platform, setPlatform] = useState<'mac' | 'windows' | 'unknown'>('unknown')
  const { tier, isAdmin } = useUserTier()
  const isAllowed = isAdmin || tier === 'ultimate'

  // Detect platform after mount: navigator is unavailable during SSR, so reading
  // it lazily in useState would cause a server/client hydration mismatch.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setPlatform(detectPlatform()) }, [])

  const openUpgrade = () =>
    window.dispatchEvent(new CustomEvent('show-upgrade-modal', {
      detail: {
        requiredTier: 'ultimate',
        feature: 'Forge Extreme Desktop',
        message: 'Forge Extreme is included with the Ultimate subscription at no extra charge.',
      },
    }))

  return (
    <div className="min-h-screen bg-[#070d1a] text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="flex items-center gap-3 mb-2">
          <Monitor className="w-8 h-8 text-[#00e5c8]" />
          <h1 className="text-3xl font-bold tracking-tight">Forge Extreme</h1>
        </div>
        <p className="text-gray-400 mb-10">
          The professional desktop studio. Everything in the web app, plus the full NLE, colour
          science, compositing, audio mastering, ForgeFlow, and ForgeReview — offline-first.
        </p>

        {!isAllowed ? (
          <div className="border border-white/10 rounded-2xl p-8 text-center bg-[#0d1425]">
            <Lock className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Ultimate Plan Required</h2>
            <p className="text-gray-400 text-sm mb-6">
              Forge Extreme is included with the Ultimate subscription at no extra charge.
            </p>
            <button
              onClick={openUpgrade}
              className="px-6 py-3 rounded-xl bg-[#00e5c8] text-black font-bold hover:bg-[#00f0d5]"
            >
              Upgrade to Ultimate
            </button>
          </div>
        ) : (
          <>
            <div className="grid gap-4 mb-12">
              {(platform === 'mac' || platform === 'unknown') && (
                <>
                  <a href={DOWNLOAD_URLS.mac_arm}
                     className="flex items-center justify-between p-5 rounded-xl bg-[#0d1425] border border-[#00e5c8]/30 hover:border-[#00e5c8] transition-all group">
                    <div className="flex items-center gap-4">
                      <Apple className="w-7 h-7 text-[#00e5c8]" />
                      <div>
                        <p className="font-semibold">macOS — Apple Silicon</p>
                        <p className="text-xs text-gray-500">M1 / M2 / M3 / M4 (arm64) · Recommended</p>
                      </div>
                    </div>
                    <span className="text-[#00e5c8] text-sm font-medium opacity-0 group-hover:opacity-100">Download →</span>
                  </a>
                  <a href={DOWNLOAD_URLS.mac_intel}
                     className="flex items-center justify-between p-5 rounded-xl bg-[#0d1425] border border-white/10 hover:border-white/25 transition-all group">
                    <div className="flex items-center gap-4">
                      <Apple className="w-7 h-7 text-gray-400" />
                      <div>
                        <p className="font-semibold text-white/80">macOS — Intel</p>
                        <p className="text-xs text-gray-500">x86_64 · macOS 13 Ventura minimum</p>
                      </div>
                    </div>
                    <span className="text-gray-400 text-sm font-medium opacity-0 group-hover:opacity-100">Download →</span>
                  </a>
                </>
              )}
              {(platform === 'windows' || platform === 'unknown') && (
                <a href={DOWNLOAD_URLS.windows}
                   className="flex items-center justify-between p-5 rounded-xl bg-[#0d1425] border border-white/10 hover:border-white/25 transition-all group">
                  <div className="flex items-center gap-4">
                    <Monitor className="w-7 h-7 text-gray-400" />
                    <div>
                      <p className="font-semibold text-white/80">Windows</p>
                      <p className="text-xs text-gray-500">x64 + arm64 · Windows 10/11</p>
                    </div>
                  </div>
                  <span className="text-gray-400 text-sm font-medium opacity-0 group-hover:opacity-100">Download →</span>
                </a>
              )}
            </div>

            <div className="bg-[#0d1425] border border-white/8 rounded-xl p-5 mb-10 text-sm text-gray-400">
              <p className="font-medium text-white/70 mb-1">First launch</p>
              <p>Open the app → enter your Cinematic Forge email + subscription key →
                 follow the API key setup wizard to store keys in your system keychain.
                 Your subscription is automatically verified. No re-purchase required.</p>
            </div>
          </>
        )}

        <h2 className="text-lg font-semibold mb-4 text-white/80">What&apos;s included</h2>
        <div className="grid grid-cols-1 gap-2">
          {FEATURES.map((f) => (
            <div key={f} className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-[#00e5c8] mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-300">{f}</span>
            </div>
          ))}
        </div>

        <p className="mt-10 text-xs text-gray-600">
          Forge Extreme requires macOS 13+ (arm64 or x86_64) or Windows 10/11 (x64 or arm64).
          Internet required only for AI generation. All editing and playback works offline.
        </p>
      </div>

      <UpgradeModal />
    </div>
  )
}
