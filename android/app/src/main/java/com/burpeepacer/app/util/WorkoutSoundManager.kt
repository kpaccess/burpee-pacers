package com.burpeepacer.app.util

import android.media.AudioManager
import android.media.ToneGenerator

/** Audio cues used by the workout timer. Abstracted so the view model can be unit tested without Android. */
interface WorkoutSounds {
    fun playCountdownBeep()
    fun playStartWhistle()
    fun playRepTrigger()
    fun playRepWarning()
    fun playRestStart()
    fun playPhaseTransition()
    fun playFinishWhistle()
    fun release()

    object None : WorkoutSounds {
        override fun playCountdownBeep() {}
        override fun playStartWhistle() {}
        override fun playRepTrigger() {}
        override fun playRepWarning() {}
        override fun playRestStart() {}
        override fun playPhaseTransition() {}
        override fun playFinishWhistle() {}
        override fun release() {}
    }
}

class WorkoutSoundManager : WorkoutSounds {
    private val toneGenerator = ToneGenerator(AudioManager.STREAM_MUSIC, 100)

    override fun playCountdownBeep() { toneGenerator.startTone(ToneGenerator.TONE_PROP_BEEP, 150) }

    override fun playStartWhistle() { toneGenerator.startTone(ToneGenerator.TONE_CDMA_ALERT_CALL_GUARD, 500) }

    override fun playRepTrigger() { toneGenerator.startTone(ToneGenerator.TONE_PROP_ACK, 200) }

    override fun playRepWarning() { toneGenerator.startTone(ToneGenerator.TONE_PROP_BEEP2, 100) }

    /** Phase 1 finished: distinct cue before the 15 s Hybrid rest. */
    override fun playRestStart() { toneGenerator.startTone(ToneGenerator.TONE_CDMA_ABBR_ALERT, 600) }

    /** Rest over, phase 2 begins. */
    override fun playPhaseTransition() { toneGenerator.startTone(ToneGenerator.TONE_CDMA_ALERT_CALL_GUARD, 600) }

    override fun playFinishWhistle() { toneGenerator.startTone(ToneGenerator.TONE_CDMA_ALERT_CALL_GUARD, 1000) }

    override fun release() { toneGenerator.release() }
}
