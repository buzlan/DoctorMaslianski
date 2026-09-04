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
    periodDayLabel: "День",
    tasksLabel: "Задачи на сегодня",
    loadError: "Не удалось загрузить данные.",
    retry: "Повторить",
    markComplete: "Отметить выполненным",
    markIncomplete: "Снять отметку",
  },
  treatment: {
    title: "Лечение",
    loading: "Загрузка…",
    noActiveTreatment: "Сейчас нет активного лечения.",
    loadError: "Не удалось загрузить данные.",
    retry: "Повторить",
    periodDayLabel: "День",
    emptyMilestones: "Пока нет визитов в ходе лечения.",
  },
};
