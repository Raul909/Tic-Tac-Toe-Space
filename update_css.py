import re

file_path = 'tictactoe/public/index.html'

with open(file_path, 'r') as f:
    content = f.read()

# Remove the problematic grid rule
# It looks like:
#   .grid {
#     grid-template-columns: 1fr !important;
#   }
# I'll use a regex to match it flexibly with whitespace.
content = re.sub(r'\s*\.grid\s*\{\s*grid-template-columns:\s*1fr\s*!important;\s*\}', '', content)

# Replace button { inside media queries
# This is trickier with regex because of nesting, but the structure is fairly simple.
# I'll look for specific context.

# Context 1: @media (max-width: 768px) ... button { ... }
# The button rule is:
#   button {
#     padding: 0.5rem 1rem !important;
#     font-size: 0.875rem !important;
#   }

content = content.replace(
    'button {\n        padding: 0.5rem 1rem !important;\n        font-size: 0.875rem !important;\n      }',
    'button:not(.aspect-square) {\n        padding: 0.5rem 1rem !important;\n        font-size: 0.875rem !important;\n      }'
)

# Context 2: @media (max-width: 480px) ... button { ... }
# The button rule is:
#   button {
#     padding: 0.4rem 0.8rem !important;
#     font-size: 0.75rem !important;
#   }

content = content.replace(
    'button {\n        padding: 0.4rem 0.8rem !important;\n        font-size: 0.75rem !important;\n      }',
    'button:not(.aspect-square) {\n        padding: 0.4rem 0.8rem !important;\n        font-size: 0.75rem !important;\n      }'
)

with open(file_path, 'w') as f:
    f.write(content)

print("CSS updated successfully.")
