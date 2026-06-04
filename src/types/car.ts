// Car model definitions and types

export interface CarModel {
  id: string;
  name: string;
  width: number;
  height: number;
  maxSpeed: number;
  acceleration: number;
  handling: number;
  color: string;
  secondaryColor?: string;
  type: 'sports' | 'sedan' | 'truck' | 'muscle' | 'compact';
  description: string;
  unlockScore?: number; // Optional: score needed to unlock
}

export interface EnemyCar {
  x: number;
  y: number;
  speed: number;
  model: CarModel;
  lane: number;
}

export const CAR_TYPES: CarModel[] = [
  {
    id: 'civic',
    name: 'Street Runner',
    width: 38,
    height: 68,
    maxSpeed: 18,
    acceleration: 0.12,
    handling: 0.7,
    color: '#eab308',
    secondaryColor: '#ca8a04',
    type: 'compact',
    description: 'Agile and reliable. Perfect for beginners.',
    unlockScore: 0,
  },
  {
    id: 'mustang',
    name: 'Thunder Bolt',
    width: 42,
    height: 72,
    maxSpeed: 22,
    acceleration: 0.15,
    handling: 0.5,
    color: '#ef4444',
    secondaryColor: '#b91c1c',
    type: 'muscle',
    description: 'Raw power and classic style. Fast acceleration.',
    unlockScore: 500,
  },
  {
    id: 'porsche',
    name: 'Velocity GT',
    width: 44,
    height: 66,
    maxSpeed: 25,
    acceleration: 0.18,
    handling: 0.8,
    color: '#f97316',
    secondaryColor: '#ea580c',
    type: 'sports',
    description: 'Precision engineering. Top speed champion.',
    unlockScore: 1500,
  },
  {
    id: 'bmw',
    name: 'Phantom Elite',
    width: 43,
    height: 70,
    maxSpeed: 23,
    acceleration: 0.14,
    handling: 0.75,
    color: '#3b82f6',
    secondaryColor: '#1d4ed8',
    type: 'sedan',
    description: 'Luxury meets performance. Balanced handling.',
    unlockScore: 3000,
  },
  {
    id: 'cyber',
    name: 'Neon Rider',
    width: 46,
    height: 64,
    maxSpeed: 24,
    acceleration: 0.16,
    handling: 0.85,
    color: '#8b5cf6',
    secondaryColor: '#7c3aed',
    type: 'sports',
    description: 'Futuristic design with unmatched agility.',
    unlockScore: 5000,
  },
  {
    id: 'truck',
    name: 'Road Boss',
    width: 50,
    height: 85,
    maxSpeed: 14,
    acceleration: 0.08,
    handling: 0.35,
    color: '#10b981',
    secondaryColor: '#047857',
    type: 'truck',
    description: 'Massive and slow. Avoid or overtake carefully.',
    unlockScore: 0, // Always available as enemy
  },
];

export function getCarModel(id: string): CarModel | undefined {
  return CAR_TYPES.find(car => car.id === id);
}

export function getUnlockedCars(playerScore: number): CarModel[] {
  return CAR_TYPES.filter(car => !car.unlockScore || playerScore >= car.unlockScore);
}

export function getRandomEnemyCar(excludeTypes?: string[]): CarModel {
  const availableTypes = CAR_TYPES.filter(
    car => car.type !== 'truck' && (!excludeTypes || !excludeTypes.includes(car.id))
  );
  
  // Weight by commonality (trucks less common, sports cars more common at higher scores)
  const weights = availableTypes.map(car => {
    if (car.type === 'sports') return 3;
    if (car.type === 'muscle') return 2;
    if (car.type === 'sedan') return 2;
    if (car.type === 'compact') return 2;
    return 1;
  });
  
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < availableTypes.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return availableTypes[i];
    }
  }
  
  return availableTypes[availableTypes.length - 1];
}

export function maybeSpawnTruck(): boolean {
  // 15% chance to spawn a truck
  return Math.random() < 0.15;
}
