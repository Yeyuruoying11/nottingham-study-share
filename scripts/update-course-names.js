const fs = require('fs');
const path = require('path');

// 读取学术数据文件
const academicDataPath = path.join(__dirname, '../lib/academic-data.ts');
let content = fs.readFileSync(academicDataPath, 'utf8');

// 正则表达式匹配课程对象中的name字段并替换为nameEn的值
content = content.replace(
  /(\s+id:\s*'[^']+',\s*\n\s*)name:\s*'[^']*',(\s*\n\s*)nameEn:\s*('([^']*)',)/g,
  '$1name: $3,$2nameEn: $3'
);

// 写回文件
fs.writeFileSync(academicDataPath, content, 'utf8');

console.log('课程名字已成功更新为英文！'); 