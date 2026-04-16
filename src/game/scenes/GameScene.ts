import * as Phaser from 'phaser';
import type { StageData } from '../../types';
import { InputSystem } from '../systems/InputSystem';
import { ReplaySystem } from '../systems/ReplaySystem';
import { AoeCircle } from '../gimmicks/AoeCircle';

const PLAYER_SPEED = 220;
const ARENA_BORDER = 4;

export class GameScene extends Phaser.Scene {
  private stageData!: StageData;
  private controls!: InputSystem; // Phaser.Scene の input と衝突しないよう controls に
  private replay!: ReplaySystem;

  // アリーナ
  private arenaOffsetX = 0;
  private arenaOffsetY = 0;
  private arenaWidth = 0;
  private arenaHeight = 0;

  // プレイヤー
  private player!: Phaser.GameObjects.Arc;
  private playerX = 0;
  private playerY = 0;

  // ギミック
  private aoeCircles: AoeCircle[] = [];
  private elapsedTime = 0;
  private isAlive = true;
  private stageDuration = 0;

  // UI
  private statusText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { stageData: StageData }) {
    this.stageData = data.stageData;
    this.elapsedTime = 0;
    this.isAlive = true;
    this.aoeCircles = [];
  }

  create() {
    const { width: screenW, height: screenH } = this.scale;

    this.arenaWidth = this.stageData.arena.width;
    this.arenaHeight = this.stageData.arena.height;
    this.arenaOffsetX = (screenW - this.arenaWidth) / 2;
    this.arenaOffsetY = (screenH - this.arenaHeight) / 2;

    this.cameras.main.setBackgroundColor('#1a1a2e');
    this.drawArena();
    this.drawGrid();

    // プレイヤー初期位置（アリーナ中央）
    this.playerX = this.arenaWidth / 2;
    this.playerY = this.arenaHeight / 2;
    this.player = this.add.circle(
      this.arenaOffsetX + this.playerX,
      this.arenaOffsetY + this.playerY,
      14,
      0x00ccff
    );

    // システム初期化
    this.controls = new InputSystem(this);
    this.replay = new ReplaySystem();
    this.replay.startRecording();

    // ギミック生成
    for (const event of this.stageData.timeline) {
      if (event.type === 'aoe_circle') {
        this.aoeCircles.push(new AoeCircle(this, event, this.arenaOffsetX, this.arenaOffsetY));
      }
    }

    // ステージ終了時間
    const lastGimmick = [...this.stageData.timeline].sort((a, b) => b.time - a.time)[0];
    this.stageDuration = lastGimmick ? lastGimmick.time + 3 : 30;

    // UI
    this.statusText = this.add.text(screenW / 2, screenH - 40, '', {
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.timerText = this.add.text(screenW / 2, this.arenaOffsetY - 30, '0.0', {
      fontSize: '18px',
      color: '#aaaaaa',
    }).setOrigin(0.5);
  }

  update(_time: number, delta: number) {
    if (!this.isAlive) return;

    const dt = delta / 1000;
    this.elapsedTime += dt;

    const { dx, dy } = this.controls.getInput();
    this.movePlayer(dx, dy, dt);

    this.replay.record(this.elapsedTime, this.playerX, this.playerY);
    this.updateGimmicks();

    this.timerText.setText(this.elapsedTime.toFixed(1) + 's');

    if (this.elapsedTime >= this.stageDuration) {
      this.stageClear();
    }
  }

  private movePlayer(dx: number, dy: number, dt: number) {
    const newX = this.playerX + dx * PLAYER_SPEED * dt;
    const newY = this.playerY + dy * PLAYER_SPEED * dt;
    const r = 14;
    this.playerX = Phaser.Math.Clamp(newX, r, this.arenaWidth - r);
    this.playerY = Phaser.Math.Clamp(newY, r, this.arenaHeight - r);
    this.player.setPosition(
      this.arenaOffsetX + this.playerX,
      this.arenaOffsetY + this.playerY
    );
  }

  private updateGimmicks() {
    for (const aoe of this.aoeCircles) {
      if (aoe.state === 'done') continue;

      const firing = aoe.update(this.elapsedTime, this.playerX, this.playerY);

      if (firing && aoe.isPlayerHit(this.playerX, this.playerY)) {
        this.replay.recordFailure(
          this.elapsedTime, aoe.event.id, aoe.event.type, this.playerX, this.playerY
        );
        aoe.markDone();
        this.playerDead(aoe.event.id);
        return;
      }

      if (aoe.state === 'active' && this.elapsedTime > aoe.event.time + 0.1) {
        aoe.markDone();
      }
    }
  }

  private playerDead(gimmickId: string) {
    this.isAlive = false;
    this.replay.stopRecording();
    this.player.setFillStyle(0xff0000);

    const failures = this.replay.getFailures();
    const cause = failures[failures.length - 1];
    this.statusText
      .setText(`被弾！ ${cause?.gimmickType ?? gimmickId}`)
      .setColor('#ff4444');

    this.time.delayedCall(2000, () => {
      this.scene.start('ReplayScene', {
        frames: this.replay.getFrames(),
        failures: this.replay.getFailures(),
        stageData: this.stageData,
      });
    });
  }

  private stageClear() {
    this.isAlive = false;
    this.replay.stopRecording();
    this.statusText.setText('クリア！').setColor('#00ff88');

    this.time.delayedCall(2000, () => {
      this.scene.start('ReplayScene', {
        frames: this.replay.getFrames(),
        failures: this.replay.getFailures(),
        stageData: this.stageData,
      });
    });
  }

  private drawArena() {
    const g = this.add.graphics();
    g.fillStyle(0x16213e, 1);
    g.fillRect(this.arenaOffsetX, this.arenaOffsetY, this.arenaWidth, this.arenaHeight);
    g.lineStyle(ARENA_BORDER, 0x4488cc, 1);
    g.strokeRect(
      this.arenaOffsetX - ARENA_BORDER / 2,
      this.arenaOffsetY - ARENA_BORDER / 2,
      this.arenaWidth + ARENA_BORDER,
      this.arenaHeight + ARENA_BORDER
    );
  }

  private drawGrid() {
    const g = this.add.graphics();
    g.lineStyle(1, 0x2a4a6a, 0.5);
    const step = 80;
    for (let x = step; x < this.arenaWidth; x += step) {
      g.lineBetween(
        this.arenaOffsetX + x, this.arenaOffsetY,
        this.arenaOffsetX + x, this.arenaOffsetY + this.arenaHeight
      );
    }
    for (let y = step; y < this.arenaHeight; y += step) {
      g.lineBetween(
        this.arenaOffsetX, this.arenaOffsetY + y,
        this.arenaOffsetX + this.arenaWidth, this.arenaOffsetY + y
      );
    }
  }
}
