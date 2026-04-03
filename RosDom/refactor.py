import os
import shutil
import glob

base_dir = r"c:\Programs\RosDom\app\src\main\java"
test_dir = r"c:\Programs\RosDom\app\src\test\java"
androidTest_dir = r"c:\Programs\RosDom\app\src\androidTest\java"

old_pkg = "com.example.rosdom"
new_pkg = "ru.rosdom"

def refactor_dir(java_dir):
    old_path = os.path.join(java_dir, "com", "example", "rosdom")
    new_path = os.path.join(java_dir, "ru", "rosdom")
    
    if os.path.exists(old_path):
        os.makedirs(os.path.dirname(new_path), exist_ok=True)
        if not os.path.exists(new_path):
            shutil.move(old_path, new_path)
        
        # Clean up empty com/example dirs if they are empty
        try:
            os.rmdir(os.path.join(java_dir, "com", "example"))
            os.rmdir(os.path.join(java_dir, "com"))
        except:
            pass

refactor_dir(base_dir)
refactor_dir(test_dir)
refactor_dir(androidTest_dir)

# Now replace strings in all code files
replace_count = 0
for root, _, files in os.walk(r"c:\Programs\RosDom"):
    for file in files:
        if file.endswith(".kt") or file.endswith(".kts") or file.endswith(".xml"):
            fp = os.path.join(root, file)
            with open(fp, "r", encoding="utf-8") as f:
                content = f.read()
            if old_pkg in content:
                content = content.replace(old_pkg, new_pkg)
                with open(fp, "w", encoding="utf-8") as f:
                    f.write(content)
                replace_count += 1
                
print("Refactored dirs and replaced in", replace_count, "files.")
