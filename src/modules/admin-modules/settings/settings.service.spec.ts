import { Test, TestingModule } from '@nestjs/testing';
import { SettingsService } from './settings.service';
import {
  ISettingsRepository,
  SETTINGS_REPOSITORY,
} from '../../../database/repositories/settings/settings.repository.interface';
import { FileManagementService } from '../../../common/services/file-management.service';
import { Settings } from '../../../database/entities/settings.entity';
import { RecordType } from '../../../common/enums/database-type.enum';
import {
  SettingsNotFoundException,
  FileUploadSettingsException,
} from './exceptions/settings.exceptions';

describe('SettingsService', () => {
  let service: SettingsService;
  let mockSettingsRepository: jest.Mocked<ISettingsRepository>;
  let mockFileManagementService: jest.Mocked<FileManagementService>;

  const mockSettings: Settings = {
    id: 'test-id',
    groupType: 'test-group',
    recordType: RecordType.STRING,
    key: 'test-key',
    value: 'test-value',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockFileSettings: Settings = {
    id: 'test-file-id',
    groupType: 'test-group',
    recordType: RecordType.FILE,
    key: 'test-file-key',
    value: 'uploads/test-file.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockRepository: Partial<jest.Mocked<ISettingsRepository>> = {
      findByGroupType: jest.fn(),
      findByGroupTypeAndKey: jest.fn(),
      upsertByGroupTypeAndKey: jest.fn(),
      deleteByGroupTypeAndKey: jest.fn(),
      deleteByGroupType: jest.fn(),
    };

    const mockFileService: Partial<jest.Mocked<FileManagementService>> = {
      uploadSettingsFile: jest.fn(),
      fileExists: jest.fn(),
      deleteFile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        {
          provide: SETTINGS_REPOSITORY,
          useValue: mockRepository,
        },
        {
          provide: FileManagementService,
          useValue: mockFileService,
        },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
    mockSettingsRepository = module.get(SETTINGS_REPOSITORY);
    mockFileManagementService = module.get(FileManagementService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSettingsByGroupType', () => {
    it('should return settings for valid group type', async () => {
      const expectedSettings = [mockSettings];
      mockSettingsRepository.findByGroupType.mockResolvedValue(
        expectedSettings
      );

      const result = await service.getSettingsByGroupType('test-group', {
        useCache: false,
      });

      expect(result).toEqual(expectedSettings);
      expect(mockSettingsRepository.findByGroupType).toHaveBeenCalledWith(
        'test-group'
      );
    });

    it('should return empty array for non-existent group type', async () => {
      mockSettingsRepository.findByGroupType.mockResolvedValue([]);

      const result = await service.getSettingsByGroupType('non-existent', {
        useCache: false,
      });

      expect(result).toEqual([]);
      expect(mockSettingsRepository.findByGroupType).toHaveBeenCalledWith(
        'non-existent'
      );
    });
  });

  describe('getSettingByGroupTypeAndKey', () => {
    it('should return setting for valid group type and key', async () => {
      mockSettingsRepository.findByGroupTypeAndKey.mockResolvedValue(
        mockSettings
      );

      const result = await service.getSettingByGroupTypeAndKey(
        'test-group',
        'test-key',
        { useCache: false }
      );

      expect(result).toEqual(mockSettings);
      expect(mockSettingsRepository.findByGroupTypeAndKey).toHaveBeenCalledWith(
        'test-group',
        'test-key'
      );
    });

    it('should return null for non-existent setting', async () => {
      mockSettingsRepository.findByGroupTypeAndKey.mockResolvedValue(null);

      const result = await service.getSettingByGroupTypeAndKey(
        'test-group',
        'non-existent',
        { useCache: false }
      );

      expect(result).toBeNull();
      expect(mockSettingsRepository.findByGroupTypeAndKey).toHaveBeenCalledWith(
        'test-group',
        'non-existent'
      );
    });
  });

  describe('createOrUpdateSettings', () => {
    it('should create text settings successfully', async () => {
      const formData = {
        siteName: 'Test Site',
        primaryColor: '#000000',
      };

      mockSettingsRepository.upsertByGroupTypeAndKey
        .mockResolvedValueOnce({
          ...mockSettings,
          key: 'siteName',
          value: 'Test Site',
        })
        .mockResolvedValueOnce({
          ...mockSettings,
          key: 'primaryColor',
          value: '#000000',
        });

      const result = await service.createOrUpdateSettings(
        'test-group',
        formData
      );

      expect(result).toHaveLength(2);
      expect(
        mockSettingsRepository.upsertByGroupTypeAndKey
      ).toHaveBeenCalledTimes(2);
    });

    it('should handle file upload in form data', async () => {
      const mockFile = {
        fieldname: 'logo',
        originalname: 'logo.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test'),
        size: 1024,
      } as Express.Multer.File;

      const formData = {
        siteName: 'Test Site',
        logo: mockFile,
      };

      mockFileManagementService.uploadSettingsFile.mockResolvedValue({
        filePath: 'settings/logo.jpg',
        originalName: 'logo.jpg',
        size: 1024,
        mimetype: 'image/jpeg',
      });

      mockSettingsRepository.upsertByGroupTypeAndKey
        .mockResolvedValueOnce({
          ...mockSettings,
          key: 'siteName',
          value: 'Test Site',
        })
        .mockResolvedValueOnce({
          ...mockSettings,
          key: 'logo',
          value: 'settings/logo.jpg',
          recordType: RecordType.FILE,
        });

      const result = await service.createOrUpdateSettings(
        'test-group',
        formData
      );

      expect(result).toHaveLength(2);
      expect(mockFileManagementService.uploadSettingsFile).toHaveBeenCalledWith(
        mockFile
      );
      expect(
        mockSettingsRepository.upsertByGroupTypeAndKey
      ).toHaveBeenCalledTimes(2);
    });

    it('should throw FileUploadSettingsException on file upload failure', async () => {
      const mockFile = {
        fieldname: 'logo',
        originalname: 'logo.jpg',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test'),
        size: 1024,
      } as Express.Multer.File;

      const formData = {
        logo: mockFile,
      };

      mockFileManagementService.uploadSettingsFile.mockRejectedValue(
        new Error('Upload failed')
      );

      await expect(
        service.createOrUpdateSettings('test-group', formData)
      ).rejects.toThrow(FileUploadSettingsException);

      expect(mockFileManagementService.uploadSettingsFile).toHaveBeenCalledWith(
        mockFile
      );
    });
  });

  describe('deleteSetting', () => {
    it('should delete text setting successfully', async () => {
      mockSettingsRepository.findByGroupTypeAndKey.mockResolvedValue(
        mockSettings
      );
      mockSettingsRepository.deleteByGroupTypeAndKey.mockResolvedValue(true);

      const result = await service.deleteSetting('test-group', 'test-key');

      expect(result).toBe(true);
      expect(mockSettingsRepository.findByGroupTypeAndKey).toHaveBeenCalledWith(
        'test-group',
        'test-key'
      );
      expect(
        mockSettingsRepository.deleteByGroupTypeAndKey
      ).toHaveBeenCalledWith('test-group', 'test-key');
    });

    it('should delete file setting and remove associated file', async () => {
      mockSettingsRepository.findByGroupTypeAndKey.mockResolvedValue(
        mockFileSettings
      );
      mockFileManagementService.fileExists.mockResolvedValue(true);
      mockFileManagementService.deleteFile.mockResolvedValue();
      mockSettingsRepository.deleteByGroupTypeAndKey.mockResolvedValue(true);

      const result = await service.deleteSetting('test-group', 'test-file-key');

      expect(result).toBe(true);
      expect(mockFileManagementService.fileExists).toHaveBeenCalledWith(
        'uploads/test-file.jpg'
      );
      expect(mockFileManagementService.deleteFile).toHaveBeenCalledWith(
        'uploads/test-file.jpg'
      );
      expect(
        mockSettingsRepository.deleteByGroupTypeAndKey
      ).toHaveBeenCalledWith('test-group', 'test-file-key');
    });

    it('should throw SettingsNotFoundException for non-existent setting', async () => {
      mockSettingsRepository.findByGroupTypeAndKey.mockResolvedValue(null);

      await expect(
        service.deleteSetting('test-group', 'non-existent')
      ).rejects.toThrow(SettingsNotFoundException);

      expect(mockSettingsRepository.findByGroupTypeAndKey).toHaveBeenCalledWith(
        'test-group',
        'non-existent'
      );
    });
  });

  describe('deleteGroupType', () => {
    it('should delete all settings for group type and clean up files', async () => {
      const settingsWithFiles = [mockSettings, mockFileSettings];
      mockSettingsRepository.findByGroupType.mockResolvedValue(
        settingsWithFiles
      );
      mockFileManagementService.fileExists.mockResolvedValue(true);
      mockFileManagementService.deleteFile.mockResolvedValue();
      mockSettingsRepository.deleteByGroupType.mockResolvedValue(2);

      const result = await service.deleteGroupType('test-group');

      expect(result).toBe(2);
      expect(mockSettingsRepository.findByGroupType).toHaveBeenCalledWith(
        'test-group'
      );
      expect(mockFileManagementService.fileExists).toHaveBeenCalledWith(
        'uploads/test-file.jpg'
      );
      expect(mockFileManagementService.deleteFile).toHaveBeenCalledWith(
        'uploads/test-file.jpg'
      );
      expect(mockSettingsRepository.deleteByGroupType).toHaveBeenCalledWith(
        'test-group'
      );
    });
  });

  describe('caching functionality', () => {
    it('should have cache stats method', async () => {
      const stats = await service.getCacheStats();
      expect(stats).toBeDefined();
      expect(typeof stats.keys).toBe('number');
    });

    it('should clear cache successfully', async () => {
      await expect(service.clearCache()).resolves.not.toThrow();
    });

    it('should clear cache for specific group type', async () => {
      await expect(service.clearCache('test-group')).resolves.not.toThrow();
    });
  });
});
