export default {
  expo: {
    name: "SeguridadCiudadanaApp",
    slug: "SeguridadCiudadanaApp",
    owner: "rodliraa15",
    scheme: "seguridadciudadanaapp",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#002B7F"
    },
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.tuapp.seguritacapp",
      googleServicesFile: "./google-services.json",
      useNextNotificationsApi: true
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
       googleClientId: "361203563970-p4e3vf7koe2buno2rurqbsnutek8gi8p.apps.googleusercontent.com",
      googleAndroidClientId: "361203563970-v0kv953f57q7atunputfnof8l268ru9v.apps.googleusercontent.com",
      eas: {
        projectId: "93506b05-04c3-4913-a269-1cb2a63a151c"
      }
    }
  }
};
