'use client';

import useSWR from 'swr';
import { api } from '@/lib/api';
import type { Notification } from '@kanban/types';

export function useNotifications(projectId: string, fallbackData?: Notification[]) {
  const { data, mutate } = useSWR<Notification[]>(
    `/notifications?projectId=${projectId}`,
    api.get,
    { refreshInterval: 10000, fallbackData },
  );

  const notifications = data ?? [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = async (id: string) => {
    await api.patch<Notification>(`/notifications/${id}/read`, {});
    await mutate();
  };

  const replyToNotification = async (id: string, reply: string) => {
    await api.post<Notification>(`/notifications/${id}/reply`, { reply });
    await mutate();
  };

  return { notifications, unreadCount, markAsRead, replyToNotification, mutate };
}
