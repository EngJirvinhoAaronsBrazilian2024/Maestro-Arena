const fs = require('fs');
let code = fs.readFileSync('src/pages/Home.tsx', 'utf8');

code = code.replace("import MatchCard from '../components/sports/MatchCard';", "import { MatchCard } from '../components/sports/MatchCard';");
code = code.replace("import { useFavorites } from '../context/FavoritesContext';", "import { useFavorites } from '../hooks/useFavorites';");
code = code.replace("import { useArticles } from '../hooks/useNews';", "import { useArticles } from '../services/news/hooks';");
code = code.replace("export default function Home() {", "export function Home() {");

fs.writeFileSync('src/pages/Home.tsx', code, 'utf8');
