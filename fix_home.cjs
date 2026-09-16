const fs = require('fs');
let content = fs.readFileSync('src/pages/Home.tsx', 'utf8');

// Looking for the malformed structure where `{/* Bento Grid Layout */}` immediately follows the left content closing div without the parent div closing.
const leftContentEndPattern = `              Enter Arena\n            </Link>\n          </div>\n        </div>\n\n        {/* Bento Grid Layout */}`;

content = content.replace(`              Enter Arena
            </Link>
          </div>
        </div>

        {/* Bento Grid Layout */}`, 
`              Enter Arena
            </Link>
          </div>
        </div>
      </div>

      {/* Bento Grid Layout */}`);

fs.writeFileSync('src/pages/Home.tsx', content);
console.log('Syntax error fixed!');
