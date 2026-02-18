import os

path = r'c:\Users\Chinc\Downloads\prof.-acerta+-3.1\pages\Planning.tsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    l_num = i + 1
    
    # Fix 1: Close Sidebar (L939)
    # The sidebar content ends at L1112: </div>
    # We should add a closing div at L1113
    if l_num == 1113 and 'Main Content' in lines[i+1]:
        # If line 1113 is not already a closing div
        if line.strip() != '</div>':
             new_lines.append('            </div>\n')
    
    # Fix 2: Close Metadata (L1397)
    # The grid ends at L1446: </div>
    # We should add a closing div at L1447
    if l_num == 1447 and 'CONTENT PREVIEW CARDS' in lines[i+1]:
        if line.strip() != '</div>':
             new_lines.append('                                    </div>\n')

    new_lines.append(line)

# Final trailing cleanup
# We need to make sure the end of the component matches the depth.
# Main (1) -> Sidebar (2) - CLOSED
# Main (1) -> MainContent (3)
#   MC (3) -> Ternary1 (showForm) branch 3 (ViewMode)
#     ViewMode (4) -> WrapperDiv (5) - L1316
#       WrapperDiv (5) -> currentPlan Ternary (6)
#         Ternary (6) -> min-h-full Div (7) - L1318
#           depth 7 closed at L1728
#         Ternary (6) else -> not-found Div (7) - L1730
#           depth 7 closed at L1740
#         Ternary (6) end at L1741
#       WrapperDiv (5) closed at L1742
#     Ternary1 end at L1743
#   MC (3) closed at L1744?
# Wait, L1115 is depth 3. L1744 closes it. Correct.
# L920 (Main) depth 1. L1764 closes it. Correct.

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Planning.tsx structural repairs applied (Sidebar L939 and Metadata L1397).")
