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
    const checkSession = async () => {
      const unsubscribe = auth.onAuthStateChanged(async (user: User | null) => {
        if (user) {
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const storedUser = await AsyncStorage.getItem('user');

            if (userDoc.exists()) {
              const role = userDoc.data().role;

              if (role === 'ciudadano') {
                navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
              } else if (role === 'autoridad') {
                navigation.reset({ index: 0, routes: [{ name: 'AuthorityDashboard' }] });
              } else {
                navigation.reset({ index: 0, routes: [{ name: 'RoleSelector' }] });
              }
            } else if (storedUser) {
              // fallback si Firestore no encuentra el doc, pero AsyncStorage tiene usuario
              navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
            } else {
              navigation.reset({ index: 0, routes: [{ name: 'RoleSelector' }] });
            }
          } catch (err) {
            console.error('Error verificando usuario:', err);
            navigation.reset({ index: 0, routes: [{ name: 'RoleSelector' }] });
          }
        } else {
          navigation.reset({ index: 0, routes: [{ name: 'RoleSelector' }] });
        }
      });

      return unsubscribe;
    };

    checkSession();
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
