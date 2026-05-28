import "expo-dev-client";
import "react-native-gesture-handler";
import React, { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import HomeScreen from "./src/screens/TasksScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import AddTaskScreen from "./src/screens/AddTaskScreen";
import AnalysisScreen from "./src/screens/AnalysisScreen";
import TimerScreen from "./src/screens/TimerScreen";
import { TasksProvider } from "./src/state/TasksContext";
import { ThemeProvider, useTheme } from "./src/state/ThemeContext";
import { configureNotifications } from "./src/services/notifications";
import { initAudio } from "./src/services/sound";

const Tab = createBottomTabNavigator();

// Inner component so it can call useTheme (must be inside ThemeProvider)
function AppNavigator() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const notificationListener = useRef();

  useEffect(() => {
    configureNotifications();
    initAudio();

    // Keep a listener so we can respond to notifications received while the
    // app is in the foreground. The system plays the channel's default sound
    // automatically (respecting ringer / vibrate / silent modes) via
    // setNotificationHandler({ shouldPlaySound: true }) in notifications.js.
    // No custom expo-av sound is played here — that would bypass ringer mode.
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (_notification) => {
        // Future: update badge count, refresh task list, etc.
      }
    );

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
    };
  }, []);

  return (
    <NavigationContainer>
      <StatusBar style={isDark ? "light" : "dark"} />
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]} edges={["top"]}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerTitleAlign: "center",
            tabBarStyle: {
              height: 70 + insets.bottom,
              paddingTop: 6,
              paddingBottom: 8 + insets.bottom,
              borderTopColor: theme.tabBorder,
              borderTopWidth: 1,
              backgroundColor: theme.tabBg,
            },
            tabBarLabelStyle: { fontSize: 11, marginBottom: 2 },
            tabBarIconStyle: { marginTop: 2 },
            tabBarItemStyle: { paddingVertical: 4 },
            tabBarLabelPosition: "below-icon",
            tabBarActiveTintColor: theme.tabActive,
            tabBarInactiveTintColor: theme.tabInactive,
            tabBarIcon: ({ color, size, focused }) => {
              const baseSize = route.name === "Add" ? 26 : 22;
              let iconName = "ellipse";

              if (route.name === "Home")     iconName = focused ? "home"        : "home-outline";
              else if (route.name === "Add") iconName = focused ? "add-circle"  : "add-circle-outline";
              else if (route.name === "Timer")    iconName = focused ? "timer"      : "timer-outline";
              else if (route.name === "Analysis") iconName = focused ? "stats-chart": "stats-chart-outline";
              else if (route.name === "Profile")  iconName = focused ? "person"     : "person-outline";

              if (route.name === "Add") {
                return (
                  <View style={[styles.addIconWrap, { backgroundColor: theme.green }, focused && { opacity: 0.85 }]}>
                    <Ionicons name="add" size={baseSize} color={isDark ? "#0e1712" : "#ffffff"} />
                  </View>
                );
              }
              return <Ionicons name={iconName} size={baseSize} color={color} />;
            }
          })}
        >
          <Tab.Screen name="Home"     component={HomeScreen}     options={{ headerShown: false }} />
          <Tab.Screen name="Timer"    component={TimerScreen}    options={{ headerShown: false }} />
          <Tab.Screen name="Add"      component={AddTaskScreen}  options={{ headerShown: false }} />
          <Tab.Screen name="Analysis" component={AnalysisScreen} options={{ headerShown: false }} />
          <Tab.Screen name="Profile"  component={ProfileScreen}  options={{ headerShown: false }} />
        </Tab.Navigator>
      </SafeAreaView>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <TasksProvider>
        <SafeAreaProvider>
          <AppNavigator />
        </SafeAreaProvider>
      </TasksProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  addIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
});
