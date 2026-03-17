const DEFAULT_API_BASE_URL = "https://application-tracker-suvm.onrender.com";

const apiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") || DEFAULT_API_BASE_URL;

export default {
  expo: {
    name: "Job Tracker",
    slug: "job-tracker",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    splash: {
      resizeMode: "contain",
      backgroundColor: "#f6f2ea",
    },
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#f6f2ea",
      },
    },
    platforms: ["ios", "android"],
    extra: {
      apiBaseUrl,
    },
  },
};
