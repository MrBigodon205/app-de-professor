import os

path = r'c:\Users\Chinc\Downloads\prof.-acerta+-3.1\pages\Planning.tsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Surgical fix at the exact spot
# Based on view from step 2282:
# 1739: </button>
# 1740: </div> (closes not found div)
# 1741: </div> (EXCESSIVE)
# 1742: )}
# 1743: </div>
# 1744: )}
# 1745: </div>

# We want:
# 1740: </div> (closes not found)
# 1741: )}
# 1742: </div>
# 1743: )}
# 1744: </div>

# Let's rebuild the lines array carefully from 1740 onwards.
new_lines = lines[:1740] # Keep up to line 1739 (button end)
new_lines.append('                                </div>\n') # Closes "not found" div (1740)
new_lines.append('                        )}\n') # Closes Ternary 2 {currentPlan ? (1741)
new_lines.append('                    </div>\n') # Closes 1316 div (1742)
new_lines.append('                )}\n') # Closes Ternary 1 chain (1743)
new_lines.append('            </div>\n') # Closes 1115 div (1744)

# Keep the rest
new_lines.extend(lines[1745:])

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Planning.tsx structure fixed with perfection.")
