
export const initialPlayers = [
  {
    id: "p1",
    name: "MARST",
    position: "CF",
    role: "타자",
    contact: 78,
    power: 84,
    eye: 75,
    pitching: 40,
    speed: 80,
    level: 1,
    exp: 0
  },
  {
    id: "p2",
    name: "NEX",
    position: "SS",
    role: "타자",
    contact: 86,
    power: 72,
    eye: 82,
    pitching: 35,
    speed: 87,
    level: 1,
    exp: 0
  },
  {
    id: "p3",
    name: "ACE",
    position: "SP",
    role: "투수",
    contact: 42,
    power: 48,
    eye: 65,
    pitching: 88,
    speed: 65,
    level: 1,
    exp: 0
  },
  {
    id: "p4",
    name: "BOLT",
    position: "RF",
    role: "타자",
    contact: 72,
    power: 91,
    eye: 69,
    pitching: 30,
    speed: 76,
    level: 1,
    exp: 0
  }
];

export function overall(player) {
  if (player.position === "SP") {
    return Math.round(
      player.pitching * 0.6 +
      player.eye * 0.15 +
      player.speed * 0.1 +
      player.contact * 0.15
    );
  }

  return Math.round(
    player.contact * 0.35 +
    player.power * 0.3 +
    player.eye * 0.2 +
    player.speed * 0.15
  );
}
