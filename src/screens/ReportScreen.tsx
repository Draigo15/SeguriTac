import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  ScrollView,
} from 'react-native';
import AnimatedScreen from '../components/AnimatedScreen';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import AnimatedButton from '../components/AnimatedButton';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';

import { ActivityIndicator } from 'react-native-paper';

const ReportScreen = () => {
  const navigation = useNavigation();
  const [incidentType, setIncidentType] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateFormatted, setDateFormatted] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    const getInitialData = async () => {
      const currentDate = new Date().toLocaleString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      setDateFormatted(currentDate);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Toast.show({
          type: 'error',
          text1: 'Permiso de ubicación denegado',
        });
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    };

    getInitialData();
  }, []);

  const handleImagePick = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({
        type: 'error',
        text1: 'Permiso denegado',
        text2: 'Se necesita acceso a la cámara.',
      });
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!incidentType || !description) {
      Toast.show({
        type: 'error',
        text1: 'Campos incompletos',
        text2: 'Por favor completa todos los campos',
      });
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, 'reports'), {
        incidentType,
        description,
        imageUri: image || null,
        email: auth.currentUser?.email || 'Anónimo',
        createdAt: serverTimestamp(),
        dateFormatted,
        location,
        status: 'Pendiente',
      });

      setLoading(false);
      setIncidentType('');
      setDescription('');
      setImage(null);
      setDateFormatted('');
      setLocation(null);

      Toast.show({
        type: 'success',
        text1: '¡Reporte enviado!',
        text2: 'Gracias por tu reporte',
        onHide: () => navigation.goBack(),
      });
    } catch (error: any) {
      console.error('Error al enviar reporte:', error);
      setLoading(false);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'No se pudo enviar el reporte',
      });
    }
  };

 return (
  <AnimatedScreen animationType="slideVertical" duration={800}>
  <LinearGradient colors={['#E3F2FD', '#BBDEFB']} style={{ flex: 1 }}>
    <ScrollView contentContainerStyle={styles.container}>
      <Animated.View entering={FadeInDown.duration(800)}>
        <Animated.Text style={styles.title}>Nuevo Reporte</Animated.Text>

        <Animated.View 
          entering={FadeInDown.delay(100).duration(500)}
          style={styles.box}
        >
          <Animated.Text style={styles.labelLight}>📅 Fecha:</Animated.Text>
          <Animated.Text style={styles.value}>{dateFormatted}</Animated.Text>
        </Animated.View>

        {location && (
          <Animated.View 
            entering={FadeInDown.delay(200).duration(500)}
            style={styles.box}
          >
            <Animated.Text style={styles.labelLight}>📍 Ubicación:</Animated.Text>
            <Animated.Text style={styles.value}>
              Lat: {location.latitude.toFixed(4)}, Lng: {location.longitude.toFixed(4)}
            </Animated.Text>
          </Animated.View>
        )}

        <Animated.Text 
          entering={FadeInDown.delay(300).duration(500)}
          style={styles.label}
        >
          Tipo de Incidente
        </Animated.Text>
        <Animated.View 
          entering={FadeInDown.delay(400).duration(500)}
          style={styles.pickerContainer}
        >
          <Picker
            selectedValue={incidentType}
            onValueChange={(itemValue) => setIncidentType(itemValue)}
            dropdownIconColor="#000"
          >
            <Picker.Item label="Selecciona un tipo..." value="" />
            <Picker.Item label="Robo" value="Robo" />
            <Picker.Item label="Secuestro" value="Secuestro" />
            <Picker.Item label="Asalto" value="Asalto" />
            <Picker.Item label="Violencia" value="Violencia" />
            <Picker.Item label="Accidente" value="Accidente" />
            <Picker.Item label="Otro" value="Otro" />
          </Picker>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500).duration(500)}>
          <TextInput
            style={[styles.input, { height: 100 }]}
            placeholder="Descripción detallada"
            value={description}
            onChangeText={setDescription}
            multiline
            placeholderTextColor="#666"
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(600).duration(500)}>
          <AnimatedButton 
            style={styles.imageButton} 
            onPress={handleImagePick}
            animationType="scale"
            iconName="camera"
          >
            <Animated.Text style={styles.imageButtonText}>Tomar o seleccionar imagen</Animated.Text>
          </AnimatedButton>
        </Animated.View>

        {image && (
          <Animated.View entering={FadeInUp.delay(700).duration(500)}>
            <Animated.Image source={{ uri: image }} style={styles.imagePreview} />
          </Animated.View>
        )}

       <Animated.View entering={FadeInUp.delay(800).duration(500)}>
         <AnimatedButton
            style={[styles.sendButton, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
            animationType="bounce"
            iconName="send"
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Animated.Text style={styles.sendButtonText}>Enviar Reporte</Animated.Text>
            )}
          </AnimatedButton>
       </Animated.View>
      </Animated.View>
    </ScrollView>
  </LinearGradient>
  </AnimatedScreen>
);
};

export default ReportScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0D47A1',
    marginBottom: 20,
    textAlign: 'center',
  },
  box: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  labelLight: {
    fontSize: 14,
    color: '#444',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  label: {
    fontSize: 16,
    color: '#0D47A1',
    marginBottom: 5,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    overflow: 'hidden',
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    color: '#000',
  },
  imageButton: {
    backgroundColor: '#1565C0',
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 16,
    alignItems: 'center',
  },
  imageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imagePreview: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: 20,
  },
  loading: {
    color: '#0D47A1',
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#388E3C',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
