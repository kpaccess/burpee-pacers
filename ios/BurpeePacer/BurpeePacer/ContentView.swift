//
//  ContentView.swift
//  BurpeePacer
//
//  Created by Krishna pradhan on 2026-05-21.
//

import SwiftUI

struct ContentView: View {
    @Bindable var appViewModel: AppViewModel
    @State private var showAuth = false
    @State private var startWithSignUp = false

    var body: some View {
        Group {
            if appViewModel.firebase.isLoading {
                ZStack {
                    Color.black.ignoresSafeArea()
                    VStack(spacing: 12) {
                        Image("AppLogo")
                            .resizable()
                            .scaledToFit()
                            .frame(width: 100, height: 100)
                            .clipShape(RoundedRectangle(cornerRadius: 22))
                        Text("BurpeePacers")
                            .font(.largeTitle)
                            .fontWeight(.black)
                            .foregroundStyle(.red)
                        ProgressView()
                            .tint(.red)
                            .padding(.top, 8)
                    }
                }
                .preferredColorScheme(.dark)

            } else if appViewModel.firebase.currentUser == nil {
                if showAuth {
                    SignInView(firebase: appViewModel.firebase, startWithSignUp: startWithSignUp)
                } else {
                    LandingView { signUp in
                        startWithSignUp = signUp
                        showAuth = true
                    }
                }

            } else if appViewModel.needsTrackSelection {
                // New user — pick a track before entering the dashboard
                TrackSelectionView(
                    currentTrack: nil,
                    onSelect: { appViewModel.updateTrack($0) }
                )
                .preferredColorScheme(.dark)

            } else {
                DashboardView(viewModel: appViewModel)
                    .preferredColorScheme(.dark)
            }
        }
    }
}

#Preview {
    ContentView(appViewModel: AppViewModel())
}
