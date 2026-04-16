import * as Phaser from 'phaser';
import type { GimmickEvent, GimmickContext, GimmickEffect, AIMemberState } from '../../types';

export type GimmickState = 'waiting' | 'warning' | 'active' | 'done';

export class StackGimmick {
  readonly event: GimmickEvent;
  state: GimmickState = 'waiting';

  private graphics: Phaser.GameObjects.Graphics;
  private markerText: Phaser.GameObjects.Text;
  private timerText: Phaser.GameObjects.Text;
  private arenaOffsetX: number;
  private arenaOffsetY: number;

  constructor(scene: Phaser.Scene, event: GimmickEvent, arenaOffsetX: number, arenaOffsetY: number) {
    this.event = event;
    this.arenaOffsetX = arenaOffsetX;
    this.arenaOffsetY = arenaOffsetY;
    this.graphics = scene.add.graphics();
    this.markerText = scene.add.text(0, 0, '⚡', { fontSize: '20px' }).setOrigin(0.5);
    this.timerText = scene.add.text(0, 0, '', {
      fontSize: '13px', color: '#ffff00', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5);
  }

  update(ctx: GimmickContext): GimmickEffect[] {
    const { elapsed, playerX, playerY, aiMembers } = ctx;
    const fireTime = this.event.time;
    const warnStart = fireTime - this.event.warningDuration;
    this.graphics.clear();

    if (elapsed < warnStart || this.state === 'done') {
      this.markerText.setVisible(false);
      this.timerText.setVisible(false);
      return [];
    }

    // ターゲット座標（playerまたはAI）
    const { tx, ty } = this.getTargetPos(playerX, playerY, aiMembers);
    const sx = this.arenaOffsetX + tx;
    const sy = this.arenaOffsetY + ty;
    const stackR = this.event.stackRadius ?? 60;
    const required = this.event.requiredCount ?? 2;

    if (elapsed >= fireTime) {
      this.state = 'active';
      // 判定：stackR内のキャラ数を数える
      const count = this.countInRange(tx, ty, stackR, playerX, playerY, aiMembers);
      this.graphics.fillStyle(count >= required ? 0x00ff88 : 0xff2200, 0.5);
      this.graphics.fillCircle(sx, sy, stackR);
      this.markerText.setVisible(false);
      this.timerText.setVisible(false);

      if (count < required) {
        return [{ kind: 'stack_fail', gimmickId: this.event.id }];
      }
      return [];
    }

    this.state = 'warning';
    const progress = (elapsed - warnStart) / this.event.warningDuration;
    const pulse = 0.3 + 0.4 * Math.abs(Math.sin(progress * Math.PI * 5));

    // 頭割りマーカー（黄色の円）
    this.graphics.lineStyle(3, 0xffdd00, 1);
    this.graphics.fillStyle(0xffdd00, pulse * 0.3);
    this.graphics.strokeCircle(sx, sy, stackR);
    this.graphics.fillCircle(sx, sy, stackR);

    // ⚡アイコン
    this.markerText.setPosition(sx, sy - stackR - 18).setVisible(true);
    const remaining = fireTime - elapsed;
    this.timerText
      .setText(`${remaining.toFixed(1)} [${required}人]`)
      .setPosition(sx, sy - stackR - 36)
      .setVisible(true);

    return [];
  }

  private getTargetPos(playerX: number, playerY: number, aiMembers: AIMemberState[]): { tx: number; ty: number } {
    if (this.event.target === 'player') return { tx: playerX, ty: playerY };
    const ai = aiMembers.find(a => a.id === this.event.target);
    if (ai) return { tx: ai.x, ty: ai.y };
    return { tx: playerX, ty: playerY };
  }

  private countInRange(
    cx: number, cy: number, r: number,
    playerX: number, playerY: number, aiMembers: AIMemberState[]
  ): number {
    let count = 0;
    if (Math.sqrt((playerX - cx) ** 2 + (playerY - cy) ** 2) < r) count++;
    for (const ai of aiMembers) {
      if (Math.sqrt((ai.x - cx) ** 2 + (ai.y - cy) ** 2) < r) count++;
    }
    return count;
  }

  markDone() {
    this.state = 'done';
    this.graphics.clear();
    this.markerText.setVisible(false);
    this.timerText.setVisible(false);
  }

  destroy() {
    this.graphics.destroy();
    this.markerText.destroy();
    this.timerText.destroy();
  }
}
