import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';

export interface GyazoImage {
  image_id: string;
  permalink_url: string;
  thumb_url: string;
  url: string;
  type: string;
  created_at?: string;
  metadata?: {
    app?: string | null;
    title?: string | null;
    url?: string | null;
    desc?: string | null;
  };
  ocr?: {
    locale: string;
    description: string;
  };
}

export interface UploadParams {
  imagedata: string;
  title?: string;
  desc?: string;
  collection_id?: string;
  referer_url?: string;
}

export interface ListParams {
  page?: number;
  per_page?: number;
}

export class GyazoClient {
  private apiClient: AxiosInstance;
  private uploadClient: AxiosInstance;
  private accessToken: string;

  constructor(accessToken: string) {
    if (!accessToken) {
      throw new Error('Gyazo access token is required');
    }

    this.accessToken = accessToken;

    // API client for general endpoints
    this.apiClient = axios.create({
      baseURL: 'https://api.gyazo.com/api',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    // Upload client for image uploads
    this.uploadClient = axios.create({
      baseURL: 'https://upload.gyazo.com/api',
    });
  }

  /**
   * Upload an image to Gyazo
   */
  async uploadImage(params: UploadParams): Promise<GyazoImage> {
    const formData = new FormData();
    formData.append('access_token', this.accessToken);
    formData.append('imagedata', params.imagedata);

    if (params.title) {
      formData.append('title', params.title);
    }
    if (params.desc) {
      formData.append('desc', params.desc);
    }
    if (params.collection_id) {
      formData.append('collection_id', params.collection_id);
    }
    if (params.referer_url) {
      formData.append('referer_url', params.referer_url);
    }

    const response = await this.uploadClient.post<GyazoImage>('/upload', formData, {
      headers: formData.getHeaders(),
    });

    return response.data;
  }

  /**
   * List images
   */
  async listImages(params: ListParams = {}): Promise<GyazoImage[]> {
    const response = await this.apiClient.get<GyazoImage[]>('/images', {
      params: {
        page: params.page || 1,
        per_page: params.per_page || 20,
      },
    });

    return response.data;
  }

  /**
   * Get a specific image by ID
   */
  async getImage(imageId: string): Promise<GyazoImage> {
    const response = await this.apiClient.get<GyazoImage>(`/images/${imageId}`);
    return response.data;
  }

  /**
   * Delete an image
   */
  async deleteImage(imageId: string): Promise<{ image_id: string; type: string }> {
    const response = await this.apiClient.delete<{ image_id: string; type: string }>(
      `/images/${imageId}`
    );
    return response.data;
  }

  /**
   * Get oEmbed data for a Gyazo URL
   */
  async getOEmbed(url: string): Promise<any> {
    const response = await this.apiClient.get('/oembed', {
      params: { url },
    });
    return response.data;
  }
}
