import type { AppCopy } from "./types";

export const copy: AppCopy = {
  tabs: {
    today: "Сегодня",
    treatment: "Лечение",
  },
  today: {
    title: "Сегодня",
    loading: "Загрузка…",
    noActiveTreatment: "Сейчас нет активного лечения.",
    noActionsForToday: "На сегодня в приложении нет доступных действий.",
    currentStageLabel: "Текущий этап",
    tasksLabel: "Задачи на сегодня",
    loadError: "Не удалось загрузить данные.",
    retry: "Повторить",
  },
  treatment: {
    title: "Лечение",
    body: "Здесь появится ход лечения.",
  },
};
