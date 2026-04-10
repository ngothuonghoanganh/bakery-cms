import { create } from 'zustand';
import { notification } from 'antd';
import type { ArgsProps } from 'antd/es/notification';
import type { ReactNode } from 'react';
import type { NotificationInstance } from 'antd/es/notification/interface';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

type NotificationStore = {
  api: NotificationInstance | null;
  setApi: (api: NotificationInstance) => void;
  show: (type: NotificationType, message: ReactNode, description?: ReactNode) => void;
  success: (message: ReactNode, description?: ReactNode) => void;
  error: (message: ReactNode, description?: ReactNode) => void;
  warning: (message: ReactNode, description?: ReactNode) => void;
  info: (message: ReactNode, description?: ReactNode) => void;
};

const defaultConfig: Partial<ArgsProps> = {
  placement: 'topRight',
  duration: 3,
};

const openNotification = (
  api: NotificationInstance | null,
  type: NotificationType,
  message: ReactNode,
  description?: ReactNode,
  extraConfig?: Partial<ArgsProps>
): void => {
  const config: ArgsProps = {
    message,
    description,
    ...defaultConfig,
    ...extraConfig,
  };

  if (api) {
    api[type](config);
    return;
  }

  notification[type](config);
};

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  api: null,
  setApi: (api: NotificationInstance) => {
    set({ api });
  },

  show: (type: NotificationType, message: ReactNode, description?: ReactNode) => {
    openNotification(get().api, type, message, description);
  },

  success: (message: ReactNode, description?: ReactNode) => {
    openNotification(get().api, 'success', message, description);
  },

  error: (message: ReactNode, description?: ReactNode) => {
    openNotification(get().api, 'error', message, description, {
      duration: 4, // Longer duration for errors
    });
  },

  warning: (message: ReactNode, description?: ReactNode) => {
    openNotification(get().api, 'warning', message, description);
  },

  info: (message: ReactNode, description?: ReactNode) => {
    openNotification(get().api, 'info', message, description);
  },
}));
