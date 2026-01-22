import os
import re

def clean_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Regex to find JSDoc-style blocks that contain the intern explanation marker
    # Pattern: /** ... GIẢI THÍCH CHO THỰC TẬP SINH ... */
    # We use re.DOTALL to make '.' match newlines
    pattern = r'/\*\*.*?\bGIẢI THÍCH CHO THỰC TẬP SINH\b.*?\*/'
    
    # Replace found blocks with an empty string or a cleaner placeholder if needed.
    # The user wants them gone, so we'll remove them.
    # Also clean up potential double newlines left behind.
    new_content = re.sub(pattern, '', content, flags=re.DOTALL)
    
    if new_content != content:
        # Strip leading/trailing newlines which might increase after block removal
        # But we don't want to mess up the whole file, just the isolated block space.
        # So we just write the new content.
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    return False

def main():
    root_dir = '/home/mguser/ducnv/ecommerce-main/web'
    count = 0
    modified = 0
    
    for root, dirs, files in os.walk(root_dir):
        # Skip node_modules and .next
        if 'node_modules' in root or '.next' in root or '.git' in root:
            continue
            
        for file in files:
            if file.endswith(('.ts', '.tsx', '.js', '.jsx')):
                count += 1
                if clean_file(os.path.join(root, file)):
                    modified += 1
                    
    print(f"Processed {count} files. Modified {modified} files.")

if __name__ == "__main__":
    main()
