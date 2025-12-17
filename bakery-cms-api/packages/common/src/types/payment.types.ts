/**
 * Payment entity types and interfaces
 * Supports multiple payment methods including VietQR
 */

import { Result } from './result.types';
import { AppError } from './error.types';

/**
 * Payment entity
 */
export type Payment = {
  readonly id: string;
  readonly orderId: string;
  readonly amount: number;
  readonly method: string; // PaymentMethod enum value
  readonly status: string; // PaymentStatus enum value
  readonly transactionId: string | null;
  readonly vietqrData: string | null;
  readonly notes: string | null;
  readonly paidAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

/**
 * Data Transfer Object for creating a payment
 */
export type CreatePaymentDTO = {
  readonly orderId: string;
  readonly amount: number;
  readonly method: string;
  readonly notes?: string;
};

/**
 * VietQR data structure
 */
export type VietQRData = {
  readonly accountNo: string;
  readonly accountName: string;
  readonly bankBin: string;
  readonly amount: number;
  readonly description: string;
  readonly qrDataURL: string;
};

/**
 * Payment repository interface (Dependency Inversion Principle)
 */
export type PaymentRepository = {
  readonly findById: (id: string) => Promise<Payment | null>;
  readonly findByOrderId: (orderId: string) => Promise<Payment | null>;
  readonly create: (data: CreatePaymentDTO) => Promise<Payment>;
  readonly updateStatus: (id: string, status: string, paidAt?: Date) => Promise<Payment | null>;
  readonly updateVietQR: (id: string, vietqrData: string) => Promise<Payment | null>;
  readonly markAsPaid: (id: string, transactionId?: string) => Promise<Payment | null>;
};

/**
 * Payment service interface (Dependency Inversion Principle)
 */
export type PaymentService = {
  readonly createPayment: (data: CreatePaymentDTO) => Promise<Result<Payment, AppError>>;
  readonly getPaymentByOrderId: (orderId: string) => Promise<Result<Payment, AppError>>;
  readonly markAsPaid: (id: string, transactionId?: string) => Promise<Result<Payment, AppError>>;
  readonly generateVietQR: (paymentId: string) => Promise<Result<VietQRData, AppError>>;
};
