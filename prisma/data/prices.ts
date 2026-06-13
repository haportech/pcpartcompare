export interface PriceSeed {
  partModel: string;
  retailer: string;
  amount: number;
  url?: string;
}

export const prices: PriceSeed[] = [
  // CPU prices
  { partModel: "Ryzen 7 7800X3D", retailer: "manual", amount: 449.99 },
  { partModel: "Ryzen 5 7600X", retailer: "manual", amount: 229.99 },
  { partModel: "Ryzen 9 7950X", retailer: "manual", amount: 699.99 },
  { partModel: "Core i5-14600K", retailer: "manual", amount: 319.99 },
  { partModel: "Core i7-14700K", retailer: "manual", amount: 409.99 },
  { partModel: "Core i9-14900K", retailer: "manual", amount: 589.99 },
  // GPU prices
  { partModel: "GeForce RTX 4090", retailer: "manual", amount: 1799.99 },
  { partModel: "GeForce RTX 4080 Super", retailer: "manual", amount: 999.99 },
  { partModel: "GeForce RTX 4070 Ti Super", retailer: "manual", amount: 799.99 },
  { partModel: "GeForce RTX 4060", retailer: "manual", amount: 299.99 },
  { partModel: "Radeon RX 7900 XTX", retailer: "manual", amount: 949.99 },
  { partModel: "Radeon RX 7800 XT", retailer: "manual", amount: 499.99 },
  { partModel: "Radeon RX 7600", retailer: "manual", amount: 269.99 },
];
