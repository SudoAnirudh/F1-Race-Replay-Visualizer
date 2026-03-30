export const TEAM_COLORS = {
  "Red Bull Racing": "3671C6",
  "Mercedes": "27F4D2",
  "Ferrari": "E8002D",
  "McLaren": "FF8000",
  "Aston Martin": "229971",
  "Alpine": "0093CC",
  "Williams": "37BEDD",
  "Visa Cash App RB": "6692FF",
  "Stake F1 Team Kick Sauber": "52E252",
  "Haas F1 Team": "B6BABD",
  "Alfa Romeo": "900000",
  "AlphaTauri": "2B4562",
  // fallback map, FastF1 returns dynamic colors per year generally
};

export function getTeamColor(teamName, fallbackCode) {
    if (fallbackCode) return fallbackCode;
    return TEAM_COLORS[teamName] || "CCCCCC";
}
