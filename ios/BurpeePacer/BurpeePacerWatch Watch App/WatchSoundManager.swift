//
//  WatchSoundManager.swift
//  BurpeePacerWatch Watch App
//

import AVFoundation

final class WatchSoundManager {
    static let shared = WatchSoundManager()

    private let engine = AVAudioEngine()
    private let player = AVAudioPlayerNode()
    private let format: AVAudioFormat

    private init() {
        format = AVAudioFormat(standardFormatWithSampleRate: 44100, channels: 1)!
        engine.attach(player)
        engine.connect(player, to: engine.mainMixerNode, format: format)
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default,
                                                            options: [.mixWithOthers])
            try AVAudioSession.sharedInstance().setActive(true)
            try engine.start()
        } catch {
            print("WatchSoundManager init error: \(error)")
        }
    }

    // Short sharp 880 Hz beep — matches the iPhone pacing alert tone
    func playCountdownBeep() {
        let sr = Float(format.sampleRate)
        let dur: Float = 0.12
        guard let buf = makeBuffer(duration: dur) else { return }
        let data = buf.floatChannelData![0]
        for i in 0..<Int(dur * sr) {
            let t = Float(i) / sr
            let env = min(t / 0.004, 1.0) * min((dur - t) / 0.008, 1.0)
            data[i] = sin(2 * .pi * 880 * t) * 0.85 * env
        }
        play(buf)
    }

    private func makeBuffer(duration: Float) -> AVAudioPCMBuffer? {
        let frames = AVAudioFrameCount(Float(format.sampleRate) * duration)
        guard let buf = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frames) else { return nil }
        buf.frameLength = frames
        return buf
    }

    private func play(_ buffer: AVAudioPCMBuffer) {
        if !engine.isRunning {
            try? AVAudioSession.sharedInstance().setActive(true)
            try? engine.start()
        }
        if player.isPlaying {
            player.scheduleBuffer(buffer, at: nil, options: .interrupts, completionHandler: nil)
        } else {
            player.scheduleBuffer(buffer, completionHandler: nil)
            player.play()
        }
    }
}
