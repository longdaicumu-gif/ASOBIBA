import * as Phaser from 'phaser';
import type { GimmickEvent, GimmickContext, GimmickEffect, AIMemberState } from '../../types';

export type GimmickState = 'waiting' | 'warning' | 'active' | 'done';

export class SpreadGimmick {
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
      fontSize: '13px', color: '#ffff00', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5);
  }

  update(ctx: GimmickContext): GimmickEffect[] {
    const { elapsed, playerX, playerY, aiMembers } = ctx;
    const fireTime = this.event.time;
    const warnStart = fireTime - this.event.warningDuration;
    this.graphics.clear();

    if (elapsed < warnStart || this.state === 'done') {
      this.timerText.setVisible(false);
      return [];
    }

    const minDist = this.event.minDistance ?? 100;
    const spreadR = this.event.spreadRadius ?? 60;

    if (elapsed >= fireTime) {
      this.state = 'active';
      // プレイヤーとAI全員の間の距離チェック
      const tooClose = aiMembers.some(ai => {
        const d = Math.sqrt((playerX - ai.x) ** 2 + (playerY - ai.y) ** 2);
        return d < minDist;
      });
      this.drawSpreadMarkers(playerX, playerY, aiMembers, spreadR, tooClose ? 0xff2200 : 0x00ff88, 0.5);
      this.timerText.setVisible(false);

      if (tooClose) {
        return [{ kind: 'spread_fail', gimmickId: this.event.id }];
      }
      return [];
    }

    this.state = 'warning';
    const progress = (elapsed - warnStart) / this.event.warningDuration;
    const pulse = 0.25 + 0.35 * Math.abs(Math.sin(progress * Math.PI * 5));
    this.drawSpreadMarkers(playerX, playerY, aiMembers, spreadR, 0xffdd00, pulse);

    const remaining = fireTime - elapsed;
    this.timerText
      .setText(`散開 ${remaining.toFixed(1)}`)
      .setPosition(this.arenaOffsetX + playerX, this.arenaOffsetY + playerY - spreadR - 20)
      .setVisible(true);

    return [];
  }

  private drawSpreadMarkers(
    playerX: number, playerY: number,
    aiMembers: AIMemberState[],
    r: number, color: number, alpha: number
  ) {
    this.graphics.lineStyle(2, color, 1);
    this.graphics.fillStyle(color, alpha * 0.4);
    // プレイヤー
    this.graphics.strokeCircle(this.arenaOffsetX + playerX, this.arenaOffsetY + playerY, r);
    this.graphics.fillCircle(this.arenaOffsetX + playerX, this.arenaOffsetY + playerY, r);
    // AI
    for (const ai of aiMembers) {
      this.graphics.strokeCircle(this.arenaOffsetX + ai.x, this.arenaOffsetY + ai.y, r);
      this.graphics.fillCircle(this.arenaOffsetX + ai.x, this.arenaOffsetY + ai.y, r);
    }
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
