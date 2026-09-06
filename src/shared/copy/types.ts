export type AppCopy = {
  tabs: {
    today: string;
    treatment: string;
    diary: string;
  };
  today: {
    title: string;
    subtitle: string;
    loading: string;
    noActiveTreatment: string;
    noActionsForToday: string;
    periodDayLabel: string;
    tasksLabel: string;
    loadError: string;
    retry: string;
    markComplete: string;
    completed: string;
    markIncomplete: string;
    fillDiary: string;
    addPhoto: string;
    photoAdded1: string;
    photoAdded2: string;
    photoAdded3: string;
  };
  diary: {
    title: string;
    subtitle: string;
    loading: string;
    noActiveTreatment: string;
    loadError: string;
    retry: string;
    painLabel: string;
    swellingLabel: string;
    wellbeingLabel: string;
    wellbeingBetter: string;
    wellbeingUnchanged: string;
    wellbeingWorse: string;
    submit: string;
    completedToday: string;
    entriesLabel: string;
  };
  treatment: {
    title: string;
    subtitle: string;
    loading: string;
    noActiveTreatment: string;
    loadError: string;
    retry: string;
    periodDayLabel: string;
    currentPeriodLabel: string;
    emptyMilestones: string;
    back: string;
    milestoneDetailTitle: string;
    milestoneNotFound: string;
    doctorPhotosLabel: string;
    doctorPhotosEmpty: string;
    doctorPhotosUnavailable: string;
    doctorPhotoAccessibilityLabel: string;
    doctorPhotoCount: string;
    photoCounterOf: string;
  };
  appointment: {
    label: string;
    empty: string;
  };
  clinicContact: {
    label: string;
    unavailable: string;
    call: string;
    email: string;
    book: string;
    openError: string;
  };
  completion: {
    title: string;
    body: string;
    loading: string;
    loadError: string;
    retry: string;
    notCompleted: string;
    surveyTitle: string;
    usefulnessLabel: string;
    clarityLabel: string;
    submit: string;
    submitted: string;
  };
  access: {
    loading: string;
    authenticationRequired: {
      title: string;
      body: string;
    };
    serviceUnavailable: {
      title: string;
      body: string;
    };
    tokenLabel: string;
    tokenPlaceholder: string;
    continueWithInvite: string;
    consentTitle: string;
    consentBody: string;
    privacyAccept: string;
    pilotConsentAccept: string;
    activate: string;
    activating: string;
    errors: {
      invalid: string;
      expired: string;
      revoked: string;
      consumed: string;
      unusable: string;
      service: string;
      network: string;
    };
  };
  photos: {
    title: string;
    takePhoto: string;
    chooseFromLibrary: string;
    confirm: string;
    retry: string;
    back: string;
    permissionDenied: string;
    cameraUnavailable: string;
    confirmError: string;
    invalidSource: string;
    dailyCap: string;
    noActiveTreatment: string;
  };
};
