# AI帖子生成修复说明

## 问题描述
小鱼摆摆的AI帖子经常出现内容被截断的问题，导致JSON解析失败，最终生成的帖子质量很差。

## 问题原因
1. **Token限制不足**：原来的maxTokens默认值只有2000，对于需要生成较长内容的角色（如小鱼摆摆）来说不够
2. **JSON解析处理不完善**：当内容被截断时，备用内容生成逻辑过于简单
3. **提示词指令不够明确**：没有强调要生成完整的JSON格式

## 修复方案

### 1. 增加Token限制
- 将默认的maxTokens从2000增加到3000
- 在`lib/ai-posting-service.ts`中修改：
  ```javascript
  maxTokens: Math.max(character.settings.max_response_length || 3000, 3000)
  ```

### 2. 改进JSON解析逻辑
在`app/api/ai/generate-content/route.ts`中：
- 增强了`extractContentFromBrokenJSON`函数，更智能地提取被截断的内容
- 改进了备用内容生成逻辑，从原始内容中提取有意义的信息
- 添加了更多的错误恢复机制

### 3. 优化提示词
- 为小鱼摆摆这样的角色添加特殊指令，强调生成完整的JSON格式
- 在提示词末尾添加"重要：请确保返回完整的JSON格式，不要截断内容"

### 4. 智能内容提取
当JSON解析失败时：
- 尝试从破损的JSON中提取title、content、excerpt和tags
- 如果content被截断，尝试找到最后一个完整的句子
- 自动清理提取的内容，移除不完整的部分

## 验证方法
1. 触发小鱼摆摆的自动发帖功能
2. 检查生成的帖子内容是否完整
3. 查看控制台日志，确认没有JSON解析错误

## 后续优化建议
1. 考虑为不同角色设置不同的maxTokens值
2. 添加内容长度监控，自动调整token限制
3. 实现更智能的内容补全机制 