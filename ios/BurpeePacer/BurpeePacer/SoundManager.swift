//
//  SoundManager.swift
//  BurpeePacer
//

import AVFoundation

class SoundManager {
    static let shared = SoundManager()

    private let engine = AVAudioEngine()
    private let playerNode = AVAudioPlayerNode()
    private let format: AVAudioFormat

    private init() {
        format = AVAudioFormat(standardFormatWithSampleRate: 44100, channels: 1)!
        engine.attach(playerNode)
        engine.connect(playerNode, to: engine.mainMixerNode, format: format)
        engine.mainMixerNode.outputVolume = 1.0

        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: [.mixWithOthers])
            try AVAudioSession.sharedInstance().setActive(true)
            try engine.start()
        } catch {
            print("SoundManager init error: \(error)")
        }

        // Restart engine after phone calls, Siri, or other interruptions
        NotificationCenter.default.addObserver(
            forName: AVAudioSession.interruptionNotification,
            object: nil, queue: .main
        ) { [weak self] notification in
            guard let self,
                  let typeValue = notification.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
                  let type = AVAudioSession.InterruptionType(rawValue: typeValue),
                  type == .ended else { return }
            self.restartEngineIfNeeded()
        }
    }

    private func restartEngineIfNeeded() {
        guard !engine.isRunning else { return }
        do {
            try AVAudioSession.sharedInstance().setActive(true)
            try engine.start()
        } catch {
            print("SoundManager: engine restart failed: \(error)")
        }
    }

    // Schedule a buffer, interrupting any currently playing sound.
    // Never calls playerNode.stop() — that resets the internal timeline and
    // causes "player did not see an IO cycle" crashes on the next play().
    private func playBuffer(_ buffer: AVAudioPCMBuffer) {
        restartEngineIfNeeded()
        if playerNode.isPlaying {
            playerNode.scheduleBuffer(buffer, at: nil, options: .interrupts, completionHandler: nil)
        } else {
            playerNode.scheduleBuffer(buffer, completionHandler: nil)
            playerNode.play()
        }
    }

    func playCountdownBeep() {
        playTone(frequency: 880, duration: 0.12, amplitude: 0.85)
    }

    // Referee (Fox 40-style) whistle:
    //   - 2800 Hz fundamental + 3rd harmonic for body
    //   - fast pitch attack (like air pressure building)
    //   - pea warble: AM modulation at ~25 Hz gives the "brrrrr" quality
    //   - sharp attack, hard cutoff
    func playWhistle() {
        let sampleRate = Float(format.sampleRate)
        let duration: Float = 1.1
        let frameCount = AVAudioFrameCount(sampleRate * duration)

        guard let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount) else { return }
        buffer.frameLength = frameCount

        let data = buffer.floatChannelData![0]

        let basePitch: Float = 2800
        let peaRate: Float = 25      // warble frequency (Hz)
        let peaDepth: Float = 0.38   // modulation depth — higher = more warble

        var phase1: Float = 0        // fundamental
        var phase2: Float = 0        // 3rd harmonic

        for i in 0..<Int(frameCount) {
            let t = Float(i) / sampleRate

            // Pitch rises quickly from ~2650 to 2800 Hz in the first 30ms (pressure build)
            let freq = basePitch * (1.0 - 0.055 * exp(-t * 60))

            // Pea warble: amplitude modulated sine, asymmetric (dips, not full cuts)
            let pea = 1.0 - peaDepth * max(0, sin(2 * Float.pi * peaRate * t))

            // 15ms fade-in, hard cutoff (referee whistle stops abruptly)
            let fadeIn = min(t / 0.015, 1.0)
            let fadeOut: Float = t < (duration - 0.04) ? 1.0 : max(0, (duration - t) / 0.04)

            // Fundamental (80%) + 3rd harmonic (20%) for a richer, less pure tone
            let wave = sin(phase1) * 0.80 + sin(phase2) * 0.20

            data[i] = wave * pea * fadeIn * fadeOut

            phase1 += 2 * Float.pi * freq / sampleRate
            phase2 += 2 * Float.pi * (freq * 3) / sampleRate
            if phase1 > 2 * Float.pi { phase1 -= 2 * Float.pi }
            if phase2 > 2 * Float.pi { phase2 -= 2 * Float.pi }
        }

        playBuffer(buffer)
    }

    func playRefereeWhistle(duration: Float = 1.5) {
        let sampleRate = Float(format.sampleRate)
        let frameCount = AVAudioFrameCount(sampleRate * duration)

        guard let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount) else { return }
        buffer.frameLength = frameCount

        let data = buffer.floatChannelData![0]

        let basePitch: Float = 2800
        let peaRate: Float = 25      // warble frequency (Hz)
        let peaDepth: Float = 0.38   // modulation depth

        var phase1: Float = 0        // fundamental
        var phase2: Float = 0        // 3rd harmonic

        for i in 0..<Int(frameCount) {
            let t = Float(i) / sampleRate

            let freq = basePitch * (1.0 - 0.055 * exp(-t * 60))
            let pea = 1.0 - peaDepth * max(0, sin(2 * Float.pi * peaRate * t))

            let fadeIn = min(t / 0.015, 1.0)
            let fadeOut: Float = t < (duration - 0.04) ? 1.0 : max(0, (duration - t) / 0.04)

            let wave = sin(phase1) * 0.80 + sin(phase2) * 0.20

            data[i] = wave * pea * fadeIn * fadeOut

            phase1 += 2 * Float.pi * freq / sampleRate
            phase2 += 2 * Float.pi * (freq * 3) / sampleRate
            if phase1 > 2 * Float.pi { phase1 -= 2 * Float.pi }
            if phase2 > 2 * Float.pi { phase2 -= 2 * Float.pi }
        }

        playBuffer(buffer)
    }

    func playGymBuzzer(duration: Float = 1.8) {
        let sampleRate = Float(format.sampleRate)
        let frameCount = AVAudioFrameCount(sampleRate * duration)

        guard let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount) else { return }
        buffer.frameLength = frameCount

        let data = buffer.floatChannelData![0]
        var phase: Float = 0

        let frequency: Float = 110 // Deep mechanical buzz

        for i in 0..<Int(frameCount) {
            let t = Float(i) / sampleRate

            // Rich square-sawtooth mix via odd and even harmonics
            var wave: Float = 0
            for harmonic in 1...6 {
                wave += sin(phase * Float(harmonic)) * (1.0 / Float(harmonic))
            }

            // Mechanical vibration overlay (60Hz amplitude modulation)
            let modulation = 0.75 + 0.25 * sin(2 * Float.pi * 60 * t)

            let fadeIn = min(t / 0.03, 1.0)
            let fadeOut = min((duration - t) / 0.08, 1.0)

            data[i] = wave * modulation * fadeIn * fadeOut * 0.35 // safe volume scaling

            phase += 2 * Float.pi * frequency / sampleRate
            if phase > 2 * Float.pi { phase -= 2 * Float.pi }
        }

        playBuffer(buffer)
    }

    func playTripleWhistle() {
        let sampleRate = Float(format.sampleRate)
        let blastDuration: Float = 0.32
        let gapDuration: Float = 0.12
        let duration = (blastDuration * 3) + (gapDuration * 2)
        let frameCount = AVAudioFrameCount(sampleRate * duration)

        guard let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount) else { return }
        buffer.frameLength = frameCount

        let data = buffer.floatChannelData![0]

        let basePitch: Float = 2800
        let peaRate: Float = 25
        let peaDepth: Float = 0.38

        var phase1: Float = 0
        var phase2: Float = 0

        for i in 0..<Int(frameCount) {
            let t = Float(i) / sampleRate

            let cycleDuration = blastDuration + gapDuration
            let blastIndex = Int(t / cycleDuration)
            let tInCycle = t - Float(blastIndex) * cycleDuration

            if tInCycle < blastDuration && blastIndex < 3 {
                let freq = basePitch * (1.0 - 0.055 * exp(-tInCycle * 60))
                let pea = 1.0 - peaDepth * max(0, sin(2 * Float.pi * peaRate * tInCycle))
                let fadeIn = min(tInCycle / 0.015, 1.0)
                let fadeOut = min((blastDuration - tInCycle) / 0.03, 1.0)
                let wave = sin(phase1) * 0.80 + sin(phase2) * 0.20

                data[i] = wave * pea * fadeIn * fadeOut * 0.9

                phase1 += 2 * Float.pi * freq / sampleRate
                phase2 += 2 * Float.pi * (freq * 3) / sampleRate
                if phase1 > 2 * Float.pi { phase1 -= 2 * Float.pi }
                if phase2 > 2 * Float.pi { phase2 -= 2 * Float.pi }
            } else {
                data[i] = 0
                phase1 = 0
                phase2 = 0
            }
        }

        playBuffer(buffer)
    }

    private func playTone(frequency: Float, duration: Float, amplitude: Float) {
        let sampleRate = Float(format.sampleRate)
        let frameCount = AVAudioFrameCount(sampleRate * duration)

        guard let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount) else { return }
        buffer.frameLength = frameCount

        let data = buffer.floatChannelData![0]
        var phase: Float = 0

        for i in 0..<Int(frameCount) {
            let t = Float(i) / sampleRate
            let fadeIn = min(t / 0.01, 1.0)
            let fadeOut = min((duration - t) / 0.01, 1.0)
            data[i] = sin(phase) * amplitude * fadeIn * fadeOut
            phase += 2 * Float.pi * frequency / sampleRate
            if phase > 2 * Float.pi { phase -= 2 * Float.pi }
        }

        playBuffer(buffer)
    }
}
