import java.io.File;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;
import java.nio.charset.StandardCharsets;

public class Refactor {
    public static void main(String[] args) throws Exception {
        String baseDir = "c:/Programs/RosDom";
        String oldPkg = "com.example.rosdom";
        String newPkg = "ru.rosdom";
        
        File root = new File(baseDir);
        refactorDir(new File(root, "app/src/main/java"));
        refactorDir(new File(root, "app/src/test/java"));
        refactorDir(new File(root, "app/src/androidTest/java"));
        
        System.out.println("Beginning string replacements...");
        replaceStrings(root, oldPkg, newPkg);
        System.out.println("Done!");
    }
    
    static void refactorDir(File javaDir) {
        File oldPath = new File(javaDir, "com/example/rosdom");
        File newPath = new File(javaDir, "ru/rosdom");
        
        if (oldPath.exists()) {
            newPath.mkdirs();
            File[] files = oldPath.listFiles();
            if (files != null) {
                for (File f : files) {
                    System.out.println("Moving " + f.getName());
                    f.renameTo(new File(newPath, f.getName()));
                }
            }
            File current = oldPath;
            while (current.exists() && current.listFiles() != null && current.listFiles().length == 0) {
                current.delete();
                current = current.getParentFile();
            }
        }
    }
    
    static void replaceStrings(File dir, String oldStr, String newStr) throws Exception {
        File[] files = dir.listFiles();
        if (files == null) return;
        
        for (File f : files) {
            if (f.isDirectory() && !f.getName().equals("build") && !f.getName().equals(".gradle")) {
                replaceStrings(f, oldStr, newStr);
            } else if (f.isFile() && (f.getName().endsWith(".kt") || f.getName().endsWith(".kts") || f.getName().endsWith(".xml"))) {
                String content = new String(Files.readAllBytes(Paths.get(f.getAbsolutePath())), StandardCharsets.UTF_8);
                if (content.contains(oldStr)) {
                    content = content.replace(oldStr, newStr);
                    Files.write(Paths.get(f.getAbsolutePath()), content.getBytes(StandardCharsets.UTF_8));
                    System.out.println("Replaced in " + f.getAbsolutePath());
                }
            }
        }
    }
}
