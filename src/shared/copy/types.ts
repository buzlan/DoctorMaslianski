export type AppCopy = {
  tabs: {
    today: string;
    treatment: string;
    diary: string;
  };
  today: {
    title: string;
    loading: string;
    noActiveTreatment: string;
    noActionsForToday: string;
    periodDayLabel: string;
    tasksLabel: string;
    loadError: string;
    retry: string;
    markComplete: string;
    markIncomplete: string;
    fillDiary: string;
  };
  diary: {
    title: string;
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
    loading: string;
    noActiveTreatment: string;
    loadError: string;
    retry: string;
    periodDayLabel: string;
    emptyMilestones: string;
    back: string;
    milestoneDetailTitle: string;
    milestoneNotFound: string;
  };
};
