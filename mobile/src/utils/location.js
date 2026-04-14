import * as Location from 'expo-location';
import { STORE_LOCATION, SERVICE_RADIUS_KM } from './constants';

function toRad(deg) {
  return deg * (Math.PI / 180);
}

export function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function isWithinServiceArea(lat, lng) {
  const distance = getDistanceKm(lat, lng, STORE_LOCATION.lat, STORE_LOCATION.lng);
  return distance <= SERVICE_RADIUS_KM;
}

export async function getCurrentLocation() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission denied');
  }
  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  return {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
  };
}
