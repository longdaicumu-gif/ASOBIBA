import * as Phaser from 'phaser';
import type { StageData, GimmickEffect, GimmickContext } from '../../types';
import { AoeCircle } from '../gimmicks/AoeCircle';
import { AoeLine } from '../gimmicks/AoeLine';
import { AoeFan } from '../gimmicks/AoeFan';
import { AoeDonut } from '../gimmicks/AoeDonut';
import { StackGimmick } from '../gimmicks/StackGimmick';
import { SpreadGimmick } from '../gimmicks/SpreadGimmick';
import { KnockbackGimmick } from '../gimmicks/KnockbackGimmick';
import { TowerGimmick } from '../gimmicks/TowerGimmick';

type AnyGimmick =
  | AoeCircle | AoeLine | AoeFan | AoeDonut
  | StackGimmick | SpreadGimmick | KnockbackGimmick | TowerGimmick;

export class GimmickManager {
  private gimmicks: AnyGimmick[] = [];

  constructor(
    scene: Phaser.Scene,
    stageData: StageData,
    arenaOffsetX: number,
    arenaOffsetY: number
  ) {
    for (const event of stageData.timeline) {
      let g: AnyGimmick | null = null;
      switch (event.type) {
        case 'aoe_circle':   g = new AoeCircle(scene, event, arenaOffsetX, arenaOffsetY); break;
        case 'aoe_line':     g = new AoeLine(scene, event, arenaOffsetX, arenaOffsetY); break;
        case 'aoe_fan':      g = new AoeFan(scene, event, arenaOffsetX, arenaOffsetY); break;
        case 'aoe_donut':    g = new AoeDonut(scene, event, arenaOffsetX, arenaOffsetY); break;
        case 'stack':        g = new StackGimmick(scene, event, arenaOffsetX, arenaOffsetY); break;
        case 'spread':       g = new SpreadGimmick(scene, event, arenaOffsetX, arenaOffsetY); break;
        case 'knockback':
        case 'pull':         g = new KnockbackGimmick(scene, event, arenaOffsetX, arenaOffsetY); break;
        case 'tower':        g = new TowerGimmick(scene, event, arenaOffsetX, arenaOffsetY); break;
      }
      if (g) this.gimmicks.push(g);
    }
  }

  update(ctx: GimmickContext): GimmickEffect[] {
    const allEffects: GimmickEffect[] = [];

    for (const g of this.gimmicks) {
      if (g.state === 'done') continue;

      let effects: GimmickEffect[] = [];

      if (g instanceof AoeCircle) {
        const firing = g.update(ctx.elapsed, ctx.playerX, ctx.playerY);
        if (firing && g.isPlayerHit(ctx.playerX, ctx.playerY)) {
          effects = [{ kind: 'hit', gimmickId: g.event.id, gimmickType: g.event.type }];
        }
        // active フェーズが終わったら done に
        if (g.state === 'active' && ctx.elapsed > g.event.time + 0.15) {
          g.markDone();
        }
      } else {
        // 他のギミックは GimmickContext を渡す
        effects = (g as AoeLine | AoeFan | AoeDonut | StackGimmick | SpreadGimmick | KnockbackGimmick | TowerGimmick).update(ctx);
        if (g.state === 'active' && ctx.elapsed > g.event.time + 0.15) {
          g.markDone();
        }
      }

      allEffects.push(...effects);
    }

    return allEffects;
  }

  destroy() {
    for (const g of this.gimmicks) g.destroy();
    this.gimmicks = [];
  }
}
