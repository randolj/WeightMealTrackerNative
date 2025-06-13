import React, { useState, useEffect } from 'react';
import { SafeAreaView, Text, StyleSheet, ScrollView, View } from 'react-native';
import axios from 'axios';
import { TamaguiProvider, YStack } from 'tamagui';
import config from './tamagui.config';
import { WeightEntry } from './src/components/WeightEntry';
import { MealEntry } from './src/components/MealEntry';
import { MealList } from './src/components/MealList';
import { MealEntry as MealEntryType, MealResponse, WeightEntry as WeightEntryType, DailyTotals } from './src/types';

const BASE_URL = 'http://192.168.1.201:8080';

export default function App() {
  const [todayWeight, setTodayWeight] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [meals, setMeals] = useState<MealEntryType[]>([]);
  const [totals, setTotals] = useState<DailyTotals>({
    protein: 0,
    carbs: 0,
    fat: 0,
    calories: 0,
  });

  useEffect(() => {
    checkTodayWeight();
    fetchTodayMeals();
  }, []);

  const checkTodayWeight = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await axios.get<WeightEntryType>(`${BASE_URL}/weight/today`);
      if (res.data && res.data.date === today) {
        setTodayWeight(res.data.weight);
      }
    } catch (err) {
      // If no weight entry found, that's fine - we'll show the weight entry screen
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTodayMeals = async () => {
    try {
      const res = await axios.get<MealResponse>(`${BASE_URL}/meals/today`);
      setMeals(res.data.meals || []);
      setTotals({
        protein: res.data.total_protein || 0,
        carbs: res.data.total_carbs || 0,
        fat: res.data.total_fat || 0,
        calories: res.data.total_calories || 0,
      });
    } catch (err) {
      setMeals([]);
      setTotals({ protein: 0, carbs: 0, fat: 0, calories: 0 });
    }
  };

  const handleWeightSubmit = async (weight: number) => {
    await axios.post(`${BASE_URL}/weight`, { weight });
    setTodayWeight(weight);
  };

  const handleMealSubmit = async (meal: MealEntryType) => {
    await axios.post(`${BASE_URL}/meals`, {
      name: meal.name,
      protein_per_serving: meal.protein,
      carbs_per_serving: meal.carbs,
      fat_per_serving: meal.fat,
      calories_per_serving: meal.calories,
      servings: meal.servings,
    });
    fetchTodayMeals();
  };

  if (isLoading) {
    return (
      <TamaguiProvider config={config}>
        <SafeAreaView style={styles.container}>
          <Text>Loading...</Text>
        </SafeAreaView>
      </TamaguiProvider>
    );
  }

  if (!todayWeight) {
    return <WeightEntry onSubmit={handleWeightSubmit} />;
  }

  return (
    <TamaguiProvider config={config}>
      <SafeAreaView style={styles.container}>
        <ScrollView>
          {/* Today's Weight Display */}
          <YStack space="$2" padding="$4" backgroundColor="$background">
            <Text style={styles.sectionTitle}>Today's Weight</Text>
            <Text style={styles.weightDisplay}>{todayWeight} lbs</Text>
          </YStack>

          <View style={styles.divider} />

          {/* Meal Entry Form */}
          <MealEntry onSubmit={handleMealSubmit} />

          <View style={styles.divider} />

          {/* Meal List and Totals */}
          <MealList meals={meals} totals={totals} />
        </ScrollView>
      </SafeAreaView>
    </TamaguiProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  sectionTitle: { 
    fontWeight: 'bold', 
    fontSize: 20, 
    marginBottom: 8 
  },
  weightDisplay: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    color: '#2e7d32'
  },
  divider: { 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee', 
    marginVertical: 8 
  },
});
