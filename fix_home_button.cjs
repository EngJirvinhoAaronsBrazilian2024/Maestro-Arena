const fs = require('fs');

let code = fs.readFileSync('src/pages/Home.tsx', 'utf8');

const oldQuizBtn = `            <Link 
              to="/quiz"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-2xl border border-slate-200 transition-all shadow-sm hover:shadow hover:-translate-y-0.5"
            >
              Play Quiz
            </Link>`;

const newQuizBtn = `            <Link 
              to="/quiz"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl border border-transparent transition-all shadow-[0_8px_20px_rgba(220,38,38,0.2)] hover:shadow-[0_8px_24px_rgba(220,38,38,0.3)] hover:-translate-y-0.5"
            >
              Play Quiz
            </Link>`;

code = code.replace(oldQuizBtn, newQuizBtn);

fs.writeFileSync('src/pages/Home.tsx', code, 'utf8');
