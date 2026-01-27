import os

path = r'c:\Users\Chinc\Downloads\prof.-acerta+-3.1\pages\Planning.tsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Verify balance of 1115 div and its contents
depth_div = 0
depth_braces = 0
depth_parens = 0

# Main loop to find where things go wrong
for i, line in enumerate(lines):
    l_num = i + 1
    # Very crude count
    depth_div += line.count('<div') - line.count('</div>')
    # Filter out comments and strings as best as possible
    clean_line = line.split('//')[0].split('/*')[0] # ignore comments
    depth_braces += clean_line.count('{') - clean_line.count('}')
    depth_parens += clean_line.count('(') - clean_line.count(')')
    
    if l_num in [1115, 1116, 1127, 1315, 1316, 1317, 1318, 1728, 1729, 1740, 1741, 1742, 1743, 1744]:
        print(f"Line {l_num:4}: Divs={depth_div:2}, Braces={depth_braces:2}, Parens={depth_parens:2} | Content: {line.strip()[:50]}")

# Final Structure fix
# Based on the analysis, I will rebuild the end of the component precisely.
# I want to be 100% sure we are at:
# At the end of "not found" button:
# DIV_NF is open (1)
# SUB_TERNARY is open (1)
# DIV_ELSE is open (1)
# MAIN_TERNARY is open (1)
# DIV_MAIN is open (1)

raw_content = "".join(lines)
# I'll use a regex to replace the whole block from 1720 to the end.
# Actually, I'll just re-write the file from line 1115 to 1768 to be absolutely clean.
