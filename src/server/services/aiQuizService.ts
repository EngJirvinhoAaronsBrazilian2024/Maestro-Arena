import { GoogleGenAI, Type } from '@google/genai';
import { getInsforgeAdmin } from '../insforgeAdmin.js';
import { QuizQuestion, QuizCategory, QuizDifficulty } from '../../types/quiz.js';
import { v4 as uuidv4 } from 'uuid';

export async function generateQuizQuestions(
  category: string,
  competition: string,
  season: string,
  difficulty: string,
  count: number,
  type: string,
  dataSource: string,
  language: string,
  adminUserId: string
) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is missing.');
  }

  const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });

  const generationSessionId = uuidv4();
  const dateNum = Date.now();

  // Create generation history record
  await getInsforgeAdmin().database.from('quiz_generations').insert([{
    id: generationSessionId,
    requested: count,
    generated: 0,
    validated: 0,
    rejected: 0,
    category,
    difficulty,
    competition,
    season,
    source: dataSource,
    admin_id: adminUserId,
    created_at: dateNum,
  }]);

  const prompt = `Generate ${count} high-quality, verified multiple-choice football quiz questions.
  
Parameters:
- Category: ${category}
- Difficulty: ${difficulty} (Easy, Medium, Hard, Expert)
- Question Type: ${type}
- Language: ${language}
- Associated Competition: ${competition || 'General'}
- Associated Season: ${season || 'General'}

Rules:
- Questions must be factual and verifiable. Do not invent statistics.
- The correct answer must be EXACTLY ONE of the options.
- Options must have exactly 4 unique choices.
- The explanation must clearly explain why the correct answer is right.
- The hint must be helpful but not give away the answer directly.
- Ensure variety in questions.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING, description: 'The quiz question text' },
              category: { type: Type.STRING, description: 'The category this belongs to' },
              difficulty: { type: Type.STRING, description: 'Difficulty level: Easy, Medium, Hard, or Expert' },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Exactly 4 distinct possible answers'
              },
              correctAnswer: { type: Type.STRING, description: 'The exact string from options that is the correct answer' },
              explanation: { type: Type.STRING, description: 'Explanation for why it is correct' },
              hint: { type: Type.STRING, description: 'A helpful hint' },
              source: { type: Type.STRING, description: 'The source of this fact (e.g. historical record, specific API)' },
            },
            required: ['question', 'category', 'difficulty', 'options', 'correctAnswer', 'explanation', 'hint', 'source']
          }
        }
      }
    });

    const text = response.text || '[]';
    let questionsData: any[] = [];
    try {
      questionsData = JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse GenAI response:', text);
      throw new Error('Invalid JSON format from AI');
    }

    let validated = 0;
    let rejected = 0;

    const validatedQuestions: any[] = [];

    // Validate each question
    for (const q of questionsData) {
      const isValid = (
        q.question &&
        q.options && q.options.length === 4 &&
        new Set(q.options).size === 4 &&
        q.options.includes(q.correctAnswer) &&
        q.explanation &&
        q.hint
      );

      if (isValid) {
        // Simple duplicate detection: check if question text exists
        const { data: exists } = await getInsforgeAdmin().database
          .from('quiz_questions')
          .select('id')
          .eq('question', q.question)
          .limit(1);

        if (!exists || exists.length === 0) {
          validated++;
          validatedQuestions.push({
            id: uuidv4(),
            question: q.question,
            category: category, // Force the requested category
            difficulty: difficulty,
            options: q.options,
            correct_answer: q.correctAnswer,
            explanation: q.explanation,
            hint: q.hint,
            source: q.source || dataSource,
            source_data: dataSource,
            competition: competition || '',
            season: season || '',
            status: 'DRAFT',
            generation_id: generationSessionId,
            created_by: adminUserId,
            created_at: dateNum,
            updated_at: dateNum,
          });
        } else {
          rejected++;
        }
      } else {
        rejected++;
      }
    }

    // Save validated questions
    if (validatedQuestions.length > 0) {
      await getInsforgeAdmin().database.from('quiz_questions').insert(validatedQuestions);
    }

    // Update generation history
    await getInsforgeAdmin().database.from('quiz_generations').update({
      generated: questionsData.length,
      validated,
      rejected,
    }).eq('id', generationSessionId);

    return {
      generationId: generationSessionId,
      requested: count,
      generated: questionsData.length,
      validated,
      rejected,
      questions: validatedQuestions
    };
  } catch (error: any) {
    console.error('Error generating questions:', error);
    // Update generation history with failure if possible
    await getInsforgeAdmin().database.from('quiz_generations').update({
      error: error.message
    }).eq('id', generationSessionId);
    throw new Error('Failed to generate questions: ' + error.message);
  }
}
