"use client";
import { useEffect, useRef, useState } from 'react'

import { SmartLink } from './shared'

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const s = Math.floor(seconds)
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

import type { SchemeHero } from "@/lib/scheme/contentTypes";

export default function Hero({ hero }: { hero: SchemeHero }) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const { video, videoBadge, videoControls } = hero
  const [muted, setMuted] = useState(true)
  const [playing, setPlaying] = useState(true)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [seeking, setSeeking] = useState(false)

  useEffect(() => {
    const el = videoRef.current
    if (!el) return undefined

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncMotion = () => {
      if (mq.matches) {
        el.pause()
        setPlaying(false)
      } else {
        el.play?.().catch(() => {})
        setPlaying(!el.paused)
      }
    }

    syncMotion()
    mq.addEventListener('change', syncMotion)
    return () => mq.removeEventListener('change', syncMotion)
  }, [])

  useEffect(() => {
    const el = videoRef.current
    if (!el) return undefined

    const onLoaded = () => setDuration(el.duration || 0)
    const onTime = () => {
      if (!seeking) setCurrentTime(el.currentTime || 0)
    }
    const onEnded = () => setPlaying(false)

    el.addEventListener('loadedmetadata', onLoaded)
    el.addEventListener('timeupdate', onTime)
    el.addEventListener('ended', onEnded)
    return () => {
      el.removeEventListener('loadedmetadata', onLoaded)
      el.removeEventListener('timeupdate', onTime)
      el.removeEventListener('ended', onEnded)
    }
  }, [seeking])

  const toggleMute = () => {
    setMuted((m) => !m)
  }

  const togglePlay = () => {
    const el = videoRef.current
    if (!el) return
    if (el.paused) {
      el.play?.().catch(() => {})
      setPlaying(true)
    } else {
      el.pause()
      setPlaying(false)
    }
  }

  const onSeek = (value: string) => {
    const el = videoRef.current
    if (!el) return
    const next = Number(value)
    if (!Number.isFinite(next)) return
    el.currentTime = next
    setCurrentTime(next)
  }

  const toggleFullscreen = () => {
    const el = videoRef.current
    const frame = el?.closest?.('.svy__heroVideoFrame')
    if (!frame) return
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {})
      return
    }
    frame.requestFullscreen?.().catch(() => {})
  }

  return (
    <section className="svy__hero" aria-label={hero.sectionAria ?? 'Hero'}>
      <div className="svy__heroInner">
        <div className="svy__heroCopy">
          <span className="svy__kicker">{hero.kicker}</span>
          <h1 className="svy__heroTitle">
            {hero.title.before}
            <span className="svy__heroTitleHighlight">{hero.title.highlight}</span>
            {hero.title.after}
          </h1>
          <p className="svy__heroSubtitle">{hero.subtitle}</p>

          <div className="svy__heroButtons">
            <SmartLink className="svy__button svy__button--primary" href={hero.primaryCta.href}>
              {hero.primaryCta.label}
            </SmartLink>
            <a className="svy__button svy__button--secondary" href={hero.secondaryCta.href}>
              {hero.secondaryCta.label}
            </a>
          </div>
        </div>

        <div className="svy__heroMedia svy__heroMedia--video">
          <div className="svy__glow" aria-hidden="true" />
          {videoBadge ? (
            <p className="svy__heroVideoBadge">
              <span className="svy__heroVideoBadgeDot" aria-hidden="true" />
              {videoBadge}
            </p>
          ) : null}
          <div className="svy__heroVideoFrame">
            <video
              ref={videoRef}
              className="svy__heroVideo"
              poster={video.poster}
              playsInline
              autoPlay
              muted={muted}
              loop
              controls={false}
              preload="metadata"
              aria-label={video.ariaLabel}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onClick={togglePlay}
            >
              <source src={video.src} type="video/mp4" />
            </video>
            <div className="svy__heroVideoChrome" aria-hidden="true" />

            {!playing ? (
              <button
                type="button"
                className="svy__heroVideoCenterPlay"
                onClick={togglePlay}
                aria-label={videoControls.play}
              >
                <span className="svy__heroVideoCenterPlayIcon" aria-hidden="true">
                  ▶
                </span>
              </button>
            ) : null}

            <div className="svy__heroVideoControls" role="group" aria-label={videoControls.toolbarAria}>
              <div className="svy__heroVideoScrubRow">
                <input
                  className="svy__heroVideoScrub"
                  type="range"
                  min={0}
                  max={duration || 0}
                  step={0.1}
                  value={Math.min(currentTime, duration || 0)}
                  onMouseDown={() => setSeeking(true)}
                  onMouseUp={(e) => {
                    setSeeking(false)
                    onSeek(e.currentTarget.value)
                  }}
                  onTouchStart={() => setSeeking(true)}
                  onTouchEnd={(e) => {
                    setSeeking(false)
                    onSeek(e.currentTarget.value)
                  }}
                  onChange={(e) => onSeek(e.target.value)}
                  aria-label="Seek"
                />
              </div>

              <div className="svy__heroVideoControlRow">
                <button type="button" className="svy__heroVideoCtlBtn" onClick={togglePlay} aria-pressed={playing}>
                  {playing ? '❚❚' : '▶'}
                </button>
                <button type="button" className="svy__heroVideoCtlBtn" onClick={toggleMute} aria-pressed={muted}>
                  {muted ? '🔇' : '🔊'}
                </button>

                <span className="svy__heroVideoTime" aria-label="Time">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>

                <span className="svy__heroVideoSpacer" aria-hidden="true" />

                <button type="button" className="svy__heroVideoCtlBtn" onClick={toggleFullscreen}>
                  ⛶
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

