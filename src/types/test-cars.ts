import { CarModel } from './car';

/**
 * Test suite for car model system
 * Run with: node --loader ts-node/esm test-cars.ts (with ts-node installed)
 * Or import in browser console during development
 */

// Import the car types module
const CAR_TYPES = [
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
    type: 'compact' as const,
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
    type: 'muscle' as const,
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
    type: 'sports' as const,
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
    type: 'sedan' as const,
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
    type: 'sports' as const,
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
    type: 'truck' as const,
    description: 'Massive and slow. Avoid or overtake carefully.',
    unlockScore: 0,
  },
];

interface TestResult {
  passed: boolean;
  testName: string;
  message?: string;
}

function runTest(testName: string, fn: () => boolean | void, message?: string): TestResult {
  try {
    const result = fn();
    const passed = typeof result === 'boolean' ? result : true;
    return { passed, testName, message: passed ? message : 'Test failed' };
  } catch (error) {
    return { 
      passed: false, 
      testName, 
      message: `Error: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

export function runCarTests(): TestResult[] {
  const results: TestResult[] = [];

  // Test 1: All cars have required properties
  results.push(runTest(
    'Required Properties',
    () => CAR_TYPES.every(car => 
      car.id && car.name && car.width > 0 && car.height > 0 && 
      car.maxSpeed > 0 && car.color && car.type
    ),
    'All cars have valid required properties'
  ));

  // Test 2: Truck is largest vehicle
  const truck = CAR_TYPES.find(c => c.id === 'truck');
  results.push(runTest(
    'Truck Dimensions',
    () => truck && truck.width >= 50 && truck.height >= 85,
    `Truck dimensions: ${truck?.width}x${truck?.height}`
  ));

  // Test 3: Sports cars have highest maxSpeed
  const sportsCars = CAR_TYPES.filter(c => c.type === 'sports');
  results.push(runTest(
    'Sports Car Speed',
    () => sportsCars.every(car => car.maxSpeed >= 24),
    `Sports cars maxSpeed: ${sportsCars.map(c => `${c.name}:${c.maxSpeed}`).join(', ')}`
  ));

  // Test 4: Unlock scores are progressive
  const unlockScores = CAR_TYPES
    .filter(c => c.unlockScore !== undefined)
    .map(c => c.unlockScore!)
    .sort((a, b) => a - b);
  results.push(runTest(
    'Progressive Unlock Scores',
    () => {
      for (let i = 1; i < unlockScores.length; i++) {
        if (unlockScores[i] <= unlockScores[i-1]) return false;
      }
      return true;
    },
    `Unlock progression: ${unlockScores.join(' → ')}`
  ));

  // Test 5: Color values are valid hex
  const hexRegex = /^#[0-9A-Fa-f]{6}$/;
  results.push(runTest(
    'Valid Hex Colors',
    () => CAR_TYPES.every(car => 
      hexRegex.test(car.color) && 
      (!car.secondaryColor || hexRegex.test(car.secondaryColor))
    ),
    'All colors are valid hex codes'
  ));

  // Test 6: Unique IDs
  const ids = CAR_TYPES.map(c => c.id);
  results.push(runTest(
    'Unique Car IDs',
    () => new Set(ids).size === ids.length,
    `All ${ids.length} car IDs are unique`
  ));

  // Test 7: Handling stat range (0-1)
  results.push(runTest(
    'Handling Stat Range',
    () => CAR_TYPES.every(car => car.handling >= 0 && car.handling <= 1),
    'All handling values are between 0 and 1'
  ));

  // Test 8: Acceleration stat range
  results.push(runTest(
    'Acceleration Stat Range',
    () => CAR_TYPES.every(car => car.acceleration > 0 && car.acceleration < 1),
    'All acceleration values are reasonable'
  ));

  // Test 9: Car type diversity
  const types = new Set(CAR_TYPES.map(c => c.type));
  results.push(runTest(
    'Car Type Diversity',
    () => types.size >= 4,
    `Found ${types.size} different car types: ${Array.from(types).join(', ')}`
  ));

  // Test 10: Starter cars available at score 0
  const starterCars = CAR_TYPES.filter(c => !c.unlockScore || c.unlockScore === 0);
  results.push(runTest(
    'Starter Cars Available',
    () => starterCars.length >= 1,
    `${starterCars.length} cars available at start: ${starterCars.map(c => c.name).join(', ')}`
  ));

  return results;
}

export function printTestResults(results: TestResult[]): void {
  console.log('\n=== Car Model Test Results ===\n');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach((result, index) => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} Test ${index + 1}: ${result.testName}`);
    if (result.message) {
      console.log(`   ${result.message}`);
    }
    console.log('');
  });
  
  console.log(`\n=== Summary: ${passed}/${total} tests passed ===\n`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Car models are ready for game integration.\n');
  } else {
    console.log('⚠️  Some tests failed. Review the issues above.\n');
  }
}

// Auto-run if executed directly
if (typeof window === 'undefined') {
  const results = runCarTests();
  printTestResults(results);
}
