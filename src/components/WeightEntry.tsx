import React, { useState } from 'react';
import { SafeAreaView, Text, StyleSheet } from 'react-native';
import { Button, Input, YStack, TamaguiProvider } from 'tamagui';
import config from '../../tamagui.config';

type WeightEntryProps = {
  onSubmit: (weight: number) => Promise<void>;
};

export const WeightEntry: React.FC<WeightEntryProps> = ({ onSubmit }) => {
  const [weight, setWeight] = useState<string>('');
  const [status, setStatus] = useState<string>('');

  const handleSubmit = async () => {
    const w = parseFloat(weight);
    if (isNaN(w)) {
      setStatus('Please enter a valid weight.');
      return;
    }
    try {
      await onSubmit(w);
      setStatus('Weight submitted!');
      setWeight('');
    } catch (err) {
      setStatus('Failed to submit weight.');
    }
  };

  return (
    <TamaguiProvider config={config}>
      <SafeAreaView style={styles.container}>
        <YStack space="$4" padding="$4" flex={1} justifyContent="center">
          <Text style={styles.title}>Enter Today's Weight</Text>
          <Input
            size="$4"
            placeholder="Weight"
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
          />
          <Button
            size="$4"
            theme="active"
            onPress={handleSubmit}
            disabled={!weight.trim()}
          >
            Submit Weight
          </Button>
          {status ? (
            <Text style={[styles.status, { textAlign: 'center' }]}>{status}</Text>
          ) : null}
        </YStack>
      </SafeAreaView>
    </TamaguiProvider>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: { 
    fontWeight: 'bold', 
    fontSize: 20, 
    marginBottom: 8,
    textAlign: 'center'
  },
  status: { 
    color: '#2e7d32', 
    marginVertical: 4 
  },
}); 