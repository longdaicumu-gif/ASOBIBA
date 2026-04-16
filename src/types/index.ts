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

export type TargetType = 'fixed' | 'player' | 'random_ai';

export interface GimmickEvent {
  id: string;
  type: GimmickType;
  time: number;
  warningDuration: number;
  target: TargetType;
  label?: string;

  // 位置（aoe_circle / aoe_line / aoe_fan / aoe_donut / knockback / pull / tower）
  x?: number;
  y?: number;

  // 円形AoE
  radius?: number;

  // 直線AoE
  width?: number;
  length?: number;
  angle?: number; // ラジアン

  // 扇形AoE
  fanAngle?: number; // ラジアン（扇の角度幅）

  // ドーナツAoE
  innerRadius?: number;
  outerRadius?: number;

  // 頭割り（Stack）
  requiredCount?: number;
  stackRadius?: number;

  // 散開（Spread）
  minDistance?: number;
  spreadRadius?: number; // 散開マーカーの表示半径

  // 吹き飛ばし・引き寄せ
  knockbackDistance?: number; // 正=吹き飛ばし、負=引き寄せ
  knockbackRadius?: number;   // この半径内のキャラが対象（デフォルト全体）

  // 塔踏み（Tower）
  towerRequiredCount?: number;

  // AIの目標座標（このギミックが発火する前にAIが移動する先）
  aiPositions?: { memberId: string; x: number; y: number }[];
}

export interface AIMember {
  id: string;
  label: string;
  color: number; // Phaser color (0xRRGGBB)
  defaultPosition: { x: number; y: number };
}

export interface AIMemberState {
  id: string;
  label: string;
  color: number;
  x: number;
  y: number;
}

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

export interface ReplayFrame {
  time: number;
  playerX: number;
  playerY: number;
}

export interface FailureLog {
  time: number;
  gimmickId: string;
  gimmickType: GimmickType;
  playerX: number;
  playerY: number;
}

// GimmickManager が返すエフェクト
export type GimmickEffect =
  | { kind: 'hit';          gimmickId: string; gimmickType: GimmickType }
  | { kind: 'knockback';    dx: number; dy: number }
  | { kind: 'stack_fail';   gimmickId: string }
  | { kind: 'tower_fail';   gimmickId: string }
  | { kind: 'spread_fail';  gimmickId: string };

// 各ギミッククラスが受け取るコンテキスト
export interface GimmickContext {
  elapsed: number;
  playerX: number;
  playerY: number;
  arenaWidth: number;
  arenaHeight: number;
  aiMembers: AIMemberState[];
}
