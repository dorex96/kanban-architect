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

  const deleteNotification = async (id: string) => {
    const previous = notifications;

    await mutate(
      (current) => (current ?? []).filter((notification) => notification.id !== id),
      { revalidate: false },
    );

    try {
      await api.delete<Notification>(`/notifications/${id}`);
      await mutate();
    } catch (error) {
      await mutate(previous, { revalidate: false });
      throw error;
    }
  };

  const deleteReadNotifications = async () => {
    const previous = notifications;

    await mutate(
      (current) => (current ?? []).filter((notification) => !notification.isRead),
      { revalidate: false },
    );

    try {
      await api.delete<{ deletedCount: number }>(`/notifications/read?projectId=${projectId}`);
      await mutate();
    } catch (error) {
      await mutate(previous, { revalidate: false });
      throw error;
    }
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    replyToNotification,
    deleteNotification,
    deleteReadNotifications,
    mutate,
  };
}
