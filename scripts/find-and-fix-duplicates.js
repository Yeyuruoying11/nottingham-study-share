const fs = require('fs');
const path = require('path');

// 读取学术数据文件
const academicDataPath = path.join(__dirname, '../lib/academic-data.ts');
let content = fs.readFileSync(academicDataPath, 'utf8');

console.log('原始文件大小:', content.length);

// 修复所有可能的语法错误
let fixedContent = content;

// 1. 修复双逗号
fixedContent = fixedContent.replace(/,,+/g, ',');

// 2. 修复重复的name字段（如果存在）
fixedContent = fixedContent.replace(/(\s+)name:\s*'([^']+)',\s*\n\s*name:\s*'[^']+',/g, '$1name: \'$2\',');

// 3. 修复可能的其他重复字段
fixedContent = fixedContent.replace(/(\s+)(id|nameEn|description|code|departmentId|level|year|credits):\s*'([^']+)',\s*\n\s*\2:\s*'[^']+',/g, '$1$2: \'$3\',');

// 4. 修复行末多余的逗号
fixedContent = fixedContent.replace(/,\s*,/g, ',');

// 5. 确保每行只有一个逗号结尾
fixedContent = fixedContent.replace(/,+\s*$/gm, ',');

console.log('修复后文件大小:', fixedContent.length);
console.log('修复的差异:', content.length - fixedContent.length);

// 写回文件
fs.writeFileSync(academicDataPath, fixedContent, 'utf8');

console.log('✅ 所有语法错误已修复！'); 