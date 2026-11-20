package com.burpeepacer.app.data

import com.burpeepacer.app.TestConfig
import com.burpeepacer.app.model.*
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import java.time.LocalDate

class RemoteMappingTest {
    @Before fun setUp() { TestConfig.load() }

    @Test fun parsesAWebCreatedDocument() {
        val doc = mapOf<String, Any?>(
            "startDate" to "2026-05-04",
            "workoutTier" to "advanced",
            "currentLevelId" to "3",
            "workoutDays" to listOf(2L, 4L, 6L),
            "ageBracket" to "40s",
            "equipment" to "Full Gym Access",
            "isAdmin" to true,
            "workoutLogs" to listOf(
                mapOf("date" to "2026-11-16", "completed" to true, "levelCompleted" to "3(N)", "repsCompleted" to 40L),
                mapOf("date" to "bad")
            )
        )
        val p = RemoteMapping.parse(doc)
        assertEquals(LocalDate.of(2026, 5, 4), p.startDate)
        assertEquals(ProgramTrack.ADVANCED, p.track)
        assertEquals("3", p.levelId)
        assertEquals(setOf(2, 4, 6), p.workoutDays)
        assertEquals(AgeBracket.FORTIES, p.ageBracket)
        assertEquals(Equipment.FULL_GYM, p.equipment)
        assertTrue(p.hasProAccess)
        assertEquals(1, p.logs.size)
        assertEquals(40, p.logs[0].repsCompleted)
    }

    @Test fun newAccountHasNoTrackYet() {
        val p = RemoteMapping.parse(mapOf("startDate" to "2026-11-20", "workoutLogs" to emptyList<Any>()))
        assertNull(p.track)
        assertNull(p.levelId)
        assertEquals(UserProfile.DEFAULT_WORKOUT_DAYS, p.workoutDays)
        assertFalse(p.hasProAccess)
    }

    @Test fun unknownLevelForTrackIsIgnored() {
        val p = RemoteMapping.parse(mapOf("workoutTier" to "beginner", "currentLevelId" to "3"))
        assertNull(p.levelId)
    }

    @Test fun logsPayloadMatchesWebStats() {
        val logs = listOf(
            WorkoutLog("2026-11-16", true, "B1(C)", "no_pushups", 20),
            WorkoutLog("2026-11-18", true, "B1(C)", "no_pushups", null),
            WorkoutLog("2026-11-20", false)
        )
        val payload = RemoteMapping.logsPayload(logs)
        @Suppress("UNCHECKED_CAST")
        val stats = payload["workoutStats"] as Map<String, Int>
        assertEquals(2, stats["workoutsCompleted"])
        assertEquals(1, stats["timerVerified"])
        @Suppress("UNCHECKED_CAST")
        val first = (payload["workoutLogs"] as List<Map<String, Any>>)[0]
        assertEquals("B1(C)", first["levelCompleted"])
        assertFalse(((payload["workoutLogs"] as List<*>)[2] as Map<*, *>).containsKey("levelCompleted"))
    }

    @Test fun newUserDocumentOmitsTier() {
        val doc = RemoteMapping.newUserDocument(LocalDate.of(2026, 11, 20), " A@B.com ", "Ann", listOf("google.com"))
        assertFalse(doc.containsKey("workoutTier"))
        assertEquals("a@b.com", doc["emailLowercase"])
        assertEquals("2026-11-20", doc["startDate"])
    }
}
