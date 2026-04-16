// ギミック種類
export type GimmickType =
  | 'aoe_circle'
  | 'aoe_line'
  | 'aoe_fan'
  | 'aoe_donut'
  | 'stack'
  | 'spread'
  | 'knockback'
  | 'pull'
  | 'tower';

// ターゲット種類
export type TargetType = 'fixed' | 'player' | 'random_ai';

// 個々のギミックイベント
export interface GimmickEvent {
  id: string;
  type: GimmickType;
  time: number;           // 発火タイミング（秒）
  warningDuration: number; // 警告フェーズの長さ（秒）
  target: TargetType;
  x?: number;             // 固定位置X（アリーナ座標）
  y?: number;             // 固定位置Y
  // 円形AoE
  radius?: number;
  // 直線AoE
  width?: number;
  angle?: number;
  length?: number;
  // 扇形AoE
  fanAngle?: number;
  // ドーナツAoE
  innerRadius?: number;
  outerRadius?: number;
  // 頭割り
  requiredCount?: number;
  // 吹き飛ばし
  knockbackDistance?: number;
  knockbackAngle?: number;
}

// AIパーティメンバー設定
export interface AIMember {
  id: string;
  label: string;          // 表示ラベル（T1, H1など）
  defaultPosition: { x: number; y: number };
}

// ステージ全体データ
export interface StageData {
  meta: {
    title: string;
    author: string;
    version: string;
  };
  arena: {
    width: number;
    height: number;
  };
  aiMembers: AIMember[];
  timeline: GimmickEvent[];
}

// フレームごとの記録（リプレイ用）
export interface ReplayFrame {
  time: number;
  playerX: number;
  playerY: number;
}

// 失敗ログ
export interface FailureLog {
  time: number;
  gimmickId: string;
  gimmickType: GimmickType;
  playerX: number;
  playerY: number;
}
