import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, TextInput, Button, FlatList, StyleSheet, ScrollView } from 'react-native';
import axios from 'axios';

const BASE_URL = 'http://192.168.1.79:8080'; // Change to your LAN IP if testing on a device

// Types
type MealEntry = {
  name: string;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
  servings: number;
};

type MealResponse = {
  meals: MealEntry[];
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_calories: number;
};

export default function App() {
  // Weight
  const [weight, setWeight] = useState<string>('');
  const [weightStatus, setWeightStatus] = useState<string>('');

  // Meal
  const [mealName, setMealName] = useState<string>('');
  const [protein, setProtein] = useState<string>('');
  const [carbs, setCarbs] = useState<string>('');
  const [fat, setFat] = useState<string>('');
  const [calories, setCalories] = useState<string>('');
  const [servings, setServings] = useState<string>('');
  const [mealStatus, setMealStatus] = useState<string>('');

  // Meals/totals
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [totals, setTotals] = useState<{ protein: number; carbs: number; fat: number; calories: number }>({
    protein: 0,
    carbs: 0,
    fat: 0,
    calories: 0,
  });

  useEffect(() => {
    fetchTodayMeals();
  }, []);

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

  const submitWeight = async () => {
    const w = parseFloat(weight);
    if (isNaN(w)) {
      setWeightStatus('Please enter a valid weight.');
      return;
    }
    try {
      await axios.post(`${BASE_URL}/weight`, { weight: w });
      setWeightStatus('Weight submitted!');
      setWeight('');
    } catch (err) {
      setWeightStatus('Failed to submit weight.');
    }
  };

  const submitMeal = async () => {
    if (
      !mealName ||
      isNaN(parseFloat(protein)) ||
      isNaN(parseFloat(carbs)) ||
      isNaN(parseFloat(fat)) ||
      isNaN(parseFloat(calories)) ||
      isNaN(parseFloat(servings))
    ) {
      setMealStatus('Please fill all fields with valid numbers.');
      return;
    }
    const meal = {
      name: mealName,
      protein_per_serving: parseFloat(protein),
      carbs_per_serving: parseFloat(carbs),
      fat_per_serving: parseFloat(fat),
      calories_per_serving: parseFloat(calories),
      servings: parseFloat(servings),
    };
    try {
      await axios.post(`${BASE_URL}/meals`, meal);
      setMealStatus('Meal logged!');
      setMealName('');
      setProtein('');
      setCarbs('');
      setFat('');
      setCalories('');
      setServings('');
      fetchTodayMeals();
    } catch (err) {
      setMealStatus('Failed to log meal.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Weight entry */}
        <Text style={styles.sectionTitle}>Enter Today's Weight</Text>
        <View style={styles.row}>
          <TextInput
            style={styles.input}
            placeholder="Weight"
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
          />
          <Button title="Submit" onPress={submitWeight} />
        </View>
        <Text style={styles.status}>{weightStatus}</Text>

        <View style={styles.divider} />

        {/* Meal entry */}
        <Text style={styles.sectionTitle}>Log a Meal</Text>
        <TextInput style={styles.input} placeholder="Meal Name" value={mealName} onChangeText={setMealName} />
        <TextInput style={styles.input} placeholder="Protein per Serving" value={protein} onChangeText={setProtein} keyboardType="numeric" />
        <TextInput style={styles.input} placeholder="Carbs per Serving" value={carbs} onChangeText={setCarbs} keyboardType="numeric" />
        <TextInput style={styles.input} placeholder="Fat per Serving" value={fat} onChangeText={setFat} keyboardType="numeric" />
        <TextInput style={styles.input} placeholder="Calories per Serving" value={calories} onChangeText={setCalories} keyboardType="numeric" />
        <TextInput style={styles.input} placeholder="Servings" value={servings} onChangeText={setServings} keyboardType="numeric" />
        <Button title="Add Meal" onPress={submitMeal} />
        <Text style={styles.status}>{mealStatus}</Text>

        <View style={styles.divider} />

        {/* Meals today */}
        <Text style={styles.sectionTitle}>Today's Meals</Text>
        {meals.length === 0 ? (
          <Text style={{ color: 'gray' }}>No meals logged today.</Text>
        ) : (
          <FlatList
            data={meals}
            keyExtractor={(_, idx) => idx.toString()}
            renderItem={({ item }) => (
              <View style={styles.mealItem}>
                <Text style={styles.mealTitle}>{item.name}</Text>
                <Text style={styles.mealMacros}>
                  Protein: {item.protein}, Carbs: {item.carbs}, Fat: {item.fat}, Calories: {item.calories}, Servings: {item.servings}
                </Text>
              </View>
            )}
          />
        )}
        <View style={styles.divider} />
        <Text style={styles.totals}>
          Totals – Protein: {totals.protein}, Carbs: {totals.carbs}, Fat: {totals.fat}, Calories: {totals.calories}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  sectionTitle: { fontWeight: 'bold', fontSize: 18, marginTop: 18 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 8, marginVertical: 5, borderRadius: 6 },
  row: { flexDirection: 'row', alignItems: 'center' },
  status: { color: 'green', marginVertical: 4 },
  divider: { borderBottomWidth: 1, borderBottomColor: '#eee', marginVertical: 14 },
  mealItem: { marginVertical: 5, padding: 6, backgroundColor: '#f5f5f5', borderRadius: 6 },
  mealTitle: { fontWeight: '600' },
  mealMacros: { fontSize: 12, color: '#333' },
  totals: { fontWeight: 'bold', fontSize: 16, marginTop: 12 }
});
