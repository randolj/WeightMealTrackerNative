import React from 'react';
import { Text, StyleSheet, FlatList } from 'react-native';
import { YStack } from 'tamagui';
import { MealEntry, DailyTotals } from '../types';

type MealListProps = {
  meals: MealEntry[];
  totals: DailyTotals;
};

export const MealList: React.FC<MealListProps> = ({ meals, totals }) => {
  return (
    <YStack space="$4" padding="$4">
      <Text style={styles.title}>Today's Meals</Text>
      {meals.length === 0 ? (
        <Text style={styles.emptyText}>No meals logged today.</Text>
      ) : (
        <FlatList
          data={meals}
          keyExtractor={(_, idx) => idx.toString()}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <YStack space="$2" padding="$2" backgroundColor="$background" borderRadius="$4">
              <Text style={styles.mealTitle}>{item.name}</Text>
              <Text style={styles.mealMacros}>
                Protein: {item.protein}g, Carbs: {item.carbs}g, Fat: {item.fat}g
              </Text>
              <Text style={styles.mealMacros}>
                Calories: {item.calories}, Servings: {item.servings}
              </Text>
            </YStack>
          )}
        />
      )}

      <YStack space="$2" padding="$4">
        <Text style={styles.title}>Daily Totals</Text>
        <Text style={styles.totals}>
          Protein: {totals.protein}g • Carbs: {totals.carbs}g • Fat: {totals.fat}g
        </Text>
        <Text style={styles.totals}>
          Calories: {totals.calories}
        </Text>
      </YStack>
    </YStack>
  );
};

const styles = StyleSheet.create({
  title: { 
    fontWeight: 'bold', 
    fontSize: 20, 
    marginBottom: 8 
  },
  emptyText: { 
    color: 'gray', 
    textAlign: 'center' 
  },
  mealTitle: { 
    fontWeight: '600',
    fontSize: 16
  },
  mealMacros: { 
    fontSize: 14, 
    color: '#666' 
  },
  totals: { 
    fontWeight: '600', 
    fontSize: 16,
    textAlign: 'center'
  }
}); 