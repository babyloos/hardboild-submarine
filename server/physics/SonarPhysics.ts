import { SonarContact, SonarSweep, Vec2 } from "../../shared/types";
import { DEST_SONAR_RANGE } from "../../shared/constants";
import { distance, bearing } from "./OceanPhysics";

export function buildSubmarineSonarContacts(
  subPos: Vec2,
  subHeading: number,
  subDepth: number,
  targets: Array<{ position: Vec2; depth?: number }>,
  rangeModifier: number
): SonarContact[] {
  const range = DEST_SONAR_RANGE * rangeModifier;
  const contacts: SonarContact[] = [];

  for (const target of targets) {
    const dist = distance(subPos, target.position);
    if (dist > range) continue;

    // Depth difference reduces signal at very different depths
    const depthDiff = Math.abs((target.depth ?? 0) - subDepth);
    const depthPenalty = Math.max(0, 1 - depthDiff / 200);
    const strength = (1 - dist / range) * depthPenalty;

    // Add noise to distance to avoid exact locating
    const noisyDist = dist * (0.8 + Math.random() * 0.4);

    contacts.push({
      bearing: bearing(subPos, target.position, subHeading),
      distance: noisyDist,
      strength,
    });
  }

  return contacts;
}

export function buildDestroyerSonarSweep(
  destPos: Vec2,
  targets: Array<{ position: Vec2; depth: number }>,
  rangeModifier: number
): SonarSweep {
  const range = DEST_SONAR_RANGE * rangeModifier;
  const contacts = targets
    .filter((t) => distance(destPos, t.position) <= range)
    .map((t) => {
      const dist = distance(destPos, t.position);
      const angle = (Math.atan2(t.position.x - destPos.x, -(t.position.y - destPos.y)) * 180) / Math.PI;
      const intensity = (1 - dist / range) * (t.depth / 300); // deeper = louder for destroyer sonar
      return { angle: ((angle % 360) + 360) % 360, distance: dist, intensity };
    });

  return { contacts, range };
}
