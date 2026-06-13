export interface BenchmarkSeed {
  partModel: string;
  benchmark: string;
  score: number;
  unit: string;
  source: string;
}

export const benchmarks: BenchmarkSeed[] = [
  // CPU — Cinebench R23 Multi Core
  { partModel: "Ryzen 7 7800X3D", benchmark: "cinebench_r23_mt", score: 18300, unit: "points", source: "techpowerup" },
  { partModel: "Ryzen 5 7600X", benchmark: "cinebench_r23_mt", score: 15300, unit: "points", source: "techpowerup" },
  { partModel: "Ryzen 9 7950X", benchmark: "cinebench_r23_mt", score: 38000, unit: "points", source: "techpowerup" },
  { partModel: "Core i5-14600K", benchmark: "cinebench_r23_mt", score: 24500, unit: "points", source: "techpowerup" },
  { partModel: "Core i7-14700K", benchmark: "cinebench_r23_mt", score: 35000, unit: "points", source: "techpowerup" },
  { partModel: "Core i9-14900K", benchmark: "cinebench_r23_mt", score: 41000, unit: "points", source: "techpowerup" },
  // CPU — Geekbench 6 Single Core
  { partModel: "Ryzen 7 7800X3D", benchmark: "geekbench6_single", score: 2600, unit: "points", source: "techpowerup" },
  { partModel: "Ryzen 5 7600X", benchmark: "geekbench6_single", score: 2750, unit: "points", source: "techpowerup" },
  { partModel: "Ryzen 9 7950X", benchmark: "geekbench6_single", score: 2850, unit: "points", source: "techpowerup" },
  { partModel: "Core i5-14600K", benchmark: "geekbench6_single", score: 2800, unit: "points", source: "techpowerup" },
  { partModel: "Core i7-14700K", benchmark: "geekbench6_single", score: 2900, unit: "points", source: "techpowerup" },
  { partModel: "Core i9-14900K", benchmark: "geekbench6_single", score: 2950, unit: "points", source: "techpowerup" },
  // GPU — 3DMark Time Spy
  { partModel: "GeForce RTX 4090", benchmark: "3dmark_time_spy", score: 36200, unit: "points", source: "techpowerup" },
  { partModel: "GeForce RTX 4080 Super", benchmark: "3dmark_time_spy", score: 27500, unit: "points", source: "techpowerup" },
  { partModel: "GeForce RTX 4070 Ti Super", benchmark: "3dmark_time_spy", score: 21500, unit: "points", source: "techpowerup" },
  { partModel: "GeForce RTX 4060", benchmark: "3dmark_time_spy", score: 10500, unit: "points", source: "techpowerup" },
  { partModel: "Radeon RX 7900 XTX", benchmark: "3dmark_time_spy", score: 29500, unit: "points", source: "techpowerup" },
  { partModel: "Radeon RX 7800 XT", benchmark: "3dmark_time_spy", score: 18500, unit: "points", source: "techpowerup" },
  { partModel: "Radeon RX 7600", benchmark: "3dmark_time_spy", score: 10500, unit: "points", source: "techpowerup" },
  // GPU — Cyberpunk 2077 1440p FPS
  { partModel: "GeForce RTX 4090", benchmark: "cyberpunk_2077_1440p", score: 105, unit: "fps", source: "techpowerup" },
  { partModel: "GeForce RTX 4080 Super", benchmark: "cyberpunk_2077_1440p", score: 82, unit: "fps", source: "techpowerup" },
  { partModel: "GeForce RTX 4070 Ti Super", benchmark: "cyberpunk_2077_1440p", score: 65, unit: "fps", source: "techpowerup" },
  { partModel: "GeForce RTX 4060", benchmark: "cyberpunk_2077_1440p", score: 42, unit: "fps", source: "techpowerup" },
  { partModel: "Radeon RX 7900 XTX", benchmark: "cyberpunk_2077_1440p", score: 90, unit: "fps", source: "techpowerup" },
  { partModel: "Radeon RX 7800 XT", benchmark: "cyberpunk_2077_1440p", score: 60, unit: "fps", source: "techpowerup" },
  { partModel: "Radeon RX 7600", benchmark: "cyberpunk_2077_1440p", score: 38, unit: "fps", source: "techpowerup" },
];
