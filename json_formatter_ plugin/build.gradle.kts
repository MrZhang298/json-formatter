plugins {
    id("java")
    id("org.jetbrains.intellij") version "1.17.3"
}

group = "org.example"
version = "1.0-SNAPSHOT"

repositories {
    mavenCentral()
}

java {
    sourceCompatibility = JavaVersion.VERSION_11
    targetCompatibility = JavaVersion.VERSION_11
}

intellij {
    version.set("2021.3")
    type.set("IC")
}

tasks {
    patchPluginXml {
        sinceBuild.set("213")
        untilBuild.set("250.*")
    }
}

dependencies {
}

tasks.test {
    useJUnitPlatform()
}
tasks.withType<JavaCompile> {
    options.encoding = "UTF-8"
}
