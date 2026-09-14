const fs = require('fs');

let quizCode = fs.readFileSync('src/pages/FootballQuiz.tsx', 'utf8');

quizCode = quizCode.replace(
  /const renderLanding = \(\) => \(\s*<div className="max-w-7xl mx-auto space-y-8">[\s\S]*?<\/div>\s*<\/div>\s*\);\s*const renderResults = \(\) => {/m,
  `const renderLanding = () => (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-[32px] p-8 md:p-12 text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-400 via-transparent to-transparent"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-widest text-blue-100">Pro Trivia</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight leading-[1.1]">The Ultimate<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">Football Quiz</span></h1>
          <p className="text-lg text-blue-100/80 mb-10 max-w-xl font-medium leading-relaxed">Test your football knowledge and prove you are a true football fan. Choose your category, set your difficulty, and beat the clock.</p>
          
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/quiz/daily" className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3.5 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-500/30">
              <Target className="w-5 h-5" /> Daily Challenge
            </Link>
            <Link to="/quiz/h2h" className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white px-6 py-3.5 rounded-xl font-bold transition-all flex items-center gap-2">
              <Users className="w-5 h-5" /> Head-to-Head
            </Link>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 bg-blue-50 rounded-xl">
                <LayoutGrid className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Quiz Setup</h2>
            </div>
            
            <div className="space-y-8">
              <div>
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Category</label>
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as QuizCategory | 'All')}
                    className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl px-5 py-4 pr-12 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="All">All Categories (Mixed)</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-5 pointer-events-none text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Difficulty</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {DIFFICULTIES.map(diff => (
                    <button
                      key={diff}
                      onClick={() => setSelectedDifficulty(diff)}
                      className={cn(
                        "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all cursor-pointer",
                        selectedDifficulty === diff ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-100 bg-white hover:border-slate-200 text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <span className="font-bold text-base mb-1">{diff}</span>
                      <span className="text-xs font-medium flex items-center gap-1 opacity-80"><Clock className="w-3 h-3" /> {DIFFICULTY_TIMES[diff]}s</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={startQuiz}
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-4.5 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all shadow-[0_8px_20px_rgba(15,23,42,0.15)] hover:-translate-y-0.5"
                >
                  <PlayCircle className="w-6 h-6" /> Start Quiz Now
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Stats & Leaderboard */}
        <div className="space-y-6">
          <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-5 flex items-center gap-2"><Activity className="w-4 h-4 text-slate-400"/> Your Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Best Score</p>
                <p className="text-2xl font-black text-slate-900">{userStats?.bestScore || 0}</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Played</p>
                <p className="text-2xl font-black text-slate-900">{userStats?.totalQuizzes || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900">Top Players</h3>
              </div>
            </div>
            
            {leaderboard.length > 0 ? (
              <div className="space-y-4">
                {leaderboard.map((entry, idx) => {
                  const accuracy = Math.round((entry.correctAnswers / entry.totalQuestions) * 100);
                  return (
                    <div key={entry.id || idx} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                          idx === 0 ? "bg-amber-100 text-amber-700" : 
                          idx === 1 ? "bg-slate-100 text-slate-600" : 
                          idx === 2 ? "bg-orange-50 text-orange-700" : "bg-slate-50 text-slate-500"
                        )}>
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{entry.userName}</p>
                          <p className="text-xs text-slate-500 font-medium">{accuracy}% Acc • {entry.difficulty}</p>
                        </div>
                      </div>
                      <span className="font-bold text-slate-900 bg-slate-50 px-2 py-1 rounded-lg text-sm">{entry.score} pts</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 font-medium bg-slate-50 rounded-2xl">
                No scores yet. Be the first!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderResults = () => {`
);

quizCode = quizCode.replace(
  /const renderResults = \(\) => {[\s\S]*?const renderReview = \(\) => \(/m,
  `const renderResults = () => {
    if (!finalResult) return null;
    const percentage = Math.round((finalResult.correctAnswers / finalResult.totalQuestions) * 100);
    
    let performanceMsg = "Keep Practicing";
    let perfColor = "text-slate-600 bg-slate-100";
    if (percentage >= 90) { performanceMsg = "Outstanding!"; perfColor = "text-green-700 bg-green-100"; }
    else if (percentage >= 70) { performanceMsg = "Great Job!"; perfColor = "text-blue-700 bg-blue-100"; }
    else if (percentage >= 50) { performanceMsg = "Good Attempt"; perfColor = "text-amber-700 bg-amber-100"; }

    return (
      <div className="max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-xl border border-slate-100 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-slate-50 to-transparent"></div>
          
          <div className="relative z-10">
            <div className="inline-block mb-6">
              <span className={cn("px-5 py-2 rounded-full text-sm font-black tracking-widest uppercase", perfColor)}>
                {performanceMsg}
              </span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-3 tracking-tight">Quiz Complete!</h2>
            <p className="text-lg text-slate-500 mb-10 font-medium">You completed the {finalResult.difficulty} {finalResult.category !== 'All' ? finalResult.category : 'Mixed'} challenge.</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
              <div className="bg-slate-50 border border-slate-100 p-6 rounded-[24px]">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Final Score</p>
                <p className="text-4xl font-black text-slate-900">{finalResult.score}</p>
              </div>
              <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-[24px]">
                <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-2">Accuracy</p>
                <p className="text-4xl font-black text-blue-600">{percentage}%</p>
              </div>
              <div className="bg-green-50/50 border border-green-100 p-6 rounded-[24px]">
                <p className="text-xs text-green-600 font-bold uppercase tracking-wider mb-2">Correct</p>
                <p className="text-4xl font-black text-green-600">{finalResult.correctAnswers}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-6 rounded-[24px]">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Time Taken</p>
                <p className="text-4xl font-black text-slate-900">{finalResult.timeTaken}s</p>
              </div>
            </div>
            
            <div className="grid sm:grid-cols-3 gap-4">
              <button
                onClick={() => { setGameState('landing'); startQuiz(); }}
                className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 transition-colors shadow-md"
              >
                <RotateCcw className="w-5 h-5" /> Play Again
              </button>
              <button
                onClick={() => setGameState('review')}
                className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-slate-900 text-white font-bold text-lg hover:bg-slate-800 transition-colors shadow-md"
              >
                <CheckCircle2 className="w-5 h-5" /> Review Answers
              </button>
              <button
                onClick={() => setGameState('landing')}
                className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-white text-slate-700 border border-slate-200 font-bold text-lg hover:bg-slate-50 transition-colors"
              >
                <LayoutGrid className="w-5 h-5" /> Back to Setup
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderReview = () => (`
);

quizCode = quizCode.replace(
  /const renderReview = \(\) => \([\s\S]*?return \(/m,
  `const renderReview = () => (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-green-500"/>
          Answer Review
        </h2>
        <button
          onClick={() => setGameState('results')}
          className="px-4 py-2 text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
        >
          Back to Results
        </button>
      </div>
      
      <div className="space-y-6">
        {questions.map((q, idx) => {
          const userAnswer = userAnswers.find(a => a.questionId === q.id);
          const isCorrect = userAnswer?.isCorrect;
          
          return (
            <div key={q.id} className="bg-white rounded-[32px] p-6 md:p-8 shadow-sm border border-slate-100">
              <div className="flex items-start gap-4 md:gap-6">
                <div className="mt-1 shrink-0">
                  {isCorrect ? (
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                      <XCircle className="w-6 h-6 text-red-600" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Question {idx + 1}</p>
                  <h3 className="text-xl font-bold text-slate-900 mb-6 leading-snug">{q.question}</h3>
                  
                  <div className="space-y-3 mb-6">
                    {q.options.map(opt => {
                      let optClass = "p-4 rounded-xl border-2 text-base font-semibold flex items-center justify-between ";
                      let icon = null;
                      
                      if (opt === q.correctAnswer) {
                        optClass += "border-green-500 bg-green-50 text-green-900";
                        icon = <CheckCircle2 className="w-5 h-5 text-green-600"/>;
                      } else if (opt === userAnswer?.answer) {
                        optClass += "border-red-500 bg-red-50 text-red-900";
                        icon = <XCircle className="w-5 h-5 text-red-600"/>;
                      } else {
                        optClass += "border-slate-100 bg-slate-50 text-slate-500";
                      }
                      
                      return (
                        <div key={opt} className={optClass}>
                          <span>{opt}</span>
                          {icon}
                        </div>
                      );
                    })}
                    
                    {!userAnswer?.answer || userAnswer.answer === '__TIMEOUT__' && (
                       <div className="p-4 rounded-xl border-2 border-amber-200 bg-amber-50 text-amber-900 text-base font-semibold mt-3 flex items-center gap-2">
                         <Clock className="w-5 h-5 text-amber-600" /> You did not answer this question in time.
                       </div>
                    )}
                  </div>
                  
                  <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 text-slate-700 text-sm leading-relaxed">
                    <span className="font-bold text-blue-900 block mb-1 uppercase tracking-wider text-xs">Explanation</span> 
                    {q.explanation}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <button
        onClick={() => setGameState('landing')}
        className="w-full flex items-center justify-center gap-2 py-5 rounded-2xl bg-slate-900 text-white font-bold text-lg hover:bg-slate-800 transition-colors shadow-lg"
      >
        Finish Review
      </button>
    </div>
  );

  return (`
);

fs.writeFileSync('src/pages/FootballQuiz.tsx', quizCode, 'utf8');

// Now fixing QuizQuestionCard.tsx
let cardCode = fs.readFileSync('src/components/quiz/QuizQuestionCard.tsx', 'utf8');

cardCode = cardCode.replace(
  /return \([\s\S]*/,
  `return (
    <div className="w-full max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Progress & Timer */}
      <div className="sticky top-16 z-20 pt-2 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pt-0 sm:bg-transparent">
        <div className="flex items-center justify-between mb-3 bg-white/80 backdrop-blur-md sm:bg-transparent py-2 rounded-xl px-2 sm:p-0">
          <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-lg">
            Question {currentNumber} <span className="text-slate-400 font-medium">of {totalQuestions}</span>
          </span>
          {timeRemaining !== null && (
            <div className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-black tracking-wider transition-colors duration-300",
              timeRemaining <= 5 ? "bg-red-100 text-red-700 animate-pulse" : "bg-blue-100 text-blue-700"
            )}>
              <Clock className="w-4 h-4" />
              <span>{timeRemaining}s</span>
            </div>
          )}
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full bg-blue-600 transition-all duration-300 rounded-full" 
            style={{ width: \`\${progressPercent}%\` }} 
          />
        </div>
      </div>

      {/* Question Text */}
      <div className="bg-white rounded-[32px] p-6 md:p-10 shadow-sm border border-slate-100">
        {question.image && (
          <div className="w-full aspect-video md:aspect-[21/9] rounded-2xl overflow-hidden mb-8 bg-slate-100 relative shadow-inner">
            <img 
              src={question.image} 
              alt="Quiz visual" 
              className="absolute inset-0 w-full h-full object-cover" 
            />
          </div>
        )}
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight mb-2">
          {question.question}
        </h2>
        
        {/* Hint Section */}
        {question.hint && !selectedAnswer && (
          <div className="mt-6">
            {!showHint ? (
              <button 
                onClick={() => setShowHint(true)}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 font-bold transition-colors bg-slate-50 hover:bg-blue-50 px-4 py-2 rounded-xl"
              >
                <HelpCircle className="w-4 h-4" /> Show Hint
              </button>
            ) : (
              <div className="p-4 bg-amber-50 text-amber-900 rounded-2xl text-sm border border-amber-100 font-medium">
                <span className="font-bold uppercase tracking-wider text-xs mr-2 text-amber-600">Hint</span> {question.hint}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Options */}
      <div className="space-y-4">
        {shuffledOptions.map((option, index) => {
          const isSelected = selectedAnswer === option;
          const isCorrectOption = option === question.correctAnswer;
          
          let btnClass = "w-full text-left p-5 md:p-6 rounded-2xl border-2 transition-all duration-200 text-lg font-bold flex items-center justify-between ";
          
          if (!selectedAnswer) {
            btnClass += "border-slate-100 bg-white shadow-sm hover:border-blue-400 hover:bg-blue-50 text-slate-700";
          } else {
            if (isCorrectOption) {
              btnClass += "border-green-500 bg-green-50 text-green-900 shadow-sm";
            } else if (isSelected && !isCorrectOption) {
              btnClass += "border-red-500 bg-red-50 text-red-900 shadow-sm";
            } else {
              btnClass += "border-slate-100 bg-white opacity-50 text-slate-400";
            }
          }

          return (
            <button
              key={index}
              disabled={selectedAnswer !== null}
              onClick={() => handleOptionClick(option)}
              className={btnClass}
            >
              <span>{option}</span>
              {selectedAnswer && isCorrectOption && <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0"><CheckCircle2 className="w-5 h-5 text-green-600" /></div>}
              {selectedAnswer && isSelected && !isCorrectOption && <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0"><XCircle className="w-5 h-5 text-red-600" /></div>}
            </button>
          );
        })}
      </div>

      {/* Explanation & Next Button */}
      {selectedAnswer && (
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
          <div className={cn(
            "p-6 rounded-2xl mb-6",
            isAnswerCorrect ? "bg-green-50 text-green-900 border border-green-100" : "bg-red-50 text-red-900 border border-red-100"
          )}>
            <div className="flex items-center gap-3 mb-3">
              {isAnswerCorrect ? (
                <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center"><CheckCircle2 className="w-6 h-6 text-green-700" /></div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-red-200 flex items-center justify-center"><XCircle className="w-6 h-6 text-red-700" /></div>
              )}
              <h3 className="font-black text-xl">
                {isAnswerCorrect ? 'Correct!' : (selectedAnswer === '__TIMEOUT__' ? 'Time\\'s Up!' : 'Incorrect!')}
              </h3>
            </div>
            <p className="text-base font-medium opacity-90 leading-relaxed">{question.explanation}</p>
          </div>

          <button
            onClick={onNextQuestion}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-5 rounded-2xl font-bold text-lg hover:bg-slate-800 shadow-[0_8px_20px_rgba(15,23,42,0.15)] hover:-translate-y-0.5 transition-all"
          >
            {currentNumber === totalQuestions ? 'See Final Results' : 'Continue to Next Question'} 
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
}
`
);

fs.writeFileSync('src/components/quiz/QuizQuestionCard.tsx', cardCode, 'utf8');

