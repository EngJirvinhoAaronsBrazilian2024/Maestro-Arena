const fs = require('fs');
const path = './firebase-blueprint.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

data.entities.Tip = {
  title: "Tip",
  description: "Football prediction tip",
  type: "object",
  properties: {
    category: { type: "string", enum: ["single", "maestro2+", "odd4+"] },
    matchId: { type: "string" },
    homeTeam: { type: "string" },
    awayTeam: { type: "string" },
    homeLogo: { type: "string" },
    awayLogo: { type: "string" },
    competition: { type: "string" },
    prediction: { type: "string" },
    market: { type: "string" },
    odds: { type: "number" },
    analysis: { type: "string" },
    kickoff: { type: "number" },
    status: { type: "string", enum: ["pending", "won", "lost", "void", "postponed"] },
    publishDate: { type: "number" },
    createdAt: { type: "number" }
  },
  required: ["category", "homeTeam", "awayTeam", "prediction", "publishDate", "createdAt"]
};

data.firestore.tips = {
  schema: { $ref: "#/entities/Tip" },
  description: "Stores daily football predictions"
};

fs.writeFileSync(path, JSON.stringify(data, null, 2));
