import os
import glob

directory = r"C:\Programs\RosDom"
target_str = "com.example.rosdom"
replacement_str = "ru.rosdom"

extensions = ['kt', 'kts', 'xml']
count = 0

for ext in extensions:
    for filepath in glob.glob(directory + f"/**/*.{ext}", recursive=True):
        try:
            with open(filepath, 'r', encoding='utf-8') as file:
                content = file.read()
            if target_str in content:
                content = content.replace(target_str, replacement_str)
                with open(filepath, 'w', encoding='utf-8') as file:
                    file.write(content)
                count += 1
                print(f"Replaced in {filepath}")
        except Exception as e:
            print(f"Failed {filepath}: {e}")

print(f"Replaced strings in {count} files.")
