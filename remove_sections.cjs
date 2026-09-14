const fs = require('fs');

let content = fs.readFileSync('src/pages/Home.tsx', 'utf8');

const myFeedStart = '{/* Personalized "My Feed" (Only shows if favorites exist) */}';
const myFeedEnd = '          )}';
const generalLiveStart = '          {/* General Live & Upcoming */}';

let startIndex = content.indexOf(myFeedStart);
let endIndex = content.indexOf(generalLiveStart);

if (startIndex !== -1 && endIndex !== -1) {
    content = content.substring(0, startIndex) + content.substring(endIndex);
    console.log('Removed My Feed section');
} else {
    console.log('My Feed section not found');
}

const recentResultsStart = '          {/* Recent Results */}';
const recentResultsEnd = '          </Card>';
const sidebarStart = '        </div>\n\n        {/* Right Column (Sidebar: Team Browser, Standings, News) */}';

let recentStartIdx = content.indexOf(recentResultsStart);
// Find the nearest closing div before sidebarStart
let rightColumnIdx = content.indexOf(sidebarStart);

if (recentStartIdx !== -1 && rightColumnIdx !== -1) {
    // Let's just substring to rightColumnIdx. Wait, there's a `        </div>` that closes the left column.
    // So recentResults ends at `          </Card>\n` before `        </div>`.
    
    // We can just find `          </Card>` after `recentResultsStart`.
    let cardCloseIdx = content.indexOf('          </Card>', recentStartIdx);
    if (cardCloseIdx !== -1) {
       cardCloseIdx += '          </Card>\n'.length;
       content = content.substring(0, recentStartIdx) + content.substring(cardCloseIdx);
       console.log('Removed Recent Results section');
    } else {
       console.log('Recent Results end not found');
    }
} else {
    console.log('Recent Results section not found');
}

fs.writeFileSync('src/pages/Home.tsx', content);
