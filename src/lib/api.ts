const API_BASE = '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  
  const data = await response.json();
  
  if (!response.ok || !data.success) {
    throw new Error(data.error || '请求失败');
  }
  
  return data;
}

export const api = {
  auth: {
    login: (username: string, password: string) => 
      request<{ success: boolean; data: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
    getUsers: () => request<{ success: boolean; data: any[] }>('/auth/users'),
  },
  
  batches: {
    list: () => request<{ success: boolean; data: any[] }>('/batches'),
    get: (id: string) => request<{ success: boolean; data: any }>(`/batches/${id}`),
    create: (data: any) => 
      request<{ success: boolean; data: any }>('/batches', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getImmune: (id: string) => 
      request<{ success: boolean; data: any[] }>(`/batches/${id}/immune`),
    addImmune: (id: string, data: any) => 
      request<{ success: boolean; data: any }>(`/batches/${id}/immune`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    checkImmune: (id: string) => 
      request<{ success: boolean; data: any }>(`/batches/${id}/immune-check`),
  },
  
  vehicles: {
    list: () => request<{ success: boolean; data: any[] }>('/vehicles'),
    get: (id: string) => request<{ success: boolean; data: any }>(`/vehicles/${id}`),
    create: (data: any) => 
      request<{ success: boolean; data: any }>('/vehicles', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    checkValidity: (id: string) => 
      request<{ success: boolean; data: any }>(`/vehicles/${id}/validity`),
  },
  
  declarations: {
    list: (filters?: any) => {
      const params = new URLSearchParams(filters || {}).toString();
      return request<{ success: boolean; data: any[] }>(
        `/declarations${params ? `?${params}` : ''}`
      );
    },
    get: (id: string) => request<{ success: boolean; data: any }>(`/declarations/${id}`),
    create: (data: any) => 
      request<{ success: boolean; data: any }>('/declarations', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    checkImmune: (id: string) => 
      request<{ success: boolean; data: any }>(`/declarations/${id}/immune-check`, {
        method: 'POST',
      }),
    bindVehicle: (id: string, vehicle_id: string) => 
      request<{ success: boolean; data: any }>(`/declarations/${id}/bind-vehicle`, {
        method: 'POST',
        body: JSON.stringify({ vehicle_id }),
      }),
    issueCertificate: (id: string, inspector_id: string) => 
      request<{ success: boolean; data: any }>(`/declarations/${id}/issue-certificate`, {
        method: 'POST',
        body: JSON.stringify({ inspector_id }),
      }),
    startTransport: (id: string) => 
      request<{ success: boolean; data: any }>(`/declarations/${id}/start-transport`, {
        method: 'POST',
      }),
    receive: (id: string, data: any) => 
      request<{ success: boolean; data: any }>(`/declarations/${id}/receive`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    reportException: (id: string, data: any) => 
      request<{ success: boolean; data: any }>(`/declarations/${id}/report-exception`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getReceipts: (id: string) => 
      request<{ success: boolean; data: any[] }>(`/declarations/${id}/receipts`),
    getReviews: (id: string) => 
      request<{ success: boolean; data: any[] }>(`/declarations/${id}/reviews`),
  },
  
  reviews: {
    list: (filters?: any) => {
      const params = new URLSearchParams(filters || {}).toString();
      return request<{ success: boolean; data: any[] }>(
        `/reviews${params ? `?${params}` : ''}`
      );
    },
    get: (id: string) => request<{ success: boolean; data: any }>(`/reviews/${id}`),
    review: (id: string, data: any) => 
      request<{ success: boolean; data: any }>(`/reviews/${id}/review`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },
};
