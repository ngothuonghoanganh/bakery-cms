/**
 * Payment Repository Tests
 * Unit tests for payment repository soft delete functionality
 */

import { PaymentModel } from '@bakery-cms/database';
import { PaymentStatus, PaymentMethod } from '@bakery-cms/common';
import { createPaymentRepository } from './payments.repositories';

// Mock PaymentModel
jest.mock('@bakery-cms/database', () => ({
  PaymentModel: {
    findByPk: jest.fn(),
    scope: jest.fn(),
  },
}));

describe('PaymentRepository - Soft Delete', () => {
  let repository: ReturnType<typeof createPaymentRepository>;
  let mockModel: jest.Mocked<typeof PaymentModel>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockModel = PaymentModel as jest.Mocked<typeof PaymentModel>;
    repository = createPaymentRepository(mockModel);
  });

  describe('delete', () => {
    it('should soft delete payment successfully', async () => {
      const paymentId = 'payment-123';
      const mockPayment = {
        id: paymentId,
        orderId: 'order-123',
        amount: 100000,
        method: PaymentMethod.VIETQR,
        status: PaymentStatus.PENDING,
        deletedAt: null,
        destroy: jest.fn().mockResolvedValue(undefined),
      };

      mockModel.findByPk.mockResolvedValue(mockPayment as any);

      const result = await repository.delete(paymentId);

      expect(result).toBe(true);
      expect(mockModel.findByPk).toHaveBeenCalledWith(paymentId);
      expect(mockPayment.destroy).toHaveBeenCalled();
    });

    it('should return false when payment not found', async () => {
      mockModel.findByPk.mockResolvedValue(null);

      const result = await repository.delete('non-existent-id');

      expect(result).toBe(false);
      expect(mockModel.findByPk).toHaveBeenCalledWith('non-existent-id');
    });

    it('should handle payment with PAID status', async () => {
      const paymentId = 'payment-paid';
      const mockPayment = {
        id: paymentId,
        orderId: 'order-123',
        amount: 100000,
        method: PaymentMethod.VIETQR,
        status: PaymentStatus.PAID,
        paidAt: new Date(),
        deletedAt: null,
        destroy: jest.fn().mockResolvedValue(undefined),
      };

      mockModel.findByPk.mockResolvedValue(mockPayment as any);

      const result = await repository.delete(paymentId);

      expect(result).toBe(true);
      expect(mockPayment.destroy).toHaveBeenCalled();
    });

    it('should handle database error during delete', async () => {
      const paymentId = 'payment-error';
      const mockPayment = {
        id: paymentId,
        destroy: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      mockModel.findByPk.mockResolvedValue(mockPayment as any);

      await expect(repository.delete(paymentId)).rejects.toThrow('Database error');
    });
  });

  describe('restore', () => {
    it('should restore soft-deleted payment successfully', async () => {
      const paymentId = 'payment-deleted';
      const mockDeletedPayment = {
        id: paymentId,
        orderId: 'order-123',
        amount: 100000,
        method: PaymentMethod.CASH,
        status: PaymentStatus.PENDING,
        deletedAt: new Date('2024-01-15'),
        restore: jest.fn().mockResolvedValue(undefined),
      };

      const mockScope = {
        findByPk: jest.fn().mockResolvedValue(mockDeletedPayment),
      };
      mockModel.scope.mockReturnValue(mockScope as any);

      const result = await repository.restore(paymentId);

      expect(result).toEqual(mockDeletedPayment);
      expect(mockModel.scope).toHaveBeenCalledWith('withDeleted');
      expect(mockScope.findByPk).toHaveBeenCalledWith(paymentId);
      expect(mockDeletedPayment.restore).toHaveBeenCalled();
    });

    it('should return null when payment not found', async () => {
      const mockScope = {
        findByPk: jest.fn().mockResolvedValue(null),
      };
      mockModel.scope.mockReturnValue(mockScope as any);

      const result = await repository.restore('non-existent-id');

      expect(result).toBeNull();
      expect(mockModel.scope).toHaveBeenCalledWith('withDeleted');
    });

    it('should return null when payment is not deleted', async () => {
      const mockActivePayment = {
        id: 'payment-active',
        deletedAt: null,
        restore: jest.fn(),
      };

      const mockScope = {
        findByPk: jest.fn().mockResolvedValue(mockActivePayment),
      };
      mockModel.scope.mockReturnValue(mockScope as any);

      const result = await repository.restore('payment-active');

      expect(result).toBeNull();
      expect(mockActivePayment.restore).not.toHaveBeenCalled();
    });

    it('should restore payment with PAID status', async () => {
      const paymentId = 'payment-paid-deleted';
      const mockDeletedPayment = {
        id: paymentId,
        orderId: 'order-456',
        amount: 200000,
        method: PaymentMethod.BANK_TRANSFER,
        status: PaymentStatus.PAID,
        paidAt: new Date('2024-01-10'),
        deletedAt: new Date('2024-01-15'),
        restore: jest.fn().mockResolvedValue(undefined),
      };

      const mockScope = {
        findByPk: jest.fn().mockResolvedValue(mockDeletedPayment),
      };
      mockModel.scope.mockReturnValue(mockScope as any);

      const result = await repository.restore(paymentId);

      expect(result).toEqual(mockDeletedPayment);
      expect(mockDeletedPayment.restore).toHaveBeenCalled();
    });

    it('should handle database error during restore', async () => {
      const mockDeletedPayment = {
        id: 'payment-error',
        deletedAt: new Date(),
        restore: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      const mockScope = {
        findByPk: jest.fn().mockResolvedValue(mockDeletedPayment),
      };
      mockModel.scope.mockReturnValue(mockScope as any);

      await expect(repository.restore('payment-error')).rejects.toThrow('Database error');
    });
  });

  describe('delete and restore workflow', () => {
    it('should handle complete delete-restore cycle', async () => {
      const paymentId = 'payment-cycle';
      
      // Step 1: Delete
      const mockPayment = {
        id: paymentId,
        orderId: 'order-789',
        amount: 150000,
        method: PaymentMethod.VIETQR,
        status: PaymentStatus.PENDING,
        deletedAt: null as Date | null,
        destroy: jest.fn().mockResolvedValue(undefined),
        restore: jest.fn().mockResolvedValue(undefined),
      };

      mockModel.findByPk.mockResolvedValue(mockPayment as any);

      const deleteResult = await repository.delete(paymentId);
      expect(deleteResult).toBe(true);

      // Step 2: Simulate payment is now soft-deleted
      mockPayment.deletedAt = new Date();

      // Step 3: Restore
      const mockScope = {
        findByPk: jest.fn().mockResolvedValue(mockPayment),
      };
      mockModel.scope.mockReturnValue(mockScope as any);

      const restoreResult = await repository.restore(paymentId);
      expect(restoreResult).toEqual(mockPayment);
      expect(mockPayment.restore).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle payment with VietQR data during delete', async () => {
      const mockPayment = {
        id: 'payment-vietqr',
        orderId: 'order-123',
        amount: 100000,
        method: PaymentMethod.VIETQR,
        status: PaymentStatus.PENDING,
        vietqrData: JSON.stringify({
          bankId: 'VCB',
          accountNo: '123456789',
          amount: 100000,
        }),
        deletedAt: null,
        destroy: jest.fn().mockResolvedValue(undefined),
      };

      mockModel.findByPk.mockResolvedValue(mockPayment as any);

      const result = await repository.delete('payment-vietqr');

      expect(result).toBe(true);
      expect(mockPayment.destroy).toHaveBeenCalled();
    });

    it('should handle payment with transaction ID during restore', async () => {
      const mockPayment = {
        id: 'payment-transaction',
        orderId: 'order-456',
        amount: 200000,
        method: PaymentMethod.BANK_TRANSFER,
        status: PaymentStatus.PAID,
        transactionId: 'TXN-123456',
        paidAt: new Date(),
        deletedAt: new Date(),
        restore: jest.fn().mockResolvedValue(undefined),
      };

      const mockScope = {
        findByPk: jest.fn().mockResolvedValue(mockPayment),
      };
      mockModel.scope.mockReturnValue(mockScope as any);

      const result = await repository.restore('payment-transaction');

      expect(result).toEqual(mockPayment);
      expect(mockPayment.restore).toHaveBeenCalled();
    });

    it('should handle payment with notes during soft delete', async () => {
      const mockPayment = {
        id: 'payment-notes',
        orderId: 'order-789',
        amount: 50000,
        method: PaymentMethod.CASH,
        status: PaymentStatus.PENDING,
        notes: 'Customer paid in cash at counter',
        deletedAt: null,
        destroy: jest.fn().mockResolvedValue(undefined),
      };

      mockModel.findByPk.mockResolvedValue(mockPayment as any);

      const result = await repository.delete('payment-notes');

      expect(result).toBe(true);
      expect(mockPayment.destroy).toHaveBeenCalled();
    });
  });
});
