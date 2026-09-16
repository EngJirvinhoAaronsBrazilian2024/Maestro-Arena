const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminDashboard.tsx', 'utf8');

const targetOldCreateTipModal = `function CreateTipModal({ onClose, onSuccess, adminId }: { onClose: () => void, onSuccess: (t: Tip) => void, adminId: string }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: 'single' as TipCategory,
    odds: '',
    analysis: '',
    bookingCode: '',
    homeTeam: '',
    awayTeam: '',
    competition: '',
    prediction: '',
    market: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newTip = await createTip(adminId, {
        category: formData.category,
        odds: formData.odds ? parseFloat(formData.odds) : undefined,
        analysis: formData.analysis || undefined,
        bookingCode: formData.bookingCode || undefined,
        status: 'pending',
        publishDate: Date.now(),
        matches: [{
          homeTeam: formData.homeTeam,
          awayTeam: formData.awayTeam,
          competition: formData.competition,
          prediction: formData.prediction,
          market: formData.market || 'Prediction'
        }]
      });
      onSuccess(newTip);
    } catch (err) {
      alert("Failed to create tip");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="font-bold text-lg">Publish New Tip</h2>
          <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-200 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 overflow-y-auto">
          <form id="tip-form" onSubmit={handleSubmit} className="space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                <select 
                  className="w-full border border-slate-300 rounded-lg p-2"
                  value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})}
                >
                  <option value="single">Single (1 Match)</option>
                  <option value="maestro2+">Maestro 2+ (Accumulator)</option>
                  <option value="odd4+">Odd 4+ (High Value)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Booking Code</label>
                <input type="text" className="w-full border border-slate-300 rounded-lg p-2" value={formData.bookingCode} onChange={e => setFormData({...formData, bookingCode: e.target.value})} placeholder="e.g. B9X12Z" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Total Odds</label>
                <input type="number" step="0.01" className="w-full border border-slate-300 rounded-lg p-2" value={formData.odds} onChange={e => setFormData({...formData, odds: e.target.value})} placeholder="e.g. 2.50" />
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-4">
              <h4 className="font-bold text-slate-800 text-sm mb-2">Match Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Home Team *</label>
                  <input required type="text" className="w-full border border-slate-300 rounded-lg p-2" value={formData.homeTeam} onChange={e => setFormData({...formData, homeTeam: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Away Team *</label>
                  <input required type="text" className="w-full border border-slate-300 rounded-lg p-2" value={formData.awayTeam} onChange={e => setFormData({...formData, awayTeam: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Competition *</label>
                  <input required type="text" className="w-full border border-slate-300 rounded-lg p-2" value={formData.competition} onChange={e => setFormData({...formData, competition: e.target.value})} placeholder="e.g. Premier League" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Market</label>
                  <input type="text" className="w-full border border-slate-300 rounded-lg p-2" value={formData.market} onChange={e => setFormData({...formData, market: e.target.value})} placeholder="e.g. 1X2, Over 2.5" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Prediction / Pick *</label>
                <input required type="text" className="w-full border border-slate-300 rounded-lg p-2 font-bold" value={formData.prediction} onChange={e => setFormData({...formData, prediction: e.target.value})} placeholder="e.g. Home Win" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Analysis / Reasoning</label>
              <textarea className="w-full border border-slate-300 rounded-lg p-2 h-20" value={formData.analysis} onChange={e => setFormData({...formData, analysis: e.target.value})} placeholder="Explain why..." />
            </div>
            
          </form>
        </div>
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2 mt-auto">
          <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-lg">Cancel</button>
          <button type="submit" form="tip-form" disabled={loading} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Publishing...' : 'Publish Tip'}
          </button>
        </div>
      </div>
    </div>
  )
}`;

