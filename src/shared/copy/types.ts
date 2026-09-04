export type AppCopy = {
  tabs: {
    today: string;
    treatment: string;
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
  };
  treatment: {
    title: string;
    loading: string;
    noActiveTreatment: string;
    loadError: string;
    retry: string;
    periodDayLabel: string;
    emptyMilestones: string;
  };
};
