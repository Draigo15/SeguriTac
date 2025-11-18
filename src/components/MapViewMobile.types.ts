// Platform-agnostic types for MapViewMobile
export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface MapPressEvent {
  nativeEvent: {
    coordinate: {
      latitude: number;
      longitude: number;
    };
  };
}

export interface MapViewMobileRef {
  animateToRegion: (region: Region, duration?: number) => void;
  animateToCoordinate: (coordinate: { latitude: number; longitude: number }, duration?: number) => void;
  getCurrentRegion: () => Promise<Region | null>;
}

// Props are defined separately in each platform-specific file
// to avoid conflicts with ref handling