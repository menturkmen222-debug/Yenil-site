import AsyncStorage from "@react-native-async-storage/async-storage";

const PROFILE_KEY = "@yenil_local_profile";

export interface LocalProfile {
  name: string;
  surname: string;
  username?: string;
  phone: string;
  region: string;
  district: string;
  profession: string;
  bio: string;
}

export async function saveLocalProfile(p: LocalProfile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}

export async function getLocalProfile(): Promise<LocalProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LocalProfile;
  } catch {
    return null;
  }
}

export async function clearLocalProfile(): Promise<void> {
  await AsyncStorage.removeItem(PROFILE_KEY);
}
