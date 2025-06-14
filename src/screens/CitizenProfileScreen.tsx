import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { auth, db } from '../services/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Toast from 'react-native-toast-message';

const CitizenProfileScreen = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      try {
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFirstName(data.firstName || '');
          setLastName(data.lastName || '');
        }
      } catch (error) {
        console.error('Error al cargar perfil:', error);
        Toast.show({
          type: 'error',
          text1: 'Error al cargar perfil',
        });
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    setLoading(true);
    try {
      const docRef = doc(db, 'users', currentUser.uid);
      await updateDoc(docRef, {
        firstName,
        lastName,
      });
      Toast.show({
        type: 'success',
        text1: 'Perfil actualizado con éxito',
      });
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      Toast.show({
        type: 'error',
        text1: 'Error al guardar cambios',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Editar Perfil</Text>

      <Text style={styles.label}>Nombres</Text>
      <View style={styles.inputWrapper}>
        <Icon name="account" size={20} color="#000" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Nombres"
          placeholderTextColor="#000"
        />
      </View>

      <Text style={styles.label}>Apellidos</Text>
      <View style={styles.inputWrapper}>
        <Icon name="account-box" size={20} color="#000" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          value={lastName}
          onChangeText={setLastName}
          placeholder="Apellidos"
          placeholderTextColor="#000"
        />
      </View>

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={loading}
      >
        <View style={styles.buttonContent}>
          <Icon name="content-save" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.buttonText}>
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </Text>
        </View>
      </TouchableOpacity>

      <Toast />
    </ScrollView>
  );
};

export default CitizenProfileScreen;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#002B7F',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#fff',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
    marginTop: 15,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#000',
  },
  button: {
    backgroundColor: '#43a047',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 30,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
