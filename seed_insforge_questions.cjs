const { createAdminClient } = require('@insforge/sdk');
const dotenv = require('dotenv');
dotenv.config();

const normalizeKey = (text) => (text || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const QUESTIONS_DATA = [
  // --- PREMIER LEAGUE ---
  {
    category: "Premier League",
    difficulty: "Easy",
    question: "Which club has won the most English Premier League titles since its inception in 1992?",
    options: ["Arsenal", "Chelsea", "Manchester City", "Manchester United"],
    correctAnswer: "Manchester United",
    explanation: "Manchester United won 13 Premier League championships under Sir Alex Ferguson.",
    hint: "They play their home games at Old Trafford."
  },
  {
    category: "Premier League",
    difficulty: "Easy",
    question: "Who is the all-time top scorer in Premier League history with 260 goals?",
    options: ["Wayne Rooney", "Harry Kane", "Alan Shearer", "Sergio Agüero"],
    correctAnswer: "Alan Shearer",
    explanation: "Alan Shearer netted 260 goals across his legendary career with Blackburn Rovers and Newcastle United.",
    hint: "He famously celebrated with an open right hand raised in the air."
  },
  {
    category: "Premier League",
    difficulty: "Medium",
    question: "Who holds the record for the most assists in Premier League history with 162 assists?",
    options: ["Frank Lampard", "Cesc Fàbregas", "Ryan Giggs", "Kevin De Bruyne"],
    correctAnswer: "Ryan Giggs",
    explanation: "Ryan Giggs recorded 162 Premier League assists in 632 matches for Manchester United.",
    hint: "Welsh winger who played over two decades in the league."
  },
  {
    category: "Premier League",
    difficulty: "Medium",
    question: "Which club produced a 5,000-to-1 miracle to win the Premier League title in 2015-16?",
    options: ["Southampton", "Leicester City", "Blackburn Rovers", "Wigan Athletic"],
    correctAnswer: "Leicester City",
    explanation: "Claudio Ranieri's Leicester City stunned the globe by lifting the 2015-16 Premier League title.",
    hint: "Jamie Vardy and Riyad Mahrez were their standout attackers."
  },
  {
    category: "Premier League",
    difficulty: "Hard",
    question: "Who holds the record for most clean sheets kept in Premier League history (202)?",
    options: ["David de Gea", "Petr Čech", "David Seaman", "Edwin van der Sar"],
    correctAnswer: "Petr Čech",
    explanation: "Petr Čech kept 202 clean sheets in 443 Premier League appearances for Chelsea and Arsenal.",
    hint: "He wore a famous protective rugby-style helmet."
  },
  {
    category: "Premier League",
    difficulty: "Hard",
    question: "Who scored the quickest hat-trick in Premier League history (2 minutes, 56 seconds)?",
    options: ["Robbie Fowler", "Sadio Mané", "Jermain Defoe", "Erling Haaland"],
    correctAnswer: "Sadio Mané",
    explanation: "Sadio Mané scored three goals in under 3 minutes for Southampton against Aston Villa in May 2015.",
    hint: "Achieved before his famous transfer to Liverpool."
  },
  {
    category: "Premier League",
    difficulty: "Expert",
    question: "Who was the first manager from outside the British Isles to win the English Premier League?",
    options: ["Jose Mourinho", "Arsène Wenger", "Ruud Gullit", "Claudio Ranieri"],
    correctAnswer: "Arsène Wenger",
    explanation: "French tactician Arsène Wenger led Arsenal to the Premier League title in 1997-98.",
    hint: "Arrived at Highbury in 1996 from Nagoya Grampus Eight."
  },

  // --- LA LIGA ---
  {
    category: "La Liga",
    difficulty: "Easy",
    question: "Who is the all-time record goalscorer in Spanish La Liga history?",
    options: ["Cristiano Ronaldo", "Telmo Zarra", "Lionel Messi", "Hugo Sánchez"],
    correctAnswer: "Lionel Messi",
    explanation: "Lionel Messi scored 474 La Liga goals in 520 matches for FC Barcelona.",
    hint: "He once scored 50 league goals in a single season (2011-12)."
  },
  {
    category: "La Liga",
    difficulty: "Easy",
    question: "What is the world-famous match between Real Madrid and FC Barcelona called?",
    options: ["Derby della Madonnina", "El Clásico", "The Superclásico", "Der Klassiker"],
    correctAnswer: "El Clásico",
    explanation: "Any match played between Real Madrid and Barcelona is universally known as El Clásico.",
    hint: "Translates to 'The Classic' in Spanish."
  },
  {
    category: "La Liga",
    difficulty: "Medium",
    question: "Which manager broke the Real Madrid and Barcelona duopoly to win La Liga with Atlético Madrid in 2014 and 2021?",
    category: "La Liga",
    difficulty: "Medium",
    options: ["Marcelo Bielsa", "Diego Simeone", "Luis Aragonés", "Unai Emery"],
    correctAnswer: "Diego Simeone",
    explanation: "Diego 'El Cholo' Simeone has been manager of Atlético Madrid since December 2011.",
    hint: "Argentine manager known for his passionate black suit touchline presence."
  },
  {
    category: "La Liga",
    difficulty: "Hard",
    question: "Which three clubs have played in every single Spanish top-flight season without ever being relegated?",
    options: [
      "Real Madrid, Barcelona, Valencia",
      "Real Madrid, Barcelona, Athletic Club",
      "Real Madrid, Barcelona, Atlético Madrid",
      "Barcelona, Sevilla, Athletic Club"
    ],
    correctAnswer: "Real Madrid, Barcelona, Athletic Club",
    explanation: "Real Madrid, Barcelona, and Athletic Club Bilbao have competed in Primera División every year since 1929.",
    hint: "One of them adheres strictly to a policy of signing only Basque players."
  },
  {
    category: "La Liga",
    difficulty: "Hard",
    question: "Which goalkeeper won the prestigious Zamora Trophy a joint-record 5 times for FC Barcelona?",
    options: ["Víctor Valdés & Antoni Ramallets", "Iker Casillas & Santiago Cañizares", "Jan Oblak & Thibaut Courtois", "Andoni Zubizarreta & Marc-André ter Stegen"],
    correctAnswer: "Víctor Valdés & Antoni Ramallets",
    explanation: "Antoni Ramallets, Víctor Valdés, and Jan Oblak share the record with 5 Zamora Trophies each.",
    hint: "Both played in goal during legendary Barcelona eras."
  },

  // --- SERIE A ---
  {
    category: "Serie A",
    difficulty: "Easy",
    question: "What is the official shield and championship trophy badge awarded to Serie A winners called?",
    options: ["Coppa d'Oro", "Scudetto", "Ballon d'Or", "Supercoppa"],
    correctAnswer: "Scudetto",
    explanation: "The Scudetto ('little shield') is the tricolor emblem awarded to Italy's top-flight champion.",
    hint: "It represents the Italian green, white, and red flag."
  },
  {
    category: "Serie A",
    difficulty: "Medium",
    question: "Which club won their third historic Serie A title in 2022-23, their first in 33 years since Maradona?",
    options: ["AS Roma", "Fiorentina", "Napoli", "Lazio"],
    correctAnswer: "Napoli",
    explanation: "Luciano Spalletti's Napoli stormed to the 2022-23 Serie A title with Victor Osimhen winning the golden boot.",
    hint: "They play at the Stadio Diego Armando Maradona."
  },
  {
    category: "Serie A",
    difficulty: "Medium",
    question: "Who holds the all-time appearance record in Serie A with 657 matches?",
    options: ["Paolo Maldini", "Gianluigi Buffon", "Francesco Totti", "Javier Zanetti"],
    correctAnswer: "Gianluigi Buffon",
    explanation: "Gianluigi Buffon made 657 Serie A appearances for Parma and Juventus.",
    hint: "Iconic Italian goalkeeper who won the 2006 World Cup."
  },
  {
    category: "Serie A",
    difficulty: "Hard",
    question: "Which two strikers share the record for most goals scored in a single Serie A season (36 goals)?",
    options: [
      "Gonzalo Higuaín & Ciro Immobile",
      "Cristiano Ronaldo & Andriy Shevchenko",
      "Zlatan Ibrahimović & Gabriel Batistuta",
      "Luca Toni & Francesco Totti"
    ],
    correctAnswer: "Gonzalo Higuaín & Ciro Immobile",
    explanation: "Gonzalo Higuaín (Napoli 2015-16) and Ciro Immobile (Lazio 2019-20) both scored 36 goals.",
    hint: "One played for Napoli and the other for Lazio."
  },
  {
    category: "Serie A",
    difficulty: "Expert",
    question: "Which city is home to the famous 'Derby della Lanterna' between Genoa and Sampdoria?",
    options: ["Turin", "Genoa", "Florence", "Verona"],
    correctAnswer: "Genoa",
    explanation: "The derby takes its name from the Torre della Lanterna, the landmark lighthouse of Genoa.",
    hint: "It takes its name from the city's historic ancient lighthouse."
  },

  // --- BUNDESLIGA ---
  {
    category: "Bundesliga",
    difficulty: "Easy",
    question: "Which club has won the most German Bundesliga titles in history?",
    options: ["Borussia Dortmund", "Hamburger SV", "Bayern Munich", "Bayer Leverkusen"],
    correctAnswer: "Bayern Munich",
    explanation: "FC Bayern Munich has won over 30 Bundesliga titles, including 11 consecutive titles from 2013 to 2023.",
    hint: "Bavarian giants based at the Allianz Arena."
  },
  {
    category: "Bundesliga",
    difficulty: "Easy",
    question: "Which club went completely unbeaten throughout the entire 2023-24 Bundesliga season?",
    options: ["Borussia Dortmund", "Bayer Leverkusen", "RB Leipzig", "VfB Stuttgart"],
    correctAnswer: "Bayer Leverkusen",
    explanation: "Xabi Alonso guided Bayer Leverkusen to an undefeated 2023-24 campaign (28 wins, 6 draws).",
    hint: "Managed by former Liverpool, Real Madrid, and Bayern midfielder Xabi Alonso."
  },
  {
    category: "Bundesliga",
    difficulty: "Medium",
    question: "Who scored 41 league goals in the 2020-21 season to break Gerd Müller's all-time single-season Bundesliga record?",
    options: ["Erling Haaland", "Robert Lewandowski", "Pierre-Emerick Aubameyang", "Harry Kane"],
    correctAnswer: "Robert Lewandowski",
    explanation: "Robert Lewandowski scored 41 Bundesliga goals in just 29 games during 2020-21 for Bayern Munich.",
    hint: "Polish striker who broke the record in the 90th minute on the final matchday."
  },
  {
    category: "Bundesliga",
    difficulty: "Hard",
    question: "How many goals did Robert Lewandowski score in just 9 minutes as a substitute against Wolfsburg in 2015?",
    options: ["3", "4", "5", "6"],
    correctAnswer: "5",
    explanation: "Lewandowski scored 5 goals in 8 minutes and 59 seconds between the 51st and 60th minutes.",
    hint: "Pep Guardiola was seen holding his head with hands in sheer amazement."
  },
  {
    category: "Bundesliga",
    difficulty: "Expert",
    question: "Which club won back-to-back Bundesliga titles under Jürgen Klopp in 2010-11 and 2011-12?",
    options: ["Mainz 05", "Schalke 04", "Borussia Dortmund", "Werder Bremen"],
    correctAnswer: "Borussia Dortmund",
    explanation: "Klopp built an energetic 'Heavy Metal Football' side at Dortmund that won consecutive German titles.",
    hint: "Famous for their 80,000-capacity 'Yellow Wall' at Signal Iduna Park."
  },

  // --- UEFA CHAMPIONS LEAGUE ---
  {
    category: "UEFA Champions League",
    difficulty: "Easy",
    question: "Which club staged the dramatic 'Miracle of Istanbul' in the 2005 Champions League Final?",
    options: ["Liverpool", "AC Milan", "Chelsea", "FC Porto"],
    correctAnswer: "Liverpool",
    explanation: "Liverpool trailed AC Milan 3-0 at half-time, equalized to 3-3, and won on penalties in Istanbul.",
    hint: "Steven Gerrard and Jerzy Dudek were the heroes."
  },
  {
    category: "UEFA Champions League",
    difficulty: "Medium",
    question: "Who are the only two players to score in three different UEFA Champions League finals?",
    options: [
      "Cristiano Ronaldo & Gareth Bale",
      "Cristiano Ronaldo & Sergio Ramos",
      "Lionel Messi & Karim Benzema",
      "Raúl & Samuel Eto'o"
    ],
    correctAnswer: "Cristiano Ronaldo & Sergio Ramos",
    explanation: "Cristiano Ronaldo scored in 2008, 2014, and 2017; Sergio Ramos scored in 2014 and 2016.",
    hint: "Both played together during Real Madrid's four-title run."
  },
  {
    category: "UEFA Champions League",
    difficulty: "Medium",
    question: "Which manager holds the record for winning the most UEFA Champions League titles as a coach (5 titles)?",
    options: ["Pep Guardiola", "Alex Ferguson", "Carlo Ancelotti", "Zinedine Zidane"],
    correctAnswer: "Carlo Ancelotti",
    explanation: "Carlo Ancelotti won 2 titles with AC Milan (2003, 2007) and 3 with Real Madrid (2014, 2022, 2024).",
    hint: "The Italian tactician nicknamed 'Don Carlo'."
  },
  {
    category: "UEFA Champions League",
    difficulty: "Hard",
    question: "Who is the only player to have won the UEFA Champions League with three different clubs?",
    options: ["Clarence Seedorf", "Cristiano Ronaldo", "Samuel Eto'o", "Mateo Kovačić"],
    correctAnswer: "Clarence Seedorf",
    explanation: "Clarence Seedorf won with Ajax (1995), Real Madrid (1998), and AC Milan (2003, 2007).",
    hint: "Dutch midfield maestro."
  },
  {
    category: "UEFA Champions League",
    difficulty: "Expert",
    question: "Who scored the fastest goal in UEFA Champions League history after just 10.12 seconds?",
    options: ["Roy Makaay", "Alexandre Pato", "Clarence Seedorf", "David Alaba"],
    correctAnswer: "Roy Makaay",
    explanation: "Roy Makaay scored for Bayern Munich against Real Madrid on March 7, 2007 in 10.12 seconds.",
    hint: "Dutch striker nicknamed 'Das Phantom'."
  },

  // --- UEFA EUROPA LEAGUE ---
  {
    category: "UEFA Europa League",
    difficulty: "Easy",
    question: "Which club is the most successful in UEFA Europa League / UEFA Cup history with 7 titles?",
    options: ["Inter Milan", "Sevilla FC", "Atlético Madrid", "Juventus"],
    correctAnswer: "Sevilla FC",
    explanation: "Sevilla won the trophy in 2006, 2007, 2014, 2015, 2016, 2020, and 2023.",
    hint: "Spanish club based in Andalusia."
  },
  {
    category: "UEFA Europa League",
    difficulty: "Medium",
    question: "Which coach has won the UEFA Europa League a record 4 times?",
    options: ["Jose Mourinho", "Diego Simeone", "Unai Emery", "Rafael Benítez"],
    correctAnswer: "Unai Emery",
    explanation: "Unai Emery won three titles with Sevilla (2014-2016) and one with Villarreal (2021).",
    hint: "Basque manager currently managing Aston Villa."
  },
  {
    category: "UEFA Europa League",
    difficulty: "Hard",
    question: "Who scored an iconic hat-trick for Atalanta in the 2024 UEFA Europa League Final against Bayer Leverkusen?",
    options: ["Gianluca Scamacca", "Charles De Ketelaere", "Ademola Lookman", "Teun Koopmeiners"],
    correctAnswer: "Ademola Lookman",
    explanation: "Nigerian winger Ademola Lookman scored all three goals in Atalanta's 3-0 triumph in Dublin.",
    hint: "Super Eagles international forward."
  },

  // --- FIFA WORLD CUP ---
  {
    category: "FIFA World Cup",
    difficulty: "Easy",
    question: "Which nation has won the most FIFA World Cups in football history?",
    options: ["Germany", "Italy", "Argentina", "Brazil"],
    correctAnswer: "Brazil",
    explanation: "Brazil has won 5 FIFA World Cups (1958, 1962, 1970, 1994, and 2002).",
    hint: "They are known as the Seleção."
  },
  {
    category: "FIFA World Cup",
    difficulty: "Easy",
    question: "Who is the all-time top goalscorer in FIFA World Cup finals tournaments with 16 goals?",
    options: ["Pelé", "Ronaldo Nazário", "Miroslav Klose", "Lionel Messi"],
    correctAnswer: "Miroslav Klose",
    explanation: "German striker Miroslav Klose scored 16 goals across four tournaments between 2002 and 2014.",
    hint: "He scored his record 16th goal during Germany's 7-1 semi-final win over Brazil in 2014."
  },
  {
    category: "FIFA World Cup",
    difficulty: "Medium",
    question: "Who scored a sensational hat-trick in the 2022 World Cup Final in Qatar?",
    options: ["Lionel Messi", "Kylian Mbappé", "Julián Álvarez", "Angel Di María"],
    correctAnswer: "Kylian Mbappé",
    explanation: "Kylian Mbappé scored three goals for France against Argentina, winning the 2022 Golden Boot.",
    hint: "French number 10 superstar."
  },
  {
    category: "FIFA World Cup",
    difficulty: "Medium",
    question: "Which country hosted the first ever FIFA World Cup tournament in 1930?",
    options: ["Italy", "Uruguay", "Brazil", "Switzerland"],
    correctAnswer: "Uruguay",
    explanation: "Uruguay hosted the inaugural 1930 World Cup in Montevideo and defeated Argentina 4-2 in the final.",
    hint: "They also won Olympic gold in 1924 and 1928."
  },
  {
    category: "FIFA World Cup",
    difficulty: "Hard",
    question: "Who scored the quickest goal in FIFA World Cup history after just 10.8 seconds?",
    options: ["Bryan Robson", "Hakan Şükür", "Clint Dempsey", "Václav Mašek"],
    correctAnswer: "Hakan Şükür",
    explanation: "Turkey's Hakan Şükür scored in 10.8 seconds against South Korea in the 2002 third-place match.",
    hint: "Turkish striker nicknamed the 'Bull of the Bosphorus'."
  },
  {
    category: "FIFA World Cup",
    difficulty: "Expert",
    question: "Who is the only player to have won three FIFA World Cup tournaments as a player?",
    options: ["Garrincha", "Pelé", "Cafu", "Mario Zagallo"],
    correctAnswer: "Pelé",
    explanation: "Pelé won the World Cup with Brazil in 1958, 1962, and 1970.",
    hint: "Nicknamed 'O Rei' (The King)."
  },

  // --- AFRICAN CUP OF NATIONS (AFCON) ---
  {
    category: "African Cup of Nations",
    difficulty: "Easy",
    question: "Which nation has won the most Africa Cup of Nations (AFCON) titles with 7 championships?",
    options: ["Cameroon", "Ghana", "Nigeria", "Egypt"],
    correctAnswer: "Egypt",
    explanation: "Egypt's Pharaohs have won a record 7 AFCON titles, including three straight in 2006, 2008, and 2010.",
    hint: "Known as the Pharaohs."
  },
  {
    category: "African Cup of Nations",
    difficulty: "Medium",
    question: "Who is the all-time leading goalscorer in AFCON tournament history with 18 goals?",
    options: ["Didier Drogba", "Samuel Eto'o", "Rashidi Yekini", "Laurent Pokou"],
    correctAnswer: "Samuel Eto'o",
    explanation: "Cameroon legend Samuel Eto'o scored 18 AFCON goals across six tournaments.",
    hint: "Four-time African Footballer of the Year who won Champions Leagues with Barcelona and Inter."
  },
  {
    category: "African Cup of Nations",
    difficulty: "Medium",
    question: "Which nation won their first ever AFCON title in 2021 (played in 2022) with Sadio Mané scoring the decisive penalty?",
    options: ["Senegal", "Algeria", "Ivory Coast", "Mali"],
    correctAnswer: "Senegal",
    explanation: "Senegal's Lions of Teranga, managed by Aliou Cissé, defeated Egypt in a penalty shootout.",
    hint: "Nicknamed the Lions of Teranga."
  },
  {
    category: "African Cup of Nations",
    difficulty: "Hard",
    question: "Which host country sacked their coach mid-tournament and still went on to win AFCON 2023 (played in 2024)?",
    options: ["Nigeria", "South Africa", "Ivory Coast", "DR Congo"],
    correctAnswer: "Ivory Coast",
    explanation: "Ivory Coast replaced Jean-Louis Gasset with Emerse Faé and miraculously fought through to win the title.",
    hint: "Sébastien Haller scored the winning goal in the final in Abidjan."
  },

  // --- FOOTBALL PLAYERS ---
  {
    category: "Football Players",
    difficulty: "Easy",
    question: "Who has won the most Ballon d'Or awards in football history with 8 trophies?",
    options: ["Cristiano Ronaldo", "Lionel Messi", "Johan Cruyff", "Marco van Basten"],
    correctAnswer: "Lionel Messi",
    explanation: "Lionel Messi won eight Ballon d'Or awards: 2009, 2010, 2011, 2012, 2015, 2019, 2021, and 2023.",
    hint: "Captained Argentina to World Cup glory in Qatar."
  },
  {
    category: "Football Players",
    difficulty: "Easy",
    question: "Which Brazilian forward was nicknamed 'O Fenômeno' (The Phenomenon)?",
    options: ["Ronaldinho", "Romário", "Ronaldo Nazário", "Rivaldo"],
    correctAnswer: "Ronaldo Nazário",
    explanation: "Ronaldo Luís Nazário de Lima won two World Cups and was renowned as Il Fenomeno.",
    hint: "Scored twice in the 2002 World Cup Final against Oliver Kahn."
  },
  {
    category: "Football Players",
    difficulty: "Medium",
    question: "Who won the Golden Boy award for best under-21 player in Europe in 2024 at age 17?",
    options: ["Arda Güler", "Lamine Yamal", "Warren Zaïre-Emery", "Kobbie Mainoo"],
    correctAnswer: "Lamine Yamal",
    explanation: "Lamine Yamal shone for Spain at Euro 2024 and Barcelona, winning the 2024 Golden Boy and Kopa Trophy.",
    hint: "Curled home a wonder goal against France in the Euro 2024 semi-final."
  },
  {
    category: "Football Players",
    difficulty: "Medium",
    question: "Which player has scored over 900 official career senior goals for clubs and country?",
    options: ["Lionel Messi", "Cristiano Ronaldo", "Pelé", "Josef Bican"],
    correctAnswer: "Cristiano Ronaldo",
    explanation: "Cristiano Ronaldo officially crossed the historic milestone of 900 official career goals in September 2024.",
    hint: "Celebrates with his signature 'SIUUU' leap."
  },
  {
    category: "Football Players",
    difficulty: "Hard",
    question: "Who is the only goalkeeper to have ever won the Ballon d'Or award (in 1963)?",
    options: ["Dino Zoff", "Lev Yashin", "Gordon Banks", "Oliver Kahn"],
    correctAnswer: "Lev Yashin",
    explanation: "Soviet goalkeeper Lev Yashin, known as 'The Black Spider', won the Ballon d'Or in 1963.",
    hint: "Nicknamed 'The Black Spider'."
  },

  // --- FOOTBALL CLUBS ---
  {
    category: "Football Clubs",
    difficulty: "Easy",
    question: "What is the famous home stadium of FC Barcelona called?",
    options: ["Santiago Bernabéu", "Camp Nou", "San Siro", "Mestalla"],
    correctAnswer: "Camp Nou",
    explanation: "Spotify Camp Nou is Barcelona's iconic home, the biggest football stadium in Europe.",
    hint: "Translates to 'New Field/Ground' in Catalan."
  },
  {
    category: "Football Clubs",
    difficulty: "Easy",
    question: "What is the traditional nickname of Liverpool Football Club?",
    options: ["The Gunners", "The Reds", "The Blues", "The Citizens"],
    correctAnswer: "The Reds",
    explanation: "Liverpool have played in an iconic all-red kit at Anfield since the mid-1960s under Bill Shankly.",
    hint: "Famous for singing 'You'll Never Walk Alone'."
  },
  {
    category: "Football Clubs",
    difficulty: "Medium",
    question: "Which club's world-famous youth academy is known as 'La Masia'?",
    options: ["Real Madrid", "Ajax", "FC Barcelona", "Sporting CP"],
    correctAnswer: "FC Barcelona",
    explanation: "La Masia produced Lionel Messi, Andres Iniesta, Xavi Hernandez, Sergio Busquets, and Lamine Yamal.",
    hint: "Catalan word meaning 'The Farmhouse'."
  },
  {
    category: "Football Clubs",
    difficulty: "Medium",
    question: "Which club won three consecutive European Cups from 1971 to 1973 pioneering 'Total Football'?",
    options: ["Bayern Munich", "Ajax", "Benfica", "Feyenoord"],
    correctAnswer: "Ajax",
    explanation: "AFC Ajax of Amsterdam revolutionized football tactics under Rinus Michels and Johan Cruyff.",
    hint: "Dutch club named after the legendary Greek mythological hero."
  },
  {
    category: "Football Clubs",
    difficulty: "Hard",
    question: "Which football club has won the most official league championship titles in Scotland (over 55 titles)?",
    options: ["Celtic", "Rangers", "Aberdeen", "Heart of Midlothian"],
    correctAnswer: "Rangers",
    explanation: "Rangers FC play at Ibrox and have won 55 Scottish league titles.",
    hint: "They contest the ferocious Old Firm derby against Celtic."
  },

  // --- FAMOUS MANAGERS ---
  {
    category: "Famous Managers",
    difficulty: "Easy",
    question: "Who won 38 major trophies over 26 years as manager of Manchester United?",
    options: ["Matt Busby", "Jose Mourinho", "Sir Alex Ferguson", "Bob Paisley"],
    correctAnswer: "Sir Alex Ferguson",
    explanation: "Sir Alex Ferguson retired in 2013 after leading United to 13 Premier Leagues and 2 Champions Leagues.",
    hint: "Scottish manager who has a stand and statue at Old Trafford."
  },
  {
    category: "Famous Managers",
    difficulty: "Easy",
    question: "Which manager famously proclaimed himself 'The Special One' in 2004?",
    options: ["Pep Guardiola", "Arsène Wenger", "Jose Mourinho", "Jurgen Klopp"],
    correctAnswer: "Jose Mourinho",
    explanation: "Jose Mourinho made the declaration in his introductory press conference at Chelsea in June 2004.",
    hint: "Won Champions League titles with Porto and Inter Milan."
  },
  {
    category: "Famous Managers",
    difficulty: "Medium",
    question: "Which manager achieved the continental Treble with both Barcelona (2008-09) and Manchester City (2022-23)?",
    options: ["Carlo Ancelotti", "Pep Guardiola", "Luis Enrique", "Zinedine Zidane"],
    correctAnswer: "Pep Guardiola",
    explanation: "Pep Guardiola is the first manager in football history to win two European trebles with men's clubs.",
    hint: "Mastermind of the tiki-taka tactical revolution."
  },
  {
    category: "Famous Managers",
    difficulty: "Hard",
    question: "Who is the only manager to have won the league title in each of Europe's top 5 leagues (ENG, ESP, ITA, GER, FRA)?",
    options: ["Jose Mourinho", "Carlo Ancelotti", "Giovanni Trapattoni", "Marcello Lippi"],
    correctAnswer: "Carlo Ancelotti",
    explanation: "Ancelotti won titles with Chelsea, Real Madrid, AC Milan, Bayern Munich, and Paris Saint-Germain.",
    hint: "Italian coach renowned for his calm demeanor and raised eyebrow."
  },
  {
    category: "Famous Managers",
    difficulty: "Hard",
    question: "Which manager steered Real Madrid to three consecutive Champions League titles between 2016 and 2018?",
    options: ["Vicente del Bosque", "Zinedine Zidane", "Carlo Ancelotti", "Santiago Solari"],
    correctAnswer: "Zinedine Zidane",
    explanation: "Zinedine Zidane achieved an unprecedented Champions League three-peat in 2016, 2017, and 2018.",
    hint: "French legend who scored the iconic volley in the 2002 final."
  },

  // --- AFRICAN FOOTBALL ---
  {
    category: "African Football",
    difficulty: "Easy",
    question: "Which African footballer won both the Ballon d'Or and FIFA World Player of the Year in 1995?",
    options: ["Samuel Eto'o", "Didier Drogba", "George Weah", "Abedi Pele"],
    correctAnswer: "George Weah",
    explanation: "Liberian forward George Weah remains the only African to win the men's Ballon d'Or.",
    hint: "Later became the President of Liberia."
  },
  {
    category: "African Football",
    difficulty: "Easy",
    question: "Which African club has won the most CAF Champions League titles with 12+ continental trophies?",
    options: ["Zamalek", "Al Ahly", "TP Mazembe", "Wydad Casablanca"],
    correctAnswer: "Al Ahly",
    explanation: "Al Ahly SC of Cairo, Egypt, is recognized as the African Club of the Century.",
    hint: "Cairo giants known as The Red Devils of Africa."
  },
  {
    category: "African Football",
    difficulty: "Medium",
    question: "Which Cameroonian striker celebrated by dancing by the corner flag at Italia '90 and scored in 1994 at age 42?",
    options: ["Roger Milla", "Patrick M'Boma", "Rigobert Song", "François Omam-Biyik"],
    correctAnswer: "Roger Milla",
    explanation: "Roger Milla is the oldest goalscorer in World Cup history at 42 years and 39 days.",
    hint: "Famous for his makossa dance at the corner flag."
  },
  {
    category: "African Football",
    difficulty: "Medium",
    question: "Which Nigerian forward was crowned CAF Men's Player of the Year in 2023 after winning Serie A with Napoli?",
    options: ["Ademola Lookman", "Victor Boniface", "Victor Osimhen", "Alex Iwobi"],
    correctAnswer: "Victor Osimhen",
    explanation: "Victor Osimhen netted 26 goals in Serie A to win the 2023 African Player of the Year.",
    hint: "Famously wears a protective black carbon-fiber face mask."
  },

  // --- FOOTBALL HISTORY ---
  {
    category: "Football History",
    difficulty: "Medium",
    question: "In which year and city was the world's first national football association (The Football Association) established?",
    options: ["London, 1863", "Sheffield, 1857", "Glasgow, 1872", "Manchester, 1888"],
    correctAnswer: "London, 1863",
    explanation: "The Football Association (FA) was founded on October 26, 1863 at the Freemasons' Tavern in London.",
    hint: "Founded in a London tavern during the Victorian era."
  },
  {
    category: "Football History",
    difficulty: "Medium",
    question: "What is officially recognized by FIFA as the oldest active football club in the world, founded in 1857?",
    options: ["Notts County", "Sheffield FC", "Stoke City", "Hallam FC"],
    correctAnswer: "Sheffield FC",
    explanation: "Sheffield FC was established on October 24, 1857 in South Yorkshire, England.",
    hint: "Located in Sheffield, England."
  },
  {
    category: "Football History",
    difficulty: "Medium",
    question: "What was the original name of the FIFA World Cup trophy, awarded from 1930 to 1970?",
    options: ["The Jules Rimet Trophy", "The Henri Delaunay Trophy", "The Coubertin Cup", "The Stanley Rous Shield"],
    correctAnswer: "The Jules Rimet Trophy",
    explanation: "Named after the 3rd FIFA President Jules Rimet, Brazil kept it after their third win in 1970.",
    hint: "Named after the pioneering French FIFA president who created the World Cup."
  },
  {
    category: "Football History",
    difficulty: "Hard",
    question: "In what year were red and yellow cards first used in a FIFA World Cup tournament?",
    options: ["1958 Sweden", "1966 England", "1970 Mexico", "1974 West Germany"],
    correctAnswer: "1970 Mexico",
    explanation: "Invented by referee Ken Aston, yellow and red cards debuted at the 1970 World Cup in Mexico.",
    hint: "Debuted at the tournament where Pelé won his third World Cup."
  },

  // --- FOOTBALL RECORDS ---
  {
    category: "Football Records",
    difficulty: "Easy",
    question: "Who holds the record for most official goals scored in a single calendar year (91 goals in 2012)?",
    options: ["Cristiano Ronaldo", "Gerd Müller", "Lionel Messi", "Robert Lewandowski"],
    correctAnswer: "Lionel Messi",
    explanation: "Lionel Messi scored 91 goals in 69 games in 2012 for Barcelona and Argentina, breaking Gerd Müller's record of 85.",
    hint: "Achieved during his Ballon d'Or winning year in 2012."
  },
  {
    category: "Football Records",
    difficulty: "Easy",
    question: "Who is the most expensive transfer in football history, transferring for €222 million in 2017?",
    options: ["Kylian Mbappé", "Neymar Jr", "Philippe Coutinho", "Jack Grealish"],
    correctAnswer: "Neymar Jr",
    explanation: "Paris Saint-Germain paid Neymar's €222 million buyout clause to sign him from FC Barcelona in August 2017.",
    hint: "Brazilian superstar forward."
  },
  {
    category: "Football Records",
    difficulty: "Hard",
    question: "Which goalkeeper holds the official world record for most career goals scored by a goalkeeper (131 goals)?",
    options: ["José Luis Chilavert", "Rogério Ceni", "René Higuita", "Jorge Campos"],
    correctAnswer: "Rogério Ceni",
    explanation: "Brazilian goalkeeper Rogério Ceni scored 131 career goals (free kicks and penalties) for São Paulo FC.",
    hint: "Legendary captain and goalkeeper of São Paulo FC."
  },
  {
    category: "Football Records",
    difficulty: "Hard",
    question: "What is the highest score ever recorded in an official senior international match (Australia vs American Samoa in 2001)?",
    options: ["21-0", "27-0", "31-0", "36-0"],
    correctAnswer: "31-0",
    explanation: "Australia beat American Samoa 31-0 on April 11, 2001. Archie Thompson scored 13 goals in the match.",
    hint: "Australia scored more than 30 unanswered goals."
  },

  // --- FOOTBALL RULES ---
  {
    category: "Football Rules",
    difficulty: "Easy",
    question: "According to the IFAB Laws of the Game, what is the regulation duration of a standard football match?",
    options: ["80 minutes", "90 minutes", "100 minutes", "120 minutes"],
    correctAnswer: "90 minutes",
    explanation: "A standard regulation match lasts two equal periods of 45 minutes, plus stoppage time.",
    hint: "Two halves of forty-five minutes."
  },
  {
    category: "Football Rules",
    difficulty: "Easy",
    question: "How far is the penalty spot located from the goal line?",
    options: ["10 yards (9.15m)", "12 yards (11m)", "15 yards (13.7m)", "18 yards (16.5m)"],
    correctAnswer: "12 yards (11m)",
    explanation: "The penalty spot is positioned exactly 12 yards (11 meters) from the midpoint between the goalposts.",
    hint: "Often called the 12-yard spot."
  },
  {
    category: "Football Rules",
    difficulty: "Medium",
    question: "Can a player be called offside when receiving the ball directly from a throw-in, goal kick, or corner kick?",
    options: ["No, not from any of the three", "Yes, from all three", "Only from throw-ins", "Only from goal kicks"],
    correctAnswer: "No, not from any of the three",
    explanation: "Under Law 11 of the IFAB Laws of the Game, there is no offside offense on a throw-in, goal kick, or corner kick.",
    hint: "Direct restarts from touchlines and goal lines have an exemption."
  },
  {
    category: "Football Rules",
    difficulty: "Hard",
    question: "What is the referee's decision if a player kicks an indirect free kick directly into the opponent's goal without touching anyone?",
    options: ["Goal is awarded", "Goal kick to the defending team", "Corner kick", "Retake the free kick"],
    correctAnswer: "Goal kick to the defending team",
    explanation: "A goal cannot be scored directly from an indirect free kick; if it enters the opponents' goal untouched, play restarts with a goal kick.",
    hint: "An indirect kick must touch another player before a goal can count."
  },
  {
    category: "Football Rules",
    difficulty: "Hard",
    question: "What is the minimum number of players a team must have on the pitch for a match to continue?",
    options: ["6 players", "7 players", "8 players", "9 players"],
    correctAnswer: "7 players",
    explanation: "Under Law 3 of the IFAB Laws of the Game, a match cannot continue if either team has fewer than seven players.",
    hint: "If five players are sent off, the match is abandoned."
  },

  // --- WORLD FOOTBALL ---
  {
    category: "World Football",
    difficulty: "Easy",
    question: "Which nation won the UEFA Euro 2024 Championship tournament in Germany?",
    options: ["England", "Germany", "France", "Spain"],
    correctAnswer: "Spain",
    explanation: "Spain defeated England 2-1 in the final in Berlin, winning all 7 of their matches.",
    hint: "La Roja won their 4th European Championship title."
  },
  {
    category: "World Football",
    difficulty: "Easy",
    question: "Which South American club competition is the continental equivalent of Europe's UEFA Champions League?",
    options: ["Copa Sudamericana", "Copa Libertadores", "Recopa Sudamericana", "Copa do Brasil"],
    correctAnswer: "Copa Libertadores",
    explanation: "The CONMEBOL Copa Libertadores has crowned the premier club in South America since 1960.",
    hint: "Named in honor of the liberators of South American independence."
  },
  {
    category: "World Football",
    difficulty: "Medium",
    question: "Which nation won back-to-back Copa América championships in 2021 and 2024?",
    options: ["Brazil", "Uruguay", "Argentina", "Colombia"],
    correctAnswer: "Argentina",
    explanation: "Lionel Scaloni's Argentina defeated Brazil in 2021 and Colombia in 2024 to secure back-to-back titles.",
    hint: "La Albiceleste led by Lionel Messi."
  },
  {
    category: "World Football",
    difficulty: "Medium",
    question: "Which two clubs contest the fierce 'Superclásico' rivalry in Buenos Aires, Argentina?",
    options: ["Boca Juniors vs River Plate", "Flamengo vs Fluminense", "Racing Club vs Independiente", "Nacional vs Peñarol"],
    correctAnswer: "Boca Juniors vs River Plate",
    explanation: "Boca Juniors and River Plate contest the Superclásico, widely considered one of the most intense derbies in sports.",
    hint: "Played between La Bombonera and El Monumental stadiums."
  },
  {
    category: "World Football",
    difficulty: "Hard",
    question: "Which country won the 2023 FIFA Women's World Cup hosted in Australia and New Zealand?",
    options: ["England", "USA", "Spain", "Sweden"],
    correctAnswer: "Spain",
    explanation: "Spain defeated England 1-0 in the final in Sydney to win their first Women's World Cup.",
    hint: "Olga Carmona scored the winning goal in the final."
  }
];

async function seedDatabase() {
  const url = (process.env.VITE_INSFORGE_URL || 'https://gci83gu5.us-east.insforge.app').replace(/\/+$/, '');
  const apiKey = process.env.INSFORGE_API_KEY;

  if (!apiKey) {
    console.error('Missing INSFORGE_API_KEY!');
    process.exit(1);
  }

  const admin = createAdminClient({ baseUrl: url, apiKey });

  console.log('Connecting to InsForge database...');

  // 1. Fetch all existing questions to ensure ZERO repetition
  const { data: existing, error: fetchErr } = await admin.database
    .from('quiz_questions')
    .select('id, question, category');

  if (fetchErr) {
    console.error('Error fetching existing questions:', fetchErr);
    process.exit(1);
  }

  const existingCount = existing ? existing.length : 0;
  console.log(`Found ${existingCount} questions already in database.`);

  const seenKeys = new Set();
  if (existing) {
    existing.forEach(q => {
      seenKeys.add(normalizeKey(q.question));
    });
  }

  // 2. Filter new questions to guarantee NO repetition
  const toInsert = [];
  const now = Date.now();

  for (let i = 0; i < QUESTIONS_DATA.length; i++) {
    const q = QUESTIONS_DATA[i];
    const key = normalizeKey(q.question);
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      const newId = `q_seed_${now + i}_${Math.random().toString(36).substring(2, 7)}`;
      toInsert.push({
        id: newId,
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
    } else {
      console.log(`Skipping duplicate question: "${q.question}"`);
    }
  }

  console.log(`Identified ${toInsert.length} brand new, unique questions to insert.`);

  if (toInsert.length === 0) {
    console.log('All questions are already present in the database!');
    return;
  }

  // 3. Insert in batches
  const batchSize = 15;
  let insertedTotal = 0;

  for (let i = 0; i < toInsert.length; i += batchSize) {
    const batch = toInsert.slice(i, i + batchSize);
    const { data, error } = await admin.database
      .from('quiz_questions')
      .insert(batch);

    if (error) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
    } else {
      insertedTotal += batch.length;
      console.log(`Inserted batch ${i / batchSize + 1} (${batch.length} questions). Total inserted: ${insertedTotal}`);
    }
  }

  // 4. Verify final database count
  const { data: finalData } = await admin.database
    .from('quiz_questions')
    .select('id, category, difficulty');

  console.log(`\n🎉 SEEDING COMPLETED! Total questions in InsForge database: ${finalData?.length}`);

  const breakdown = {};
  if (finalData) {
    finalData.forEach(q => {
      breakdown[q.category] = (breakdown[q.category] || 0) + 1;
    });
  }
  console.log('Category breakdown in InsForge:');
  console.table(breakdown);
}

seedDatabase().catch(console.error);
