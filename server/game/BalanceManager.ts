import { Faction } from "../../shared/types";

export class BalanceManager {
  private submarines = new Set<string>();
  private destroyers = new Set<string>();

  assign(playerId: string, preferred?: Faction): Faction {
    const faction = preferred ?? this.leastPopulated();
    if (faction === "submarine") {
      this.submarines.add(playerId);
    } else {
      this.destroyers.add(playerId);
    }
    return faction;
  }

  remove(playerId: string): void {
    this.submarines.delete(playerId);
    this.destroyers.delete(playerId);
  }

  getFaction(playerId: string): Faction | null {
    if (this.submarines.has(playerId)) return "submarine";
    if (this.destroyers.has(playerId)) return "destroyer";
    return null;
  }

  submarineCount(): number {
    return this.submarines.size;
  }

  destroyerCount(): number {
    return this.destroyers.size;
  }

  private leastPopulated(): Faction {
    return this.submarines.size <= this.destroyers.size ? "submarine" : "destroyer";
  }
}
