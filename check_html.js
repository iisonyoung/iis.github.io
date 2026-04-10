const fs = require('fs');

function checkHTML(html) {
    const stack = [];
    const errors = [];
    const selfClosing = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
    
    // A simple regex parser
    const regex = /<(\/)?([a-zA-Z0-9\-]+)([^>]*?)>/g;
    let match;
    let lineNum = 1;
    let lastIndex = 0;
    
    while ((match = regex.exec(html)) !== null) {
        // Update line number
        const textBefore = html.substring(lastIndex, match.index);
        lineNum += (textBefore.match(/\n/g) || []).length;
        lastIndex = match.index;
        
        const isClosing = match[1] === '/';
        const tag = match[2].toLowerCase();
        const attrsStr = match[3];
        
        if (selfClosing.has(tag)) {
            continue;
        }
        
        if (isClosing) {
            if (stack.length === 0) {
                errors.push(`Extra closing </${tag}> at line ${lineNum}`);
            } else {
                const last = stack.pop();
                if (last.tag !== tag) {
                    errors.push(`Mismatch at line ${lineNum}: Expected </${last.tag}> (from line ${last.line}), got </${tag}>`);
                    // Try to recover
                    if (stack.length > 0 && stack[stack.length - 1].tag === tag) {
                        stack.pop(); // Treat it as if the inner tag was just unclosed
                    } else {
                        stack.push(last); // Put it back and treat the closing tag as extra
                    }
                }
            }
        } else {
            // Is it an XML-style self closing? <div />
            if (attrsStr.trim().endsWith('/')) {
                continue;
            }
            
            // Extract id and class for context
            let id = '';
            let cls = '';
            const idMatch = attrsStr.match(/id=(['"])(.*?)\1/);
            if (idMatch) id = idMatch[2];
            const clsMatch = attrsStr.match(/class=(['"])(.*?)\1/);
            if (clsMatch) cls = clsMatch[2];
            
            stack.push({ tag, line: lineNum, id, cls });
        }
    }
    
    return { errors, stack };
}

const html = fs.readFileSync('index.html', 'utf8');
const result = checkHTML(html);

console.log("=== ERRORS ===");
result.errors.forEach(e => console.log(e));

console.log("\n=== UNCLOSED TAGS ===");
result.stack.forEach(s => console.log(`<${s.tag} id="${s.id}" class="${s.cls}"> from line ${s.line}`));
