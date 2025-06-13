export type MealEntry = {
  name: string;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
  servings: number;
};

export type MealResponse = {
  meals: MealEntry[];
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_calories: number;
};

export type WeightEntry = {
  weight: number;
  date: string;
};

export type DailyTotals = {
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
}; 