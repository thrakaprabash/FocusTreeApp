import AsyncStorage from "@react-native-async-storage/async-storage";

const TASKS_KEY        = "focusTree.tasks";
const XP_KEY           = "focusTree.xp";
const PROFILE_NAME_KEY = "focusTree.profileName";
const THEME_KEY        = "focusTree.theme";

export const loadTasks = async () => {
  try {
    const raw = await AsyncStorage.getItem(TASKS_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

export const saveTasks = async (tasks) => {
  try {
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch (error) {
    return;
  }
};

export const loadXp = async () => {
  try {
    const raw = await AsyncStorage.getItem(XP_KEY);
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  } catch (error) {
    return 0;
  }
};

export const saveXp = async (xp) => {
  try {
    await AsyncStorage.setItem(XP_KEY, String(xp));
  } catch (error) {
    return;
  }
};

export const loadProfileName = async () => {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_NAME_KEY);
    return raw || "";
  } catch (error) {
    return "";
  }
};

export const saveProfileName = async (name) => {
  try {
    await AsyncStorage.setItem(PROFILE_NAME_KEY, String(name));
  } catch (error) {
    return;
  }
};

export const loadTheme = async () => {
  try {
    const raw = await AsyncStorage.getItem(THEME_KEY);
    return raw || "system";
  } catch {
    return "system";
  }
};

export const saveTheme = async (mode) => {
  try {
    await AsyncStorage.setItem(THEME_KEY, String(mode));
  } catch {
    return;
  }
};
