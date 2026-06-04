import { CarModel } from './car';

export interface CarSelectionProps {
  unlockedCars: CarModel[];
  selectedCarId: string | null;
  onSelectCar: (carId: string) => void;
  playerBestScore: number;
}

export function getCarTypeIcon(type: CarModel['type']): string {
  switch (type) {
    case 'sports':
      return '🏎️';
    case 'muscle':
      return '💪';
    case 'sedan':
      return '🚗';
    case 'compact':
      return '🚙';
    case 'truck':
      return '🚛';
    default:
      return '🚗';
  }
}

export function getCarTypeColor(type: CarModel['type']): string {
  switch (type) {
    case 'sports':
      return 'from-orange-500 to-red-500';
    case 'muscle':
      return 'from-red-600 to-red-800';
    case 'sedan':
      return 'from-blue-500 to-blue-700';
    case 'compact':
      return 'from-yellow-500 to-yellow-600';
    case 'truck':
      return 'from-green-600 to-green-800';
    default:
      return 'from-gray-500 to-gray-700';
  }
}

export function formatStat(value: number, max: number = 25): string {
  const percentage = Math.min((value / max) * 100, 100);
  return `${Math.round(percentage)}%`;
}
