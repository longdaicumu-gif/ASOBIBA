import * as Phaser from 'phaser';
import type { StageData, GimmickEffect } from '../../types';
import { InputSystem } from '../systems/InputSystem';
import { ReplaySystem } from '../systems/ReplaySystem';
import { GimmickManager } from '../systems/GimmickManager';
import { AISystem } from '../systems/AISystem';
import { eventBus } from '../eventBus';

const PLAYER_SPEED = 220;
const ARENA_BORDER = 4;
const PLAYER_RADIUS = 14;

export class GameScene extends Phaser.Scene {
  private stageData!: StageData;
  private controls!: InputSystem;
  private replay!: ReplaySystem;
  private gimmickManager!: GimmickManager;
  private aiSystem!: AISystem | null;

  private arenaOffsetX = 0;
  private arenaOffsetY = 0;
  private arenaWidth = 0;
  private arenaHeight = 0;

  private player!: Phaser.GameObjects.Arc;
  private playerX = 0;
  private playerY = 0;
  private knockbackVX = 0;
  private knockbackVY = 0;

  private elapsedTime = 0;
  private isAlive = true;
  private stageDuration = 0;

  private statusText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { stageData: StageData }) {
    this.stageData = data.stageData;
    this.elapsedTime = 0;
    this.isAlive = true;
    this.knockbackVX = 0;
    this.knockbackVY = 0;
    this.aiSystem = null;
  }

  create() {
    const { width: W, height: H } = this.scale;

    this.arenaWidth = this.stageData.arena.width;
    this.arenaHeight = this.stageData.arena.height;
    this.arenaOffsetX = (W - this.arenaWidth) / 2;
    this.arenaOffsetY = (H - this.arenaHeight) / 2;

    this.cameras.main.setBackgroundColor('#1a1a2e');
    this.drawArena();
    this.drawGrid();

    // プレイヤー
    this.playerX = this.arenaWidth / 2;
    this.playerY = this.arenaHeight / 2;
    this.player = this.add.circle(
      this.arenaOffsetX + this.playerX,
      this.arenaOffsetY + this.playerY,
      PLAYER_RADIUS, 0x00ccff
    );
    this.add.circle(
      this.arenaOffsetX + this.playerX,
      this.arenaOffsetY + this.playerY,
      PLAYER_RADIUS
    ).setStrokeStyle(2, 0xffffff).setFillStyle(0, 0);

    // システム
    this.controls = new InputSystem(this);
    this.replay = new ReplaySystem();
    this.replay.startRecording();

    this.gimmickManager = new GimmickManager(
      this, this.stageData, this.arenaOffsetX, this.arenaOffsetY
    );

    if (this.stageData.aiMembers.length > 0) {
      this.aiSystem = new AISystem(this, this.stageData.aiMembers);
    }

    const last = [...this.stageData.timeline].sort((a, b) => b.time - a.time)[0];
    this.stageDuration = last ? last.time + 3 : 30;

    // UI
    const { width: screenW, height: screenH } = this.scale;
    this.statusText = this.add.text(screenW / 2, screenH - 36, '', {
      fontSize: '20px', color: '#fff', stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);

    this.timerText = this.add.text(screenW / 2, this.arenaOffsetY - 28, '0.0', {
      fontSize: '16px', color: '#7799bb',
    }).setOrigin(0.5);

    this.hintText = this.add.text(screenW / 2, screenH - 16, '[ESC] タイトルへ', {
      fontSize: '12px', color: '#555577',
    }).setOrigin(0.5);

    // ESCでタイトル
    this.input.keyboard?.addKey('ESC').on('down', () => this.exitToTitle());
  }

  update(_time: number, delta: number) {
    if (!this.isAlive) return;

    const dt = delta / 1000;
    this.elapsedTime += dt;

    // ノックバック減衰
    if (Math.abs(this.knockbackVX) > 0 || Math.abs(this.knockbackVY) > 0) {
      this.movePlayer(this.knockbackVX * dt, this.knockbackVY * dt, false);
      this.knockbackVX *= Math.pow(0.05, dt);
      this.knockbackVY *= Math.pow(0.05, dt);
      if (Math.abs(this.knockbackVX) < 1) this.knockbackVX = 0;
      if (Math.abs(this.knockbackVY) < 1) this.knockbackVY = 0;
    } else {
      const { dx, dy } = this.controls.getInput();
      this.movePlayer(dx * PLAYER_SPEED * dt, dy * PLAYER_SPEED * dt, true);
    }

    // AI更新
    this.aiSystem?.update(
      this.elapsedTime, dt,
      this.stageData.timeline,
      this.stageData.aiMembers,
      this.arenaOffsetX, this.arenaOffsetY
    );

    // リプレイ記録
    this.replay.record(this.elapsedTime, this.playerX, this.playerY);

    // ギミック更新
    const effects = this.gimmickManager.update({
      elapsed: this.elapsedTime,
      playerX: this.playerX,
      playerY: this.playerY,
      arenaWidth: this.arenaWidth,
      arenaHeight: this.arenaHeight,
      aiMembers: this.aiSystem?.getStates() ?? [],
    });

    this.handleEffects(effects);

    this.timerText.setText(this.elapsedTime.toFixed(1) + 's');

    if (this.elapsedTime >= this.stageDuration) this.stageClear();
  }

  private movePlayer(dx: number, dy: number, clampArena: boolean) {
    let nx = this.playerX + dx;
    let ny = this.playerY + dy;

    if (clampArena) {
      nx = Phaser.Math.Clamp(nx, PLAYER_RADIUS, this.arenaWidth - PLAYER_RADIUS);
      ny = Phaser.Math.Clamp(ny, PLAYER_RADIUS, this.arenaHeight - PLAYER_RADIUS);
    } else {
      // ノックバック時：壁に当たったら死亡
      const hitWall =
        nx < PLAYER_RADIUS || nx > this.arenaWidth - PLAYER_RADIUS ||
        ny < PLAYER_RADIUS || ny > this.arenaHeight - PLAYER_RADIUS;
      nx = Phaser.Math.Clamp(nx, PLAYER_RADIUS, this.arenaWidth - PLAYER_RADIUS);
      ny = Phaser.Math.Clamp(ny, PLAYER_RADIUS, this.arenaHeight - PLAYER_RADIUS);
      if (hitWall) {
        this.knockbackVX = 0;
        this.knockbackVY = 0;
        // 壁への激突は今回は即死なし（壁で止まるだけ）
      }
    }

    this.playerX = nx;
    this.playerY = ny;
    this.player.setPosition(this.arenaOffsetX + nx, this.arenaOffsetY + ny);
  }

  private handleEffects(effects: GimmickEffect[]) {
    for (const effect of effects) {
      if (effect.kind === 'knockback') {
        // ノックバック: 瞬間移動 + 慣性
        this.knockbackVX = effect.dx * 5;
        this.knockbackVY = effect.dy * 5;
      } else if (
        effect.kind === 'hit' ||
        effect.kind === 'stack_fail' ||
        effect.kind === 'tower_fail' ||
        effect.kind === 'spread_fail'
      ) {
        const gimmickId = 'gimmickId' in effect ? effect.gimmickId : '';
        const type = 'gimmickType' in effect ? effect.gimmickType : effect.kind;
        this.replay.recordFailure(
          this.elapsedTime, gimmickId, type as import('../../types').GimmickType,
          this.playerX, this.playerY
        );
        this.playerDead(effect.kind);
        return;
      }
    }
  }

  private playerDead(reason: string) {
    this.isAlive = false;
    this.replay.stopRecording();
    this.player.setFillStyle(0xff0000);

    const labels: Record<string, string> = {
      hit: '被弾',
      stack_fail: '頭割り失敗',
      tower_fail: '塔踏み失敗',
      spread_fail: '散開失敗',
    };
    this.statusText
      .setText(`失敗: ${labels[reason] ?? reason}`)
      .setColor('#ff4444');

    this.time.delayedCall(2200, () => {
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

    this.time.delayedCall(2200, () => {
      this.scene.start('ReplayScene', {
        frames: this.replay.getFrames(),
        failures: this.replay.getFailures(),
        stageData: this.stageData,
      });
    });
  }

  private exitToTitle() {
    this.gimmickManager?.destroy();
    this.aiSystem?.destroy();
    eventBus.emit('game:exit');
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
    g.lineStyle(1, 0x2a4a6a, 0.4);
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
