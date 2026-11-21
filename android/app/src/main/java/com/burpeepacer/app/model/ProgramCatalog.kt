package com.burpeepacer.app.model

import android.content.Context
import com.google.gson.Gson
import com.google.gson.annotations.SerializedName

/**
 * Shared, web-owned workout program configuration (levels, goals, modes, schedule defaults).
 *
 * The JSON in `assets/program-config.json` is a copy of the live config that the web and iOS
 * apps bundle (`ios/BurpeePacer/program-config.json`). Android must not hard-code levels or
 * goals; everything comes from here, mirroring iOS `ProgramCatalog`.
 */
data class ProgramConfigFile(
    @SerializedName("version") val version: Int,
    @SerializedName("access") val access: Access,
    @SerializedName("progressionRules") val progressionRules: ProgressionRules?,
    @SerializedName("tracks") val tracks: List<TrackConfig>,
    @SerializedName("levels") val levels: List<LevelConfig>,
    @SerializedName("defaultModeByWeekday") val defaultModeByWeekday: Map<String, Map<String, String>>,
    @SerializedName("hybridRules") val hybridRules: HybridRules
) {
    data class Access(@SerializedName("launchAccessEnabled") val launchAccessEnabled: Boolean)

    data class ProgressionRules(
        @SerializedName("qualifyingSessionsRequired") val qualifyingSessionsRequired: Int
    )

    data class TrackConfig(
        @SerializedName("id") val id: String,
        @SerializedName("displayName") val displayName: String,
        @SerializedName("availableModes") val availableModes: List<String>
    )

    data class LevelConfig(
        @SerializedName("id") val id: String,
        @SerializedName("track") val track: String,
        @SerializedName("displayName") val displayName: String,
        @SerializedName("description") val description: String,
        @SerializedName("sealsGoal") val sealsGoal: Int,
        @SerializedName("fiveCountGoal") val fiveCountGoal: Int,
        @SerializedName("timeLimitMinutes") val timeLimitMinutes: Int
    )

    data class HybridPhase(
        @SerializedName("mode") val mode: String,
        @SerializedName("label") val label: String
    )

    data class HybridRules(
        @SerializedName("phaseDurationMinutes") val phaseDurationMinutes: Int,
        @SerializedName("goalSplit") val goalSplit: String,
        @SerializedName("phases") val phases: List<HybridPhase>
    )
}

object ProgramCatalog {
    private const val ASSET_NAME = "program-config.json"

    /** Seconds of rest inserted between the two Hybrid phases (matches the web timer). */
    const val HYBRID_PHASE_REST_SECONDS = 15

    /** Fallback used by the web app when the config has no value. */
    private const val DEFAULT_QUALIFYING_SESSIONS = 3

    @Volatile
    private var config: ProgramConfigFile? = null

    /** Loads the bundled config once. Safe to call repeatedly. */
    fun init(context: Context) {
        if (config != null) return
        val json = context.applicationContext.assets.open(ASSET_NAME).bufferedReader().use { it.readText() }
        loadFromJson(json)
    }

    /** Parses and validates a config. Exposed for unit tests. */
    fun loadFromJson(json: String) {
        val parsed = Gson().fromJson(json, ProgramConfigFile::class.java)
        require(parsed.tracks.isNotEmpty()) { "Program config tracks are missing" }
        require(parsed.levels.isNotEmpty()) { "Program config levels are missing" }
        require(parsed.hybridRules.goalSplit == "ceil_half" && parsed.hybridRules.phases.size == 2) {
            "Program config hybrid rules are invalid"
        }
        config = parsed
    }

    private val cfg: ProgramConfigFile
        get() = config ?: error("ProgramCatalog is not initialised. Call ProgramCatalog.init(context) first.")

    val launchAccessEnabled: Boolean get() = cfg.access.launchAccessEnabled

    val qualifyingSessionsRequired: Int
        get() = cfg.progressionRules?.qualifyingSessionsRequired?.takeIf { it >= 1 } ?: DEFAULT_QUALIFYING_SESSIONS

    val hybridPhaseDurationMinutes: Int get() = cfg.hybridRules.phaseDurationMinutes

    val hybridPhaseLabels: List<String>
        get() = cfg.hybridRules.phases.map { it.label }.takeIf { it.size == 2 }
            ?: listOf("Navy Seals", "5-Count Pushups")

    fun levels(track: ProgramTrack): List<Level> =
        cfg.levels
            .filter { it.track == track.storageValue }
            .map {
                Level(
                    id = it.id,
                    track = track,
                    displayName = it.displayName,
                    description = it.description,
                    sealsGoal = it.sealsGoal,
                    sixCountsGoal = it.fiveCountGoal
                )
            }

    fun startingLevel(track: ProgramTrack): Level = levels(track).first()

    fun availableModes(track: ProgramTrack): List<WorkoutMode> {
        val configured = cfg.tracks.firstOrNull { it.id == track.storageValue }
            ?.availableModes
            ?.mapNotNull { WorkoutMode.fromShortName(it) }
            .orEmpty()
        return configured.ifEmpty {
            if (track == ProgramTrack.BEGINNER) listOf(WorkoutMode.FIVE_COUNT)
            else listOf(WorkoutMode.NAVY_SEALS, WorkoutMode.FIVE_COUNT, WorkoutMode.HYBRID)
        }
    }

    /**
     * Default workout mode for a weekday, using iOS/web weekday numbers (Sunday = 1 … Saturday = 7).
     */
    fun defaultMode(track: ProgramTrack, weekday: Int): WorkoutMode {
        val configured = cfg.defaultModeByWeekday[track.storageValue]?.get(weekday.toString())
            ?.let { WorkoutMode.fromShortName(it) }
        return configured ?: if (track == ProgramTrack.ADVANCED) WorkoutMode.NAVY_SEALS else WorkoutMode.FIVE_COUNT
    }
}
