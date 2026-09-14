const fs = require('fs');

let index = fs.readFileSync('index.html', 'utf8');

index = index.replace('<title>Sports Hub</title>', ''); // remove the weird one in the link
index = index.replace('family=Inter:wght@400;500;600;700display=swap', 'family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');
index = index.replace(/Sports Hub/g, 'Maestro Arena');

fs.writeFileSync('index.html', index, 'utf8');

let metadata = fs.readFileSync('metadata.json', 'utf8');
metadata = metadata.replace(/"name": "Sports Hub"/g, '"name": "Maestro Arena"');
fs.writeFileSync('metadata.json', metadata, 'utf8');

