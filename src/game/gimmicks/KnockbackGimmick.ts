import * as Phaser from 'phaser';
import type { GimmickEvent, GimmickContext, GimmickEffect } from '../../types';

export type GimmickState = 'waiting' | 'warning' | 'active' | 'done';

export class KnockbackGimmick {
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
      fontSize: '13px', color: '#cc88ff', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5);
  }

  update(ctx: GimmickContext): GimmickEffect[] {
    const { elapsed, playerX, playerY, arenaWidth, arenaHeight } = ctx;
    const fireTime = this.event.time;
    const warnStart = fireTime - this.event.warningDuration;
    this.graphics.clear();

    const isPull = this.event.type === 'pull';
    const ox = this.event.x ?? arenaWidth / 2;
    const oy = this.event.y ?? arenaHeight / 2;
    const sox = this.arenaOffsetX + ox;
    const soy = this.arenaOffsetY + oy;
    const kbRadius = this.event.knockbackRadius ?? 99999;
    const kbDist = this.event.knockbackDistance ?? 200;

    if (elapsed < warnStart || this.state === 'done') {
      this.timerText.setVisible(false);
      return [];
    }

    if (elapsed >= fireTime) {
      this.state = 'active';
      this.graphics.fillStyle(0xaa44ff, 0.5);
      this.graphics.fillCircle(sox, soy, 20);
      this.timerText.setVisible(false);

      const dx = playerX - ox;
      const dy = playerY - oy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < kbRadius && dist > 0) {
        const nx = dx / dist;
        const ny = dy / dist;
        const mult = isPull ? -1 : 1;
        return [{ kind: 'knockback', dx: nx * kbDist * mult, dy: ny * kbDist * mult }];
      }
      return [];
    }

    this.state = 'warning';
    const progress = (elapsed - warnStart) / this.event.warningDuration;

    // 発火原点を示す円
    this.graphics.lineStyle(3, 0xaa44ff, 0.9);
    this.graphics.strokeCircle(sox, soy, 24);
    this.graphics.fillStyle(0xaa44ff, 0.3);
    this.graphics.fillCircle(sox, soy, 24);

    // 放射状の矢印を描く
    const arrowCount = 8;
    for (let i = 0; i < arrowCount; i++) {
      const a = (i / arrowCount) * Math.PI * 2;
      const animOffset = (progress * 40) % 40;
      const startR = isPull ? 80 + animOffset : 32 + animOffset;
      const endR = isPull ? 32 + animOffset : 80 + animOffset;
      const mx = isPull ? -1 : 1;

      this.graphics.lineStyle(2, 0xcc88ff, 0.8);
      this.graphics.lineBetween(
        sox + Math.cos(a) * startR * mx, soy + Math.sin(a) * startR * mx,
        sox + Math.cos(a) * endR * mx, soy + Math.sin(a) * endR * mx
      );
    }

    const remaining = fireTime - elapsed;
    const label = isPull ? `引き寄せ ${remaining.toFixed(1)}` : `吹き飛ばし ${remaining.toFixed(1)}`;
    this.timerText.setText(label).setPosition(sox, soy - 40).setVisible(true);

    return [];
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
