/**
 * AI Service Layer for dakadaka
 * Uses Minimax API for AI-powered features
 */

import type { Memory } from '../types/memory';

// 配置 - 可以改为从环境变量读取
const MINIMAX_API_KEY = import.meta.env.VITE_MINIMAX_API_KEY || '';
const MINIMAX_BASE_URL = 'https://api.minimax.chat/v1/text';
const MODEL = 'abab6.5s-chat';

export interface AIResponse {
  content: string;
  error?: string;
}

/**
 * 统一调用 AI 接口
 */
async function callAI(prompt: string, systemPrompt: string = ''): Promise<AIResponse> {
  if (!MINIMAX_API_KEY) {
    return { 
      content: '', 
      error: 'API Key 未配置。请设置 VITE_MINIMAX_API_KEY 环境变量。' 
    };
  }

  try {
    const response = await fetch(`${MINIMAX_BASE_URL}/chatcompletion_v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MINIMAX_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 8192,
        messages: [
          ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
          { role: 'user' as const, content: prompt }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return { content: '', error: `API 错误: ${error}` };
    }

    const data = await response.json();
    return { content: data.choices?.[0]?.message?.content || '' };
  } catch (err) {
    return { content: '', error: `请求失败: ${err}` };
  }
}

/**
 * AI 记忆助手 - 问答回忆
 */
export async function queryMemory(memories: Memory[], question: string): Promise<AIResponse> {
  const memoryList = memories.map(m => 
    `- ${m.date}: ${m.title} - ${m.description || ''} ${m.location ? `@${m.location}` : ''}`
  ).join('\n');

  const systemPrompt = `你是一个温暖的情侣记忆助手。用户会问你关于他们回忆的问题，请根据提供的记忆信息回答。要亲切、自然，就像朋友聊天一样。`;

  const prompt = `
用户的问题: ${question}

他们的回忆记录:
${memoryList}

请根据以上回忆回答用户的问题。如果找不到相关信息，请温柔地告诉他们，并建议他们可以添加新的回忆。`;

  return callAI(prompt, systemPrompt);
}

/**
 * AI 写文案 - 为照片生成甜蜜文案
 */
export async function generateCaption(memory: Partial<Memory>): Promise<AIResponse> {
  const context = `
- 纪念日: ${memory.date || '未知'}
- 标题: ${memory.title || '未命名'}
- 描述: ${memory.description || '无'}
- 地点: ${memory.location || '未知'}
- 标签: ${memory.tags?.join(', ') || '无'}
  `.trim();

  const systemPrompt = `你是一个浪漫的情侣文案助手。根据回忆信息，为用户生成甜蜜、温馨的社交媒体文案。`;

  const prompt = `
请为以下回忆生成 2-3 条不同风格的文案选择：

${context}

要求：
1. 温暖、甜蜜、浪漫
2. 适合发朋友圈/小红书
3. 简短有氛围感
4. 每条 20-50 字

请用中文回复。`;

  return callAI(prompt, systemPrompt);
}

/**
 * AI 打卡建议 - 推荐新地点
 */
export async function suggestPlace(memories: Memory[]): Promise<AIResponse> {
  const visitedPlaces = memories
    .filter(m => m.location)
    .map(m => m.location!)
    .filter(Boolean);

  const placeTypes = memories
    .filter(m => m.tags)
    .flatMap(m => m.tags || [])
    .reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const topTypes = Object.entries(placeTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([type]) => type);

  const systemPrompt = `你是一个贴心的情侣出游顾问。根据用户去过的地点和偏好，推荐新的打卡地点。`;

  const prompt = `
用户已经去过的地方:
${visitedPlaces.slice(0, 20).join(', ') || '暂无'}

用户喜欢的类型:
${topTypes.join(', ') || '暂无'}

请推荐 3-5 个适合情侣打卡的地点，要求：
1. 真实存在的地方（中国城市）
2. 浪漫、有氛围
3. 给出具体地点名称和推荐理由
4. 简短但有画面感

请用中文回复。`;

  return callAI(prompt, systemPrompt);
}

/**
 * 回忆摘要 - 每月总结
 */
export async function generateMonthlySummary(memories: Memory[], year: number, month: number): Promise<AIResponse> {
  const monthMemories = memories.filter(m => {
    const date = new Date(m.date);
    return date.getFullYear() === year && date.getMonth() + 1 === month;
  });

  const memoryList = monthMemories.map(m => 
    `- ${m.date}: ${m.title} ${m.location ? `@${m.location}` : ''}`
  ).join('\n');

  const systemPrompt = `你是一个温暖的情侣回忆记录师。为用户生成月度回忆总结。`;

  const prompt = `
请为 ${year}年${month}月 生成一段温暖的回忆总结：

${memoryList || '本月暂无回忆'}

要求：
1. 温暖、感人的语气
2. 总结本月的重要时刻
3. 50-100 字
4. 适合发朋友圈

请用中文回复。`;

  return callAI(prompt, systemPrompt);
}
