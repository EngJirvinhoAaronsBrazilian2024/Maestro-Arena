const fs = require('fs');
const CATEGORIES = [
  'La Liga', 'Serie A', 'Bundesliga', 
  'UEFA Champions League', 'UEFA Europa League', 'African Football', 'African Cup of Nations', 'Football Players', 
  'Football Clubs', 'Football History', 'Football Records', 'Football Rules', 'Famous Managers'
];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Expert'];

const newMocks = [];
for (const category of CATEGORIES) {
  for (const difficulty of DIFFICULTIES) {
    for (let i = 1; i <= 10; i++) {
      newMocks.push({
        id: `m_${category.replace(/\s+/g, '')}_${difficulty}_${i}`,
        question: `Sample ${difficulty} question ${i} about ${category}?`,
        category: category,
        difficulty: difficulty,
        options: [
          `Correct Answer for ${category} Q${i}`,
          `Wrong Answer 1`,
          `Wrong Answer 2`,
          `Wrong Answer 3`
        ],
        correctAnswer: `Correct Answer for ${category} Q${i}`,
        explanation: `This is the explanation for ${category} question ${i}.`,
        hint: `Hint for ${category} question ${i}`
      });
    }
  }
}

let mockContent = fs.readFileSync('src/services/mockQuestions.ts', 'utf8');
const exportLine = 'export const MOCK_QUESTIONS: QuizQuestion[] = [';
const parts = mockContent.split(exportLine);
let newMocksString = JSON.stringify(newMocks, null, 2).slice(1, -1) + ',';
const newContent = parts[0] + exportLine + '\n  ' + newMocksString + parts[1];
fs.writeFileSync('src/services/mockQuestions.ts', newContent);
console.log('Added remaining categories!');
