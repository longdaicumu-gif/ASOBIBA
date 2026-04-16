import * as Phaser from 'phaser';
import type { GimmickEvent, GimmickContext, GimmickEffect } from '../../types';

export type GimmickState = 'waiting' | 'warning' | 'active' | 'done';

export class AoeLine {
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
    const angle = this.event.angle ?? 0;
    const w = this.event.width ?? 80;
    const len = this.event.length ?? 400;

    if (elapsed >= fireTime) {
      this.state = 'active';
      this.graphics.fillStyle(0xff2200, 0.75);
      this.drawRect(ox, oy, angle, w, len);
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
    this.drawRect(ox, oy, angle, w, len);

    const remaining = fireTime - elapsed;
    const cx = ox + Math.cos(angle) * len / 2;
    const cy = oy + Math.sin(angle) * len / 2;
    this.timerText.setText(remaining.toFixed(1)).setPosition(cx, cy - 20).setVisible(true);

    return [];
  }

  private drawRect(ox: number, oy: number, angle: number, w: number, len: number) {
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const hw = w / 2;
    // 4 corners in local space: (0,-hw), (len,-hw), (len,hw), (0,hw)
    const points = [
      { x: ox + cos * 0 - sin * (-hw), y: oy + sin * 0 + cos * (-hw) },
      { x: ox + cos * len - sin * (-hw), y: oy + sin * len + cos * (-hw) },
      { x: ox + cos * len - sin * hw, y: oy + sin * len + cos * hw },
      { x: ox + cos * 0 - sin * hw, y: oy + sin * 0 + cos * hw },
    ];
    this.graphics.fillPoints(points, true);
    this.graphics.strokePoints(points, true);
  }

  private isHit(px: number, py: number): boolean {
    const ox = this.event.x ?? 0;
    const oy = this.event.y ?? 0;
    const angle = this.event.angle ?? 0;
    const w = this.event.width ?? 80;
    const len = this.event.length ?? 400;
    const dx = px - ox, dy = py - oy;
    const cos = Math.cos(-angle), sin = Math.sin(-angle);
    const rx = dx * cos - dy * sin;
    const ry = dx * sin + dy * cos;
    return rx >= 0 && rx <= len && ry >= -w / 2 && ry <= w / 2;
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
