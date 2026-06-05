//
//  WorkoutSoundManger.swift
//  BurpeePacer
//
//  Created by Krishna pradhan on 2026-05-29.
//
import AVFoundation

  final class WorkoutSoundManager {
      static let shared = WorkoutSoundManager()

      private let engine = AVAudioEngine()
      private let player = AVAudioPlayerNode()
      private let format: AVAudioFormat

      private init() {
          format = AVAudioFormat(standardFormatWithSampleRate: 44100, channels: 1)!
          engine.attach(player)
          engine.connect(player, to: engine.mainMixerNode, format: format)

          do {
              // .duckOthers lowers Spotify/Music while a sound plays, then restores it
              try AVAudioSession.sharedInstance().setCategory(
                  .playback, mode: .default,
                  options: [.mixWithOthers, .duckOthers]
              )
              try AVAudioSession.sharedInstance().setActive(true)
              try engine.start()
          } catch {
              print("WorkoutSoundManager init error: \(error)")
          }

          NotificationCenter.default.addObserver(
              forName: AVAudioSession.interruptionNotification,
              object: nil, queue: .main
          ) { [weak self] n in
              guard let self,
                    let v = n.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
                    AVAudioSession.InterruptionType(rawValue: v) == .ended
              else { return }
              self.restartEngine()
              // Retry after 300ms: Apple Fitness sometimes hasn't released the
              // audio session by the time .ended fires, so the first attempt fails.
              DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) { [weak self] in
                  self?.restartEngine()
              }
          }

          // Apple Fitness notification can trigger a route change instead of
          // (or in addition to) a clean interruption. Restart on any route change
          // so the engine reconnects to the new output route.
          NotificationCenter.default.addObserver(
              forName: AVAudioSession.routeChangeNotification,
              object: nil, queue: .main
          ) { [weak self] _ in
              self?.restartEngine()
          }
      }

      // MARK: - Public

      /// 3 short high-pitched beeps → 1 long beep
      func playPrepCountdown() {
          let sr = Float(format.sampleRate)
          let shortDur: Float = 0.10
          let longDur:  Float = 0.55
          let gap:      Float = 0.10
          let total = 3 * (shortDur + gap) + longDur

          guard let buf = makeBuffer(duration: total) else { return }
          let data = buf.floatChannelData![0]

          func writeBeep(offset: Float, dur: Float, freq: Float, amp: Float = 0.70) {
              let s = Int(offset * sr), e = min(Int((offset + dur) * sr), Int(total * sr))
              for i in s..<e {
                  let t = Float(i - s) / sr
                  let env = min(t / 0.006, 1.0) * min((dur - t) / 0.006, 1.0)
                  data[i] = sin(2 * .pi * freq * t) * amp * env
              }
          }

          for i in 0..<3 { writeBeep(offset: Float(i) * (shortDur + gap), dur: shortDur, freq: 880) }
          writeBeep(offset: 3 * (shortDur + gap), dur: longDur, freq: 880, amp: 0.85)
          play(buf)
      }

      /// Sharp ascending whistle — energetic "Go" cue
      func playWorkStart() {
          let sr = Float(format.sampleRate)
          let dur: Float = 0.75
          guard let buf = makeBuffer(duration: dur) else { return }
          let data = buf.floatChannelData![0]

          var p1: Float = 0, p2: Float = 0
          for i in 0..<Int(dur * sr) {
              let t = Float(i) / sr
              let freq = 2200 + 500 * (1 - exp(-t * 18))   // fast pitch sweep up
              let pea  = 1.0 - 0.38 * max(0, sin(2 * .pi * 26 * t))
              let env  = min(t / 0.008, 1.0) * (t < dur - 0.05 ? 1.0 : max(0, (dur - t) / 0.05))
              data[i]  = (sin(p1) * 0.78 + sin(p2) * 0.22) * pea * env * 0.82
              p1 += 2 * .pi * freq / sr;       if p1 > 2 * .pi { p1 -= 2 * .pi }
              p2 += 2 * .pi * (freq * 2.5) / sr; if p2 > 2 * .pi { p2 -= 2 * .pi }
          }
          play(buf)
      }

      /// Descending double-beep — "Stop / Rest" cue
      func playRestStart() {
          let sr = Float(format.sampleRate)
          let beep: Float = 0.22, gap: Float = 0.08
          let total = 2 * beep + gap
          guard let buf = makeBuffer(duration: total) else { return }
          let data = buf.floatChannelData![0]

          func writeBeep(offset: Float, freq: Float) {
              let s = Int(offset * sr), e = min(Int((offset + beep) * sr), Int(total * sr))
              for i in s..<e {
                  let t   = Float(i - s) / sr
                  let env = min(t / 0.008, 1.0) * min((beep - t) / 0.010, 1.0)
                  data[i] = sin(2 * .pi * freq * t) * 0.70 * env
              }
          }
          writeBeep(offset: 0,            freq: 660)   // high
          writeBeep(offset: beep + gap,   freq: 420)   // low
          play(buf)
      }

      /// Single soft chime — subtle halfway cue
      func playHalfway() {
          let sr = Float(format.sampleRate)
          let dur: Float = 0.45
          guard let buf = makeBuffer(duration: dur) else { return }
          let data = buf.floatChannelData![0]

          for i in 0..<Int(dur * sr) {
              let t = Float(i) / sr
              let env = min(t / 0.003, 1.0) * exp(-t * 7)   // instant attack, natural decay
              data[i] = sin(2 * .pi * 1047 * t) * 0.50 * env
          }
          play(buf)
      }

      // MARK: - Private

      private func makeBuffer(duration: Float) -> AVAudioPCMBuffer? {
          let frames = AVAudioFrameCount(Float(format.sampleRate) * duration)
          guard let buf = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frames) else { return nil }
          buf.frameLength = frames
          return buf
      }

      private func play(_ buffer: AVAudioPCMBuffer) {
          restartEngine()
          if player.isPlaying {
              player.scheduleBuffer(buffer, at: nil, options: .interrupts, completionHandler: nil)
          } else {
              player.scheduleBuffer(buffer, completionHandler: nil)
              player.play()
          }
      }

      private func restartEngine() {
          guard !engine.isRunning else { return }
          do {
              try AVAudioSession.sharedInstance().setActive(true)
              try engine.start()
          } catch {
              print("WorkoutSoundManager: engine restart failed: \(error)")
          }
      }
  }
