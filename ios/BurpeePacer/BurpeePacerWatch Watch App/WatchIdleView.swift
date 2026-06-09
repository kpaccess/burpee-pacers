//
//  WatchIdleView.swift
//  BurpeePacerWatch Watch App
//

import SwiftUI

struct WatchIdleView: View {
    @Environment(WatchSessionManager.self) var session

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: "figure.strengthtraining.functional")
                .font(.system(size: 36))
                .foregroundStyle(.red)

            Text("BurpeePacers")
                .font(.headline)
                .fontWeight(.black)
                .foregroundStyle(.red)

            Button {
                session.tapStart()
            } label: {
                Text("Start")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .tint(.red)
        }
        .padding()
    }
}

#Preview {
    WatchIdleView()
}
