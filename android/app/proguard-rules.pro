# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.kts.

# Gson reflects over these (shared program config + persisted workout logs); keep names and fields for release builds.
-keep class com.burpeepacer.app.model.ProgramConfigFile { *; }
-keep class com.burpeepacer.app.model.ProgramConfigFile$* { *; }
-keep class com.burpeepacer.app.model.WorkoutLog { *; }
-keepattributes Signature
-keepattributes *Annotation*
