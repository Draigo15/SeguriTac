import React, { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

import { auth, db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from 'firebase/auth';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AuthLoading'>;

const AuthLoadingScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user: User | null) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const storedUser = await AsyncStorage.getItem('user');
          const storedRole = storedUser ? JSON.parse(storedUser).role : null;

          if (userDoc.exists()) {
            const role = userDoc.data().role;

            // ✅ VERIFICAR que el rol actual coincida con el guardado en AsyncStorage
            if (storedRole && role !== storedRole) {
              console.warn(`Rol inconsistente. Firebase: ${role} | AsyncStorage: ${storedRole}`);
              await auth.signOut();
              await AsyncStorage.removeItem('user');
              navigation.reset({ index: 0, routes: [{ name: 'RoleSelector' }] });
              return;
            }

            // ✅ Redirección segura
            if (role === 'ciudadano') {
              navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
            } else if (role === 'autoridad') {
              navigation.reset({ index: 0, routes: [{ name: 'AuthorityDashboard' }] });
            } else {
              navigation.reset({ index: 0, routes: [{ name: 'RoleSelector' }] });
            }
          } else {
            await auth.signOut();
            await AsyncStorage.removeItem('user');
            navigation.reset({ index: 0, routes: [{ name: 'RoleSelector' }] });
          }
        } catch (err) {
          console.error('Error verificando usuario:', err);
          await auth.signOut();
          await AsyncStorage.removeItem('user');
          navigation.reset({ index: 0, routes: [{ name: 'RoleSelector' }] });
        }
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'RoleSelector' }] });
      }
    });

    return unsubscribe;
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2196f3" />
    </View>
  );
};

export default AuthLoadingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
  },
});
