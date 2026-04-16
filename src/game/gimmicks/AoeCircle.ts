import * as Phaser from 'phaser';
import type { GimmickEvent } from '../../types';

export type GimmickState = 'warning' | 'active' | 'done';

export class AoeCircle {
  readonly event: GimmickEvent;
  private graphics: Phaser.GameObjects.Graphics;
  private timerText: Phaser.GameObjects.Text;
  state: GimmickState = 'warning';

  // 発火時に確定したAoE中心座標（追尾型用）
  private firedCX: number | null = null;
  private firedCY: number | null = null;

  private arenaOffsetX: number;
  private arenaOffsetY: number;

  constructor(scene: Phaser.Scene, event: GimmickEvent, arenaOffsetX: number, arenaOffsetY: number) {
    this.event = event;
    this.arenaOffsetX = arenaOffsetX;
    this.arenaOffsetY = arenaOffsetY;

    this.graphics = scene.add.graphics();
    this.timerText = scene.add.text(0, 0, '', {
      fontSize: '14px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
  }

  update(elapsedTime: number, playerWorldX: number, playerWorldY: number): boolean {
    const radius = this.event.radius ?? 100;
    const fireTime = this.event.time;
    const warnStart = fireTime - this.event.warningDuration;

    this.graphics.clear();

    if (elapsedTime < warnStart || this.state === 'done') {
      this.timerText.setVisible(false);
      return false;
    }

    if (elapsedTime >= fireTime) {
      // 発火時に座標を確定（追尾型は発火瞬間で止める）
      if (this.firedCX === null) {
        this.firedCX = this.getBaseX(playerWorldX);
        this.firedCY = this.getBaseY(playerWorldY);
      }
      const cx = this.firedCX;
      const cy = this.firedCY!;

      this.graphics.fillStyle(0xff2200, 0.7);
      this.graphics.fillCircle(this.arenaOffsetX + cx, this.arenaOffsetY + cy, radius);
      this.timerText.setVisible(false);
      this.state = 'active';
      return true;
    }

    // 警告フェーズ（追尾型は警告中もプレイヤー追尾）
    const cx = this.getBaseX(playerWorldX);
    const cy = this.getBaseY(playerWorldY);

    this.state = 'warning';
    const progress = (elapsedTime - warnStart) / this.event.warningDuration;
    const alpha = 0.3 + 0.4 * Math.abs(Math.sin(progress * Math.PI * 6));

    this.graphics.lineStyle(3, 0xff4400, 1);
    this.graphics.fillStyle(0xff4400, alpha);
    this.graphics.strokeCircle(this.arenaOffsetX + cx, this.arenaOffsetY + cy, radius);
    this.graphics.fillCircle(this.arenaOffsetX + cx, this.arenaOffsetY + cy, radius);

    const remaining = fireTime - elapsedTime;
    this.timerText
      .setText(remaining.toFixed(1))
      .setPosition(this.arenaOffsetX + cx, this.arenaOffsetY + cy - radius - 16)
      .setVisible(true);

    return false;
  }

  isPlayerHit(playerWorldX: number, playerWorldY: number): boolean {
    if (this.state !== 'active') return false;
    const cx = this.firedCX ?? this.getBaseX(playerWorldX);
    const cy = this.firedCY ?? this.getBaseY(playerWorldY);
    const radius = this.event.radius ?? 100;
    const dist = Phaser.Math.Distance.Between(playerWorldX, playerWorldY, cx, cy);
    return dist < radius;
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

  private getBaseX(playerWorldX: number): number {
    return this.event.target === 'player' ? playerWorldX : (this.event.x ?? 0);
  }

  private getBaseY(playerWorldY: number): number {
    return this.event.target === 'player' ? playerWorldY : (this.event.y ?? 0);
  }
}
