import * as Phaser from 'phaser';
import type { StageData, ReplayFrame, FailureLog } from '../../types';
import { AoeCircle } from '../gimmicks/AoeCircle';

export class ReplayScene extends Phaser.Scene {
  private frames: ReplayFrame[] = [];
  private failures: FailureLog[] = [];
  private stageData!: StageData;

  private replayTime = 0;
  private totalTime = 0;
  private isPlaying = true;

  private arenaOffsetX = 0;
  private arenaOffsetY = 0;
  private arenaWidth = 0;
  private arenaHeight = 0;

  private playerDot!: Phaser.GameObjects.Arc;
  private trailGraphics!: Phaser.GameObjects.Graphics;
  private aoeCircles: AoeCircle[] = [];
  private statusText!: Phaser.GameObjects.Text;
  private timeBar!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'ReplayScene' });
  }

  init(data: { frames: ReplayFrame[]; failures: FailureLog[]; stageData: StageData }) {
    this.frames = data.frames;
    this.failures = data.failures;
    this.stageData = data.stageData;
    this.replayTime = 0;
    this.isPlaying = true;
  }

  create() {
    const { width: screenW, height: screenH } = this.scale;

    this.arenaWidth = this.stageData.arena.width;
    this.arenaHeight = this.stageData.arena.height;
    this.arenaOffsetX = (screenW - this.arenaWidth) / 2;
    this.arenaOffsetY = (screenH - this.arenaHeight) / 2 - 20;

    this.totalTime = this.frames.length > 0 ? this.frames[this.frames.length - 1].time : 0;

    this.cameras.main.setBackgroundColor('#0d0d1a');

    this.drawArena();

    this.trailGraphics = this.add.graphics();

    // プレイヤードット
    this.playerDot = this.add.circle(0, 0, 12, 0x00ccff).setVisible(false);

    // AoEギミック再現
    for (const event of this.stageData.timeline) {
      if (event.type === 'aoe_circle') {
        this.aoeCircles.push(new AoeCircle(this, event, this.arenaOffsetX, this.arenaOffsetY));
      }
    }

    // 失敗ログ表示
    this.drawFailureMarkers();

    // UIテキスト
    this.statusText = this.add.text(screenW / 2, 20, 'リプレイ中...', {
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // タイムバー背景
    this.add.rectangle(screenW / 2, screenH - 20, screenW - 40, 10, 0x333333).setOrigin(0.5);
    this.timeBar = this.add.graphics();

    // Rキーで再スタート、Eキーでエディター（将来）
    this.input.keyboard?.addKey('R').on('down', () => this.restartStage());

    this.add.text(screenW / 2, screenH - 45, '[R] もう一度プレイ', {
      fontSize: '14px',
      color: '#888888',
    }).setOrigin(0.5);
  }

  update(_time: number, delta: number) {
    if (!this.isPlaying) return;

    this.replayTime += delta / 1000;
    if (this.replayTime > this.totalTime + 1) {
      this.isPlaying = false;
      this.statusText.setText('リプレイ終了 — [R] でもう一度');
      return;
    }

    // プレイヤー位置補間
    const pos = this.getFrameAt(this.replayTime);
    if (pos) {
      const sx = this.arenaOffsetX + pos.x;
      const sy = this.arenaOffsetY + pos.y;
      this.playerDot.setPosition(sx, sy).setVisible(true);
    }

    // 軌跡描画
    this.drawTrail();

    // ギミック再生
    for (const aoe of this.aoeCircles) {
      if (aoe.state !== 'done') {
        aoe.update(this.replayTime, pos?.x ?? 0, pos?.y ?? 0);
        if (aoe.state === 'active' && this.replayTime > aoe.event.time + 0.1) {
          aoe.markDone();
        }
      }
    }

    // タイムバー
    const { width: screenW, height: screenH } = this.scale;
    const progress = Math.min(this.replayTime / this.totalTime, 1);
    this.timeBar.clear();
    this.timeBar.fillStyle(0x00ccff, 1);
    this.timeBar.fillRect(20, screenH - 25, (screenW - 40) * progress, 10);

    // 失敗時刻のステータス
    const currentFailure = this.failures.find(
      f => Math.abs(f.time - this.replayTime) < 0.2
    );
    if (currentFailure) {
      this.statusText.setText(`被弾: ${currentFailure.gimmickType}`).setColor('#ff4444');
    }
  }

  private drawTrail() {
    this.trailGraphics.clear();
    const maxTrailTime = 1.5;
    const trailFrames = this.frames.filter(
      f => f.time >= this.replayTime - maxTrailTime && f.time <= this.replayTime
    );
    if (trailFrames.length < 2) return;

    for (let i = 1; i < trailFrames.length; i++) {
      const alpha = (i / trailFrames.length) * 0.6;
      this.trailGraphics.lineStyle(3, 0x00ccff, alpha);
      this.trailGraphics.lineBetween(
        this.arenaOffsetX + trailFrames[i - 1].playerX,
        this.arenaOffsetY + trailFrames[i - 1].playerY,
        this.arenaOffsetX + trailFrames[i].playerX,
        this.arenaOffsetY + trailFrames[i].playerY
      );
    }
  }

  private drawFailureMarkers() {
    for (const fail of this.failures) {
      const sx = this.arenaOffsetX + fail.playerX;
      const sy = this.arenaOffsetY + fail.playerY;
      // ✕マーク
      const g = this.add.graphics();
      g.lineStyle(3, 0xff2200, 1);
      g.lineBetween(sx - 10, sy - 10, sx + 10, sy + 10);
      g.lineBetween(sx + 10, sy - 10, sx - 10, sy + 10);

      this.add.text(sx, sy - 20, `被弾: ${fail.gimmickType}`, {
        fontSize: '11px',
        color: '#ff4444',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5);
    }
  }

  private getFrameAt(time: number): { x: number; y: number } | null {
    if (this.frames.length === 0) return null;
    const idx = this.frames.findIndex(f => f.time >= time);
    if (idx === 0) return { x: this.frames[0].playerX, y: this.frames[0].playerY };
    if (idx === -1) {
      const last = this.frames[this.frames.length - 1];
      return { x: last.playerX, y: last.playerY };
    }
    const a = this.frames[idx - 1];
    const b = this.frames[idx];
    const t = (time - a.time) / (b.time - a.time);
    return {
      x: a.playerX + (b.playerX - a.playerX) * t,
      y: a.playerY + (b.playerY - a.playerY) * t,
    };
  }

  private restartStage() {
    this.scene.start('GameScene', { stageData: this.stageData });
  }

  private drawArena() {
    const g = this.add.graphics();
    g.fillStyle(0x16213e, 1);
    g.fillRect(this.arenaOffsetX, this.arenaOffsetY, this.arenaWidth, this.arenaHeight);
    g.lineStyle(4, 0x4488cc, 1);
    g.strokeRect(this.arenaOffsetX - 2, this.arenaOffsetY - 2, this.arenaWidth + 4, this.arenaHeight + 4);
    // グリッド
    g.lineStyle(1, 0x2a4a6a, 0.4);
    const step = 80;
    for (let x = step; x < this.arenaWidth; x += step) {
      g.lineBetween(this.arenaOffsetX + x, this.arenaOffsetY, this.arenaOffsetX + x, this.arenaOffsetY + this.arenaHeight);
    }
    for (let y = step; y < this.arenaHeight; y += step) {
      g.lineBetween(this.arenaOffsetX, this.arenaOffsetY + y, this.arenaOffsetX + this.arenaWidth, this.arenaOffsetY + y);
    }
  }
}
