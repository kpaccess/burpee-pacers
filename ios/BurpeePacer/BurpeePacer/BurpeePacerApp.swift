//
//  BurpeePacerApp.swift
//  BurpeePacer
//
//  Created by Krishna pradhan on 2026-05-21.
//

import SwiftUI
import FirebaseCore
import GoogleSignIn
import UIKit

@main
struct BurpeePacerApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    
    // Use StateObject or a lazily initialized State to ensure it happens after init()
    @State private var appViewModel: AppViewModel

    init() {
        FirebaseApp.configure()
        // Initialize the state here, after Firebase is ready
        _appViewModel = State(initialValue: AppViewModel())
    }

    var body: some Scene {
        WindowGroup {
            ContentView(appViewModel: appViewModel)
        }
    }
}

class AppDelegate: NSObject, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        return true
    }

    func application(_ app: UIApplication,
                     open url: URL,
                     options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return GIDSignIn.sharedInstance.handle(url)
    }
}
