import api from '../api';

export interface PDF {
  id: string;
  filename: string;
  originalName: string;
  cloudinaryUrl: string;
  fileSize: number;
  pageCount?: number;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  embeddingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface PDFStatus {
  processingStatus: string;
  embeddingStatus: string;
  isReady: boolean;
  jobStatus: {
    state: string;
    progress: number;
  } | null;
}

export const pdfService = {
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('pdf', file);

    const response = await api.post('/pdf/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getAll: async (params?: { page?: number; limit?: number; status?: string }) => {
    const response = await api.get('/pdf', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/pdf/${id}`);
    return response.data;
  },

  getStatus: async (id: string): Promise<{ success: boolean; data: PDFStatus }> => {
    const response = await api.get(`/pdf/${id}/status`);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/pdf/${id}`);
    return response.data;
  },

  retry: async (id: string) => {
    const response = await api.post(`/pdf/${id}/retry`);
    return response.data;
  },
};
