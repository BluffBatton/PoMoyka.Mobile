// src/constants/CarTypes.tsx
export enum CarType {
  Hatchback = 0,
  CrossOver = 1,
  SUV = 2,
}

// Получаем массив имен: ["Hatchback", "Crossover", "SUV"]
export const CarTypeNames = Object.keys(CarType).filter(key => isNaN(Number(key)));

// Функция для получения имени по числовому значению
export function getCarTypeName(value: CarType): string | undefined {
  return CarTypeNames.find(name => CarType[name as keyof typeof CarType] === value);
}

// Функция для получения числового значения по имени (может пригодиться)
export function getCarTypeValue(name: string): CarType | undefined {
    return CarType[name as keyof typeof CarType];
}