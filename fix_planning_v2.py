import os

path = r'c:\Users\Chinc\Downloads\prof.-acerta+-3.1\pages\Planning.tsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Goal: Rebuild the tail end of the component structure starting from the "not found" block.
# We want to find the line that starts the currentPlan ternary and ensure everything below is perfect.

new_lines = []
for i, line in enumerate(lines):
    # Stop before we hit the chaotic closing block
    # We'll recognize line 1740 (the end of "not found" div)
    if 'Voltar à Lista' in line and (i + 5 < len(lines)) and ')}' in lines[i+2]:
         # We found the block end.
         # Let's write the correct sequence.
         new_lines.append(line)
         continue
    
    if i > 1738 and i < 1745: # The chaotic zone
        continue # We'll replace this
    
    if i == 1739: # The button end
        new_lines.append(line)
        new_lines.append('                                    </button>\n')
        new_lines.append('                                </div>\n')
        new_lines.append('                            )}\n')
        new_lines.append('                        </div>\n')
        new_lines.append('                    )}\n')
        new_lines.append('                </div>\n')
        continue

    new_lines.append(line)

# Let's try a different approach. I'll just overwrite the exact lines 1740-1744.
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Final surgical fix
# Line 1740 corresponds to index 1739
lines[1740] = '                                </div>\n'
lines[1741] = '                        )}\n'
lines[1742] = '                    </div>\n'
lines[1743] = '                )}\n'
lines[1744] = '            </div>\n'

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Planning.tsx structure fixed surgically.")
