//
//  RecoveryDisclosureGroup.swift
//  BurpeePacer
//
//  Created by Krishna pradhan on 2026-05-21.
//

import SwiftUI

struct Exercise: Identifiable {
    let id = UUID()
    let name: String
    let duration: String
    let cue: String
}
struct RecoveryDisclosureGroup: View {
    @State private var isExpanded = false
    @State private var selectedTab: Tab = .warmup
    
    enum Tab {
        case warmup, cooldown
    }
    
    private let warmupExercises = [
        Exercise(name: "Arm Circles", duration: "30 sec each direction", cue: "Start small, gradually widen the circles"),
        Exercise(name: "Shoulder Rolls", duration: "10 reps forward, 10 backward", cue: "Roll shoulders fully — up, back, down, forward"),
        Exercise(name: "Hip Circles", duration: "10 reps each direction", cue: "Hands on hips, draw wide circles with your pelvis"),
        Exercise(name: "Bodyweight Squats", duration: "10 reps", cue: "Slow and controlled — feel your hips and knees open up"),
        Exercise(name: "Step-Back Walkouts", duration: "8 reps", cue: "Step back, walk hands out to plank, walk back, stand up"),
        Exercise(name: "Light Jogging / Marching in Place", duration: "1–2 minutes", cue: "Raise your knees, swing your arms — get your heart rate up")
    ]
    
    private let cooldownExercises = [
        Exercise(name: "Slow Walking", duration: "2–3 minutes", cue: "Keep moving — don't sit down immediately after a workout"),
        Exercise(name: "Chest Stretch", duration: "30 sec each side", cue: "Clasp hands behind back, open chest, look slightly up"),
        Exercise(name: "Shoulder Stretch", duration: "30 sec each side", cue: "Pull arm across chest, keep shoulder relaxed and down"),
        Exercise(name: "Child's Pose", duration: "60 seconds", cue: "Arms extended forward, breathe deeply into your lower back"),
        Exercise(name: "Hip Flexor Stretch", duration: "30 sec each side", cue: "Kneel on one knee, push hips forward — feel the front of your hip"),
        Exercise(name: "Deep Breathing", duration: "5 slow breaths", cue: "In for 4 counts, hold 2, out for 6 — activate your rest response")
    ]
    
    var body: some View {
        DisclosureGroup(isExpanded: $isExpanded) {
            VStack(alignment: .leading, spacing: 16) {
                Text("A 5-minute warm-up reduces injury risk. A 5–10 minute cool-down speeds recovery. Build the habit — it compounds over 6 months.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .padding(.top, 4)
                
                Picker("Routine", selection: $selectedTab) {
                    Text("Warm-up (5–8 min)").tag(Tab.warmup)
                    Text("Cool-down (5–10 min)").tag(Tab.cooldown)
                }
                .pickerStyle(.segmented)
                .padding(.vertical, 4)
                
                if selectedTab == .warmup {
                    workoutList(exercises: warmupExercises, accentColor: .green)
                } else {
                    workoutList(exercises: cooldownExercises, accentColor: .cyan)
                }
                
                Divider()
                    .padding(.vertical, 4)
                
                // Epsom salt tip
                VStack(alignment: .leading, spacing: 4) {
                    Text("RECOVERY TIP (OPTIONAL)")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundStyle(.secondary)
                    
                    Text("A warm Epsom salt bath (1–2 cups in warm water, 15–20 min) may help reduce muscle soreness for some people after a tough session. This is optional — listen to your body.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.cyan.opacity(0.08))
                .cornerRadius(8)
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(Color.cyan.opacity(0.2), lineWidth: 1)
                )
                
                // Safety disclaimer
                VStack(alignment: .leading, spacing: 4) {
                    Text("SAFETY FIRST")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundStyle(.orange)
                    
                    Text("If you are over 40, have a pre-existing medical condition, or have been sedentary for more than 6 months, consult your doctor before starting this program. Stop immediately and seek medical attention if you experience sharp pain, chest tightness, dizziness, or shortness of breath. This program is not a substitute for professional medical advice.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.orange.opacity(0.08))
                .cornerRadius(8)
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(Color.orange.opacity(0.2), lineWidth: 1)
                )
            }
            .padding(.top, 8)
        } label: {
            HStack {
                Image(systemName: "heart.text.square.fill")
                    .font(.title3)
                    .foregroundStyle(.red)
                
                Text("Warm-up, Cool-down & Recovery")
                    .font(.headline)
                    .foregroundStyle(.primary)
                
                Spacer()
            }
        }
        .padding()
        .background(Color(UIColor.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .animation(.default, value: isExpanded)
    }
    
    private func workoutList(exercises: [Exercise], accentColor: Color) -> some View {
        VStack(spacing: 10) {
            ForEach(Array(exercises.enumerated()), id: \.element.id) { index, ex in
                HStack(alignment: .top, spacing: 12) {
                    Text("\(index + 1).")
                        .font(.subheadline)
                        .fontWeight(.bold)
                        .foregroundStyle(accentColor)
                        .frame(width: 18, alignment: .leading)
                        .padding(.top, 2)
                    
                    VStack(alignment: .leading, spacing: 2) {
                        Text(ex.name)
                            .font(.subheadline)
                            .fontWeight(.bold)
                        
                        Text(ex.duration)
                            .font(.caption)
                            .foregroundStyle(accentColor)
                        
                        Text(ex.cue)
                            .font(.caption)
                            .italic()
                            .foregroundStyle(.secondary)
                    }
                    
                    Spacer()
                }
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color(UIColor.tertiarySystemBackground))
                .cornerRadius(8)
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(Color(UIColor.separator).opacity(0.5), lineWidth: 0.5)
                )
            }
        }
    }
}

#Preview {
    RecoveryDisclosureGroup()
        .padding()
        .background(Color(UIColor.systemBackground))
}
