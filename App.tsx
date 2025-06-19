import React, { useState, useEffect } from 'react';
import { SafeAreaView, Text, StyleSheet, ScrollView, View, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { TamaguiProvider, YStack } from 'tamagui';
import config from './tamagui.config';
import { WeightEntry } from './src/components/WeightEntry';
import { MealEntry } from './src/components/MealEntry';
import { MealList } from './src/components/MealList';
import { NutritionLabelUpload } from './src/components/NutritionLabelUpload';
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
  const [entryMode, setEntryMode] = useState<'manual' | 'scan'>('manual');

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
    try {
      console.log('Submitting weight:', weight, 'to URL:', `${BASE_URL}/weight`);
      const response = await axios.post(`${BASE_URL}/weight`, { weight });
      console.log('Weight submission response:', response.data);
      setTodayWeight(weight);
    } catch (error: any) {
      console.error('Weight submission error:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
      } else if (error.request) {
        console.error('Network error - no response received');
      } else {
        console.error('Error setting up request:', error.message);
      }
      throw error; // Re-throw to let the component handle it
    }
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

          {/* Meal Entry Section */}
          <YStack space="$3" padding="$4" backgroundColor="$background">
            <Text style={styles.sectionTitle}>Add Meal</Text>
            
            {/* Entry Mode Toggle */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  entryMode === 'manual' && styles.toggleButtonActive
                ]}
                onPress={() => setEntryMode('manual')}
              >
                <Text style={[
                  styles.toggleButtonText,
                  entryMode === 'manual' && styles.toggleButtonTextActive
                ]}>
                  Manual Entry
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  entryMode === 'scan' && styles.toggleButtonActive
                ]}
                onPress={() => setEntryMode('scan')}
              >
                <Text style={[
                  styles.toggleButtonText,
                  entryMode === 'scan' && styles.toggleButtonTextActive
                ]}>
                  Scan Label
                </Text>
              </TouchableOpacity>
            </View>

            {/* Conditional Component Rendering */}
            {entryMode === 'manual' ? (
              <MealEntry onSubmit={handleMealSubmit} />
            ) : (
              <NutritionLabelUpload onSubmit={handleMealSubmit} baseUrl={BASE_URL} />
            )}
          </YStack>

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
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  toggleButtonActive: {
    backgroundColor: '#2e7d32',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  toggleButtonTextActive: {
    color: 'white',
  },
});