const newCreateTipModal = `const COMPETITIONS = ["Premier League", "La Liga", "Serie A", "Bundesliga", "Ligue 1", "Champions League", "Europa League", "World Cup", "Euro", "Other"];
const MARKETS = ["1X2 (Match Result)", "Over 2.5 Goals", "Under 2.5 Goals", "Both Teams To Score", "Double Chance", "Draw No Bet", "Asian Handicap", "Correct Score", "Other"];

function CreateTipModal({ onClose, onSuccess, adminId }: { onClose: () => void, onSuccess: (t: Tip) => void, adminId: string }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: 'single' as TipCategory,
    odds: '',
    analysis: '',
    bookingCode: ''
  });

  const [matches, setMatches] = useState<Partial<TipMatch>[]>([
    { homeTeam: '', awayTeam: '', competition: 'Premier League', prediction: '', market: '1X2 (Match Result)' }
  ]);

  const handleCategoryChange = (cat: string) => {
    setFormData({ ...formData, category: cat as TipCategory });
    if (cat === 'single') {
      setMatches([matches[0]]); // Limit to 1
    }
  };

  const updateMatch = (index: number, field: string, value: string) => {
    const newMatches = [...matches];
    newMatches[index] = { ...newMatches[index], [field]: value };
    setMatches(newMatches);
  };

  const addMatch = () => {
    setMatches([...matches, { homeTeam: '', awayTeam: '', competition: 'Premier League', prediction: '', market: '1X2 (Match Result)' }]);
  };

  const removeMatch = (index: number) => {
    setMatches(matches.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formattedMatches = matches.map(m => ({
        homeTeam: m.homeTeam || '',
        awayTeam: m.awayTeam || '',
        competition: m.competition || '',
        prediction: m.prediction || '',
        market: m.market || 'Prediction'
      }));

      const newTip = await createTip(adminId, {
        category: formData.category,
        odds: formData.odds ? parseFloat(formData.odds) : undefined,
        analysis: formData.analysis || undefined,
        bookingCode: formData.bookingCode || undefined,
        status: 'pending',
        publishDate: Date.now(),
        matches: formattedMatches
      });
      onSuccess(newTip);
    } catch (err) {
      alert("Failed to create tip");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="font-bold text-lg">Publish New Tip</h2>
          <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-200 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 overflow-y-auto">
          <form id="tip-form" onSubmit={handleSubmit} className="space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                <select 
                  className="w-full border border-slate-300 rounded-lg p-2"
                  value={formData.category} onChange={e => handleCategoryChange(e.target.value)}
                >
                  <option value="single">Single (1 Match)</option>
                  <option value="maestro2+">Maestro 2+ (Accumulator)</option>
                  <option value="odd4+">Odd 4+ (High Value)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Booking Code (e.g., Bet9ja / SportyBet)</label>
                <input type="text" className="w-full border border-slate-300 rounded-lg p-2" value={formData.bookingCode} onChange={e => setFormData({...formData, bookingCode: e.target.value})} placeholder="e.g. B9X12Z" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Total Odds</label>
                <input type="number" step="0.01" className="w-full border border-slate-300 rounded-lg p-2" value={formData.odds} onChange={e => setFormData({...formData, odds: e.target.value})} placeholder="e.g. 2.50" />
              </div>
            </div>

            <div className="space-y-4">
              {matches.map((match, idx) => (
                <div key={idx} className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-4 relative">
                  <h4 className="font-bold text-slate-800 text-sm">Match Details {matches.length > 1 ? '#' + (idx + 1) : ''}</h4>
                  
                  {matches.length > 1 && (
                    <button type="button" onClick={() => removeMatch(idx)} className="absolute top-3 right-3 text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors"><Trash2 className="w-4 h-4"/></button>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Home Team *</label>
                      <input required type="text" className="w-full border border-slate-300 rounded-lg p-2" value={match.homeTeam} onChange={e => updateMatch(idx, 'homeTeam', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Away Team *</label>
                      <input required type="text" className="w-full border border-slate-300 rounded-lg p-2" value={match.awayTeam} onChange={e => updateMatch(idx, 'awayTeam', e.target.value)} />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Competition *</label>
                      <select required className="w-full border border-slate-300 rounded-lg p-2" value={match.competition} onChange={e => updateMatch(idx, 'competition', e.target.value)}>
                        {COMPETITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Market</label>
                      <select required className="w-full border border-slate-300 rounded-lg p-2" value={match.market} onChange={e => updateMatch(idx, 'market', e.target.value)}>
                        {MARKETS.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Prediction / Pick *</label>
                    <input required type="text" className="w-full border border-slate-300 rounded-lg p-2 font-bold" value={match.prediction} onChange={e => updateMatch(idx, 'prediction', e.target.value)} placeholder="e.g. Home Win" />
                  </div>
                </div>
              ))}
              
              {formData.category !== 'single' && (
                <button type="button" onClick={addMatch} className="flex items-center gap-2 text-blue-600 font-bold hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors">
                  <PlusCircle className="w-4 h-4" /> Add Another Match
                </button>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Analysis / Reasoning</label>
              <textarea className="w-full border border-slate-300 rounded-lg p-2 h-20" value={formData.analysis} onChange={e => setFormData({...formData, analysis: e.target.value})} placeholder="Explain why..." />
            </div>
            
          </form>
        </div>
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2 mt-auto">
          <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-lg">Cancel</button>
          <button type="submit" form="tip-form" disabled={loading} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Publishing...' : 'Publish Tip'}
          </button>
        </div>
      </div>
    </div>
  )
}`;

if (content.includes('function CreateTipModal(')) {
  const startIndex = content.indexOf('function CreateTipModal(');
  const endIndex = content.indexOf('function CreateQuizModal(');
  
  if (startIndex !== -1 && endIndex !== -1) {
    const stringToReplace = content.substring(startIndex, endIndex);
    content = content.replace(stringToReplace, newCreateTipModal + '\\n\\n');
    fs.writeFileSync('src/pages/AdminDashboard.tsx', content);
    console.log('Successfully updated tip modal for multibets and dropdowns!');
  } else {
    console.log('Failed to parse boundaries correctly.');
  }
} else {
  console.log('Could not find CreateTipModal function.');
}

