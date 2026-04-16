import * as Phaser from 'phaser';
import type { GimmickEvent, GimmickContext, GimmickEffect, AIMemberState } from '../../types';

export type GimmickState = 'waiting' | 'warning' | 'active' | 'done';

export class TowerGimmick {
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
      fontSize: '13px', color: '#00ffaa', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5);
  }

  update(ctx: GimmickContext): GimmickEffect[] {
    const { elapsed, playerX, playerY, aiMembers } = ctx;
    const fireTime = this.event.time;
    const warnStart = fireTime - this.event.warningDuration;
    this.graphics.clear();

    const tx = this.event.x ?? 320;
    const ty = this.event.y ?? 320;
    const stx = this.arenaOffsetX + tx;
    const sty = this.arenaOffsetY + ty;
    const r = this.event.radius ?? 60;
    const required = this.event.towerRequiredCount ?? 1;

    if (elapsed < warnStart || this.state === 'done') {
      this.timerText.setVisible(false);
      return [];
    }

    const count = this.countInTower(tx, ty, r, playerX, playerY, aiMembers);

    if (elapsed >= fireTime) {
      this.state = 'active';
      const success = count >= required;
      this.graphics.fillStyle(success ? 0x00ff88 : 0xff2200, 0.6);
      this.drawTower(stx, sty, r);
      this.timerText.setVisible(false);

      if (!success) {
        return [{ kind: 'tower_fail', gimmickId: this.event.id }];
      }
      return [];
    }

    this.state = 'warning';
    const progress = (elapsed - warnStart) / this.event.warningDuration;
    const filled = count >= required;
    // 塔の色: 踏まれている場合は緑、そうでなければシアン
    const color = filled ? 0x00ff88 : 0x00ffcc;
    const pulse = 0.3 + 0.3 * Math.abs(Math.sin(progress * Math.PI * 4));

    this.graphics.lineStyle(3, color, 1);
    this.graphics.fillStyle(color, pulse * 0.4);
    this.drawTower(stx, sty, r);

    const remaining = fireTime - elapsed;
    this.timerText
      .setText(`塔 ${remaining.toFixed(1)} [${count}/${required}]`)
      .setPosition(stx, sty - r - 18)
      .setVisible(true);

    return [];
  }

  private drawTower(stx: number, sty: number, r: number) {
    // 四角形で塔を表現
    this.graphics.fillRect(stx - r, sty - r, r * 2, r * 2);
    this.graphics.strokeRect(stx - r, sty - r, r * 2, r * 2);
    // 中央に十字
    this.graphics.lineStyle(2, 0xffffff, 0.6);
    this.graphics.lineBetween(stx, sty - r + 8, stx, sty + r - 8);
    this.graphics.lineBetween(stx - r + 8, sty, stx + r - 8, sty);
  }

  private countInTower(
    tx: number, ty: number, r: number,
    playerX: number, playerY: number, aiMembers: AIMemberState[]
  ): number {
    let count = 0;
    // 四角形判定
    if (Math.abs(playerX - tx) < r && Math.abs(playerY - ty) < r) count++;
    for (const ai of aiMembers) {
      if (Math.abs(ai.x - tx) < r && Math.abs(ai.y - ty) < r) count++;
    }
    return count;
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
