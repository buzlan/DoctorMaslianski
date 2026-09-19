import { useState } from "react";

import { Button } from "@/shared/ui";

import { resetLocalPatientSession } from "./reset-local-patient-session";

const DEV_RESET_LABEL = "Сбросить локальную сессию";

export function DevResetLocalSessionControl() {
  const [busy, setBusy] = useState(false);

  if (!__DEV__) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      label={DEV_RESET_LABEL}
      disabled={busy}
      onPress={() => {
        setBusy(true);
        void resetLocalPatientSession().finally(() => {
          setBusy(false);
        });
      }}
    />
  );
}
