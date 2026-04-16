import * as Phaser from 'phaser';
import type { GimmickEvent, GimmickContext, GimmickEffect } from '../../types';

export type GimmickState = 'waiting' | 'warning' | 'active' | 'done';

export class AoeFan {
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
    const { elapsed, playerX, playerY } = ctx;
    const fireTime = this.event.time;
    const warnStart = fireTime - this.event.warningDuration;
    this.graphics.clear();

    if (elapsed < warnStart || this.state === 'done') {
      this.timerText.setVisible(false);
      return [];
    }

    const ox = this.arenaOffsetX + (this.event.x ?? 0);
    const oy = this.arenaOffsetY + (this.event.y ?? 0);

    if (elapsed >= fireTime) {
      this.state = 'active';
      this.graphics.fillStyle(0xff2200, 0.75);
      this.drawFan(ox, oy);
      this.timerText.setVisible(false);

      if (this.isHit(playerX, playerY)) {
        return [{ kind: 'hit', gimmickId: this.event.id, gimmickType: this.event.type }];
      }
      return [];
    }

    this.state = 'warning';
    const progress = (elapsed - warnStart) / this.event.warningDuration;
    const alpha = 0.25 + 0.35 * Math.abs(Math.sin(progress * Math.PI * 6));
    this.graphics.fillStyle(0xff6600, alpha);
    this.graphics.lineStyle(2, 0xff6600, 0.9);
    this.drawFan(ox, oy);

    const remaining = fireTime - elapsed;
    const angle = this.event.angle ?? 0;
    const len = this.event.length ?? 300;
    this.timerText
      .setText(remaining.toFixed(1))
      .setPosition(ox + Math.cos(angle) * len * 0.6, oy + Math.sin(angle) * len * 0.6 - 16)
      .setVisible(true);

    return [];
  }

  private drawFan(ox: number, oy: number) {
    const angle = this.event.angle ?? 0;
    const half = (this.event.fanAngle ?? Math.PI / 3) / 2;
    const len = this.event.length ?? 300;
    const segments = 24;
    const points: { x: number; y: number }[] = [{ x: ox, y: oy }];
    for (let i = 0; i <= segments; i++) {
      const a = angle - half + (half * 2 * i) / segments;
      points.push({ x: ox + Math.cos(a) * len, y: oy + Math.sin(a) * len });
    }
    this.graphics.fillPoints(points, true);
    this.graphics.strokePoints(points, true);
  }

  private isHit(px: number, py: number): boolean {
    const ox = this.event.x ?? 0;
    const oy = this.event.y ?? 0;
    const angle = this.event.angle ?? 0;
    const half = (this.event.fanAngle ?? Math.PI / 3) / 2;
    const len = this.event.length ?? 300;
    const dx = px - ox, dy = py - oy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > len) return false;
    let a = Math.atan2(dy, dx) - angle;
    // normalize to [-PI, PI]
    while (a > Math.PI) a -= 2 * Math.PI;
    while (a < -Math.PI) a += 2 * Math.PI;
    return Math.abs(a) <= half;
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
