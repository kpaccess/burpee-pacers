import Foundation

struct ProgramConfigFile: Codable {
    struct Access: Codable {
        let launchAccessEnabled: Bool
    }

    struct Track: Codable {
        let id: String
        let displayName: String
        let availableModes: [WorkoutMode]
    }

    struct LevelDefinition: Codable {
        let id: String
        let track: String
        let displayName: String
        let description: String
        let sealsGoal: Int
        let fiveCountGoal: Int
        let timeLimitMinutes: Int
    }

    struct HybridPhase: Codable {
        let mode: WorkoutMode
        let label: String
    }

    struct HybridRules: Codable {
        let phaseDurationMinutes: Int
        let goalSplit: String
        let phases: [HybridPhase]
    }

    let version: Int
    let access: Access
    let tracks: [Track]
    let levels: [LevelDefinition]
    let defaultModeByWeekday: [String: [String: WorkoutMode]]
    let hybridRules: HybridRules
}

enum ProgramCatalog {
    private struct LoadedState {
        let config: ProgramConfigFile?
        let errorMessage: String?
    }

    private static let state = loadBundledConfig()

    static var configErrorMessage: String? { state.errorMessage }
    static var launchAccessEnabled: Bool { state.config?.access.launchAccessEnabled ?? false }
    static var hybridPhaseDurationMinutes: Int { state.config?.hybridRules.phaseDurationMinutes ?? 10 }
    static var hybridPhaseLabels: [String] {
        let labels = state.config?.hybridRules.phases.map(\.label) ?? []
        if labels.count == 2 {
            return labels
        }
        return ["Navy Seals", "5-Count Pushups"]
    }

    static func levels(for track: ProgramTrack) -> [Level] {
        guard let config = state.config else { return [] }

        return config.levels
            .filter { $0.track == track.storageValue }
            .map { level in
                Level(
                    id: level.id,
                    track: track,
                    displayName: level.displayName,
                    description: level.description,
                    sealsGoal: level.sealsGoal,
                    sixCountsGoal: level.fiveCountGoal
                )
            }
    }

    static func availableModes(for track: ProgramTrack) -> [WorkoutMode] {
        state.config?
            .tracks
            .first(where: { $0.id == track.storageValue })?
            .availableModes ?? []
    }

    static func startingLevel(for track: ProgramTrack) -> Level? {
        levels(for: track).first
    }

    static func defaultMode(for track: ProgramTrack, weekday: Int) -> WorkoutMode {
        let configuredMode = state.config?
            .defaultModeByWeekday[track.storageValue]?[String(weekday)]

        if let configuredMode {
            return configuredMode
        }

        return track == .advanced ? .navySeals : .fiveCount
    }

    static func reminderContent(
        for track: ProgramTrack,
        weekday: Int,
        levelDisplayName: String
    ) -> (title: String, body: String) {
        if track == .beginner {
            return (
                "Workout Day! 💪",
                "Time for your burpee session — \(levelDisplayName)"
            )
        }

        switch defaultMode(for: track, weekday: weekday) {
        case .navySeals:
            return ("Navy Seals Day! 💪", "Full range burpees today — \(levelDisplayName)")
        case .fiveCount:
            return ("5-Count Pushups Day! 💪", "Strict pushup burpees today — \(levelDisplayName)")
        case .hybrid:
            return ("Hybrid Day! 💪", "Navy Seals + 5-Count Pushups today — \(levelDisplayName)")
        }
    }

    static func loadFromURL(_ url: URL) throws -> ProgramConfigFile {
        let data = try Data(contentsOf: url)
        return try JSONDecoder().decode(ProgramConfigFile.self, from: data)
    }

    private static func loadBundledConfig() -> LoadedState {
        guard let url = Bundle.main.url(forResource: "program-config", withExtension: "json") else {
            return handleLoadFailure("Missing bundled program-config.json")
        }

        do {
            let config = try loadFromURL(url)
            guard config.hybridRules.goalSplit == "ceil_half",
                  config.hybridRules.phases.count == 2 else {
                return handleLoadFailure("Invalid hybrid rules in program-config.json")
            }
            return LoadedState(config: config, errorMessage: nil)
        } catch {
            return handleLoadFailure("Unable to decode program-config.json: \(error.localizedDescription)")
        }
    }

    private static func handleLoadFailure(_ message: String) -> LoadedState {
        #if DEBUG
        fatalError(message)
        #else
        return LoadedState(config: nil, errorMessage: message)
        #endif
    }
}
