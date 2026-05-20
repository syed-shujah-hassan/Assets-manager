const appJson = require('./app.json');

module.exports = () => {
  const googleMapsKey =
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY?.trim() ||
    '';

  const base = appJson.expo;

  return {
    expo: {
      ...base,
      android: {
        ...base.android,
        config: {
          ...(base.android?.config || {}),
          googleMaps: { apiKey: googleMapsKey },
        },
      },
    },
  };
};
