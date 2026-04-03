import java.io.*;

public class GradleBuild {
    public static void main(String[] args) {
        try {
            ProcessBuilder pb = new ProcessBuilder("cmd.exe", "/c", "gradlew.bat clean assembleDebug");
            pb.directory(new File("c:/Programs/RosDom"));
            pb.redirectErrorStream(true);
            Process p = pb.start();
            
            try (BufferedReader br = new BufferedReader(new InputStreamReader(p.getInputStream()));
                 PrintWriter pw = new PrintWriter(new FileWriter("gradle_log.txt"))) {
                String line;
                while ((line = br.readLine()) != null) {
                    pw.println(line);
                }
            }
            p.waitFor();
            System.out.println("Done!");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
