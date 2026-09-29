const { GoogleGenAI } = require('@google/genai');
const { createAdminClient } = require('@insforge/sdk');
const dotenv = require('dotenv');
dotenv.config();

const normalizeKey = (text) => (text || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const CATEGORIES = [
  'Premier League',
  'La Liga',
  'Serie A',
  'Bundesliga',
  'UEFA Champions League',
  'UEFA Europa League',
  'FIFA World Cup',
  'African Cup of Nations',
  'African Football',
  'Football Players',
  'Football Clubs',
  'Famous Managers',
  'Football History',
  'Football Records',
  'Football Rules',
  'World Football'
];

const TARGET_PER_CAT = 315; // 16 * 315 = 5,040+ questions total!

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function callGemini(ai, prompt) {
  const models = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
  for (let attempt = 0; attempt < 5; attempt++) {
    for (const model of models) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.85
          }
        });
        let text = (response.text || '').trim();
        if (text.startsWith('```json')) text = text.slice(7);
        if (text.startsWith('```')) text = text.slice(3);
        if (text.endsWith('```')) text = text.slice(0, -3);
        text = text.trim();

        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (err) {
        // try next model or retry
      }
    }
    await sleep(2000 * (attempt + 1));
  }
  return [];
}

async function main() {
  const url = (process.env.VITE_INSFORGE_URL || 'https://gci83gu5.us-east.insforge.app').replace(/\/+$/, '');
  const apiKey = process.env.INSFORGE_API_KEY;

  if (!apiKey) {
    console.error('Missing INSFORGE_API_KEY!');
    process.exit(1);
  }

  const admin = createAdminClient({ baseUrl: url, apiKey });
  const ai = new GoogleGenAI();

  console.log('--- ROAD TO 5,000 QUESTIONS: SPORTSHUB GENERATOR ---');
  console.log(`Target: At least ${TARGET_PER_CAT} questions per category across 16 categories (5,000+ total)\n`);

  for (const category of CATEGORIES) {
    // Get exact current count from database
    const { count: currentCountRaw, error: countErr } = await admin.database
      .from('quiz_questions')
      .select('*', { count: 'exact', head: true })
      .eq('category', category);

    let currentCount = currentCountRaw || 0;
    console.log(`\n======================================================`);
    console.log(`Category: [${category}] - Current Count: ${currentCount} / Target: ${TARGET_PER_CAT}`);
    console.log(`======================================================`);

    if (currentCount >= TARGET_PER_CAT) {
      console.log(`✓ [${category}] already has ${currentCount} questions (target ${TARGET_PER_CAT} met).`);
      continue;
    }

    // Fetch existing question texts for this category to guarantee zero duplicates
    const seenKeys = new Set();
    try {
      const { data: existingQ } = await admin.database
        .from('quiz_questions')
        .select('question')
        .eq('category', category)
        .limit(1000);
      if (existingQ) {
        existingQ.forEach(q => seenKeys.add(normalizeKey(q.question)));
      }
    } catch (e) {
      console.warn('Could not fetch existing questions for deduplication check:', e.message);
    }

    const eras = [
      'CURRENT & MODERN ERA (2018 to 2026): Euro 2024, recent domestic titles, modern tactical shifts, VAR decisions, rising stars, modern records',
      '2010s ERA: Pep vs Mourinho rivalry, MSN vs BBC, Leicester City fairytale, World Cups 2010/2014/2018, iconic Champions League comebacks',
      '2000s ERA: The Galácticos, Arsenal Invincibles, AC Milan & Liverpool finals, Ronaldo/Ronaldinho/Zidane peak, Euro 2004/2008, legendary derbies',
      'CLASSIC & 20th CENTURY ERA (1950s-1990s): Pelé, Maradona, Cruyff, Beckenbauer, vintage World Cups, original cup winners, European Cup heritage',
      'DEEP TRIVIA & UNUSUAL FACTS: Iconic jersey numbers, famous transfers, referee records, bizarre match incidents, record attendances, quotes'
    ];

    let eraIndex = 0;
    let consecutiveFailures = 0;

    while (currentCount < TARGET_PER_CAT && consecutiveFailures < 6) {
      const needed = TARGET_PER_CAT - currentCount;
      const batchRequestCount = Math.min(25, needed + 5);
      const selectedEra = eras[eraIndex % eras.length];
      eraIndex++;

      console.log(`Generating batch for "${category}" (${selectedEra.split(':')[0]})... Needs: ${needed}`);

      const prompt = `You are a football trivia master for a sports quiz app.
Generate ${batchRequestCount} unique multiple-choice trivia questions specifically for the category: "${category}".
Focus on: ${selectedEra}.
Include a mix of difficulties: Easy, Medium, Hard, and Expert.
Ensure every question is factually accurate, verifiable, and distinct.
Do NOT repeat well-known basic questions. Mix current/recent football facts with historic/past moments.

Output ONLY a JSON array of objects with the following exact keys:
[
  {
    "question": "Clear, engaging football question text",
    "category": "${category}",
    "difficulty": "Easy" | "Medium" | "Hard" | "Expert",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Exact string matching one of the options",
    "explanation": "Detailed, interesting educational explanation of why this answer is correct",
    "hint": "Helpful, subtle clue for the player"
  }
]`;

      try {
        const generatedQuestions = await callGemini(ai, prompt);
        if (!generatedQuestions || generatedQuestions.length === 0) {
          consecutiveFailures++;
          console.warn(`Could not generate questions for this batch (failures: ${consecutiveFailures}). Retrying...`);
          await sleep(2500);
          continue;
        }

        consecutiveFailures = 0;
        const validToInsert = [];
        const now = Date.now();

        for (let i = 0; i < generatedQuestions.length; i++) {
          const q = generatedQuestions[i];
          if (!q.question || !q.correctAnswer || !Array.isArray(q.options) || q.options.length < 2) {
            continue;
          }

          const key = normalizeKey(q.question);
          if (seenKeys.has(key)) {
            continue;
          }

          let opts = Array.from(new Set(q.options.map(o => String(o).trim())));
          if (!opts.includes(q.correctAnswer)) {
            opts.push(q.correctAnswer);
          }
          if (opts.length < 4) {
            continue;
          }
          opts = opts.slice(0, 4);

          seenKeys.add(key);
          const newId = `q_ai_${now + i}_${Math.random().toString(36).substring(2, 7)}`;

          validToInsert.push({
            id: newId,
            question: q.question.trim(),
            category: category,
            difficulty: ['Easy', 'Medium', 'Hard', 'Expert'].includes(q.difficulty) ? q.difficulty : 'Medium',
            options: opts,
            correctanswer: q.correctAnswer.trim(),
            explanation: q.explanation || '',
            hint: q.hint || '',
            image: null,
            source: 'SportsHub Trivia Engine',
            status: 'PUBLISHED',
            created_at: now + i
          });
        }

        if (validToInsert.length > 0) {
          const chunkSize = 10;
          for (let c = 0; c < validToInsert.length; c += chunkSize) {
            const chunk = validToInsert.slice(c, c + chunkSize);
            try {
              const { error: insertErr } = await admin.database
                .from('quiz_questions')
                .insert(chunk);
              if (insertErr) {
                console.warn('Chunk insert warning:', insertErr);
              }
            } catch (err) {
              console.warn('DB chunk insert caught error:', err.message);
            }
          }

          currentCount += validToInsert.length;
          console.log(`✓ Added ${validToInsert.length} questions. [${category}] progress: ${currentCount} / ${TARGET_PER_CAT}`);
        } else {
          console.log('No new unique questions in this batch. Trying next era.');
        }

        await sleep(1500);
      } catch (loopErr) {
        console.warn('Error in category loop:', loopErr.message);
        await sleep(3000);
      }
    }
  }

  console.log('\n======================================================');
  console.log('🎉 5,000 QUESTION MILESTONE REACHED!');
  console.log('======================================================');

  let grandTotal = 0;
  const finalSummary = {};
  for (const cat of CATEGORIES) {
    try {
      const { count } = await admin.database.from('quiz_questions').select('*', { count: 'exact', head: true }).eq('category', cat);
      finalSummary[cat] = count || 0;
      grandTotal += (count || 0);
    } catch (e) {}
  }
  console.table(finalSummary);
  console.log('FINAL GRAND TOTAL IN INSFORGE:', grandTotal);
}

main().catch(console.error);
