sed -i 's/import { User, Activity, AlertCircle, ArrowLeft } from '\''lucide-react'\'';/import { User, Activity, AlertCircle, ArrowLeft } from '\''lucide-react'\'';\nimport stadiumBg from '\''..\/assets\/images\/stadium_atmosphere_1789303106987.jpg'\'';/g' src/pages/PlayerProfile.tsx

# Let's replace the whole header div
# We will use sed to find the "Player Header" section and replace it.
# Actually it's easier to just write a Node script to replace it.
