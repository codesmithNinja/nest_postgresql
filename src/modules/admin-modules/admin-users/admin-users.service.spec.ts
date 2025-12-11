import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

// Mock bcrypt before importing anything else
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));
import { AdminUsersService } from './admin-users.service';
import { EmailService } from '../../../email/email.service';
import {
  IAdminRepository,
  ADMIN_REPOSITORY,
} from '../../../database/repositories/admin/admin.repository.interface';
import { Admin } from '../../../database/entities/admin.entity';
import {
  AdminNotFoundException,
  AdminAlreadyExistsException,
  InvalidAdminCredentialsException,
  InactiveAdminException,
  AdminPasswordMismatchException,
} from './exceptions/admin.exceptions';
import {
  CreateAdminDto,
  AdminLoginDto,
  UpdatePasswordDto,
} from './dto/admin-user.dto';

describe('AdminUsersService', () => {
  let service: AdminUsersService;
  let adminRepository: jest.Mocked<IAdminRepository>;
  let jwtService: jest.Mocked<JwtService>;

  const mockAdmin: Admin = {
    id: '1',
    publicId: 'pub-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'admin@example.com',
    password: '$2a$12$hashedpassword',
    active: true,
    loginIpAddress: '127.0.0.1',
    currentLoginDateTime: new Date(),
    lastLoginDateTime: new Date(),
    twoFactorAuthVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAdminRepository = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findByPublicId: jest.fn(),
    findByResetToken: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    updatePassword: jest.fn(),
    deleteById: jest.fn(),
    findWithPagination: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockEmailService = {
    sendPasswordResetEmail: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminUsersService,
        {
          provide: ADMIN_REPOSITORY,
          useValue: mockAdminRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AdminUsersService>(AdminUsersService);
    adminRepository = module.get(ADMIN_REPOSITORY);
    jwtService = module.get(JwtService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('createAdmin', () => {
    const createAdminDto: CreateAdminDto = {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      password: 'password123',
      passwordConfirm: 'password123',
      active: true,
      twoFactorAuthVerified: false,
      publicId: '',
    };

    it('should create admin successfully', async () => {
      adminRepository.findByEmail.mockResolvedValue(null);
      adminRepository.insert.mockResolvedValue(mockAdmin);

      const result = await service.createAdmin(createAdminDto);

      expect(mockAdminRepository.findByEmail).toHaveBeenCalledWith(
        createAdminDto.email
      );
      expect(mockAdminRepository.insert).toHaveBeenCalled();
      expect(result.email).toBe(mockAdmin.email);
    });

    it('should throw AdminPasswordMismatchException when passwords do not match', async () => {
      const dto = { ...createAdminDto, passwordConfirm: 'different' };

      await expect(service.createAdmin(dto)).rejects.toThrow(
        AdminPasswordMismatchException
      );
    });

    it('should throw AdminAlreadyExistsException when admin exists', async () => {
      adminRepository.findByEmail.mockResolvedValue(mockAdmin);

      await expect(service.createAdmin(createAdminDto)).rejects.toThrow(
        AdminAlreadyExistsException
      );
    });
  });

  describe('login', () => {
    const loginDto: AdminLoginDto = {
      email: 'admin@example.com',
      password: 'password123',
    };

    beforeEach(async () => {
      const bcrypt = await import('bcryptjs');
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    });

    it('should login successfully', async () => {
      adminRepository.findByEmail.mockResolvedValue(mockAdmin);
      adminRepository.update.mockResolvedValue(mockAdmin);
      jwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login(loginDto, '127.0.0.1');

      expect(result.access_token).toBe('jwt-token');
      expect(result.admin.email).toBe(mockAdmin.email);
    });

    it('should throw InvalidAdminCredentialsException when admin not found', async () => {
      adminRepository.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto, '127.0.0.1')).rejects.toThrow(
        InvalidAdminCredentialsException
      );
    });

    it('should throw InactiveAdminException when admin is inactive', async () => {
      const inactiveAdmin = { ...mockAdmin, active: false };
      adminRepository.findByEmail.mockResolvedValue(inactiveAdmin);

      await expect(service.login(loginDto, '127.0.0.1')).rejects.toThrow(
        InactiveAdminException
      );
    });

    it('should throw InvalidAdminCredentialsException when password is wrong', async () => {
      const bcrypt = await import('bcryptjs');
      adminRepository.findByEmail.mockResolvedValue(mockAdmin);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto, '127.0.0.1')).rejects.toThrow(
        InvalidAdminCredentialsException
      );
    });
  });

  describe('getProfile', () => {
    it('should return admin profile successfully', async () => {
      adminRepository.findById.mockResolvedValue(mockAdmin);

      const result = await service.getProfile('1');

      expect(result.email).toBe(mockAdmin.email);
      expect(mockAdminRepository.findById).toHaveBeenCalledWith('1');
    });

    it('should throw AdminNotFoundException when admin not found', async () => {
      adminRepository.findById.mockResolvedValue(null);

      await expect(service.getProfile('1')).rejects.toThrow(
        AdminNotFoundException
      );
    });
  });

  describe('getAdminByPublicId', () => {
    it('should return admin by public ID successfully', async () => {
      adminRepository.findByPublicId.mockResolvedValue(mockAdmin);

      const result = await service.getAdminByPublicId('pub-1');

      expect(result.email).toBe(mockAdmin.email);
      expect(mockAdminRepository.findByPublicId).toHaveBeenCalledWith('pub-1');
    });

    it('should throw AdminNotFoundException when admin not found', async () => {
      adminRepository.findByPublicId.mockResolvedValue(null);

      await expect(service.getAdminByPublicId('pub-1')).rejects.toThrow(
        AdminNotFoundException
      );
    });
  });

  describe('updatePassword', () => {
    const updatePasswordDto: UpdatePasswordDto = {
      currentPassword: 'oldpassword',
      newPassword: 'newpassword123',
      confirmPassword: 'newpassword123',
    };

    it('should update password successfully', async () => {
      const bcrypt = await import('bcryptjs');
      adminRepository.findById.mockResolvedValue(mockAdmin);
      adminRepository.updatePassword.mockResolvedValue(mockAdmin);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await service.updatePassword('1', updatePasswordDto);

      expect(mockAdminRepository.updatePassword).toHaveBeenCalled();
    });

    it('should throw AdminNotFoundException when admin not found', async () => {
      adminRepository.findById.mockResolvedValue(null);

      await expect(
        service.updatePassword('1', updatePasswordDto)
      ).rejects.toThrow(AdminNotFoundException);
    });

    it('should throw AdminPasswordMismatchException when new passwords do not match', async () => {
      const bcrypt = await import('bcryptjs');
      const dto = { ...updatePasswordDto, confirmPassword: 'different' };
      adminRepository.findById.mockResolvedValue(mockAdmin);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.updatePassword('1', dto)).rejects.toThrow(
        AdminPasswordMismatchException
      );
    });
  });

  describe('getAllAdmins', () => {
    it('should return paginated admin list', async () => {
      const mockResult = {
        items: [mockAdmin],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalCount: 1,
          limit: 10,
          hasNext: false,
          hasPrev: false,
        },
      };
      adminRepository.findWithPagination.mockResolvedValue(mockResult);

      const result = await service.getAllAdmins({
        page: 1,
        limit: 10,
      });

      expect(result.admins).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });
  });

  describe('deleteAdmin', () => {
    it('should delete admin successfully', async () => {
      adminRepository.findByPublicId.mockResolvedValue(mockAdmin);
      adminRepository.deleteById.mockResolvedValue(true);

      await service.deleteAdmin('pub-1');

      expect(mockAdminRepository.deleteById).toHaveBeenCalledWith('1');
    });

    it('should throw AdminNotFoundException when admin not found', async () => {
      adminRepository.findByPublicId.mockResolvedValue(null);

      await expect(service.deleteAdmin('pub-1')).rejects.toThrow(
        AdminNotFoundException
      );
    });
  });
});
