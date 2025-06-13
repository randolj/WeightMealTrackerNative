import React, { useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { Button, Input, YStack } from 'tamagui';

type MealEntryProps = {
  onSubmit: (meal: {
    name: string;
    protein: number;
    carbs: number;
    fat: number;
    calories: number;
    servings: number;
  }) => Promise<void>;
};

export const MealEntry: React.FC<MealEntryProps> = ({ onSubmit }) => {
  const [mealName, setMealName] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [calories, setCalories] = useState('');
  const [servings, setServings] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async () => {
    if (
      !mealName ||
      isNaN(parseFloat(protein)) ||
      isNaN(parseFloat(carbs)) ||
      isNaN(parseFloat(fat)) ||
      isNaN(parseFloat(calories)) ||
      isNaN(parseFloat(servings))
    ) {
      setStatus('Please fill all fields with valid numbers.');
      return;
    }

    try {
      await onSubmit({
        name: mealName,
        protein: parseFloat(protein),
        carbs: parseFloat(carbs),
        fat: parseFloat(fat),
        calories: parseFloat(calories),
        servings: parseFloat(servings),
      });
      setStatus('Meal logged!');
      // Clear form
      setMealName('');
      setProtein('');
      setCarbs('');
      setFat('');
      setCalories('');
      setServings('');
    } catch (err) {
      setStatus('Failed to log meal.');
    }
  };

  return (
    <YStack space="$4" padding="$4">
      <Text style={styles.title}>Log a Meal</Text>
      <Input
        size="$4"
        placeholder="Meal Name"
        value={mealName}
        onChangeText={setMealName}
      />
      <Input
        size="$4"
        placeholder="Protein per Serving"
        value={protein}
        onChangeText={setProtein}
        keyboardType="numeric"
      />
      <Input
        size="$4"
        placeholder="Carbs per Serving"
        value={carbs}
        onChangeText={setCarbs}
        keyboardType="numeric"
      />
      <Input
        size="$4"
        placeholder="Fat per Serving"
        value={fat}
        onChangeText={setFat}
        keyboardType="numeric"
      />
      <Input
        size="$4"
        placeholder="Calories per Serving"
        value={calories}
        onChangeText={setCalories}
        keyboardType="numeric"
      />
      <Input
        size="$4"
        placeholder="Servings"
        value={servings}
        onChangeText={setServings}
        keyboardType="numeric"
      />
      <Button
        size="$4"
        theme="active"
        onPress={handleSubmit}
        disabled={!mealName.trim() || !protein.trim() || !carbs.trim() || !fat.trim() || !calories.trim() || !servings.trim()}
      >
        Add Meal
      </Button>
      {status ? (
        <Text style={[styles.status, { textAlign: 'center' }]}>{status}</Text>
      ) : null}
    </YStack>
  );
};

const styles = StyleSheet.create({
  title: { 
    fontWeight: 'bold', 
    fontSize: 20, 
    marginBottom: 8 
  },
  status: { 
    color: '#2e7d32', 
    marginVertical: 4 
  },
}); 