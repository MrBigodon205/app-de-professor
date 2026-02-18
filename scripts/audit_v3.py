import re

path = r'c:\Users\Chinc\Downloads\prof.-acerta+-3.1\pages\Planning.tsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

def detailed_audit():
    stack = []
    # Simplified regex for tags, ignoring self-closing
    tag_pattern = re.compile(r'<(/?)([a-zA-Z0-9.-]+)([^>]*)>')
    
    for i, line in enumerate(lines):
        l_num = i + 1
        # ignore comments
        code = line.split('//')[0].split('/*')[0]
        
        for match in tag_pattern.finditer(code):
            is_closing = match.group(1) == '/'
            tag_name = match.group(2)
            attrs = match.group(3)
            
            # self-closing detection (very basic)
            if attrs.strip().endswith('/') or tag_name in ['br', 'img', 'hr', 'input']:
                continue
            
            if is_closing:
                if not stack:
                    print(f"[{l_num}] EXTRA CLOSING TAG: </{tag_name}>")
                else:
                    open_tag, open_line = stack.pop()
                    if open_tag != tag_name:
                        print(f"[{l_num}] MISMATCH: Found </{tag_name}>, expected </{open_tag}> (from line {open_line})")
                        # put it back to try to recover
                        stack.append((open_tag, open_line))
            else:
                stack.append((tag_name, l_num))
    
    if stack:
        print("\nUNCLOSED TAGS AT END:")
        for tag, l in stack:
            print(f" - <{tag}> from line {l}")

detailed_audit()
