import { apiRequest, setAccessToken } from './client';
import type {
  ChangePasswordInput,
  CreateTaskInput,
  LinkEmailResponse,
  LinkPlatformResponse,
  TaskActionPreview,
  VerifyEmailResponse,
  LoginInput,
  LoginResponse,
  Platform,
  PlatformStatus,
  SignUpInput,
  Task,
  TaskListQuery,
  TaskListResponse,
  UpdateTaskInput,
  UpdateUserInput,
  User,
} from './types';

export const authApi = {
  async signUp(input: SignUpInput): Promise<void> {
    await apiRequest<void>('/auth/signup', {
      method: 'POST',
      body: input,
      anonymous: true,
    });
  },

  async login(input: LoginInput): Promise<LoginResponse> {
    const result = await apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: input,
      anonymous: true,
    });
    setAccessToken(result.accessToken);
    return result;
  },

  async logout(): Promise<void> {
    await apiRequest<void>('/auth/logout', {
      method: 'POST',
      anonymous: true,
    });
    setAccessToken(null);
  },

  changePassword(input: ChangePasswordInput): Promise<void> {
    return apiRequest<void>('/auth/change-password', {
      method: 'POST',
      body: input,
    });
  },
};

export const usersApi = {
  me(): Promise<User> {
    return apiRequest<User>('/users/me');
  },

  updateMe(input: UpdateUserInput): Promise<User> {
    return apiRequest<User>('/users/me', { method: 'PATCH', body: input });
  },
};

export const platformsApi = {
  list(): Promise<PlatformStatus[]> {
    return apiRequest<PlatformStatus[]>('/platforms');
  },

  linkTelegram(): Promise<LinkPlatformResponse> {
    return apiRequest<LinkPlatformResponse>('/platforms/telegram/link', {
      method: 'POST',
    });
  },

  linkEmail(email: string): Promise<LinkEmailResponse> {
    return apiRequest<LinkEmailResponse>('/platforms/email/link', {
      method: 'POST',
      body: { email },
    });
  },

  verifyEmail(token: string): Promise<VerifyEmailResponse> {
    return apiRequest<VerifyEmailResponse>('/platforms/email/verify', {
      method: 'POST',
      body: { token },
      anonymous: true,
    });
  },

  unlink(platform: Platform): Promise<void> {
    return apiRequest<void>(`/platforms/${platform}/link`, {
      method: 'DELETE',
    });
  },
};

export const tasksApi = {
  list(query: TaskListQuery): Promise<TaskListResponse> {
    return apiRequest<TaskListResponse>('/tasks', { query });
  },

  get(taskId: string): Promise<Task> {
    return apiRequest<Task>(`/tasks/${taskId}`);
  },

  create(input: CreateTaskInput): Promise<Task> {
    return apiRequest<Task>('/tasks', { method: 'POST', body: input });
  },

  update(taskId: string, input: UpdateTaskInput): Promise<Task> {
    return apiRequest<Task>(`/tasks/${taskId}`, {
      method: 'PATCH',
      body: input,
    });
  },

  remove(taskId: string): Promise<void> {
    return apiRequest<void>(`/tasks/${taskId}`, { method: 'DELETE' });
  },

  confirm(taskId: string): Promise<{ outcome: string }> {
    return apiRequest<{ outcome: string }>(`/tasks/${taskId}/confirm`, {
      method: 'POST',
    });
  },

  snooze(taskId: string): Promise<{ outcome: string }> {
    return apiRequest<{ outcome: string }>(`/tasks/${taskId}/snooze`, {
      method: 'POST',
    });
  },

  /** Reads the reminder behind an emailed link. Never changes state. */
  previewTokenAction(token: string): Promise<TaskActionPreview> {
    return apiRequest<TaskActionPreview>(`/tasks/actions/${token}`, {
      anonymous: true,
    });
  },

  performTokenAction(token: string): Promise<{ outcome: string }> {
    return apiRequest<{ outcome: string }>(`/tasks/actions/${token}`, {
      method: 'POST',
      anonymous: true,
    });
  },
};
