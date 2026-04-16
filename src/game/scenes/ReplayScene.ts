import * as Phaser from 'phaser';
import type { StageData, ReplayFrame, FailureLog } from '../../types';
import { eventBus } from '../eventBus';

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
    const { width: W, height: H } = this.scale;

    this.arenaWidth = this.stageData.arena.width;
    this.arenaHeight = this.stageData.arena.height;
    this.arenaOffsetX = (W - this.arenaWidth) / 2;
    this.arenaOffsetY = (H - this.arenaHeight) / 2 - 20;
    this.totalTime = this.frames.length > 0 ? this.frames[this.frames.length - 1].time : 0;

    this.cameras.main.setBackgroundColor('#0d0d1a');
    this.drawArena();

    this.trailGraphics = this.add.graphics();
    this.playerDot = this.add.circle(0, 0, 12, 0x00ccff).setVisible(false);

    this.drawFailureMarkers();

    const hasFail = this.failures.length > 0;
    this.statusText = this.add.text(W / 2, 20,
      hasFail ? 'リプレイ - 失敗箇所を確認しよう' : 'リプレイ - クリアおめでとう！', {
        fontSize: '16px',
        color: hasFail ? '#ff8888' : '#88ffaa',
        stroke: '#000', strokeThickness: 3,
      }).setOrigin(0.5);

    this.add.rectangle(W / 2, H - 20, W - 40, 8, 0x333355).setOrigin(0.5);
    this.timeBar = this.add.graphics();

    this.add.text(W / 2, H - 44, '[R] もう一度プレイ   [ESC] タイトルへ', {
      fontSize: '13px', color: '#666688',
    }).setOrigin(0.5);

    this.input.keyboard?.addKey('R').on('down', () =>
      this.scene.start('GameScene', { stageData: this.stageData })
    );
    this.input.keyboard?.addKey('ESC').on('down', () => this.exitToTitle());
  }

  update(_time: number, delta: number) {
    if (!this.isPlaying) return;

    this.replayTime += delta / 1000;
    if (this.replayTime > this.totalTime + 1) {
      this.isPlaying = false;
      this.statusText.setText('[R] でもう一度 / [ESC] タイトルへ');
      return;
    }

    const pos = this.getFrameAt(this.replayTime);
    if (pos) {
      this.playerDot
        .setPosition(this.arenaOffsetX + pos.x, this.arenaOffsetY + pos.y)
        .setVisible(true);
    }

    this.drawTrail();

    const { width: W, height: H } = this.scale;
    const progress = this.totalTime > 0 ? Math.min(this.replayTime / this.totalTime, 1) : 0;
    this.timeBar.clear();
    this.timeBar.fillStyle(0x00ccff, 1);
    this.timeBar.fillRect(20, H - 24, (W - 40) * progress, 8);

    const cur = this.failures.find(f => Math.abs(f.time - this.replayTime) < 0.15);
    if (cur) this.statusText.setText(`被弾: ${cur.gimmickType}`).setColor('#ff4444');
  }

  private drawTrail() {
    this.trailGraphics.clear();
    const win = 1.5;
    const trail = this.frames.filter(
      f => f.time >= this.replayTime - win && f.time <= this.replayTime
    );
    if (trail.length < 2) return;
    for (let i = 1; i < trail.length; i++) {
      this.trailGraphics.lineStyle(3, 0x00ccff, (i / trail.length) * 0.55);
      this.trailGraphics.lineBetween(
        this.arenaOffsetX + trail[i - 1].playerX, this.arenaOffsetY + trail[i - 1].playerY,
        this.arenaOffsetX + trail[i].playerX, this.arenaOffsetY + trail[i].playerY
      );
    }
  }

  private drawFailureMarkers() {
    for (const fail of this.failures) {
      const sx = this.arenaOffsetX + fail.playerX;
      const sy = this.arenaOffsetY + fail.playerY;
      const g = this.add.graphics();
      g.lineStyle(3, 0xff2200, 1);
      g.lineBetween(sx - 10, sy - 10, sx + 10, sy + 10);
      g.lineBetween(sx + 10, sy - 10, sx - 10, sy + 10);
      this.add.text(sx, sy - 22, `✗ ${fail.gimmickType}`, {
        fontSize: '11px', color: '#ff5544', stroke: '#000', strokeThickness: 2,
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
    const a = this.frames[idx - 1], b = this.frames[idx];
    const t = (time - a.time) / (b.time - a.time);
    return {
      x: a.playerX + (b.playerX - a.playerX) * t,
      y: a.playerY + (b.playerY - a.playerY) * t,
    };
  }

  private exitToTitle() {
    eventBus.emit('game:exit');
  }

  private drawArena() {
    const g = this.add.graphics();
    g.fillStyle(0x16213e, 1);
    g.fillRect(this.arenaOffsetX, this.arenaOffsetY, this.arenaWidth, this.arenaHeight);
    g.lineStyle(4, 0x4488cc, 1);
    g.strokeRect(this.arenaOffsetX - 2, this.arenaOffsetY - 2, this.arenaWidth + 4, this.arenaHeight + 4);
    g.lineStyle(1, 0x2a4a6a, 0.35);
    for (let x = 80; x < this.arenaWidth; x += 80)
      g.lineBetween(this.arenaOffsetX + x, this.arenaOffsetY, this.arenaOffsetX + x, this.arenaOffsetY + this.arenaHeight);
    for (let y = 80; y < this.arenaHeight; y += 80)
      g.lineBetween(this.arenaOffsetX, this.arenaOffsetY + y, this.arenaOffsetX + this.arenaWidth, this.arenaOffsetY + y);
  }
}
