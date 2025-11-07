// src/constants/CarTypes.tsx
export enum CarType {
  Hatchback = 0,
  CrossOver = 1,
  SUV = 2,
}

export const CarTypeNames = Object.keys(CarType).filter(key => isNaN(Number(key)));

export function getCarTypeName(value: CarType): string | undefined {
  return CarTypeNames.find(name => CarType[name as keyof typeof CarType] === value);
}

export function getCarTypeValue(name: string): CarType | undefined {
    return CarType[name as keyof typeof CarType];
}

export const carTypeOptions = ["hatchback", "crossOver", "suv"];