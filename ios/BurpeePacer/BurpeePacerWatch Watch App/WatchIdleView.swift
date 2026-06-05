//
//  WatchIdleView.swift
//  BurpeePacerWatch Watch App
//

import SwiftUI

struct WatchIdleView: View {
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: "figure.strengthtraining.functional")
                .font(.system(size: 36))
                .foregroundStyle(.red)

            Text("BurpeePacers")
                .font(.headline)
                .fontWeight(.black)
                .foregroundStyle(.red)

            Text("Start workout\non iPhone")
                .font(.caption2)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
    }
}

#Preview {
    WatchIdleView()
}
