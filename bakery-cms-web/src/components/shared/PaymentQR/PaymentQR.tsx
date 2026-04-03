/**
 * PaymentQR shared component
 */

import { Card } from '@/components/core';
import type { VietQRData } from '@/types/models/payment.model';
import { formatCurrency } from '@/utils/format.utils';

export type PaymentQRProps = {
  readonly qrData: VietQRData;
};

export const PaymentQR = ({ qrData }: PaymentQRProps): React.JSX.Element => (
  <Card title="VietQR Payment">
    <div className="flex flex-col items-center gap-4">
      <img src={qrData.qrDataURL ?? ''} alt="QR Code" className="w-64 h-64" />
      <div className="text-center">
        <p>
          <strong>Account:</strong> {qrData.accountNo}
        </p>
        <p>
          <strong>Name:</strong> {qrData.accountName}
        </p>
        <p>
          <strong>Amount:</strong> {formatCurrency(qrData.amount)}
        </p>
        <p className="text-sm text-gray-600">{qrData.addInfo}</p>
      </div>
    </div>
  </Card>
);
