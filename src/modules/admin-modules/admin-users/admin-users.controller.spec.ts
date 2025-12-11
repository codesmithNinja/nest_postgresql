import { Test, TestingModule } from '@nestjs/testing';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import {
  AdminResponseDto,
  AdminLoginDto,
  CreateAdminDto,
  UpdateAdminDto,
  UpdatePasswordDto,
  AdminLoginResponseDto,
  AdminPaginationResponseDto,
} from './dto/admin-user.dto';
import { RequestWithAdmin } from './interfaces/admin-request.interface';

describe('AdminUsersController', () => {
  let controller: AdminUsersController;
  let service: jest.Mocked<AdminUsersService>;

  const mockAdminResponse: AdminResponseDto = {
    id: '1',
    publicId: 'pub-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'admin@example.com',
    active: true,
    loginIpAddress: '127.0.0.1',
    currentLoginDateTime: new Date(),
    lastLoginDateTime: new Date(),
    twoFactorAuthVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockLoginResponse: AdminLoginResponseDto = {
    access_token: 'jwt-token',
    admin: mockAdminResponse,
  };

  const mockPaginationResponse: AdminPaginationResponseDto = {
    admins: [mockAdminResponse],
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
  };

  const mockAdminService = {
    createAdmin: jest.fn(),
    login: jest.fn(),
    getProfile: jest.fn(),
    getAllAdmins: jest.fn(),
    getAdminByPublicId: jest.fn(),
    updateAdmin: jest.fn(),
    deleteAdmin: jest.fn(),
    updatePassword: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    logout: jest.fn(),
  };

  const mockRequest: Partial<RequestWithAdmin> = {
    user: { id: '1', email: 'admin@example.com' },
    ip: '127.0.0.1',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminUsersController],
      providers: [
        {
          provide: AdminUsersService,
          useValue: mockAdminService,
        },
      ],
    }).compile();

    controller = module.get<AdminUsersController>(AdminUsersController);
    service = module.get(AdminUsersService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login admin successfully', async () => {
      const loginDto: AdminLoginDto = {
        email: 'admin@example.com',
        password: 'password123',
      };

      service.login.mockResolvedValue(mockLoginResponse);

      const result = await controller.login(
        loginDto,
        mockRequest as RequestWithAdmin
      );

      expect(mockAdminService.login).toHaveBeenCalledWith(
        loginDto,
        '127.0.0.1'
      );
      expect(result.data).toEqual(mockLoginResponse);
    });
  });

  describe('getProfile', () => {
    it('should get current admin profile', async () => {
      service.getProfile.mockResolvedValue(mockAdminResponse);

      const result = await controller.getProfile(
        mockRequest as RequestWithAdmin
      );

      expect(mockAdminService.getProfile).toHaveBeenCalledWith('1');
      expect(result).toBe(mockAdminResponse);
    });
  });

  describe('getAllAdmins', () => {
    it('should get all admins with pagination', async () => {
      const filterDto = { page: 1, limit: 10 };
      service.getAllAdmins.mockResolvedValue(mockPaginationResponse);

      const result = await controller.getAllAdmins(filterDto);

      expect(mockAdminService.getAllAdmins).toHaveBeenCalledWith(filterDto);
      expect(result).toEqual(mockPaginationResponse);
    });
  });

  describe('getAdminByPublicId', () => {
    it('should get admin by public ID', async () => {
      service.getAdminByPublicId.mockResolvedValue(mockAdminResponse);

      const result = await controller.getAdminByPublicId('pub-1');

      expect(mockAdminService.getAdminByPublicId).toHaveBeenCalledWith('pub-1');
      expect(result).toBe(mockAdminResponse);
    });
  });

  describe('createAdmin', () => {
    it('should create admin successfully', async () => {
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

      service.createAdmin.mockResolvedValue(mockAdminResponse);

      const result = await controller.createAdmin(
        createAdminDto,
        null as unknown as Express.Multer.File
      );

      expect(mockAdminService.createAdmin).toHaveBeenCalledWith(createAdminDto);
      expect(result).toBe(mockAdminResponse);
    });

    it('should create admin with photo upload', async () => {
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

      const mockFile = {
        originalname: 'photo.jpg',
        mimetype: 'image/jpeg',
        size: 1000,
        buffer: Buffer.from('test'),
      } as unknown as Express.Multer.File;

      service.createAdmin.mockResolvedValue(mockAdminResponse);

      // Mock FileUploadUtil.uploadFile
      jest.doMock('../../../common/utils/file-upload.util', () => ({
        FileUploadUtil: {
          uploadFile: jest.fn().mockResolvedValue({
            filePath: 'admins/photo.jpg',
            url: 'https://example.com/admins/photo.jpg',
          }),
        },
        getBucketName: jest.fn().mockReturnValue('admins'),
      }));

      await controller.createAdmin(createAdminDto, mockFile);

      expect(mockAdminService.createAdmin).toHaveBeenCalled();
    });
  });

  describe('updateAdmin', () => {
    it('should update admin successfully', async () => {
      const updateAdminDto: UpdateAdminDto = {
        firstName: 'Updated',
        lastName: 'Name',
      };

      service.updateAdmin.mockResolvedValue(mockAdminResponse);
      service.getAdminByPublicId.mockResolvedValue(mockAdminResponse);

      const result = await controller.updateAdmin(
        'pub-1',
        updateAdminDto,
        null as unknown as Express.Multer.File
      );

      expect(mockAdminService.updateAdmin).toHaveBeenCalledWith(
        'pub-1',
        updateAdminDto
      );
      expect(result).toBe(mockAdminResponse);
    });
  });

  describe('deleteAdmin', () => {
    it('should delete admin successfully', async () => {
      service.deleteAdmin.mockResolvedValue(undefined);

      const result = await controller.deleteAdmin('pub-1');

      expect(mockAdminService.deleteAdmin).toHaveBeenCalledWith('pub-1');
      expect(result.message).toBe('Admin deleted successfully');
    });
  });

  describe('updatePassword', () => {
    it('should update password successfully', async () => {
      const updatePasswordDto: UpdatePasswordDto = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      };

      service.updatePassword.mockResolvedValue(undefined);

      const result = await controller.updatePassword(
        updatePasswordDto,
        mockRequest as RequestWithAdmin
      );

      expect(mockAdminService.updatePassword).toHaveBeenCalledWith(
        '1',
        updatePasswordDto
      );
      expect(result.message).toBe('Password updated successfully');
    });
  });

  describe('forgotPassword', () => {
    it('should request password reset', async () => {
      const forgotPasswordDto = { email: 'admin@example.com' };
      service.forgotPassword.mockResolvedValue(undefined);

      const result = await controller.forgotPassword(forgotPasswordDto);

      expect(mockAdminService.forgotPassword).toHaveBeenCalledWith(
        forgotPasswordDto
      );
      expect(result.message).toBe('Password reset email sent if admin exists');
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const resetPasswordDto = {
        token: 'reset-token',
        password: 'newpassword123',
        confirmPassword: 'newpassword123',
      };
      service.resetPassword.mockResolvedValue(undefined);

      const result = await controller.resetPassword(resetPasswordDto);

      expect(mockAdminService.resetPassword).toHaveBeenCalledWith(
        resetPasswordDto
      );
      expect(result.message).toBe('Password reset successful');
    });
  });

  describe('logout', () => {
    it('should logout admin successfully', () => {
      service.logout.mockReturnValue(undefined);

      const result = controller.logout();

      expect(mockAdminService.logout).toHaveBeenCalled();
      expect(result.message).toBe('Admin logged out successfully');
    });
  });
});
