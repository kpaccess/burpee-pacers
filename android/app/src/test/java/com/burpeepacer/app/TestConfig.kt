package com.burpeepacer.app

import com.burpeepacer.app.model.ProgramCatalog
import java.io.File

/** Loads the same bundled program-config.json the app ships (unit tests run from the `app` module dir). */
object TestConfig {
    fun load() {
        ProgramCatalog.loadFromJson(File("src/main/assets/program-config.json").readText())
    }
}
