import * as Phaser from 'phaser';
import type { AIMember, AIMemberState, GimmickEvent } from '../../types';

const AI_SPEED = 160; // px/秒
const MOVE_AHEAD = 3;  // 何秒前からターゲット位置に移動開始するか

export class AISystem {
  private states: AIMemberState[];
  private graphics: Phaser.GameObjects.Graphics;
  private labels: Phaser.GameObjects.Text[] = [];

  constructor(scene: Phaser.Scene, members: AIMember[]) {
    this.states = members.map(m => ({
      id: m.id,
      label: m.label,
      color: m.color,
      x: m.defaultPosition.x,
      y: m.defaultPosition.y,
    }));
    this.graphics = scene.add.graphics();
    for (const m of members) {
      this.labels.push(
        scene.add.text(0, 0, m.label, {
          fontSize: '10px', color: '#ffffff', stroke: '#000', strokeThickness: 2,
        }).setOrigin(0.5)
      );
    }
  }

  update(
    elapsed: number,
    dt: number,
    timeline: GimmickEvent[],
    defaults: AIMember[],
    arenaOffsetX: number,
    arenaOffsetY: number
  ) {
    for (let i = 0; i < this.states.length; i++) {
      const state = this.states[i];
      const def = defaults[i];
      const target = this.getTarget(state.id, elapsed, timeline, def.defaultPosition);

      // 線形補間で滑らかに移動
      const dx = target.x - state.x;
      const dy = target.y - state.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 1) {
        const step = Math.min(AI_SPEED * dt, dist);
        state.x += (dx / dist) * step;
        state.y += (dy / dist) * step;
      }
    }

    this.render(arenaOffsetX, arenaOffsetY);
  }

  private getTarget(
    memberId: string,
    elapsed: number,
    timeline: GimmickEvent[],
    defaultPos: { x: number; y: number }
  ): { x: number; y: number } {
    // 次のギミック（MOVE_AHEAD秒以内）にaiPositionsが設定されているか確認
    const upcoming = timeline.filter(
      e => e.time > elapsed && e.time <= elapsed + MOVE_AHEAD && e.aiPositions
    );

    // 最も近い時間のギミックを優先
    upcoming.sort((a, b) => a.time - b.time);

    for (const event of upcoming) {
      const pos = event.aiPositions?.find(p => p.memberId === memberId);
      if (pos) return pos;
    }

    return defaultPos;
  }

  private render(arenaOffsetX: number, arenaOffsetY: number) {
    this.graphics.clear();
    for (let i = 0; i < this.states.length; i++) {
      const s = this.states[i];
      const sx = arenaOffsetX + s.x;
      const sy = arenaOffsetY + s.y;
      this.graphics.fillStyle(s.color, 0.9);
      this.graphics.fillCircle(sx, sy, 11);
      this.graphics.lineStyle(2, 0xffffff, 0.6);
      this.graphics.strokeCircle(sx, sy, 11);
      this.labels[i].setPosition(sx, sy);
    }
  }

  getStates(): AIMemberState[] {
    return this.states;
  }

  destroy() {
    this.graphics.destroy();
    for (const l of this.labels) l.destroy();
  }
}
