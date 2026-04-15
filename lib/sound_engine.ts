import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * PRODUCTION Sound Engine
 * Rules: Default OFF, Persistent setting, Opt-in only.
 */

const SOUND_SETTINGS_KEY = 'auramx_sound_enabled';

export const isSoundEnabled = async () => {
    const val = await AsyncStorage.getItem(SOUND_SETTINGS_KEY);
    return val === 'true'; // Default is false (null -> false)
};

export const setSoundEnabled = async (enabled: boolean) => {
    await AsyncStorage.setItem(SOUND_SETTINGS_KEY, enabled.toString());
};

export const playTradeSound = async () => {
    const enabled = await isSoundEnabled();
    if (!enabled) return;

    try {
        const { sound } = await Audio.Sound.createAsync(
            { uri: 'https://auramx-assets.s3.amazonaws.com/sounds/chaching.mp3' }, // Mock URI
            { shouldPlay: true }
        );
        await sound.playAsync();
        // Unload after playing to save memory
        sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
                sound.unloadAsync();
            }
        });
    } catch (error) {
        console.warn('[SoundEngine] Failed to play trade sound:', error);
    }
};

export const playAchievementSound = async () => {
    const enabled = await isSoundEnabled();
    if (!enabled) return;

    try {
        const { sound } = await Audio.Sound.createAsync(
            { uri: 'https://auramx-assets.s3.amazonaws.com/sounds/achievement.mp3' },
            { shouldPlay: true }
        );
        await sound.playAsync();
    } catch (e) {}
};
