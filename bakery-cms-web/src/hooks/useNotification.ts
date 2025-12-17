import { useNotificationStore } from '../stores/notificationStore';

export const useNotification = () => {
  const { show, success, error, warning, info } = useNotificationStore();

  return {
    show,
    success,
    error,
    warning,
    info,
  };
};
