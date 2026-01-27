import re

path = r'c:\Users\Chinc\Downloads\prof.-acerta+-3.1\pages\Planning.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

def detailed_audit(text):
    # Remove template literals (content inside backticks)
    # This is a bit naive but should work for this file
    text_no_templates = re.sub(r'`[\s\S]*?`', '`TEMPLATE_STRING_REMOVED`', text)
    
    # Remove comments
    text_no_comments = re.sub(r'//.*', '', text_no_templates)
    text_no_comments = re.sub(r'/\*[\s\S]*?\*/', '', text_no_comments)
    
    lines = text_no_comments.split('\n')
    stack = []
    # Match tags
    tag_pattern = re.compile(r'<(/?)([a-zA-Z0-9.-]+)([^>]*)>')
    
    for i, line in enumerate(lines):
        l_num = i + 1
        for match in tag_pattern.finditer(line):
            is_closing = match.group(1) == '/'
            tag_name = match.group(2)
            attrs = match.group(3)
            
            # Skip self-closing and non-JSX tags like <currentPlan.subject...
            if attrs.strip().endswith('/') or tag_name in ['br', 'img', 'hr', 'input']:
                continue
            
            # Simple check for things like <currentPlan.subject... which aren't tags
            if '.' in tag_name:
                continue

            if is_closing:
                if not stack:
                    print(f"[{l_num}] EXTRA CLOSING TAG: </{tag_name}> | Line: {line.strip()}")
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

detailed_audit(content)
