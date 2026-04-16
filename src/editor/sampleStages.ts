import type { StageData } from '../types';

export const DEMO_STAGE: StageData = {
  meta: { title: '全ギミック体験ステージ', author: 'system', version: '0.2.0' },
  arena: { width: 640, height: 640 },
  aiMembers: [
    { id: 'T1', label: 'T1', color: 0x4488ff, defaultPosition: { x: 140, y: 320 } },
    { id: 'H1', label: 'H1', color: 0x44ff88, defaultPosition: { x: 500, y: 320 } },
    { id: 'D1', label: 'D1', color: 0xffaa44, defaultPosition: { x: 320, y: 140 } },
    { id: 'D2', label: 'D2', color: 0xffaa44, defaultPosition: { x: 320, y: 500 } },
  ],
  timeline: [
    // ① 固定円形AoE × 2（四隅）
    {
      id: 'c1', type: 'aoe_circle', time: 4, warningDuration: 3,
      target: 'fixed', x: 180, y: 180, radius: 130,
      label: '円形AoE①',
    },
    {
      id: 'c2', type: 'aoe_circle', time: 4, warningDuration: 3,
      target: 'fixed', x: 460, y: 460, radius: 130,
      label: '円形AoE②',
    },
    // ② プレイヤー追尾AoE
    {
      id: 'c3', type: 'aoe_circle', time: 8, warningDuration: 2.5,
      target: 'player', radius: 100,
      label: '追尾AoE',
    },
    // ③ 直線AoE（縦）
    {
      id: 'l1', type: 'aoe_line', time: 12, warningDuration: 3,
      target: 'fixed', x: 240, y: 0, angle: Math.PI / 2, width: 100, length: 640,
      label: '直線AoE',
      aiPositions: [
        { memberId: 'T1', x: 100, y: 320 },
        { memberId: 'H1', x: 540, y: 320 },
        { memberId: 'D1', x: 100, y: 200 },
        { memberId: 'D2', x: 540, y: 500 },
      ],
    },
    // ④ 扇形AoE（左から右）
    {
      id: 'f1', type: 'aoe_fan', time: 17, warningDuration: 3,
      target: 'fixed', x: 0, y: 320, angle: 0, fanAngle: Math.PI / 2, length: 380,
      label: '扇形AoE',
      aiPositions: [
        { memberId: 'T1', x: 320, y: 140 },
        { memberId: 'H1', x: 320, y: 500 },
        { memberId: 'D1', x: 500, y: 140 },
        { memberId: 'D2', x: 500, y: 500 },
      ],
    },
    // ⑤ ドーナツAoE（中央が安全）
    {
      id: 'dn1', type: 'aoe_donut', time: 22, warningDuration: 3,
      target: 'fixed', x: 320, y: 320, innerRadius: 140, outerRadius: 400,
      label: 'ドーナツAoE',
      aiPositions: [
        { memberId: 'T1', x: 240, y: 320 },
        { memberId: 'H1', x: 400, y: 320 },
        { memberId: 'D1', x: 320, y: 240 },
        { memberId: 'D2', x: 320, y: 400 },
      ],
    },
    // ⑥ 頭割り（プレイヤー追尾、3人必要）
    {
      id: 's1', type: 'stack', time: 27, warningDuration: 3,
      target: 'player', requiredCount: 3, stackRadius: 70,
      label: '頭割り',
      aiPositions: [
        { memberId: 'T1', x: 320, y: 320 },
        { memberId: 'H1', x: 320, y: 320 },
        { memberId: 'D1', x: 320, y: 320 },
        { memberId: 'D2', x: 160, y: 480 },
      ],
    },
    // ⑦ 散開
    {
      id: 'sp1', type: 'spread', time: 32, warningDuration: 3,
      target: 'player', minDistance: 100, spreadRadius: 70,
      label: '散開',
      aiPositions: [
        { memberId: 'T1', x: 160, y: 160 },
        { memberId: 'H1', x: 480, y: 160 },
        { memberId: 'D1', x: 160, y: 480 },
        { memberId: 'D2', x: 480, y: 480 },
      ],
    },
    // ⑧ 吹き飛ばし（中央から）
    {
      id: 'kb1', type: 'knockback', time: 37, warningDuration: 3,
      target: 'fixed', x: 320, y: 320, knockbackDistance: 220,
      label: '吹き飛ばし',
    },
    // ⑨ 塔踏み × 2
    {
      id: 'tw1', type: 'tower', time: 43, warningDuration: 4,
      target: 'fixed', x: 160, y: 320, radius: 55, towerRequiredCount: 1,
      label: '塔①',
      aiPositions: [
        { memberId: 'T1', x: 480, y: 320 },
        { memberId: 'H1', x: 320, y: 160 },
        { memberId: 'D1', x: 320, y: 480 },
        { memberId: 'D2', x: 400, y: 320 },
      ],
    },
    {
      id: 'tw2', type: 'tower', time: 43, warningDuration: 4,
      target: 'fixed', x: 480, y: 320, radius: 55, towerRequiredCount: 1,
      label: '塔②',
    },
  ],
};

export const BLANK_STAGE: StageData = {
  meta: { title: '新規ステージ', author: '', version: '0.1.0' },
  arena: { width: 640, height: 640 },
  aiMembers: [
    { id: 'T1', label: 'T1', color: 0x4488ff, defaultPosition: { x: 160, y: 320 } },
    { id: 'H1', label: 'H1', color: 0x44ff88, defaultPosition: { x: 480, y: 320 } },
    { id: 'D1', label: 'D1', color: 0xffaa44, defaultPosition: { x: 320, y: 160 } },
    { id: 'D2', label: 'D2', color: 0xff8844, defaultPosition: { x: 320, y: 480 } },
  ],
  timeline: [],
};
