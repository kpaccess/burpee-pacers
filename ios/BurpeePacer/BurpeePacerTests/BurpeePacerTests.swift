import Foundation
import Testing
@testable import BurpeePacer

private func sharedProgramConfigURL() -> URL {
    URL(fileURLWithPath: #filePath)
        .deletingLastPathComponent() // BurpeePacerTests
        .deletingLastPathComponent() // ios/BurpeePacer
        .deletingLastPathComponent() // ios
        .deletingLastPathComponent() // repo root
        .appendingPathComponent("web/src/config/program-config.json")
}

private final class TestFirebaseService: FirebaseService {
    override init() {
        super.init()
        self.currentUser = nil
        self.isLoading = false
    }

    override func attachListener(uid: String?) {
        self.isLoading = false
    }

    override func updateLevel(_ levelID: String) async {}
    override func updateWorkoutDays(_ days: [Int]) async {}
    override func updateStartWeight(_ weightLbs: Double) async {}
    override func updateTrack(_ tier: String) async {}
    override func updatePersonalization(age: AgeBracket, equipment: Equipment) async {}
    override func saveWorkoutLog(date: Date, levelID: String, mode: WorkoutMode, repsCompleted: Int, completed: Bool) async {}
}

@Suite("Program Config Tests")
struct ProgramConfigTests {
    @Test("Shared program config decodes and preserves counts")
    func sharedProgramConfigDecodes() throws {
        let config = try ProgramCatalog.loadFromURL(sharedProgramConfigURL())

        #expect(config.version == 1)
        #expect(config.levels.filter { $0.track == "beginner" }.count == 6)
        #expect(config.levels.filter { $0.track == "advanced" }.count == 6)
    }

    @Test("Weekday defaults match the web program rules")
    func weekdayDefaultsMatchWeb() {
        #expect(ProgramCatalog.defaultMode(for: .beginner, weekday: 2) == .fiveCount)
        #expect(ProgramCatalog.defaultMode(for: .advanced, weekday: 2) == .navySeals)
        #expect(ProgramCatalog.defaultMode(for: .advanced, weekday: 4) == .fiveCount)
        #expect(ProgramCatalog.defaultMode(for: .advanced, weekday: 6) == .hybrid)
    }

    @Test("Hybrid phase goals use ceil-half split")
    func hybridGoalSplitUsesCeiling() {
        let oddLevel = Level(
            id: "custom",
            track: .advanced,
            displayName: "Custom",
            description: "Odd goal test",
            sealsGoal: 55,
            sixCountsGoal: 101
        )

        #expect(oddLevel.hybridPhaseGoal(phase: 0) == 28)
        #expect(oddLevel.hybridPhaseGoal(phase: 1) == 51)
    }
}

@Suite("Level Parity Tests")
struct LevelParityTests {
    @Test("Shared config-backed levels expose expected canonical examples")
    func sharedLevelsExposeExpectedExamples() {
        let beginnerLevels = LevelDatabase.levels(for: .beginner)
        let advancedLevels = LevelDatabase.levels(for: .advanced)

        #expect(beginnerLevels.count == 6)
        #expect(advancedLevels.count == 6)
        #expect(beginnerLevels.first?.id == "B1")
        #expect(beginnerLevels.first?.sixCountsGoal == 20)
        #expect(advancedLevels.first?.id == "F")
        #expect(advancedLevels.first?.sealsGoal == 15)

        let levelOne = advancedLevels.first(where: { $0.id == "1" })
        #expect(levelOne?.sealsGoal == 20)
        #expect(levelOne?.sixCountsGoal == 50)
    }

    @Test("Available modes come from shared track config")
    func availableModesComeFromSharedConfig() {
        let beginner = LevelDatabase.levels(for: .beginner).first ?? Level.placeholder(for: .beginner)
        let advanced = LevelDatabase.levels(for: .advanced).first ?? Level.placeholder(for: .advanced)

        #expect(beginner.availableModes == [.fiveCount])
        #expect(advanced.availableModes == [.navySeals, .fiveCount, .hybrid])
    }
}

@Suite("Access Logic Tests")
struct AccessLogicTests {
    private func makeViewModel(isPro: Bool? = nil, isAdmin: Bool? = nil) -> AppViewModel {
        let firebase = TestFirebaseService()
        firebase.userData = FirestoreUserData(
            startDate: "2026-07-01",
            startWeight: 150,
            workoutTier: "advanced",
            currentLevelId: "F",
            isPro: isPro,
            isAdmin: isAdmin,
            startPictureUrl: nil,
            workoutLogs: [],
            workoutDays: [2, 4, 6],
            ageBracket: nil,
            equipment: nil
        )
        return AppViewModel(firebase: firebase)
    }

    @Test("Admin access is honored")
    func adminAccessIsHonored() {
        let viewModel = makeViewModel(isAdmin: true)
        #expect(viewModel.hasProAccess == true)
    }

    @Test("Pro access is honored")
    func proAccessIsHonored() {
        let viewModel = makeViewModel(isPro: true)
        #expect(viewModel.hasProAccess == true)
    }

    @Test("Users without explicit flags follow the current web launch policy")
    func launchAccessPolicyIsApplied() {
        let viewModel = makeViewModel()
        #expect(viewModel.hasProAccess == ProgramCatalog.launchAccessEnabled)
    }
}

@Suite("Session Timer Tests")
struct SessionTimerViewModelTests {
    @Test("Timer starts with shared-config-derived defaults")
    func timerStartsWithExpectedDefaults() {
        let level = LevelDatabase.levels(for: .advanced).first ?? Level.placeholder(for: .advanced)
        let viewModel = SessionTimerViewModel(level: level, workoutMode: .hybrid)

        #expect(viewModel.timeRemaining == 20 * 60)
        #expect(viewModel.currentPhaseGoal == level.hybridPhaseGoal(phase: 0))
        #expect(viewModel.hybridPhaseLabel == ProgramCatalog.hybridPhaseLabels[0])
    }
}
