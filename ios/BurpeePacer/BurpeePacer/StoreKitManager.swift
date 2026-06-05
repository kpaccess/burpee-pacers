//
//  StoreKitManager.swift
//  BurpeePacer
//

import Foundation
import StoreKit

@Observable
final class StoreKitManager {
    
    // Product ID for the Pro tier
    static let proProductID = "com.burpeepacers.pro"
    
    var products: [Product] = []
    var purchasedProductIDs = Set<String>()
    var isLoading = true
    
    private var transactionListener: Task<Void, Error>?
    
    init() {
        // Start listening for transactions as soon as the manager is created
        transactionListener = listenForTransactions()
        
        Task {
            await fetchProducts()
            await updatePurchasedProducts()
        }
    }
    
    deinit {
        transactionListener?.cancel()
    }
    
    /// Fetches the Pro product from the App Store
    @MainActor
    func fetchProducts() async {
        isLoading = true
        do {
            self.products = try await Product.products(for: [Self.proProductID])
        } catch {
            print("Failed to fetch products: \(error)")
        }
        isLoading = false
    }
    
    /// Checks for currently owned products
    @MainActor
    func updatePurchasedProducts() async {
        var isCurrentlyPro = false
        for await result in StoreKit.Transaction.currentEntitlements {
            guard case .verified(let transaction) = result else { continue }
            
            if transaction.revocationDate == nil {
                self.purchasedProductIDs.insert(transaction.productID)
                if transaction.productID == Self.proProductID {
                    isCurrentlyPro = true
                }
            } else {
                self.purchasedProductIDs.remove(transaction.productID)
            }
        }
        
        // isPro is managed server-side by the Stripe webhook — no client write needed
    }
    
    /// Initiates a purchase for a product
    @MainActor
    func purchase(_ product: Product) async throws -> StoreKit.Transaction? {
        let result = try await product.purchase()
        
        switch result {
        case .success(let verification):
            guard case .verified(let transaction) = verification else {
                throw StoreError.failedVerification
            }
            
            // Deliver content to the user
            await updatePurchasedProducts()
            
            // Finish the transaction
            await transaction.finish()
            
            return transaction
            
        case .userCancelled:
            return nil
            
        case .pending:
            return nil
            
        @unknown default:
            return nil
        }
    }
    
    /// Continuously listens for transaction updates (e.g., successful purchases, refunds)
    private func listenForTransactions() -> Task<Void, Error> {
        return Task.detached {
            for await result in StoreKit.Transaction.updates {
                guard case .verified(let transaction) = result else { continue }
                
                // Deliver content to the user
                await MainActor.run {
                    if transaction.revocationDate == nil {
                        self.purchasedProductIDs.insert(transaction.productID)
                    } else {
                        self.purchasedProductIDs.remove(transaction.productID)
                    }
                }
                
                // Always finish the transaction
                await transaction.finish()
            }
        }
    }
    
    @MainActor
    func restorePurchases() async {
        try? await AppStore.sync()
        await updatePurchasedProducts()
    }
    
    var hasPro: Bool {
        return purchasedProductIDs.contains(Self.proProductID)
    }
}

enum StoreError: Error {
    case failedVerification
}
