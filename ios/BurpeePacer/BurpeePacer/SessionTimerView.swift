//
//  SessionTimerView.swift
//  BurpeePacer
//

import SwiftUI

struct SessionTimerView: View {
    @Bindable var viewModel: SessionTimerViewModel
    @State private var warmupChecked = false
    @State private var showWarmupPrompt = false

    var onComplete: ((WorkoutSession) -> Void)?
    var onShowWarmup: (() -> Void)?
    var onShowCooldown: (() -> Void)?

    init(viewModel: SessionTimerViewModel,
         onComplete: ((WorkoutSession) -> Void)? = nil,
         onShowWarmup: (() -> Void)? = nil,
         onShowCooldown: (() -> Void)? = nil) {
        self.viewModel = viewModel
        self.onComplete = onComplete
        self.onShowWarmup = onShowWarmup
        self.onShowCooldown = onShowCooldown
    }

    var body: some View {
        VStack(spacing: 20) {
            // Mode picker — only for advanced, locked once running
            if viewModel.level.track == .advanced {
                modePicker
            }

            // Phase header — only for hybrid
            if viewModel.isHybrid {
                phaseHeader
            }

            // Timer display with time-progress ring
            timerSection

            // Rep pace guide chip (shows when running)
            if viewModel.isRunning {
                repPaceChip
            }

            // Rep counter
            repCounterSection

            // Idle hint — shown before the first start
            if viewModel.isIdle && !showWarmupPrompt {
                warmupHint
            }

            // Controls or warmup gate
            if showWarmupPrompt {
                warmupPromptView
            } else {
                controlButtonsSection
            }

            // Cooldown banner after workout finishes
            if viewModel.isFinished && !showWarmupPrompt {
                cooldownBanner
                saveWorkoutButton
            }

            // Tutorial link
            tutorialLinkSection

            Spacer()
        }
        .padding()
        .background(Color(UIColor.systemBackground))
        .overlay {
            if let countdown = viewModel.countdownRemaining {
                countdownOverlay(value: countdown)
            }
        }
    }

    // MARK: - Mode Picker

    private var modePicker: some View {
        Picker("Mode", selection: $viewModel.workoutMode) {
            ForEach(viewModel.level.availableModes, id: \.self) { mode in
                Text(mode.displayName).tag(mode)
            }
        }
        .pickerStyle(.segmented)
        .disabled(viewModel.isRunning || viewModel.isCountingDown)
        .padding(.horizontal)
    }

    // MARK: - Hybrid Phase Header

