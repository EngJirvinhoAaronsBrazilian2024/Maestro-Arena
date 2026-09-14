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
files.push('index.html');
for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;
    // remove dark: classes
    content = content.replace(/dark:[a-zA-Z0-9/\[\]\-]+/g, '');
    
    // The user wants primary background #F7F9FC
    // Secondary background #FFFFFF
    // Text primary #111827
    // Primary accent #16A34A (green-600)
    // Replace bg-slate-50 with bg-[#F7F9FC] (or we can just keep bg-slate-50 if it's close, but let's use custom for bg)
    
    if (original !== content) {
        // Also remove double spaces that might have formed, but only inside quotes? 
        // Safer to just replace "  +" with " " inside classNames, but regex `class(Name)?="[^"]*"` is needed
        content = content.replace(/className="([^"]*)"/g, (match, p1) => {
            return `className="${p1.replace(/\s+/g, ' ').trim()}"`;
        });
        fs.writeFileSync(file, content, 'utf8');
    }
}
