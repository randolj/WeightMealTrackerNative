import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { YStack, Button, XStack } from 'tamagui';
import { MealEntry as MealEntryType } from '../types';

interface NutritionLabelUploadProps {
  onSubmit: (meal: MealEntryType) => void;
  baseUrl: string;
}

export const NutritionLabelUpload: React.FC<NutritionLabelUploadProps> = ({ onSubmit, baseUrl }) => {
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const uploadImage = async (uri: string) => {
    setIsLoading(true);
    try {
      console.log('Starting upload for URI:', uri);
      
      // For React Native, we need to handle the URI differently
      // Create form data with the image file
      const formData = new FormData();
      
      // Extract filename from URI
      const filename = uri.split('/').pop() || 'image.jpg';
      
      // For React Native, we need to append the file with proper structure
      formData.append('image', {
        uri: uri,
        type: 'image/jpeg',
        name: filename,
      } as any);

      console.log('FormData created with filename:', filename);

      // Upload to backend
      const result = await axios.post(`${baseUrl}/nutrition-label`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 second timeout
      });

      console.log('Upload response:', result.data);

      // Convert backend response to frontend format
      const meal: MealEntryType = {
        name: result.data.name,
        protein: result.data.protein_per_serving,
        carbs: result.data.carbs_per_serving,
        fat: result.data.fat_per_serving,
        calories: result.data.calories_per_serving,
        servings: result.data.servings,
      };

      onSubmit(meal);
      Alert.alert('Success', 'Nutrition label parsed successfully!');
    } catch (error: any) {
      console.error('Upload error:', error);
      let errorMessage = 'Failed to parse nutrition label. Please try again or enter manually.';
      
      if (error.response) {
        if (error.response.status === 400) {
          errorMessage = error.response.data?.detail || 'Invalid image format or empty image. Please try again.';
        } else if (error.response.status === 500) {
          errorMessage = 'Failed to process image. Please ensure the image is clear and contains readable nutrition information.';
        } else {
          errorMessage = `Server error: ${error.response.status} - ${error.response.data?.detail || 'Unknown error'}`;
        }
      } else if (error.request) {
        errorMessage = 'Network error: Unable to connect to server. Please check your connection.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <YStack space="$3" padding="$4" backgroundColor="$background">
      <Text style={styles.description}>
        Take a photo or select an image of a nutrition label to automatically parse the nutrition information.
      </Text>
      
      <XStack space="$2" justifyContent="center">
        <Button
          onPress={takePhoto}
          disabled={isLoading}
          backgroundColor="$blue10"
          color="white"
          flex={1}
        >
          {isLoading ? 'Processing...' : 'Take Photo'}
        </Button>
        
        <Button
          onPress={pickImage}
          disabled={isLoading}
          backgroundColor="$green10"
          color="white"
          flex={1}
        >
          {isLoading ? 'Processing...' : 'Choose Image'}
        </Button>
      </XStack>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Parsing nutrition label...</Text>
        </View>
      )}
    </YStack>
  );
};

const styles = StyleSheet.create({
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
}); 