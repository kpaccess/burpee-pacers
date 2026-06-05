# BurpeePacer

A minimalist, high-yield fitness tracker built around 20-minute time-capped burpee workouts following the Busy People Program.

## 🏗️ Architecture

This app follows the **MVVM (Model-View-ViewModel)** architecture pattern with SwiftUI and modern Swift Concurrency.

### Project Structure

```
BurpeePacer/
├── Models.swift                      # Core data models
├── AppViewModel.swift                # Main app state management
├── SessionTimerViewModel.swift       # Timer-specific logic
├── ContentView.swift                 # App entry point
├── DashboardView.swift              # Main dashboard layout
├── SessionTimerView.swift           # Workout timer interface
├── HeaderView.swift                 # Status header component
├── StatsOverviewCard.swift          # User profile & stats
├── WorkoutCalendarGridView.swift    # Monthly calendar grid
├── RecoveryDisclosureGroup.swift    # Warm-up/cool-down guide
└── ProgressPhotosSection.swift      # Photo tracking
```

## 🎯 Key Features

### 1. **SessionTimerView** 
A fully-featured 20-minute countdown timer with:
- **Smooth countdown** using Combine's Timer publisher
- **Rep counter** with large tap target and +/- controls
- **Visual progress ring** showing completion percentage
- **Color-coded time warnings** (red when < 1 min remaining)
- **Tutorial video links** specific to each level
- **Resilient state management** that handles pause/resume

**ViewModel (`SessionTimerViewModel`):**
- Uses `@Observable` macro for modern SwiftUI state management
- Implements precise timer logic with background resilience
- Tracks reps and calculates progress
- Creates WorkoutSession records on completion

### 2. **DashboardView**
The main hub combining all components:
- Header with program status and reset option
- Stats overview with weight tracking and protein calculator
- Current level card with "Start Workout" button
- Recovery guidelines (collapsible)
- Monthly workout calendar
- Progress photos section
- CSV export functionality
- 48-hour rest reminder

### 3. **Workout Calendar**
Interactive monthly grid displaying:
- **Mon/Wed/Fri** as workout days (checkable)
- **Other days** automatically marked as "Rest"
- **Completed sessions** show level code badge (e.g., "B1", "A3")
- **Missed workouts** flagged in red with X icon
- **Today's date** highlighted with red border
- **Month navigation** with smooth animations

### 4. **Program Tracks**

#### Beginner Track (No Push-ups)
- B1: 20 reps in 20 min
- B2: 40 reps in 20 min
- B3: 55 reps in 20 min
- B4: 70 reps in 20 min
- B5: 90 reps in 20 min
- B6: 110 reps in 20 min

#### Advanced Track (With Push-ups)
- A1: 30 reps in 20 min
- A2: 50 reps in 20 min
- A3: 75 reps in 20 min
- A4: 100 reps in 20 min
- A5: 150 reps in 20 min

### 5. **Auto-calculated Metrics**
- **Protein Target:** Automatically calculates daily protein (1.5g × weight in kg)
- **Days Since Start:** Tracks program progression
- **Level Progression:** Auto-advances when workout target is met

### 6. **Data Persistence**
All data is stored locally using UserDefaults:
- User profile (weight, start date, current level)
- Workout session history
- Progress photos
- No cloud dependency—complete privacy

### 7. **Data Portability**
Export complete workout history as CSV file:
- Date
- Level ID
- Reps Completed
- Target Reps
- Completion Status

## 🎨 Design System

### Dark Mode First
- Strict dark mode aesthetic
- Background: `Color(UIColor.systemBackground)` → `#09090b`
- Cards: `Color(UIColor.secondarySystemBackground)` → `#1c1c1e`

### Accent Colors
- **Red/Crimson:** Primary actions, active states, warnings
- **Green:** Completion, success states, start button
- **Orange:** Pause, caution states

### Typography
- **Dynamic Type** support throughout
- **Rounded system font** for timers and numerical displays
- **Bold weights** for readability during workouts
- **Monospaced digits** for timer consistency

### SF Symbols
All icons use Apple's SF Symbols for native consistency:
- `figure.strengthtraining.traditional`
- `timer`
- `play.circle.fill`
- `heart.text.square.fill`
- And many more...

## 🔧 Technical Implementation

### State Management
- **`@Observable` macro** (Swift 5.10+) for ViewModels
- **`@State` and `@Binding`** for view-local state
- Automatic SwiftUI updates on property changes

### Timer Implementation
```swift
Timer.publish(every: 0.1, on: .main, in: .common)
    .autoconnect()
    .sink { [weak self] _ in
        self?.updateTimer()
    }
```
- 0.1 second intervals for smooth countdown
- Calculates elapsed time from start timestamp
- Maintains accurate countdown even with UI updates

### Calendar Logic
- Uses Foundation's `Calendar` APIs
- Generates monthly grids dynamically
- Matches workout sessions to calendar dates
- Auto-flags missed workouts based on date comparison

### Photo Handling
- **PhotosUI framework** for native photo picking
- Stores photos as Data in UserDefaults
- Converts to SwiftUI `Image` for display
- 6-month milestone locked until 180 days elapsed

## 🚀 Getting Started

### Requirements
- iOS 17.0+
- Xcode 15.0+
- Swift 5.10+

### Running the App
1. Open the project in Xcode
2. Build and run on iPhone simulator or device
3. The app initializes with default beginner settings
4. Tap "Start Workout" to begin your first session

### First Time Setup
1. Set your current weight (kg or lbs)
2. Add a Day 1 baseline photo
3. Choose your track (Beginner or Advanced)
4. Review the recovery guidelines
5. Start your first 20-minute workout

## 📱 User Flow

1. **Dashboard** → View stats, current level, calendar
2. **Tap "Start Workout"** → Opens SessionTimerView sheet
3. **Start Timer** → 20-minute countdown begins
4. **Tap Center Button** → Log each completed rep
5. **Monitor Progress** → Visual ring shows completion %
6. **Time Expires** → Session auto-pauses
7. **Close Sheet** → Session saved to history
8. **Auto-Advance** → If target met, level increases

## 🎯 Future Enhancements

Potential additions:
- SwiftData migration for better data modeling
- HealthKit integration for calories/heart rate
- Notifications for scheduled workout days
- Custom workout templates
- Social sharing features
- Apple Watch companion app
- Widgets for quick stats

## 📄 License

Created by Krishna Pradhan on 2026-05-21.

---

Built with ❤️ using SwiftUI
