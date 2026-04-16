import * as Phaser from 'phaser';
import type { GimmickEvent, GimmickContext, GimmickEffect } from '../../types';

export type GimmickState = 'waiting' | 'warning' | 'active' | 'done';

export class AoeDonut {
  readonly event: GimmickEvent;
  state: GimmickState = 'waiting';

  private graphics: Phaser.GameObjects.Graphics;
  private timerText: Phaser.GameObjects.Text;
  private arenaOffsetX: number;
  private arenaOffsetY: number;

  constructor(scene: Phaser.Scene, event: GimmickEvent, arenaOffsetX: number, arenaOffsetY: number) {
    this.event = event;
    this.arenaOffsetX = arenaOffsetX;
    this.arenaOffsetY = arenaOffsetY;
    this.graphics = scene.add.graphics();
    this.timerText = scene.add.text(0, 0, '', {
      fontSize: '13px', color: '#ffffff', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5);
  }

  update(ctx: GimmickContext): GimmickEffect[] {
    const { elapsed, playerX, playerY, arenaWidth, arenaHeight } = ctx;
    const fireTime = this.event.time;
    const warnStart = fireTime - this.event.warningDuration;
    this.graphics.clear();

    if (elapsed < warnStart || this.state === 'done') {
      this.timerText.setVisible(false);
      return [];
    }

    const cx = this.arenaOffsetX + (this.event.x ?? arenaWidth / 2);
    const cy = this.arenaOffsetY + (this.event.y ?? arenaHeight / 2);
    const inner = this.event.innerRadius ?? 120;
    const outer = this.event.outerRadius ?? Math.max(arenaWidth, arenaHeight);

    if (elapsed >= fireTime) {
      this.state = 'active';
      this.drawDonut(cx, cy, inner, outer, 0xff2200, 0.7);
      this.timerText.setVisible(false);

      if (this.isHit(playerX, playerY)) {
        return [{ kind: 'hit', gimmickId: this.event.id, gimmickType: this.event.type }];
      }
      return [];
    }

    this.state = 'warning';
    const progress = (elapsed - warnStart) / this.event.warningDuration;
    const alpha = 0.2 + 0.3 * Math.abs(Math.sin(progress * Math.PI * 6));
    this.drawDonut(cx, cy, inner, outer, 0xff6600, alpha);
    this.graphics.lineStyle(2, 0xff6600, 0.9);
    this.graphics.strokeCircle(cx, cy, inner);

    const remaining = fireTime - elapsed;
    this.timerText
      .setText(remaining.toFixed(1))
      .setPosition(cx, cy - inner - 18)
      .setVisible(true);

    return [];
  }

  // Phaser の fillCircle を重ねてドーナツを描く
  private drawDonut(cx: number, cy: number, inner: number, outer: number, color: number, alpha: number) {
    const clampedOuter = Math.min(outer, 9999);
    // 外円全体を塗る → 内円をマスクする（Phaserにはclipがないので多角形近似）
    const segments = 64;
    const outerPts: { x: number; y: number }[] = [];
    const innerPts: { x: number; y: number }[] = [];
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      outerPts.push({ x: cx + Math.cos(a) * clampedOuter, y: cy + Math.sin(a) * clampedOuter });
    }
    for (let i = segments; i >= 0; i--) {
      const a = (i / segments) * Math.PI * 2;
      innerPts.push({ x: cx + Math.cos(a) * inner, y: cy + Math.sin(a) * inner });
    }
    this.graphics.fillStyle(color, alpha);
    this.graphics.fillPoints([...outerPts, ...innerPts], true);
    // 内側の安全地帯（明るく）
    this.graphics.fillStyle(0x00ffaa, 0.08);
    this.graphics.fillCircle(cx, cy, inner);
  }

  private isHit(px: number, py: number): boolean {
    const ox = this.event.x ?? 0;
    const oy = this.event.y ?? 0;
    const inner = this.event.innerRadius ?? 120;
    const outer = this.event.outerRadius ?? 999999;
    const dist = Math.sqrt((px - ox) ** 2 + (py - oy) ** 2);
    return dist > inner && dist < outer;
  }

  markDone() {
    this.state = 'done';
    this.graphics.clear();
    this.timerText.setVisible(false);
  }

  destroy() {
    this.graphics.destroy();
    this.timerText.destroy();
  }
}
