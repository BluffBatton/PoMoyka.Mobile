
export const CarType = {
  Hatchback: 0,
  Crossover: 1,
  SUV: 2
};

export const CarTypeNames = Object.keys(CarType).filter(key => isNaN(Number(key)));