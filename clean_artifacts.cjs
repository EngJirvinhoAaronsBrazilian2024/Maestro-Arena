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
            if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css') || file.endsWith('.html')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('src');
for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;
    
    // Replace dangling ' :some-class' caused by removing 'dark' from 'dark:some-class'
    content = content.replace(/\s+:[a-zA-Z0-9/\[\]\-]+/g, '');
    
    if (original !== content) {
        // clean up double spaces inside classNames
        content = content.replace(/className="([^"]*)"/g, (match, p1) => {
            return `className="${p1.replace(/\s+/g, ' ').trim()}"`;
        });
        fs.writeFileSync(file, content, 'utf8');
    }
}
