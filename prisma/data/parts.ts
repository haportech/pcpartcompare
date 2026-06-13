export interface PartSeed {
  type: string;
  brand: string;
  model: string;
  specs: string;
  imageUrl?: string;
}

const cpuSpecs = {
  "AMD Ryzen 7 7800X3D": JSON.stringify({
    cores: 8,
    threads: 16,
    baseClock: "4.2GHz",
    boostClock: "5.0GHz",
    tdp: "120W",
    socket: "AM5",
    cache: "104MB",
    lithography: "5nm",
  }),
  "AMD Ryzen 5 7600X": JSON.stringify({
    cores: 6,
    threads: 12,
    baseClock: "4.7GHz",
    boostClock: "5.3GHz",
    tdp: "105W",
    socket: "AM5",
    cache: "38MB",
    lithography: "5nm",
  }),
  "AMD Ryzen 9 7950X": JSON.stringify({
    cores: 16,
    threads: 32,
    baseClock: "4.5GHz",
    boostClock: "5.7GHz",
    tdp: "170W",
    socket: "AM5",
    cache: "80MB",
    lithography: "5nm",
  }),
  "Intel Core i5-14600K": JSON.stringify({
    cores: 14,
    threads: 20,
    baseClock: "3.5GHz",
    boostClock: "5.3GHz",
    tdp: "125W",
    socket: "LGA1700",
    cache: "24MB",
    lithography: "Intel 7",
  }),
  "Intel Core i7-14700K": JSON.stringify({
    cores: 20,
    threads: 28,
    baseClock: "3.4GHz",
    boostClock: "5.6GHz",
    tdp: "125W",
    socket: "LGA1700",
    cache: "33MB",
    lithography: "Intel 7",
  }),
  "Intel Core i9-14900K": JSON.stringify({
    cores: 24,
    threads: 32,
    baseClock: "3.2GHz",
    boostClock: "6.0GHz",
    tdp: "125W",
    socket: "LGA1700",
    cache: "36MB",
    lithography: "Intel 7",
  }),
};

const gpuSpecs = {
  "NVIDIA GeForce RTX 4090": JSON.stringify({
    vram: "24GB GDDR6X",
    cudaCores: 16384,
    boostClock: "2.52GHz",
    tdp: "450W",
    memoryBus: "384-bit",
    memoryBandwidth: "1008 GB/s",
  }),
  "NVIDIA GeForce RTX 4080 Super": JSON.stringify({
    vram: "16GB GDDR6X",
    cudaCores: 10240,
    boostClock: "2.55GHz",
    tdp: "320W",
    memoryBus: "256-bit",
    memoryBandwidth: "736 GB/s",
  }),
  "NVIDIA GeForce RTX 4070 Ti Super": JSON.stringify({
    vram: "16GB GDDR6X",
    cudaCores: 8448,
    boostClock: "2.61GHz",
    tdp: "285W",
    memoryBus: "256-bit",
    memoryBandwidth: "672 GB/s",
  }),
  "NVIDIA GeForce RTX 4060": JSON.stringify({
    vram: "8GB GDDR6",
    cudaCores: 3072,
    boostClock: "2.46GHz",
    tdp: "115W",
    memoryBus: "128-bit",
    memoryBandwidth: "272 GB/s",
  }),
  "AMD Radeon RX 7900 XTX": JSON.stringify({
    vram: "24GB GDDR6",
    cudaCores: 6144,
    boostClock: "2.5GHz",
    tdp: "355W",
    memoryBus: "384-bit",
    memoryBandwidth: "960 GB/s",
  }),
  "AMD Radeon RX 7800 XT": JSON.stringify({
    vram: "16GB GDDR6",
    cudaCores: 3840,
    boostClock: "2.43GHz",
    tdp: "263W",
    memoryBus: "256-bit",
    memoryBandwidth: "624 GB/s",
  }),
  "AMD Radeon RX 7600": JSON.stringify({
    vram: "8GB GDDR6",
    cudaCores: 2048,
    boostClock: "2.66GHz",
    tdp: "165W",
    memoryBus: "128-bit",
    memoryBandwidth: "288 GB/s",
  }),
};

export const parts: PartSeed[] = [
  // CPUs
  { type: "CPU", brand: "AMD", model: "Ryzen 7 7800X3D", specs: cpuSpecs["AMD Ryzen 7 7800X3D"] },
  { type: "CPU", brand: "AMD", model: "Ryzen 5 7600X", specs: cpuSpecs["AMD Ryzen 5 7600X"] },
  { type: "CPU", brand: "AMD", model: "Ryzen 9 7950X", specs: cpuSpecs["AMD Ryzen 9 7950X"] },
  { type: "CPU", brand: "Intel", model: "Core i5-14600K", specs: cpuSpecs["Intel Core i5-14600K"] },
  { type: "CPU", brand: "Intel", model: "Core i7-14700K", specs: cpuSpecs["Intel Core i7-14700K"] },
  { type: "CPU", brand: "Intel", model: "Core i9-14900K", specs: cpuSpecs["Intel Core i9-14900K"] },
  // GPUs
  { type: "GPU", brand: "NVIDIA", model: "GeForce RTX 4090", specs: gpuSpecs["NVIDIA GeForce RTX 4090"] },
  { type: "GPU", brand: "NVIDIA", model: "GeForce RTX 4080 Super", specs: gpuSpecs["NVIDIA GeForce RTX 4080 Super"] },
  { type: "GPU", brand: "NVIDIA", model: "GeForce RTX 4070 Ti Super", specs: gpuSpecs["NVIDIA GeForce RTX 4070 Ti Super"] },
  { type: "GPU", brand: "NVIDIA", model: "GeForce RTX 4060", specs: gpuSpecs["NVIDIA GeForce RTX 4060"] },
  { type: "GPU", brand: "AMD", model: "Radeon RX 7900 XTX", specs: gpuSpecs["AMD Radeon RX 7900 XTX"] },
  { type: "GPU", brand: "AMD", model: "Radeon RX 7800 XT", specs: gpuSpecs["AMD Radeon RX 7800 XT"] },
  { type: "GPU", brand: "AMD", model: "Radeon RX 7600", specs: gpuSpecs["AMD Radeon RX 7600"] },
];
