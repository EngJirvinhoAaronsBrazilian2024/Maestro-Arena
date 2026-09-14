const fs = require('fs');

let quizCode = fs.readFileSync('src/pages/FootballQuiz.tsx', 'utf8');

// Find the line index where the second `return (` starts after my added `return (`
const lines = quizCode.split('\n');

// We know line 443 is `  return (` and line 444 is `          <div key={q.id}...`
// Let's just find `  return (` that is followed immediately by `          <div key={q.id}...`
let newLines = [];
let skip = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('  return (') && lines[i+1] && lines[i+1].includes('<div key={q.id} className="bg-white/60 backdrop-blur-xl rounded-[32px]')) {
    skip = true; // this is the start of the junk
    // We want to insert the correct final return block here
    newLines.push(`  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 min-h-[calc(100vh-80px)]">
      {gameState === 'loading' && (
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-slate-500 font-bold uppercase tracking-widest animate-pulse">Loading...</p>
        </div>
      )}
      
      {gameState === 'landing' && renderLanding()}
      
      {gameState === 'playing' && questions.length > 0 && (
        <QuizQuestionCard 
          question={questions[currentIndex]}
          currentNumber={currentIndex + 1}
          totalQuestions={questions.length}
          timeRemaining={timeRemaining}
          onAnswerSubmit={handleAnswerSubmit}
          onNextQuestion={nextQuestion}
        />
      )}
      
      {gameState === 'results' && renderResults()}
      {gameState === 'review' && renderReview()}
    </div>
  );
}`);
    break; // We're done processing after this.
  } else {
    newLines.push(lines[i]);
  }
}

fs.writeFileSync('src/pages/FootballQuiz.tsx', newLines.join('\n'), 'utf8');