    private var phaseHeader: some View {
        VStack(spacing: 4) {
            HStack(spacing: 8) {
                phaseChip(index: 0)
                Image(systemName: "arrow.right")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                phaseChip(index: 1)
            }

            Text("Total remaining: \(viewModel.formattedTotalRemaining)")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding(.horizontal)
    }

    private func phaseChip(index: Int) -> some View {
        let isActive = viewModel.hybridPhaseIndex == index
        let label = viewModel.level.hybridPhaseLabels[index]
        let goal = viewModel.level.hybridPhaseGoal(phase: index)
        return VStack(spacing: 2) {
            Text("Phase \(index + 1)")
                .font(.caption2)
                .foregroundStyle(isActive ? .white : .secondary)
            Text("\(label) · \(goal) reps")
                .font(.caption)
                .fontWeight(isActive ? .semibold : .regular)
                .foregroundStyle(isActive ? .white : .secondary)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(isActive ? Color.red : Color(UIColor.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }

    // MARK: - Timer Section

    /// Time progress ring wrapping the countdown display.
    /// The ring fills as time elapses through the current phase.
    private var timerSection: some View {
        ZStack {
            // Background track
            Circle()
                .stroke(Color(UIColor.secondarySystemBackground), lineWidth: 10)
                .frame(width: 200, height: 200)

            // Time progress arc — fills clockwise as the phase elapses
            Circle()
                .trim(from: 0, to: viewModel.timeProgress)
                .stroke(
                    timerRingColor,
                    style: StrokeStyle(lineWidth: 10, lineCap: .round)
                )
                .frame(width: 200, height: 200)
                .rotationEffect(.degrees(-90))
                .animation(.linear(duration: 0.1), value: viewModel.timeProgress)

            // Timer digits + subtitle
            VStack(spacing: 4) {
                Text(viewModel.formattedTime)
                    .font(.system(size: 52, weight: .bold, design: .rounded))
                    .foregroundStyle(timerColor)
                    .monospacedDigit()
                    .contentTransition(.numericText(countsDown: true))

                Text(timerSubtitle)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                    .tracking(2)
            }
        }
    }

    private var timerColor: Color {
        let t = viewModel.currentPhaseTimeRemaining
        if t > 5 * 60 { return .primary }
        if t > 60     { return .orange }
        return .red
    }

    /// Ring uses brand pink normally, pulses red when a rep boundary is imminent.
    private var timerRingColor: Color {
        viewModel.isNearRepBoundary ? .red : Color(red: 1.0, green: 0.21, blue: 0.41)
    }

    private var timerSubtitle: String {
        if viewModel.isHybrid {
            return "PHASE \(viewModel.hybridPhaseIndex + 1) · \(viewModel.hybridPhaseLabel.uppercased())"
        }
        return "TIME REMAINING"
    }

    // MARK: - Rep Pace Guide Chip

    /// Shows "Next rep in Xs" during the workout so the user can keep pace.
    /// Turns red and pulses in the last 4 seconds before each rep boundary.
    private var repPaceChip: some View {
        Group {
            if let paceText = viewModel.repPaceGuideText {
                HStack(spacing: 6) {
                    Image(systemName: viewModel.isNearRepBoundary ? "exclamationmark.circle.fill" : "timer")
                        .font(.caption)
                    Text(paceText)
                        .font(.caption.bold())
                        .contentTransition(.numericText(countsDown: true))
                }
                .foregroundStyle(viewModel.isNearRepBoundary ? .white : .secondary)
                .padding(.horizontal, 14)
                .padding(.vertical, 6)
                .background(
                    Capsule()
                        .fill(viewModel.isNearRepBoundary
                              ? Color.red
                              : Color(UIColor.secondarySystemBackground))
                )
                .animation(.easeInOut(duration: 0.2), value: viewModel.isNearRepBoundary)
                .scaleEffect(viewModel.isNearRepBoundary ? 1.05 : 1.0)
                .animation(
                    viewModel.isNearRepBoundary
                        ? .easeInOut(duration: 0.4).repeatForever(autoreverses: true)
                        : .default,
                    value: viewModel.isNearRepBoundary
                )
            }
        }
    }

    // MARK: - Rep Counter

    private var repCounterSection: some View {
        VStack(spacing: 16) {
            ZStack {
                Circle()
                    .stroke(Color(UIColor.tertiarySystemBackground), lineWidth: 12)
                    .frame(width: 180, height: 180)

                Circle()
                    .trim(from: 0, to: viewModel.progress)
                    .stroke(
                        viewModel.isCompleted ? Color.green : Color.red,
                        style: StrokeStyle(lineWidth: 12, lineCap: .round)
                    )
                    .frame(width: 180, height: 180)
                    .rotationEffect(.degrees(-90))
                    .animation(.easeInOut(duration: 0.3), value: viewModel.progress)

                VStack(spacing: 4) {
                    Text("\(viewModel.currentDisplayRep)")
                        .font(.system(size: 48, weight: .bold, design: .rounded))
                        .foregroundStyle(viewModel.isCompleted ? .green : .primary)
                        .contentTransition(.numericText())

                    Text("/ \(viewModel.currentPhaseGoal)")
                        .font(.system(size: 20, weight: .medium, design: .rounded))
                        .foregroundStyle(.secondary)
                }
            }
            .contentShape(Circle())
            .onTapGesture {
                withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
                    viewModel.incrementRep()
                }
            }

            HStack(spacing: 32) {
                Button {
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
                        viewModel.decrementRep()
                    }
                } label: {
                    Image(systemName: "minus.circle.fill")
                        .font(.system(size: 44))
                        .foregroundStyle(.red)
                }
                .buttonStyle(.plain)
                .disabled(viewModel.currentReps == 0)
                .opacity(viewModel.currentReps == 0 ? 0.3 : 1.0)

                Button {
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
                        viewModel.incrementRep()
                    }
                } label: {
                    ZStack {
                        Circle()
                            .fill(Color.red.gradient)
                            .frame(width: 100, height: 100)
                        Image(systemName: "plus")
                            .font(.system(size: 32, weight: .bold))
                            .foregroundStyle(.white)
                    }
                }
                .buttonStyle(.plain)
                .scaleEffect(viewModel.isRunning ? 1.0 : 0.9)
                .animation(.easeInOut(duration: 0.2), value: viewModel.isRunning)

                Button {
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
                        viewModel.incrementRep()
                    }
                } label: {
                    Image(systemName: "plus.circle.fill")
                        .font(.system(size: 44))
                        .foregroundStyle(.green)
                }
                .buttonStyle(.plain)
            }

            Text("TAP TO LOG REP")
                .font(.caption)
                .foregroundStyle(.secondary)
                .tracking(1.5)
        }
        .padding(.vertical)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(Color(UIColor.secondarySystemBackground))
        )
        .padding(.horizontal)
    }

    // MARK: - Controls

    private var controlButtonsSection: some View {
        HStack(spacing: 16) {
            if viewModel.isRunning {
                Button { viewModel.pauseTimer() } label: {
                    Label("Pause", systemImage: "pause.fill")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.orange.gradient)
                        .foregroundStyle(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }
            } else if viewModel.canStart {
                Button {
                    if !warmupChecked {
                        showWarmupPrompt = true
                    } else {
                        viewModel.startTimer()
                    }
                } label: {
                    Label("Start", systemImage: "play.fill")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.green.gradient)
                        .foregroundStyle(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }
            }

            Button {
                warmupChecked = false
                showWarmupPrompt = false
                viewModel.resetTimer()
            } label: {
                Label("Reset", systemImage: "arrow.counterclockwise")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color(UIColor.secondarySystemBackground))
                    .foregroundStyle(.primary)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            }
        }
        .padding(.horizontal)
    }

    // MARK: - Save Workout Button

    private var saveWorkoutButton: some View {
        Button {
            onComplete?(viewModel.createSession())
        } label: {
            Label("Save Workout", systemImage: "checkmark.circle.fill")
                .font(.headline)
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.green.gradient)
                .foregroundStyle(.white)
                .clipShape(RoundedRectangle(cornerRadius: 12))
        }
        .padding(.horizontal)
    }

    // MARK: - Tutorial Link

    private var tutorialLinkSection: some View {
        let isBeginnerTrack = viewModel.level.track == .beginner
        return Link(destination: URL(string: viewModel.level.tutorialURL)!) {
            HStack {
                Image(systemName: "play.rectangle.fill").font(.title3)
                VStack(alignment: .leading, spacing: 2) {
                    Text(isBeginnerTrack ? "Open Beginner Video" : "Open Tutorials").font(.headline)
                    Text("Learn proper form").font(.caption).foregroundStyle(.secondary)
                }
                Spacer()
                Image(systemName: "arrow.up.right").font(.caption)
            }
            .padding()
            .background(Color(UIColor.secondarySystemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
        .padding(.horizontal)
    }

    // MARK: - Warmup Hint

    private var warmupHint: some View {
        HStack(spacing: 6) {
            Image(systemName: "figure.strengthtraining.traditional")
                .font(.caption)
                .foregroundStyle(.secondary)
            Text("Warm up first. Train smart.")
                .font(.caption)
                .italic()
                .foregroundStyle(.secondary)
        }
    }

    // MARK: - Warmup Prompt

    private var warmupPromptView: some View {
        VStack(spacing: 12) {
            Text("Did you warm up?")
                .font(.subheadline)
                .fontWeight(.bold)
                .foregroundStyle(.orange)

            VStack(spacing: 8) {
                Button {
                    warmupChecked = true
                    showWarmupPrompt = false
                    viewModel.startTimer()
                } label: {
                    Label("Yes, Start Workout", systemImage: "play.fill")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.green.gradient)
                        .foregroundStyle(.white)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }

                if onShowWarmup != nil {
                    Button {
                        showWarmupPrompt = false
                        onShowWarmup?()
                    } label: {
                        Label("Show Warm-up", systemImage: "figure.walk")
                            .font(.headline)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color(UIColor.secondarySystemBackground))
                            .foregroundStyle(.orange)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color.orange, lineWidth: 1)
                            )
                    }
                }
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.orange, lineWidth: 1)
        )
        .padding(.horizontal)
    }

    // MARK: - Cooldown Banner

    private var cooldownBanner: some View {
        VStack(spacing: 10) {
            Text("Great job. Cool down for 5–10 min.")
                .font(.subheadline)
                .fontWeight(.bold)
                .foregroundStyle(.green)

            if onShowCooldown != nil {
                Button {
                    onShowCooldown?()
                } label: {
                    Label("Show Cool-down", systemImage: "figure.cooldown")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color(UIColor.secondarySystemBackground))
                        .foregroundStyle(.green)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color.green, lineWidth: 1)
                        )
                }
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.green, lineWidth: 1)
        )
        .padding(.horizontal)
    }

    // MARK: - Countdown Overlay

    private func countdownOverlay(value: Int) -> some View {
        ZStack {
            Color.black.opacity(0.75).ignoresSafeArea()
            VStack(spacing: 12) {
                Text(value > 0 ? "\(value)" : "GO!")
                    .font(.system(size: 140, weight: .black, design: .rounded))
                    .foregroundStyle(value > 0 ? .white : .yellow)
                    .id(value)
                    .transition(.asymmetric(
                        insertion: .scale(scale: 1.4).combined(with: .opacity),
                        removal: .scale(scale: 0.6).combined(with: .opacity)
                    ))
                    .animation(.spring(response: 0.3, dampingFraction: 0.6), value: value)

                if value > 0 {
                    Text("GET READY")
                        .font(.headline)
                        .foregroundStyle(.white.opacity(0.7))
                        .tracking(4)
                }
            }
        }
    }
}

#Preview {
    SessionTimerView(viewModel: SessionTimerViewModel(level: LevelDatabase.advancedLevels[0], workoutMode: .hybrid))
}
