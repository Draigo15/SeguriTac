// @ts-nocheck
import 'dotenv/config';

// Leer flag Detox desde variables públicas de Expo o fallback
const detoxFlag = process.env.EXPO_PUBLIC_DETOX_E2E ?? process.env.DETOX_E2E;

export default {
  name: "SeguridadCiudadanaApp",
  slug: "SeguridadCiudadanaApp",
  owner: "rodliraa15",
  scheme: "seguridadciudadanaapp",
  version: "1.0.0",
  newArchEnabled: true,
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#002B7F"
  },
  ios: {
    supportsTablet: true,
    config: {
      googleMapsApiKey: process.env["GOOGLE_MAPS_API_KEY"]
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff"
    },
    package: "com.tuapp.seguritacapp",
    googleServicesFile: "./google-services.json",
    useNextNotificationsApi: true,
    config: {
      googleMaps: {
        apiKey: process.env["GOOGLE_MAPS_API_KEY"]
      }
    }
  },
  web: {
    favicon: "./assets/favicon.png",
    name: "Seguridad Ciudadana Tacna",
    shortName: "SeguridadApp",
    description: "Aplicativo web para reportes ciudadanos en tiempo real en Tacna.",
    themeColor: "#002B7F",
    backgroundColor: "#ffffff",
    config: {
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY
    }
  },
  plugins: [
    [
      "expo-build-properties",
      {
        android: {
          minSdkVersion: 26,
          enableProguardInReleaseBuilds: true,
          enableShrinkResourcesInReleaseBuilds: true,
          ndkVersion: "28.0.12433566"
        }
      }
    ],
    [
      "expo-dev-launcher",
      {
        launchMode: "most-recent"
      }
    ]
  ],
  extra: {
    FIREBASE_API_KEY: process.env["FIREBASE_API_KEY"],
    FIREBASE_AUTH_DOMAIN: process.env["FIREBASE_AUTH_DOMAIN"],
    FIREBASE_PROJECT_ID: process.env["FIREBASE_PROJECT_ID"],
    FIREBASE_STORAGE_BUCKET: process.env["FIREBASE_STORAGE_BUCKET"],
    FIREBASE_MESSAGING_SENDER_ID: process.env["FIREBASE_MESSAGING_SENDER_ID"],
    FIREBASE_APP_ID: process.env["FIREBASE_APP_ID"],
    GOOGLE_MAPS_API_KEY: process.env["GOOGLE_MAPS_API_KEY"],
    googleClientId: "361203563970-p4e3vf7koe2buno2rurqbsnutek8gi8p.apps.googleusercontent.com",
    googleAndroidClientId: "361203563970-v0kv953f57q7atunputfnof8l268ru9v.apps.googleusercontent.com",
    // Mapea EXPO_PUBLIC_DETOX_E2E (preferente) y hace fallback al antiguo DETOX_E2E
    detoxE2E: detoxFlag === 'true',
    eas: {
      projectId: "93506b05-04c3-4913-a269-1cb2a63a151c"
    }
  }
};
