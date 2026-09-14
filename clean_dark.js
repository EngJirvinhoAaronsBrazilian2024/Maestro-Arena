const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('src');
for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    // regex to match dark: followed by word chars, hyphens, slashes, square brackets
    const original = content;
    content = content.replace(/dark:[a-zA-Z0-9/\[\]\-]+/g, '');
    // remove extra spaces left by replacement
    content = content.replace(/\s+/g, ' ');
    if (original !== content) {
        fs.writeFileSync(file, content, 'utf8');
    }
}
