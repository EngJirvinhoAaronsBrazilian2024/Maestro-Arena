const fs = require('fs');
let content = fs.readFileSync('src/pages/Tips.tsx', 'utf8');

const targetContent = `                  {(tip.odds || tip.analysis) && (
                    <div className="bg-slate-50 p-4 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-3">
                      {tip.analysis && <p className="text-sm text-slate-600 italic">"{tip.analysis}"</p>}
                      {tip.odds && (
                        <div className="ml-auto bg-amber-100 text-amber-900 px-4 py-1.5 rounded-lg font-bold shadow-sm border border-amber-200">
                          ODDS: {tip.odds.toFixed(2)}
                        </div>
                      )}
                    </div>
                  )}`;

const newContent = `                  {(tip.odds || tip.analysis || tip.bookingCode) && (
                    <div className="bg-slate-50 p-4 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-3">
                      {tip.analysis && <p className="text-sm text-slate-600 italic max-w-lg">"{tip.analysis}"</p>}
                      <div className="ml-auto flex items-center gap-3">
                        {tip.bookingCode && (
                          <div className="flex items-center gap-2 bg-blue-100 text-blue-900 px-3 py-1.5 rounded-lg font-bold shadow-sm border border-blue-200">
                            <span className="text-xs uppercase text-blue-600">Booking Code:</span>
                            <span className="font-mono tracking-wider">{tip.bookingCode}</span>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(tip.bookingCode!);
                                alert('Booking code copied: ' + tip.bookingCode);
                              }}
                              className="ml-1 text-blue-600 hover:text-blue-800 transition-colors"
                              title="Copy Booking Code"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                            </button>
                          </div>
                        )}
                        {tip.odds && (
                          <div className="bg-amber-100 text-amber-900 px-4 py-1.5 rounded-lg font-bold shadow-sm border border-amber-200">
                            ODDS: {tip.odds.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}`;

if (content.includes('tip.odds || tip.analysis')) {
  content = content.replace(targetContent, newContent);
  fs.writeFileSync('src/pages/Tips.tsx', content);
  console.log('Tips.tsx updated with booking code functionality!');
} else {
  console.log('Target not found in Tips.tsx');
}
