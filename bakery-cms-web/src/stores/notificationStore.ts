import { create } from 'zustand';
import { notification } from 'antd';
import type { ArgsProps } from 'antd/es/notification';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

type NotificationStore = {
  show: (type: NotificationType, message: string, description?: string) => void;
  success: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
  warning: (message: string, description?: string) => void;
  info: (message: string, description?: string) => void;
};

const defaultConfig: Partial<ArgsProps> = {
  placement: 'topRight',
  duration: 3,
};

export const useNotificationStore = create<NotificationStore>(() => ({
  show: (type: NotificationType, message: string, description?: string) => {
    notification[type]({
      message,
      description,
      ...defaultConfig,
    });
  },
  
  success: (message: string, description?: string) => {
    notification.success({
      message,
      description,
      ...defaultConfig,
    });
  },
  
  error: (message: string, description?: string) => {
    notification.error({
      message,
      description,
      ...defaultConfig,
      duration: 4, // Longer duration for errors
    });
  },
  
  warning: (message: string, description?: string) => {
    notification.warning({
      message,
      description,
      ...defaultConfig,
    });
  },
  
  info: (message: string, description?: string) => {
    notification.info({
      message,
      description,
      ...defaultConfig,
    });
  },
}));
