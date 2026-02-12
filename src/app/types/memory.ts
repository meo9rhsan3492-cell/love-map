export type MemoryType = 'memory' | 'expectation';

export type MemoryCategory =
  | 'place'      // 去过的地方
  | 'food'       // 吃过的美食
  | 'first'      // 第一次
  | 'travel'     // 旅行
  | 'date'       // 约会
  | 'special'    // 特殊时刻
  | 'other';     // 其他

export interface MediaItem {
  type: 'image' | 'video';
  url: string; // Base64 or URL
  thumbnailUrl?: string; // For videos
  mimeType: string;
  fileName?: string;
}

export interface Memory {
  id: string;
  type: MemoryType;
  category: MemoryCategory;
  title: string;
  description: string;
  weather?: 'sunny' | 'cloudy' | 'rainy' | 'snowy';
  latitude: number;
  longitude: number;
  locationName?: string; // e.g. "Shanghai, China" or "Disneyland"
  date: string;
  /** @deprecated Use media[] instead */
  imageUrl?: string;
  media: MediaItem[];
  createdAt: string;
}

export interface MemoryFilter {
  type: MemoryType | 'all';
  category: MemoryCategory | 'all';
}
