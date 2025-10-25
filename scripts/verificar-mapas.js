#!/usr/bin/env node

/**
 * Script para verificar la configuración de Google Maps
 * Uso: node scripts/verificar-mapas.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🗺️  Verificando configuración de Google Maps...\n');

// 1. Verificar .env
console.log('1. Verificando archivo .env:');
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasGoogleMapsKey = envContent.includes('GOOGLE_MAPS_API_KEY');
  console.log(`   ✅ Archivo .env existe`);
  console.log(`   ${hasGoogleMapsKey ? '✅' : '❌'} GOOGLE_MAPS_API_KEY ${hasGoogleMapsKey ? 'configurada' : 'NO encontrada'}`);
  
  if (hasGoogleMapsKey) {
    const keyMatch = envContent.match(/GOOGLE_MAPS_API_KEY=(.+)/);
    if (keyMatch) {
      const key = keyMatch[1].trim();
      console.log(`   🔑 API Key: ${key.substring(0, 10)}...${key.substring(key.length - 4)}`);
    }
  }
} else {
  console.log('   ❌ Archivo .env NO encontrado');
}

// 2. Verificar AndroidManifest.xml
console.log('\n2. Verificando AndroidManifest.xml:');
const manifestPath = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
if (fs.existsSync(manifestPath)) {
  const manifestContent = fs.readFileSync(manifestPath, 'utf8');
  const hasApiKey = manifestContent.includes('com.google.android.geo.API_KEY');
  console.log(`   ✅ AndroidManifest.xml existe`);
  console.log(`   ${hasApiKey ? '✅' : '❌'} API_KEY ${hasApiKey ? 'configurada' : 'NO encontrada'}`);
  
  if (hasApiKey) {
    const keyMatch = manifestContent.match(/android:value="([^"]+)"/g);
    if (keyMatch) {
      const apiKeyLine = keyMatch.find(line => line.includes('AIza'));
      if (apiKeyLine) {
        const key = apiKeyLine.match(/"([^"]+)"/)[1];
        console.log(`   🔑 API Key: ${key.substring(0, 10)}...${key.substring(key.length - 4)}`);
      }
    }
  }
} else {
  console.log('   ❌ AndroidManifest.xml NO encontrado');
}

// 3. Verificar google-services.json
console.log('\n3. Verificando google-services.json:');
const googleServicesPath = path.join(__dirname, '..', 'google-services.json');
if (fs.existsSync(googleServicesPath)) {
  const googleServicesContent = fs.readFileSync(googleServicesPath, 'utf8');
  const config = JSON.parse(googleServicesContent);
  console.log(`   ✅ google-services.json existe`);
  console.log(`   📱 Project ID: ${config.project_info.project_id}`);
  console.log(`   📦 Package Name: ${config.client[0].client_info.android_client_info.package_name}`);
} else {
  console.log('   ❌ google-services.json NO encontrado');
}

// 4. Verificar package.json para react-native-maps
console.log('\n4. Verificando dependencias:');
const packagePath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packagePath)) {
  const packageContent = fs.readFileSync(packagePath, 'utf8');
  const packageJson = JSON.parse(packageContent);
  const hasReactNativeMaps = packageJson.dependencies && packageJson.dependencies['react-native-maps'];
  console.log(`   ${hasReactNativeMaps ? '✅' : '❌'} react-native-maps ${hasReactNativeMaps ? `v${packageJson.dependencies['react-native-maps']}` : 'NO instalado'}`);
}

// 5. Obtener SHA-1 fingerprint
console.log('\n5. Obteniendo SHA-1 fingerprint:');
try {
  const androidDir = path.join(__dirname, '..', 'android');
  process.chdir(androidDir);
  
  console.log('   🔍 Ejecutando gradlew signingReport...');
  const output = execSync('./gradlew signingReport', { encoding: 'utf8' });
  
  // Buscar SHA1 en la salida
  const sha1Match = output.match(/SHA1: ([A-F0-9:]+)/g);
  if (sha1Match) {
    console.log('   ✅ SHA-1 Fingerprints encontrados:');
    sha1Match.forEach((match, index) => {
      const sha1 = match.replace('SHA1: ', '');
      console.log(`   🔑 ${index === 0 ? 'Debug' : 'Release'}: ${sha1}`);
    });
  } else {
    console.log('   ❌ No se encontraron SHA-1 fingerprints');
  }
} catch (error) {
  console.log('   ❌ Error al obtener SHA-1:', error.message);
  console.log('   💡 Ejecuta manualmente: cd android && ./gradlew signingReport');
}

// 6. Instrucciones finales
console.log('\n📋 Próximos pasos:');
console.log('   1. Ve a https://console.cloud.google.com/');
console.log('   2. Selecciona el proyecto "seguritacapp"');
console.log('   3. Ve a APIs & Services > Credentials');
console.log('   4. Edita tu API Key');
console.log('   5. En "Application restrictions" selecciona "Android apps"');
console.log('   6. Agrega package name: com.tuapp.seguritacapp');
console.log('   7. Agrega el SHA-1 fingerprint mostrado arriba');
console.log('   8. En "API restrictions" habilita "Maps SDK for Android"');
console.log('   9. Guarda los cambios');
console.log('   10. Espera 5-10 minutos y prueba la app');

console.log('\n🔧 Para limpiar y reconstruir:');
console.log('   npx expo start --clear');
console.log('   cd android && ./gradlew clean && cd ..');
console.log('   npx expo run:android');