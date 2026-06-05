//
//  WorkoutCalendarGridView.swift
//  BurpeePacer
//
//  Created by Krishna pradhan on 2026-05-21.
//

import SwiftUI

struct WorkoutCalendarGridView: View {
    @Bindable var viewModel: AppViewModel
    @State private var selectedMonth: Date = Date()
    @State private var selectedDay: CalendarDay? = nil
    
    private let columns = Array(repeating: GridItem(.flexible(), spacing: 8), count: 7)
    private let weekdays = ["S", "M", "T", "W", "T", "F", "S"]
    
    var body: some View {
        VStack(spacing: 16) {
            // Month Navigation
            monthNavigationHeader
            
            // Weekday Headers
            LazyVGrid(columns: columns, spacing: 8) {
                ForEach(weekdays.indices, id: \.self) { i in
                    Text(weekdays[i])
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity)
                }
            }
            
            // Calendar Grid
            LazyVGrid(columns: columns, spacing: 8) {
                ForEach(Array(paddedDays.enumerated()), id: \.offset) { _, day in
                    if let day = day {
                        calendarCell(for: day)
                    } else {
                        Color.clear
                            .frame(height: 50)
                    }
                }
            }
            
            // Legend
            legendView
        }
        .padding()
        .background(Color(UIColor.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
    
    // MARK: - Month Navigation
    
    private var monthNavigationHeader: some View {
        HStack {
            Button(action: {
                changeMonth(by: -1)
            }) {
                Image(systemName: "chevron.left.circle.fill")
                    .font(.title2)
                    .foregroundStyle(.red)
            }
            
            Spacer()
            
            Text(monthYearText)
                .font(.headline)
                .fontWeight(.bold)
            
            Spacer()
            
            Button(action: {
                changeMonth(by: 1)
            }) {
                Image(systemName: "chevron.right.circle.fill")
                    .font(.title2)
                    .foregroundStyle(.red)
            }
        }
    }
    
    private var monthYearText: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMMM yyyy"
        return formatter.string(from: selectedMonth)
    }
    
    // MARK: - Calendar Cell
    
    @ViewBuilder
    private func calendarCell(for day: CalendarDay) -> some View {
        let dayNumber = Calendar.current.component(.day, from: day.date)
        let isToday = Calendar.current.isDateInToday(day.date)
        
        ZStack {
            RoundedRectangle(cornerRadius: 8)
                .fill(cellBackgroundColor(for: day.state))
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .strokeBorder(isToday ? Color.red : Color.clear, lineWidth: 2)
                )
            
            VStack(spacing: 4) {
                Text("\(dayNumber)")
                    .font(.system(.callout, design: .rounded))
                    .fontWeight(isToday ? .bold : .regular)
                    .foregroundStyle(textColor(for: day.state))
                
                stateIndicator(for: day.state)
            }
        }
        .frame(height: 50)
        .contentShape(Rectangle())
        .onTapGesture {
            if case .completed = day.state {
                selectedDay = day
            }
        }
        .sheet(item: $selectedDay) { tappedDay in
            workoutDetailSheet(for: tappedDay)
        }
    }
    
    @ViewBuilder
    private func stateIndicator(for state: DayState) -> some View {
        switch state {
        case .rest:
            Text("Rest")
                .font(.system(size: 8))
                .foregroundStyle(.secondary)
        case .scheduled:
            Image(systemName: "circle")
                .font(.system(size: 8))
                .foregroundStyle(.gray)
        case .completed(_, let levelCode, let mode):
            VStack(spacing: 1) {
                Text(levelCode)
                    .font(.system(size: 8, weight: .bold))
                Text(mode.shortName)
                    .font(.system(size: 7, weight: .semibold))
                    .opacity(0.85)
            }
            .foregroundStyle(.white)
            .padding(.horizontal, 3)
            .padding(.vertical, 2)
            .background(Color.green)
            .clipShape(RoundedRectangle(cornerRadius: 4))
        case .missed:
            Image(systemName: "xmark")
                .font(.system(size: 10, weight: .bold))
                .foregroundStyle(.red)
        }
    }
    
