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
    currentStageLabel: string;
    tasksLabel: string;
    loadError: string;
    retry: string;
  };
  treatment: {
    title: string;
    body: string;
  };
};
