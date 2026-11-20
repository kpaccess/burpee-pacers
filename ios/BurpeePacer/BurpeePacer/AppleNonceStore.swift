//
//  AppleNonceStore.swift
//  BurpeePacer
//
//  Keeps the raw nonce for every Sign in with Apple request and returns the one
//  that matches the identity token Apple sends back.
//
//  SwiftUI's SignInWithAppleButton can call its request closure more than once
//  for a single tap. Storing only the latest nonce then hands Firebase a raw nonce
//  that doesn't match the token ("The nonce in ID Token ... does not match the
//  SHA256 hash of the raw nonce"). Looking the nonce up by the token's own `nonce`
//  claim always picks the right one.
//
//  This is a plain class (not @Observable) so storing a nonce never re-renders the view.
//

import Foundation

final class AppleNonceStore {
    /// SHA-256 hash (sent to Apple) → raw nonce (sent to Firebase).
    private var rawByHash: [String: String] = [:]

    /// Creates a new nonce, remembers it, and returns the hash to put on the Apple request.
    func makeHashedNonce() -> String {
        let raw = FirebaseService.randomNonceString()
        let hashed = FirebaseService.sha256(raw)
        rawByHash[hashed] = raw
        return hashed
    }

    /// The raw nonce whose hash is the `nonce` claim inside Apple's identity token.
    func rawNonce(forIdentityToken idToken: String) -> String? {
        guard let claim = Self.nonceClaim(in: idToken) else { return nil }
        return rawByHash[claim]
    }

    func reset() {
        rawByHash.removeAll()
    }

    private static func nonceClaim(in idToken: String) -> String? {
        let parts = idToken.split(separator: ".")
        guard parts.count >= 2 else { return nil }

        var payload = String(parts[1])
            .replacingOccurrences(of: "-", with: "+")
            .replacingOccurrences(of: "_", with: "/")
        payload += String(repeating: "=", count: (4 - payload.count % 4) % 4)

        guard let data = Data(base64Encoded: payload),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            return nil
        }
        return json["nonce"] as? String
    }
}
