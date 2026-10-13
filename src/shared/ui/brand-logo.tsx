import { Image } from "expo-image";
import { StyleSheet } from "react-native";

export function BrandLogo() {
  return (
    <Image
      source={require("../../../assets/images/patient/medical-logo.svg")}
      style={styles.logo}
      resizeMode="contain"
      accessible={false}
    />
  );
}

const styles = StyleSheet.create({
  logo: { width: 44, height: 44 },
});
