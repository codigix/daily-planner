const fs = require('fs');
let content = fs.readFileSync('backend/services/sheetsService.cjs', 'utf8');

// Rename the first 'pool' to 'authPool'
content = content.replace(/const pool = await getPool\(\);\n  const \[accounts\] = await pool\.query/g, "const authPool = await getPool();\n  const [accounts] = await authPool.query");

fs.writeFileSync('backend/services/sheetsService.cjs', content);
console.log("Fixed pool declaration!");
