import java.io.File

val baseDir = File("c:/Programs/RosDom")
val oldPkg = "com.example.rosdom"
val newPkg = "ru.rosdom"

val targetSrcDirs = listOf(
    File(baseDir, "app/src/main/java"),
    File(baseDir, "app/src/test/java"),
    File(baseDir, "app/src/androidTest/java")
)

fun refactorDir(javaDir: File) {
    val oldPath = File(javaDir, "com/example/rosdom")
    val newPath = File(javaDir, "ru/rosdom")
    if (oldPath.exists()) {
        newPath.mkdirs()
        oldPath.listFiles()?.forEach { file ->
            val dest = File(newPath, file.name)
            file.renameTo(dest)
        }
        var current = oldPath
        while (current.exists() && current.listFiles()?.isEmpty() == true) {
            current.delete()
            current = current.parentFile
        }
    }
}

targetSrcDirs.forEach { refactorDir(it) }

var count = 0
baseDir.walkTopDown().filter { it.isFile && (it.extension == "kt" || it.extension == "kts" || it.extension == "xml") }.forEach { file ->
    val content = file.readText(Charsets.UTF_8)
    if (content.contains(oldPkg)) {
        file.writeText(content.replace(oldPkg, newPkg), Charsets.UTF_8)
        count++
    }
}
println("Refactored $count files.")
