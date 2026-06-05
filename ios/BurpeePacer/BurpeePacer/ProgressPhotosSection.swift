//
//  ProgressPhotosSection.swift
//  BurpeePacer
//
//  Created by Krishna pradhan on 2026-05-21.
//

import SwiftUI
import PhotosUI

struct ProgressPhotosSection: View {
    @State private var day1Photo: PhotosPickerItem?
    @State private var day1Image: Image?
    @State private var sixMonthPhoto: PhotosPickerItem?
    @State private var sixMonthImage: Image?
    
    let daysSinceStart: Int
    var remoteDay1Url: String? = nil
    
    var isSixMonthUnlocked: Bool {
        daysSinceStart >= 180
    }
    
    var body: some View {
        VStack(spacing: 16) {
            HStack {
                Image(systemName: "photo.on.rectangle.angled")
                    .font(.title3)
                    .foregroundStyle(.red)
                
                Text("Progress Photos")
                    .font(.headline)
                
                Spacer()
            }
            
            HStack(spacing: 16) {
                // Day 1 Photo
                VStack(spacing: 8) {
                    PhotosPicker(selection: $day1Photo, matching: .images) {
                        ZStack {
                            RoundedRectangle(cornerRadius: 12)
                                .fill(Color(UIColor.tertiarySystemBackground))
                                .frame(height: 200)
                            
                            if let day1Image {
                                day1Image
                                    .resizable()
                                    .scaledToFill()
                                    .frame(height: 200)
                                    .clipShape(RoundedRectangle(cornerRadius: 12))
                            } else if let urlString = remoteDay1Url, let url = URL(string: urlString) {
                                AsyncImage(url: url) { phase in
                                    switch phase {
                                    case .success(let image):
                                        image.resizable().scaledToFill()
                                            .frame(height: 200)
                                            .clipShape(RoundedRectangle(cornerRadius: 12))
                                    case .failure:
                                        placeholderContent
                                    default:
                                        ProgressView()
                                    }
                                }
                                .frame(height: 200)
                            } else {
                                placeholderContent
                            }
                        }
                    }
                    .onChange(of: day1Photo) { _, newValue in
                        Task {
                            if let data = try? await newValue?.loadTransferable(type: Data.self),
                               let uiImage = UIImage(data: data) {
                                day1Image = Image(uiImage: uiImage)
                                saveImage(data, key: "day1Photo")
                            }
                        }
                    }
                    
                    Text("Day 1 Baseline")
                        .font(.caption)
                        .fontWeight(.semibold)
                }
                
                // 6-Month Check-in
                VStack(spacing: 8) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 12)
                            .fill(isSixMonthUnlocked ? Color(UIColor.tertiarySystemBackground) : Color(UIColor.systemGray5))
                            .frame(height: 200)
                        
                        if isSixMonthUnlocked {
                            PhotosPicker(selection: $sixMonthPhoto, matching: .images) {
                                if let sixMonthImage {
                                    sixMonthImage
                                        .resizable()
                                        .scaledToFill()
                                        .frame(height: 200)
                                        .clipShape(RoundedRectangle(cornerRadius: 12))
                                } else {
                                    VStack(spacing: 8) {
                                        Image(systemName: "photo.badge.plus")
                                            .font(.largeTitle)
                                            .foregroundStyle(.secondary)
                                        Text("Add Photo")
                                            .font(.caption)
                                            .foregroundStyle(.secondary)
                                    }
                                }
                            }
                            .onChange(of: sixMonthPhoto) { _, newValue in
                                Task {
                                    if let data = try? await newValue?.loadTransferable(type: Data.self),
                                       let uiImage = UIImage(data: data) {
                                        sixMonthImage = Image(uiImage: uiImage)
                                        saveImage(data, key: "sixMonthPhoto")
                                    }
                                }
                            }
                        } else {
                            VStack(spacing: 8) {
                                Image(systemName: "lock.fill")
                                    .font(.largeTitle)
                                    .foregroundStyle(.secondary)
                                Text("Locked")
                                    .font(.caption)
                                    .fontWeight(.semibold)
                                    .foregroundStyle(.secondary)
                                Text("\(180 - daysSinceStart) days to go")
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                    
                    Text("6-Month Check-in")
                        .font(.caption)
                        .fontWeight(.semibold)
                }
            }
        }
        .padding()
        .background(Color(UIColor.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .onAppear {
            loadSavedImages()
        }
    }
    
    private var placeholderContent: some View {
        VStack(spacing: 8) {
            Image(systemName: "photo.badge.plus")
                .font(.largeTitle)
                .foregroundStyle(.secondary)
            Text("Add Photo")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }

    // MARK: - Image Persistence
    
    private func saveImage(_ data: Data, key: String) {
        UserDefaults.standard.set(data, forKey: key)
    }
    
    private func loadSavedImages() {
        // Load Day 1 Photo
        if let data = UserDefaults.standard.data(forKey: "day1Photo"),
           let uiImage = UIImage(data: data) {
            day1Image = Image(uiImage: uiImage)
        }
        
        // Load 6-Month Photo
        if let data = UserDefaults.standard.data(forKey: "sixMonthPhoto"),
           let uiImage = UIImage(data: data) {
            sixMonthImage = Image(uiImage: uiImage)
        }
    }
}

#Preview {
    ProgressPhotosSection(daysSinceStart: 45)
        .padding()
        .background(Color(UIColor.systemBackground))
}
