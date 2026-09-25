import {
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { copy } from "@/shared/copy";
import { getColors, theme } from "@/shared/theme";
import { AppText } from "@/shared/ui";

const CLINIC_PHONES = [
  {
    id: "short",
    labelKey: "shortPhoneLabel",
    display: "7095",
    dial: "7095",
  },
  {
    id: "a1",
    labelKey: "a1PhoneLabel",
    display: "+375 (44) 538-70-95",
    dial: "+375445387095",
  },
  {
    id: "mts",
    labelKey: "mtsPhoneLabel",
    display: "+375 (29) 508-70-95",
    dial: "+375295087095",
  },
  {
    id: "landline",
    labelKey: "landlinePhoneLabel",
    display: "+375 (17) 370-00-05",
    dial: "+375173700005",
  },
] as const;

type AppointmentContactModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function AppointmentContactModal({
  visible,
  onClose,
}: AppointmentContactModalProps) {
  const colors = getColors(useColorScheme());
  const insets = useSafeAreaInsets();

  async function callPhone(dial: string, display: string) {
    try {
      await Linking.openURL(`tel:${dial}`);
    } catch {
      Alert.alert(
        copy.appointment.callErrorTitle,
        `${copy.appointment.callErrorBody}\n${display}`,
      );
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={copy.appointment.close}
        />

        <View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              paddingBottom: Math.max(insets.bottom, theme.spacing.md),
            },
          ]}
        >
          <View
            accessible={false}
            style={[styles.handle, { backgroundColor: colors.border }]}
          />

          <View style={styles.header}>
            <AppText
              variant="title"
              tone="primary"
              accessibilityRole="header"
              style={styles.heading}
            >
              {copy.appointment.contactsModalTitle}
            </AppText>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.appointment.close}
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeTarget,
                { opacity: pressed ? 0.75 : 1 },
              ]}
            >
              <View
                style={[
                  styles.closeDisc,
                  { backgroundColor: colors.accentSoft },
                ]}
              >
                <View style={styles.closeMark}>
                  <View
                    style={[
                      styles.closeBar,
                      {
                        backgroundColor: colors.accent,
                        transform: [{ rotate: "45deg" }],
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.closeBar,
                      {
                        backgroundColor: colors.accent,
                        transform: [{ rotate: "-45deg" }],
                      },
                    ]}
                  />
                </View>
              </View>
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.section}>
              <AppText
                variant="label"
                tone="secondary"
                accessibilityRole="header"
                style={styles.sectionTitle}
              >
                {copy.appointment.phonesTitle}
              </AppText>

              <View style={styles.phoneList}>
                {CLINIC_PHONES.map((phone) => (
                  <Pressable
                    key={phone.id}
                    accessibilityRole="button"
                    accessibilityLabel={
                      `${copy.appointment.call}, ` +
                      `${copy.appointment[phone.labelKey]}: ${phone.display}`
                    }
                    onPress={() => {
                      void callPhone(phone.dial, phone.display);
                    }}
                    style={({ pressed }) => [
                      styles.phoneRow,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <AppText
                      variant="caption"
                      tone="secondary"
                      style={styles.phoneLabel}
                    >
                      {copy.appointment[phone.labelKey]}
                    </AppText>

                    <AppText
                      variant="title"
                      style={[styles.phoneNumber, { color: colors.accent }]}
                    >
                      {phone.display}
                    </AppText>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <AppText
                variant="label"
                tone="secondary"
                accessibilityRole="header"
                style={styles.sectionTitle}
              >
                {copy.appointment.clinicTitle}
              </AppText>

              <AppText tone="primary" selectable>
                {copy.appointment.clinicName}
              </AppText>
            </View>

            <View style={styles.section}>
              <AppText
                variant="label"
                tone="secondary"
                accessibilityRole="header"
                style={styles.sectionTitle}
              >
                {copy.appointment.addressTitle}
              </AppText>

              <AppText tone="primary" selectable>
                {copy.appointment.clinicAddress}
              </AppText>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  sheet: {
    maxHeight: "85%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: theme.spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  heading: {
    flex: 1,
  },
  closeTarget: {
    width: 44,
    height: 44,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  closeDisc: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  closeMark: {
    width: 16,
    height: 16,
  },
  closeBar: {
    position: "absolute",
    width: 14,
    height: 2,
    borderRadius: 1,
    top: 7,
    left: 1,
  },
  scroll: {
    flexShrink: 1,
  },
  scrollContent: {
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  section: {
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  phoneList: {
    gap: theme.spacing.xs,
  },
  phoneRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    minHeight: 48,
    columnGap: theme.spacing.sm,
    rowGap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
  },
  phoneLabel: {
    width: 88,
  },
  phoneNumber: {
    flexShrink: 1,
  },
});
