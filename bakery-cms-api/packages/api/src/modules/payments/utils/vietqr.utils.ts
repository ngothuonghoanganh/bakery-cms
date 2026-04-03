/**
 * VietQR utilities
 * Generates payment QR data using VietQR API with Quick Link fallback
 */

const VIETQR_GENERATE_API_URL = 'https://api.vietqr.io/v2/generate';
const VIETQR_QUICK_LINK_BASE_URL = 'https://img.vietqr.io/image';
const DEFAULT_TEMPLATE = 'compact';
const MAX_ACCOUNT_NAME_LENGTH = 50;
const MAX_ADD_INFO_LENGTH = 25;

export interface VietQRCredentials {
  clientId: string;
  apiKey: string;
}

export interface GenerateVietQRInput {
  bankBin: string;
  accountNo: string;
  accountName: string;
  amount: number;
  addInfo: string;
  template?: string;
}

export interface GenerateVietQROutput {
  qrDataURL: string;
  qrContent: string;
  accountName: string;
  addInfo: string;
  template: string;
  source: 'api' | 'quicklink';
  warning?: string;
}

type VietQRGenerateResponse = {
  code?: string;
  desc?: string;
  data?: {
    qrCode?: string;
    qrDataURL?: string;
  };
};

const removeDiacritics = (value: string): string => {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, (match) => (match === 'đ' ? 'd' : 'D'));
};

export const sanitizeVietQRAccountName = (value: string): string => {
  return removeDiacritics(value)
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_ACCOUNT_NAME_LENGTH);
};

export const sanitizeVietQRAddInfo = (value: string): string => {
  return removeDiacritics(value)
    .replace(/[^A-Za-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_ADD_INFO_LENGTH);
};

const toPositiveIntegerAmount = (amount: number): number => {
  const value = Number.isFinite(amount) ? Math.round(amount) : 0;
  return value > 0 ? value : 0;
};

const toQuickLinkURL = (
  bankBin: string,
  accountNo: string,
  amount: number,
  addInfo: string,
  accountName: string,
  template: string
): string => {
  const params = new URLSearchParams();
  if (amount > 0) {
    params.set('amount', String(amount));
  }
  if (addInfo) {
    params.set('addInfo', addInfo);
  }
  if (accountName) {
    params.set('accountName', accountName);
  }

  const query = params.toString();
  const base = `${VIETQR_QUICK_LINK_BASE_URL}/${encodeURIComponent(bankBin)}-${encodeURIComponent(
    accountNo
  )}-${encodeURIComponent(template)}.png`;
  return query ? `${base}?${query}` : base;
};

const toFallbackQRContent = (
  bankBin: string,
  accountNo: string,
  amount: number,
  addInfo: string
): string => {
  return `${bankBin}|${accountNo}|${amount}|${addInfo}`;
};

export const generateVietQRData = async (
  input: GenerateVietQRInput,
  credentials: VietQRCredentials | null
): Promise<GenerateVietQROutput> => {
  const template = input.template ?? DEFAULT_TEMPLATE;
  const bankBin = input.bankBin.trim();
  const accountNo = input.accountNo.trim();
  const amount = toPositiveIntegerAmount(input.amount);
  const normalizedAccountName = sanitizeVietQRAccountName(input.accountName);
  const accountName =
    normalizedAccountName.length >= 5 ? normalizedAccountName : 'BAKERY CMS';
  const normalizedAddInfo = sanitizeVietQRAddInfo(input.addInfo);
  const addInfo = normalizedAddInfo || 'PAYMENT';
  const fallbackQRDataURL = toQuickLinkURL(
    bankBin,
    accountNo,
    amount,
    addInfo,
    accountName,
    template
  );
  const fallbackQRContent = toFallbackQRContent(bankBin, accountNo, amount, addInfo);

  if (!credentials?.clientId || !credentials?.apiKey) {
    return {
      qrDataURL: fallbackQRDataURL,
      qrContent: fallbackQRContent,
      accountName,
      addInfo,
      template,
      source: 'quicklink',
      warning: 'VietQR API credentials are missing',
    };
  }

  try {
    const acqId = Number.parseInt(bankBin, 10);
    if (!Number.isFinite(acqId)) {
      return {
        qrDataURL: fallbackQRDataURL,
        qrContent: fallbackQRContent,
        accountName,
        addInfo,
        template,
        source: 'quicklink',
        warning: 'Invalid bank BIN for VietQR API',
      };
    }

    const response = await fetch(VIETQR_GENERATE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': credentials.clientId,
        'x-api-key': credentials.apiKey,
      },
      body: JSON.stringify({
        accountNo,
        accountName,
        acqId,
        amount,
        addInfo,
        template,
      }),
    });

    const responseText = await response.text();

    if (!response.ok) {
      return {
        qrDataURL: fallbackQRDataURL,
        qrContent: fallbackQRContent,
        accountName,
        addInfo,
        template,
        source: 'quicklink',
        warning: `VietQR API HTTP ${response.status}: ${responseText}`,
      };
    }

    let payload: VietQRGenerateResponse | null = null;
    try {
      payload = JSON.parse(responseText) as VietQRGenerateResponse;
    } catch {
      payload = null;
    }

    const responseCode = payload?.code ?? '';
    const responseDesc = payload?.desc ?? '';
    const qrContent = payload?.data?.qrCode?.trim() ?? '';
    const qrDataURL = payload?.data?.qrDataURL?.trim() ?? '';

    if (responseCode && responseCode !== '00') {
      return {
        qrDataURL: fallbackQRDataURL,
        qrContent: qrContent || fallbackQRContent,
        accountName,
        addInfo,
        template,
        source: 'quicklink',
        warning: `VietQR API returned code ${responseCode}: ${responseDesc}`,
      };
    }

    if (!qrContent) {
      return {
        qrDataURL: fallbackQRDataURL,
        qrContent: fallbackQRContent,
        accountName,
        addInfo,
        template,
        source: 'quicklink',
        warning: 'VietQR API response missing qrCode',
      };
    }

    return {
      qrDataURL: qrDataURL || fallbackQRDataURL,
      qrContent,
      accountName,
      addInfo,
      template,
      source: 'api',
    };
  } catch (error) {
    return {
      qrDataURL: fallbackQRDataURL,
      qrContent: fallbackQRContent,
      accountName,
      addInfo,
      template,
      source: 'quicklink',
      warning: error instanceof Error ? error.message : 'Unknown VietQR error',
    };
  }
};
