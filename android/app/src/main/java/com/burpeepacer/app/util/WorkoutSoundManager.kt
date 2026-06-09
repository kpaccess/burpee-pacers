package com.burpeepacer.app.util

import android.media.AudioManager
import android.media.ToneGenerator

class WorkoutSoundManager {
    private val toneGenerator = ToneGenerator(AudioManager.STREAM_MUSIC, 100)

    fun playCountdownBeep() {
        toneGenerator.startTone(ToneGenerator.TONE_PROP_BEEP, 150)
    }

    fun playStartWhistle() {
        toneGenerator.startTone(ToneGenerator.TONE_CDMA_ALERT_CALL_GUARD, 500)
    }

    fun playRepTrigger() {
        toneGenerator.startTone(ToneGenerator.TONE_PROP_ACK, 200)
    }

    fun playRepWarning() {
        toneGenerator.startTone(ToneGenerator.TONE_PROP_BEEP2, 100)
    }

    fun playFinishWhistle() {
        toneGenerator.startTone(ToneGenerator.TONE_CDMA_ALERT_CALL_GUARD, 1000)
    }

    fun playPhaseTransition() {
        toneGenerator.startTone(ToneGenerator.TONE_CDMA_PIP, 600)
    }

    fun release() {
        toneGenerator.release()
    }
}
