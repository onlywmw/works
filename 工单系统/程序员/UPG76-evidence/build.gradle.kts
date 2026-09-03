plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.mov.android"
    compileSdk = 36

    packaging {
        resources.excludes += "META-INF/LICENSE*"
        resources.excludes += "META-INF/NOTICE*"
        resources.excludes += "META-INF/LICENSE.txt"
        resources.excludes += "META-INF/NOTICE.txt"
        resources.excludes += "META-INF/README*"
    }

    defaultConfig {
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        applicationId = "com.mov.android"
        minSdk = 26
        targetSdk = 36
        versionCode = 1
        versionName = "V1.0"

        // Unlimited-OCR: JNI 桥接（mov_ocr_jni.cpp）；大 .so 走 jniLibs 预编译
        externalNativeBuild {
            cmake {
                cppFlags += "-std=c++17"
                abiFilters += "arm64-v8a"
            }
        }
        ndk {
            abiFilters += "arm64-v8a"
        }
    }

    externalNativeBuild {
        cmake {
            path = file("src/main/cpp/CMakeLists.txt")
            version = "3.22.1"
        }
    }

    signingConfigs {
        create("release") {
            val spFile = providers.gradleProperty("MOV_STORE_FILE").orNull
            val spPass = providers.gradleProperty("MOV_STORE_PASSWORD").orNull
            val spAlias = providers.gradleProperty("MOV_KEY_ALIAS").orNull
            val spKeyPass = providers.gradleProperty("MOV_KEY_PASSWORD").orNull
            if (spFile != null && spPass != null && spAlias != null && spKeyPass != null) {
                storeFile = file(spFile)
                storePassword = spPass
                keyAlias = spAlias
                keyPassword = spKeyPass
            }
            // 缺失时 signingConfig 无效 → assembleRelease 报错（天然 fail-loud）
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("release")
            // UPG-16：release 任务图 fail-loud（缺签名参数只在 release 任务报错，不绑架日常 dev）
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    testOptions {
        // JVM 单测触达 android.util.Log 的路径（如 DeepSeekAdapter.parseSse 诊断日志）返回默认值而非抛 "not mocked"
        unitTests.isReturnDefaultValues = true
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    // 源码直接在 app/src/main/kotlin（复制自 kotlin-port/src/main/kotlin）
}

dependencies {
    androidTestImplementation("androidx.test:runner:1.5.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test:core:1.5.0")
    androidTestImplementation("junit:junit:4.13.2")
    implementation("androidx.appcompat:appcompat:1.7.1")
    implementation("androidx.drawerlayout:drawerlayout:1.1.1") // 侧边栏抽屉（侧滑手势 + 遮罩）
    implementation("com.google.android.material:material:1.11.0") // BottomSheetDialog——设置页底部弹出
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.webkit:webkit:1.11.0") // WebViewAssetLoader——assets 走 https:// 避免 file:// 下 markstream-vue 报错
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.1")
    implementation(project(":memory-api"))
    implementation(project(":tool-orch"))
    implementation(project(":memory-os"))
    // UPG-76：复用 mov-exec-engine 纯 JVM 件（CanonicalCodec 参数指纹）——禁造第三份 canonical
    implementation(project(":mov-exec-engine"))
    implementation("androidx.documentfile:documentfile:1.0.1")
    implementation("androidx.exifinterface:exifinterface:1.3.7")
    implementation("com.osmerion.sqlite.android:sqlite-android:0.4.0")
    // md 排版（AI 消息渲染——底层 commonmark，对齐 dsh AST 渲染思路）
    implementation("io.noties.markwon:core:4.6.2")
    implementation("io.noties.markwon:ext-tables:4.6.2")  // 表格（等宽对齐文本表）
    implementation("io.noties.markwon:ext-strikethrough:4.6.2")
    implementation("ru.noties:jlatexmath-android:0.2.0")  // LaTeX 数学公式渲染
    testImplementation("junit:junit:4.13.2")  // 纯函数单测（MathExtractor/MdPreprocess 等）
    testImplementation("org.json:json:20240303")  // UPG-03：单测 JVM 用真 org.json（android.jar stub 的 JSONObject 全 null——真实查票 PARSE_DRIFT 根因）
    // commonmark AST（表格分块渲染——TableLayout 自动对齐；与 Markwon 同源 com.atlassian 0.13，避免双版本冲突）
    implementation("com.atlassian.commonmark:commonmark:0.13.0")
    implementation("com.atlassian.commonmark:commonmark-ext-gfm-tables:0.13.0")
    implementation("com.google.mlkit:text-recognition-chinese:16.0.1")
    implementation("com.google.mlkit:barcode-scanning:17.3.0")  // UPG-02 qr.scan
    implementation("com.tom-roush:pdfbox-android:2.0.27.0")
}

// UPG-16：release 任务图 fail-loud（缺签名参数只在 release 任务报错，不绑架日常 dev）
tasks.matching { it.name.contains("Release") && it.name.contains("assemble") }.configureEach {
    doFirst {
        val missing = listOf("MOV_STORE_FILE", "MOV_STORE_PASSWORD", "MOV_KEY_ALIAS", "MOV_KEY_PASSWORD")
            .filter { providers.gradleProperty(it).orNull.isNullOrBlank() }
        if (missing.isNotEmpty()) error("UPG-16: 缺签名参数 $missing（请在 gradle.properties 或 ~/.gradle/gradle.properties 配置；此文件不入 git）")
    }
}
