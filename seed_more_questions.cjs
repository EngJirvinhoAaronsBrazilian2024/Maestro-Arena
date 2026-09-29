const { createAdminClient } = require('@insforge/sdk');
const dotenv = require('dotenv');
dotenv.config();

const normalizeKey = (text) => (text || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const MORE_QUESTIONS = [
  // --- PREMIER LEAGUE ---
  {
    category: "Premier League",
    difficulty: "Easy",
    question: "Which goalkeeper has the most clean sheets in a single Premier League season (24 clean sheets in 2004-05)?",
    options: ["Edwin van der Sar", "Petr Čech", "Alisson Becker", "Ederson"],
    correctAnswer: "Petr Čech",
    explanation: "Petr Čech conceded only 15 goals and kept 24 clean sheets in Chelsea's title-winning 2004-05 season.",
    hint: "Achieved in his debut season under Jose Mourinho."
  },
  {
    category: "Premier League",
    difficulty: "Medium",
    question: "Who holds the record for the most Premier League Player of the Month awards (7 awards)?",
    options: ["Wayne Rooney & Cristiano Ronaldo", "Sergio Agüero & Harry Kane", "Steven Gerrard & Thierry Henry", "Alan Shearer & Frank Lampard"],
    correctAnswer: "Sergio Agüero & Harry Kane",
    explanation: "Both Sergio Agüero and Harry Kane have won the award 7 times each.",
    hint: "One was Manchester City's record scorer, the other Tottenham's."
  },
  {
    category: "Premier League",
    difficulty: "Medium",
    question: "Which team accumulated an unprecedented 100 points in the 2017-18 Premier League season (The Centurions)?",
    options: ["Liverpool", "Chelsea", "Manchester City", "Arsenal"],
    correctAnswer: "Manchester City",
    explanation: "Pep Guardiola's Manchester City became the first team to reach 100 points in English top-flight history.",
    hint: "Gabriel Jesus scored in the 94th minute of matchday 38 against Southampton to hit 100."
  },
  {
    category: "Premier League",
    difficulty: "Hard",
    question: "Who was the first player to score 100 Premier League goals for two different clubs?",
    options: ["Alan Shearer", "Teddy Sheringham", "Romelu Lukaku", "Les Ferdinand"],
    correctAnswer: "Alan Shearer",
    explanation: "Alan Shearer scored 112 goals for Blackburn Rovers and 148 goals for Newcastle United.",
    hint: "He is also the Premier League's all-time top scorer."
  },
  {
    category: "Premier League",
    difficulty: "Hard",
    question: "Which player has scored the most direct free-kicks in Premier League history (18 goals)?",
    options: ["David Beckham", "James Ward-Prowse", "Thierry Henry", "Gianfranco Zola"],
    correctAnswer: "David Beckham",
    explanation: "David Beckham scored 18 direct free-kicks for Manchester United in the Premier League.",
    hint: "Renowned for his 'Bend It Like Beckham' curving technique."
  },

  // --- LA LIGA ---
  {
    category: "La Liga",
    difficulty: "Easy",
    question: "Which stadium is the home ground of Real Madrid?",
    options: ["Camp Nou", "Metropolitano", "Santiago Bernabéu", "San Mamés"],
    correctAnswer: "Santiago Bernabéu",
    explanation: "Real Madrid has played at the Santiago Bernabéu in Chamartín, Madrid since 1947.",
    hint: "Named after their legendary former president."
  },
  {
    category: "La Liga",
    difficulty: "Medium",
    question: "Who scored the most hat-tricks in La Liga history (36 hat-tricks)?",
    options: ["Cristiano Ronaldo", "Lionel Messi", "Alfredo Di Stéfano", "Telmo Zarra"],
    correctAnswer: "Lionel Messi",
    explanation: "Lionel Messi scored 36 La Liga hat-tricks for FC Barcelona, surpassing Cristiano Ronaldo's 34.",
    hint: "Argentine maestro who spent 17 seasons in Spain's top flight."
  },
  {
    category: "La Liga",
    difficulty: "Hard",
    question: "Which club holds the record for the longest unbeaten streak in La Liga history (43 matches, 2017-2018)?",
    options: ["Real Madrid", "FC Barcelona", "Atlético Madrid", "Valencia"],
    correctAnswer: "FC Barcelona",
    explanation: "Barcelona went 43 league games unbeaten across two seasons under Luis Enrique and Ernesto Valverde.",
    hint: "Their streak finally ended against Levante in a 5-4 thriller."
  },
  {
    category: "La Liga",
    difficulty: "Hard",
    question: "Who was the top goalscorer (Pichichi) in La Liga for the 2023-24 season with 24 goals?",
    options: ["Jude Bellingham", "Robert Lewandowski", "Artem Dovbyk", "Alexander Sørloth"],
    correctAnswer: "Artem Dovbyk",
    explanation: "Ukrainian striker Artem Dovbyk scored 24 goals for Girona to win the 2023-24 Pichichi Trophy.",
    hint: "Striker who propelled fairytale side Girona into the Champions League."
  },

  // --- SERIE A ---
  {
    category: "Serie A",
    difficulty: "Easy",
    question: "Which two football giants share the San Siro stadium (Stadio Giuseppe Meazza) in Milan?",
    options: ["Juventus & Torino", "AC Milan & Inter Milan", "Roma & Lazio", "Genoa & Sampdoria"],
    correctAnswer: "AC Milan & Inter Milan",
    explanation: "Both AC Milan and FC Internazionale Milano call the iconic stadium their home.",
    hint: "The Rossoneri and the Nerazzurri."
  },
  {
    category: "Serie A",
    difficulty: "Medium",
    question: "Which club won 9 consecutive Serie A titles from 2011-12 to 2019-20?",
    options: ["AC Milan", "Inter Milan", "Juventus", "Napoli"],
    correctAnswer: "Juventus",
    explanation: "Juventus established an Italian record of 9 straight Scudetti under Conte, Allegri, and Sarri.",
    hint: "Turin giants with black and white stripes."
  },
  {
    category: "Serie A",
    difficulty: "Hard",
    question: "Who is the legendary captain who made 619 Serie A appearances exclusively for AS Roma?",
    options: ["Daniele De Rossi", "Francesco Totti", "Alessandro Del Piero", "Paolo Maldini"],
    correctAnswer: "Francesco Totti",
    explanation: "Francesco Totti spent his entire 25-season professional playing career at AS Roma.",
    hint: "Known as 'Il Gladiatore' (The Gladiator) or 'The King of Rome'."
  },
  {
    category: "Serie A",
    difficulty: "Hard",
    question: "Who holds the record for the most goals in Serie A history with 274 goals?",
    options: ["Silvio Piola", "Francesco Totti", "Gunnar Nordahl", "Giuseppe Meazza"],
    correctAnswer: "Silvio Piola",
    explanation: "Silvio Piola scored 274 Serie A goals playing for Pro Vercelli, Lazio, Juventus, and Novara.",
    hint: "Italian legend who won the 1938 FIFA World Cup."
  },

  // --- BUNDESLIGA ---
  {
    category: "Bundesliga",
    difficulty: "Easy",
    question: "What is the famous derby between Borussia Dortmund and FC Schalke 04 called?",
    options: ["Der Klassiker", "Revierderby", "Nordderby", "Rheinderby"],
    correctAnswer: "Revierderby",
    explanation: "The clash between Dortmund and Schalke in the industrial Ruhr region is the Revierderby.",
    hint: "Named after the Ruhr river district (Revier)."
  },
  {
    category: "Bundesliga",
    difficulty: "Medium",
    question: "Which English striker scored 36 Bundesliga goals in his debut season with Bayern Munich (2023-24)?",
    options: ["Jude Bellingham", "Harry Kane", "Jadon Sancho", "Jamal Musiala"],
    correctAnswer: "Harry Kane",
    explanation: "Harry Kane won the European Golden Shoe with 36 Bundesliga goals in his first season in Germany.",
    hint: "England captain signed from Tottenham Hotspur."
  },
  {
    category: "Bundesliga",
    difficulty: "Hard",
    question: "Which club was the last team other than Bayern Munich or Borussia Dortmund to win the Bundesliga before 2024?",
    options: ["VfL Wolfsburg (2008-09)", "VfB Stuttgart (2006-07)", "Werder Bremen (2003-04)", "Kaiserslautern (1997-98)"],
    correctAnswer: "VfL Wolfsburg (2008-09)",
    explanation: "Felix Magath's Wolfsburg won the 2008-09 title powered by Grafite and Edin Džeko.",
    hint: "They were powered by the devastating strike duo of Grafite and Edin Džeko."
  },

  // --- UEFA CHAMPIONS LEAGUE ---
  {
    category: "UEFA Champions League",
    difficulty: "Medium",
    question: "Who scored the winning bicycle kick goal for Real Madrid against Liverpool in the 2018 UCL Final?",
    options: ["Cristiano Ronaldo", "Karim Benzema", "Gareth Bale", "Marco Asensio"],
    correctAnswer: "Gareth Bale",
    explanation: "Gareth Bale came off the bench and scored an extraordinary overhead bicycle kick in Kyiv.",
    hint: "Welsh winger who scored twice in that final."
  },
  {
    category: "UEFA Champions League",
    difficulty: "Medium",
    question: "Which German club won the Champions League as part of a historic Sextuple in 2020?",
    options: ["Borussia Dortmund", "RB Leipzig", "Bayern Munich", "Bayer Leverkusen"],
    correctAnswer: "Bayern Munich",
    explanation: "Hansi Flick's Bayern Munich won every single Champions League match played in the 2019-20 season.",
    hint: "Kingsley Coman scored the winning goal in the final against PSG."
  },
  {
    category: "UEFA Champions League",
    difficulty: "Hard",
    question: "Who holds the record for most assists in UEFA Champions League history (42 assists)?",
    options: ["Lionel Messi", "Cristiano Ronaldo", "Ángel Di María", "Neymar Jr"],
    correctAnswer: "Cristiano Ronaldo",
    explanation: "Cristiano Ronaldo registered 42 assists in the Champions League alongside his 140 goals.",
    hint: "He also leads the all-time goalscoring chart."
  },
  {
    category: "UEFA Champions League",
    difficulty: "Expert",
    question: "In 1993, who scored the only goal for Marseille against AC Milan in the first modern UEFA Champions League final?",
    options: ["Didier Deschamps", "Basile Boli", "Rudi Völler", "Alen Bokšić"],
    correctAnswer: "Basile Boli",
    explanation: "Defender Basile Boli headed in a corner just before half-time in Munich to seal the 1-0 win.",
    hint: "French central defender who scored with a powerful header."
  },

  // --- FIFA WORLD CUP ---
  {
    category: "FIFA World Cup",
    difficulty: "Easy",
    question: "Which country won their first ever FIFA World Cup in 2010 with Andrés Iniesta's extra-time winner?",
    options: ["Netherlands", "Spain", "Germany", "Portugal"],
    correctAnswer: "Spain",
    explanation: "Spain defeated the Netherlands 1-0 in Johannesburg on July 11, 2010.",
    hint: "Iniesta celebrated by revealing a tribute to Dani Jarque."
  },
  {
    category: "FIFA World Cup",
    difficulty: "Medium",
    question: "Who won the Best Young Player Award at the 2018 World Cup at age 19, scoring 4 goals?",
    options: ["Luka Modrić", "Antoine Griezmann", "Kylian Mbappé", "Paul Pogba"],
    correctAnswer: "Kylian Mbappé",
    explanation: "Mbappé became the youngest player since Pelé in 1958 to score in a World Cup final.",
    hint: "Scored a dazzling brace against Argentina in the Round of 16."
  },
  {
    category: "FIFA World Cup",
    difficulty: "Hard",
    question: "Who was the goalkeeper who saved two penalties in the shootout for Argentina in the 2022 World Cup Final?",
    options: ["Franco Armani", "Emiliano Martínez", "Gerónimo Rulli", "Willy Caballero"],
    correctAnswer: "Emiliano Martínez",
    explanation: "'Dibu' Martínez made an unbelievable 123rd-minute save against Kolo Muani and starred in the shootout.",
    hint: "Nicknamed 'Dibu' and won the Golden Glove."
  },
  {
    category: "FIFA World Cup",
    difficulty: "Expert",
    question: "Who was the top goalscorer at the 1958 FIFA World Cup with a still-unbeaten record of 13 goals in a single tournament?",
    options: ["Pelé", "Just Fontaine", "Vavá", "Helmut Rahn"],
    correctAnswer: "Just Fontaine",
    explanation: "French forward Just Fontaine scored 13 goals in 6 matches at Sweden 1958.",
    hint: "French striker whose single-tournament record has stood for nearly 70 years."
  },

  // --- AFRICAN FOOTBALL & AFCON ---
  {
    category: "African Football",
    difficulty: "Easy",
    question: "Which Chelsea legend scored the winning penalty in the 2012 UEFA Champions League final for Chelsea?",
    options: ["Michael Essien", "John Obi Mikel", "Didier Drogba", "Salomon Kalou"],
    correctAnswer: "Didier Drogba",
    explanation: "Didier Drogba scored the 88th-minute equalizer and the winning shootout penalty against Bayern Munich.",
    hint: "Ivory Coast's greatest ever goalscorer."
  },
  {
    category: "African Football",
    difficulty: "Medium",
    question: "Which Egyptian forward became Liverpool's all-time top Premier League goalscorer?",
    options: ["Mohamed Zidan", "Mohamed Salah", "Mido", "Amr Zaki"],
    correctAnswer: "Mohamed Salah",
    explanation: "Mohamed Salah has broken multiple scoring records and won 3 Premier League Golden Boots.",
    hint: "Affectionately crowned 'The Egyptian King' by the Kop."
  },
  {
    category: "African Football",
    difficulty: "Medium",
    question: "Which Nigerian magician won the BBC African Footballer of the Year award twice and played for Bolton, PSG, and Frankfurt?",
    options: ["Nwankwo Kanu", "Jay-Jay Okocha", "Finidi George", "Sunday Oliseh"],
    correctAnswer: "Jay-Jay Okocha",
    explanation: "Augustine 'Jay-Jay' Okocha was celebrated for his unbelievable dribbling and flamboyant skills.",
    hint: "So good they named him twice!"
  },
  {
    category: "African Cup of Nations",
    difficulty: "Hard",
    question: "Which country won the Africa Cup of Nations three consecutive times in 2006, 2008, and 2010?",
    options: ["Cameroon", "Nigeria", "Egypt", "Ghana"],
    correctAnswer: "Egypt",
    explanation: "Hassan Shehata's Egypt achieved an unprecedented AFCON 'three-peat' between 2006 and 2010.",
    hint: "Managed by Hassan Shehata."
  },
  {
    category: "African Cup of Nations",
    difficulty: "Expert",
    question: "Which goalkeeper was named Best Goalkeeper at AFCON 2023 after saving 4 penalties in a single shootout against Cape Verde?",
    options: ["André Onana", "Ronwen Williams", "Stanley Nwabali", "Édouard Mendy"],
    correctAnswer: "Ronwen Williams",
    explanation: "South Africa's Ronwen Williams set a world record by saving 4 out of 5 penalties in the quarter-final shootout.",
    hint: "South Africa's captain and Mamelodi Sundowns keeper."
  },

  // --- FOOTBALL PLAYERS ---
  {
    category: "Football Players",
    difficulty: "Easy",
    question: "Which country does Erling Haaland represent at the international level?",
    options: ["Sweden", "Denmark", "Norway", "Iceland"],
    correctAnswer: "Norway",
    explanation: "Erling Haaland plays internationally for Norway, where he is their all-time leading scorer.",
    hint: "Scandinavian nation whose capital is Oslo."
  },
  {
    category: "Football Players",
    difficulty: "Medium",
    question: "Which Croatian midfield maestro won the Ballon d'Or in 2018, breaking the Messi-Ronaldo duopoly?",
    options: ["Ivan Rakitić", "Luka Modrić", "Mateo Kovačić", "Mario Mandžukić"],
    correctAnswer: "Luka Modrić",
    explanation: "Luka Modrić won the Champions League with Real Madrid and led Croatia to the 2018 World Cup final.",
    hint: "Wears the number 10 shirt for Real Madrid and Croatia."
  },
  {
    category: "Football Players",
    difficulty: "Hard",
    question: "Which French midfield icon famously scored twice with headers in the 1998 World Cup Final against Brazil?",
    options: ["Didier Deschamps", "Emmanuel Petit", "Zinedine Zidane", "Patrick Vieira"],
    correctAnswer: "Zinedine Zidane",
    explanation: "Zinedine Zidane scored two first-half headers to power France to a 3-0 victory at the Stade de France.",
    hint: "Known affectionately as 'Zizou'."
  },
  {
    category: "Football Players",
    difficulty: "Expert",
    question: "Who is the only player to have won the European Golden Shoe playing for clubs in three different countries?",
    options: ["Cristiano Ronaldo", "Zlatan Ibrahimović", "Luis Suárez", "Robert Lewandowski"],
    correctAnswer: "Cristiano Ronaldo",
    explanation: "Cristiano Ronaldo won the European Golden Shoe with Manchester United (England) and Real Madrid (Spain).",
    hint: "Actually shared the 2013-14 award with Luis Suárez."
  },

  // --- FAMOUS MANAGERS ---
  {
    category: "Famous Managers",
    difficulty: "Easy",
    question: "Which charismatic German manager brought Liverpool their first league title in 30 years in 2020?",
    options: ["Thomas Tuchel", "Jürgen Klopp", "Hansi Flick", "Julian Nagelsmann"],
    correctAnswer: "Jürgen Klopp",
    explanation: "Jürgen Klopp managed Liverpool from 2015 to 2024, winning the Champions League, Premier League, and FA Cup.",
    hint: "Famous for his fist pumps in front of the Kop."
  },
  {
    category: "Famous Managers",
    difficulty: "Medium",
    question: "Who was the Dutch football visionary who managed Barcelona's early 1990s 'Dream Team'?",
    options: ["Louis van Gaal", "Johan Cruyff", "Frank Rijkaard", "Guus Hiddink"],
    correctAnswer: "Johan Cruyff",
    explanation: "Cruyff coached the Dream Team to four consecutive La Liga titles (1991–1994) and the 1992 European Cup.",
    hint: "The father of modern Barcelona tactical philosophy."
  },
  {
    category: "Famous Managers",
    difficulty: "Hard",
    question: "Which manager famously led AC Milan to back-to-back European Cups in 1989 and 1990 with zonal marking?",
    options: ["Fabio Capello", "Arrigo Sacchi", "Giovanni Trapattoni", "Marcello Lippi"],
    correctAnswer: "Arrigo Sacchi",
    explanation: "Arrigo Sacchi revolutionized football defending with his compact 4-4-2 press and Dutch trio (Gullit, Van Basten, Rijkaard).",
    hint: "Famous for saying: 'A jockey doesn't have to have been a horse first.'"
  },

  // --- FOOTBALL HISTORY & RECORDS ---
  {
    category: "Football History",
    difficulty: "Medium",
    question: "Which nation won the inaugural UEFA European Championship (then called the European Nations' Cup) in 1960?",
    options: ["Soviet Union", "Yugoslavia", "Czechoslovakia", "France"],
    correctAnswer: "Soviet Union",
    explanation: "The Soviet Union, featuring Lev Yashin in goal, defeated Yugoslavia 2-1 after extra time in Paris.",
    hint: "Lev Yashin was their star goalkeeper."
  },
  {
    category: "Football Records",
    difficulty: "Medium",
    question: "What is the longest unbeaten league streak in European football history (104 games, 1986-1989)?",
    options: ["Celtic (Scotland)", "Steaua București (Romania)", "Arsenal (England)", "AC Milan (Italy)"],
    correctAnswer: "Steaua București (Romania)",
    explanation: "Steaua București went 104 domestic league matches unbeaten between 1986 and 1989.",
    hint: "Romanian club that also won the 1986 European Cup."
  },
  {
    category: "Football Records",
    difficulty: "Hard",
    question: "Who holds the record for the most red cards in football history (46 career red cards)?",
    options: ["Sergio Ramos", "Gerardo Bedoya", "Pepe", "Roy Keane"],
    correctAnswer: "Gerardo Bedoya",
    explanation: "Colombian midfielder Gerardo Bedoya received a world record 46 red cards throughout his career.",
    hint: "Colombian midfielder nicknamed 'The Beast'."
  },
  {
    category: "Football Records",
    difficulty: "Expert",
    question: "What is the fastest recorded shot in football history, clocked at an astonishing 211 km/h (131 mph)?",
    options: ["Roberto Carlos vs France", "Ronny Heberson for Sporting CP", "Tony Yeboah for Leeds", "Zlatan Ibrahimović for PSG"],
    correctAnswer: "Ronny Heberson for Sporting CP",
    explanation: "Ronny Heberson's blistering free-kick for Sporting CP against Naval in November 2006 was recorded at 211 km/h.",
    hint: "Brazilian full-back playing in the Portuguese league in 2006."
  },

  // --- FOOTBALL RULES ---
  {
    category: "Football Rules",
    difficulty: "Easy",
    question: "What does the abbreviation 'VAR' stand for in modern football refereeing?",
    options: ["Video Assistant Referee", "Virtual Action Replay", "Visual Assistant Review", "Video Analysis Referee"],
    correctAnswer: "Video Assistant Referee",
    explanation: "VAR stands for Video Assistant Referee, introduced to review clear and obvious errors in match-changing incidents.",
    hint: "Standardized worldwide by FIFA and IFAB."
  },
  {
    category: "Football Rules",
    difficulty: "Medium",
    question: "Can a goalkeeper handle the ball if it was deliberately kicked to them by a teammate?",
    options: ["Yes, anywhere in their half", "Yes, as long as they are inside the penalty box", "No, it is a back-pass violation resulting in an indirect free kick", "No, it results in a penalty kick"],
    correctAnswer: "No, it is a back-pass violation resulting in an indirect free kick",
    explanation: "Under the back-pass rule introduced in 1992, handling a deliberate kick from a teammate results in an indirect free-kick.",
    hint: "Introduced in 1992 to prevent time-wasting."
  },
  {
    category: "Football Rules",
    difficulty: "Hard",
    question: "If the ball bursts or becomes defective during the run of play, how is the match restarted?",
    options: ["With a dropped ball at the position where it became defective", "With a throw-in to the team that had possession", "With an indirect free kick", "With a goal kick"],
    correctAnswer: "With a dropped ball at the position where it became defective",
    explanation: "Under Law 2 of the IFAB Laws, play is stopped, the ball replaced, and play restarts with a dropped ball.",
    hint: "The referee drops the replacement ball."
  }
];

async function seedMore() {
  const url = (process.env.VITE_INSFORGE_URL || 'https://gci83gu5.us-east.insforge.app').replace(/\/+$/, '');
  const apiKey = process.env.INSFORGE_API_KEY;

  const admin = createAdminClient({ baseUrl: url, apiKey });

  // 1. Get existing questions to eliminate duplicates
  const { data: existing } = await admin.database.from('quiz_questions').select('question');
  const seenKeys = new Set((existing || []).map(q => normalizeKey(q.question)));

  console.log(`Current questions in InsForge: ${seenKeys.size}`);

  const toInsert = [];
  const now = Date.now();

  for (let i = 0; i < MORE_QUESTIONS.length; i++) {
    const q = MORE_QUESTIONS[i];
    const key = normalizeKey(q.question);
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      toInsert.push({
        id: `q_seed2_${now + i}_${Math.random().toString(36).substring(2, 7)}`,
        question: q.question,
        category: q.category,
        difficulty: q.difficulty,
        options: q.options,
        correctanswer: q.correctAnswer,
        explanation: q.explanation || '',
        hint: q.hint || null,
        image: null,
        source: null,
        status: 'PUBLISHED',
        created_at: now + i
      });
    }
  }

  console.log(`New unique questions to add: ${toInsert.length}`);

  const batchSize = 15;
  for (let i = 0; i < toInsert.length; i += batchSize) {
    const batch = toInsert.slice(i, i + batchSize);
    const { error } = await admin.database.from('quiz_questions').insert(batch);
    if (error) console.error('Batch error:', error);
  }

  const { data: finalQs } = await admin.database.from('quiz_questions').select('category');
  console.log(`\n🎉 SUCCESS! Total questions now in InsForge: ${finalQs?.length}`);
  const breakdown = {};
  finalQs?.forEach(q => { breakdown[q.category] = (breakdown[q.category] || 0) + 1; });
  console.table(breakdown);
}

seedMore().catch(console.error);