    private func cellBackgroundColor(for state: DayState) -> Color {
        switch state {
        case .rest:
            return Color(UIColor.systemBackground).opacity(0.5)
        case .scheduled:
            return Color(UIColor.tertiarySystemBackground)
        case .completed:
            return Color.green.opacity(0.2)
        case .missed:
            return Color.red.opacity(0.2)
        }
    }
    
    private func textColor(for state: DayState) -> Color {
        switch state {
        case .missed:
            return .red
        case .completed:
            return .green
        default:
            return .primary
        }
    }
    
    // MARK: - Legend
    
    private var legendView: some View {
        HStack(spacing: 16) {
            legendItem(color: .green, text: "Completed")
            legendItem(color: .red, text: "Missed")
            legendItem(color: .gray, text: "Scheduled")
        }
        .font(.caption)
    }
    
    private func legendItem(color: Color, text: String) -> some View {
        HStack(spacing: 4) {
            Circle()
                .fill(color)
                .frame(width: 8, height: 8)
            Text(text)
                .foregroundStyle(.secondary)
        }
    }
    
    // MARK: - Workout Detail Sheet

    @ViewBuilder
    private func workoutDetailSheet(for day: CalendarDay) -> some View {
        if case .completed(let reps, let levelCode, let mode) = day.state {
            let allModes: [WorkoutMode] = [.navySeals, .fiveCount, .hybrid]
            let completedTrack: ProgramTrack = levelCode.hasPrefix("B") ? .beginner : .advanced

            VStack(spacing: 20) {
                // Date + level header
                VStack(spacing: 4) {
                    Text(day.date, style: .date)
                        .font(.title2)
                        .fontWeight(.bold)
                    HStack(spacing: 6) {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundStyle(.green)
                        Text("Completed · Level \(levelCode)")
                            .foregroundStyle(.green)
                    }
                    .font(.subheadline)
                }
                .padding(.top, 28)

                // Workout type options — completed one is highlighted
                VStack(alignment: .leading, spacing: 10) {
                    Text("WORKOUT TYPE")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundStyle(.secondary)
                        .tracking(1.5)

                    VStack(spacing: 8) {
                        ForEach(allModes, id: \.self) { m in
                            let isDone = m == mode
                            HStack(spacing: 12) {
                                Image(systemName: modeIcon(m))
                                    .font(.title3)
                                    .foregroundStyle(isDone ? .white : .secondary)
                                    .frame(width: 28)

                                Text(m.displayName(for: completedTrack))
                                    .font(.headline)
                                    .foregroundStyle(isDone ? .white : .primary)

                                Spacer()

                                if isDone {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundStyle(.white)
                                }
                            }
                            .padding(.horizontal, 16)
                            .padding(.vertical, 12)
                            .background(isDone ? Color.green : Color(UIColor.secondarySystemBackground))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                        }
                    }
                }

                // Reps — only show if tracked (> 0)
                if reps > 0 {
                    HStack {
                        Text("\(reps)")
                            .font(.system(size: 44, weight: .black, design: .rounded))
                        Text("Reps\nCompleted")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.leading)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(20)
                    .background(Color(UIColor.secondarySystemBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                }

                Spacer()
            }
            .padding(.horizontal, 24)
            .presentationDetents([.medium, .large])
            .presentationDragIndicator(.visible)
        }
    }

    private func modeIcon(_ mode: WorkoutMode) -> String {
        switch mode {
        case .navySeals: return "star.fill"
        case .fiveCount: return "hand.raised.fill"
        case .hybrid:    return "arrow.triangle.2.circlepath"
        }
    }

    // MARK: - Helper Methods
    
    // generateCalendarDays already returns a full Sun–Sat grid, no extra padding needed
    private var paddedDays: [CalendarDay?] {
        viewModel.generateCalendarDays(for: selectedMonth).map { Optional($0) }
    }
    
    private func changeMonth(by offset: Int) {
        if let newMonth = Calendar.current.date(byAdding: .month, value: offset, to: selectedMonth) {
            selectedMonth = newMonth
        }
    }
}

#Preview {
    @Previewable @State var viewModel = AppViewModel()
    
    WorkoutCalendarGridView(viewModel: viewModel)
        .padding()
        .background(Color(UIColor.systemBackground))
}
