import re

path = r'c:\Users\Chinc\Downloads\prof.-acerta+-3.1\pages\Planning.tsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

def check_balance():
    div_stack = []
    braces_depth = 0
    parens_depth = 0
    
    # Regex to find tags
    tag_re = re.compile(r'<(/?)([a-zA-Z0-9.-]+)([^>]*)>')
    
    for i, line in enumerate(lines):
        l_num = i + 1
        # Simplified: scan for tags
        # We need to be careful with strings and curly braces
        
        # Count braces and parens for depth
        clean_line = line.split('//')[0].split('/*')[0]
        braces_depth += clean_line.count('{') - clean_line.count('}')
        parens_depth += clean_line.count('(') - clean_line.count(')')
        
        for match in tag_re.finditer(line):
            is_closing = match.group(1) == '/'
            tag_name = match.group(2)
            attrs = match.group(3)
            
            # Skip self-closing and certain tags
            if attrs.strip().endswith('/') or tag_name in ['br', 'img', 'hr', 'input']:
                continue
                
            if is_closing:
                if not div_stack:
                    print(f"Error: Unexpected closing tag </{tag_name}> at line {l_num}")
                else:
                    open_tag = div_stack.pop()
                    if open_tag != tag_name:
                        print(f"Error: Tag mismatch. Expected </{open_tag}> but found </{tag_name}> at line {l_num}")
            else:
                div_stack.append(tag_name)
        
        if l_num == 1740:
            print(f"At Line 1740: Stack={div_stack} | Braces={braces_depth} | Parens={parens_depth}")

check_balance()
print("Scan complete.")
