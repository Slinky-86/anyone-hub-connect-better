import { supabase } from '../supabase-unified';

export interface UploadResult {
  url?: string;
  path?: string;
  error?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Storage Service using Supabase Storage
 * Replaces file upload functionality from Express server
 */
export class StorageService {
  private readonly VOICE_MESSAGES_BUCKET = 'voice-messages';
  private readonly AVATAR_BUCKET = 'avatars';
  private readonly MEDIA_BUCKET = 'media';

  /**
   * Initialize storage buckets
   */
  async initializeBuckets(): Promise<{ error?: string }> {
    try {
      const buckets = [
        { name: this.VOICE_MESSAGES_BUCKET, public: false },
        { name: this.AVATAR_BUCKET, public: true },
        { name: this.MEDIA_BUCKET, public: false },
      ];

      for (const bucketConfig of buckets) {
        // Check if bucket exists
        const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
        
        if (listError) {
          console.error('Error listing buckets:', listError);
          continue;
        }

        const bucketExists = existingBuckets?.some(b => b.name === bucketConfig.name);
        
        if (!bucketExists) {
          // Create bucket
          const { error: createError } = await supabase.storage.createBucket(
            bucketConfig.name,
            { public: bucketConfig.public }
          );
          
          if (createError) {
            console.error(`Error creating bucket ${bucketConfig.name}:`, createError);
          } else {
            console.log(`Created bucket: ${bucketConfig.name}`);
          }
        }
      }

      return {};
    } catch (error) {
      console.error('Initialize buckets error:', error);
      return { error: 'Failed to initialize storage buckets' };
    }
  }

  /**
   * Upload voice message file
   * Replaces: POST /api/conversations/:id/messages/voice
   */
  async uploadVoiceMessage(
    file: File,
    userId: number,
    conversationId: number,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      // Validate file type
      if (!file.type.startsWith('audio/')) {
        return { error: 'Invalid file type. Only audio files are allowed.' };
      }

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        return { error: 'File size exceeds 10MB limit.' };
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomSuffix = Math.round(Math.random() * 1E9);
      const fileExtension = file.name.split('.').pop() || 'wav';
      const filename = `${userId}/${conversationId}/${timestamp}-${randomSuffix}.${fileExtension}`;

      // Upload file
      const { data, error } = await supabase.storage
        .from(this.VOICE_MESSAGES_BUCKET)
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        return { error: error.message };
      }

      // Get public URL (for private buckets, we'll need signed URLs)
      const { data: urlData } = supabase.storage
        .from(this.VOICE_MESSAGES_BUCKET)
        .getPublicUrl(filename);

      return {
        url: urlData.publicUrl,
        path: filename,
      };
    } catch (error) {
      console.error('Upload voice message error:', error);
      return { error: 'Failed to upload voice message' };
    }
  }

  /**
   * Get signed URL for private file
   */
  async getSignedUrl(bucket: string, path: string, expiresIn: number = 3600): Promise<{ url?: string; error?: string }> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error) {
        return { error: error.message };
      }

      return { url: data.signedUrl };
    } catch (error) {
      console.error('Get signed URL error:', error);
      return { error: 'Failed to get signed URL' };
    }
  }

  /**
   * Upload avatar image
   */
  async uploadAvatar(
    file: File,
    userId: number,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        return { error: 'Invalid file type. Only image files are allowed.' };
      }

      // Validate file size (5MB limit for avatars)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        return { error: 'File size exceeds 5MB limit.' };
      }

      // Generate filename
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const filename = `${userId}/avatar.${fileExtension}`;

      // Upload file (overwrite existing)
      const { data, error } = await supabase.storage
        .from(this.AVATAR_BUCKET)
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: true, // Overwrite existing avatar
        });

      if (error) {
        return { error: error.message };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.AVATAR_BUCKET)
        .getPublicUrl(filename);

      return {
        url: urlData.publicUrl,
        path: filename,
      };
    } catch (error) {
      console.error('Upload avatar error:', error);
      return { error: 'Failed to upload avatar' };
    }
  }

  /**
   * Upload media file (images, videos)
   */
  async uploadMedia(
    file: File,
    userId: number,
    conversationId: number,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      // Validate file type
      const allowedTypes = ['image/', 'video/'];
      const isValidType = allowedTypes.some(type => file.type.startsWith(type));
      
      if (!isValidType) {
        return { error: 'Invalid file type. Only images and videos are allowed.' };
      }

      // Validate file size (50MB limit for media)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        return { error: 'File size exceeds 50MB limit.' };
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomSuffix = Math.round(Math.random() * 1E9);
      const fileExtension = file.name.split('.').pop() || 'bin';
      const filename = `${userId}/${conversationId}/${timestamp}-${randomSuffix}.${fileExtension}`;

      // Upload file
      const { data, error } = await supabase.storage
        .from(this.MEDIA_BUCKET)
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        return { error: error.message };
      }

      // Get public URL (for private buckets, we'll need signed URLs)
      const { data: urlData } = supabase.storage
        .from(this.MEDIA_BUCKET)
        .getPublicUrl(filename);

      return {
        url: urlData.publicUrl,
        path: filename,
      };
    } catch (error) {
      console.error('Upload media error:', error);
      return { error: 'Failed to upload media' };
    }
  }

  /**
   * Delete file from storage
   */
  async deleteFile(bucket: string, path: string): Promise<{ error?: string }> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error) {
      console.error('Delete file error:', error);
      return { error: 'Failed to delete file' };
    }
  }

  /**
   * List files in a directory
   */
  async listFiles(bucket: string, path: string = ''): Promise<{ files: any[]; error?: string }> {
    try {
      const { data: files, error } = await supabase.storage
        .from(bucket)
        .list(path);

      if (error) {
        return { files: [], error: error.message };
      }

      return { files: files || [] };
    } catch (error) {
      console.error('List files error:', error);
      return { files: [], error: 'Failed to list files' };
    }
  }

  /**
   * Get file size and metadata
   */
  async getFileInfo(bucket: string, path: string): Promise<{ info?: any; error?: string }> {
    try {
      const { data: files, error } = await supabase.storage
        .from(bucket)
        .list(path.split('/').slice(0, -1).join('/'));

      if (error) {
        return { error: error.message };
      }

      const filename = path.split('/').pop();
      const fileInfo = files?.find(f => f.name === filename);

      return { info: fileInfo };
    } catch (error) {
      console.error('Get file info error:', error);
      return { error: 'Failed to get file info' };
    }
  }

  /**
   * Download file as blob
   */
  async downloadFile(bucket: string, path: string): Promise<{ blob?: Blob; error?: string }> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(path);

      if (error) {
        return { error: error.message };
      }

      return { blob: data };
    } catch (error) {
      console.error('Download file error:', error);
      return { error: 'Failed to download file' };
    }
  }

  /**
   * Get storage usage for a user
   */
  async getStorageUsage(userId: number): Promise<{ usage: number; error?: string }> {
    try {
      let totalSize = 0;
      const buckets = [this.VOICE_MESSAGES_BUCKET, this.AVATAR_BUCKET, this.MEDIA_BUCKET];

      for (const bucket of buckets) {
        const { files, error } = await this.listFiles(bucket, String(userId));
        
        if (error) {
          continue; // Skip this bucket if error
        }

        const bucketSize = files.reduce((sum, file) => sum + (file.metadata?.size || 0), 0);
        totalSize += bucketSize;
      }

      return { usage: totalSize };
    } catch (error) {
      console.error('Get storage usage error:', error);
      return { usage: 0, error: 'Failed to get storage usage' };
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();
export default storageService;