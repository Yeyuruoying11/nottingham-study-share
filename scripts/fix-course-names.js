const fs = require('fs');
const path = require('path');

// 读取学术数据文件
const academicDataPath = path.join(__dirname, '../lib/academic-data.ts');
let content = fs.readFileSync(academicDataPath, 'utf8');

// 修复多余的逗号
content = content.replace(/name: '([^']*)',,/g, "name: '$1',");

// 写回文件
fs.writeFileSync(academicDataPath, content, 'utf8');

console.log('课程名字语法错误已修复！'); 