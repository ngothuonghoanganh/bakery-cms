/**
 * SettingsPage
 * System settings management
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Empty,
  Form,
  Image,
  Input,
  InputNumber,
  Select,
  Space,
  Spin,
  Tabs,
} from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/shared/PageHeader/PageHeader';
import { FileUpload } from '@/components/shared/FileUpload';
import { fileService } from '@/services/file.service';
import { settingsService } from '@/services/settings.service';
import { useNotification } from '@/hooks/useNotification';
import { useAuthStore } from '@/stores/authStore';
import { UserRole } from '@/services/auth.service';
import type {
  InvoiceLanguage,
  StoreProfile,
  VietQRBank,
} from '@/types/models/settings.model';

type BankReceiverFormValues = {
  bankBin: string;
  accountNo: string;
  accountName: string;
};

type OrderExtraFeeFormValue = {
  id: string;
  name: string;
  defaultAmount: number;
};

type OrderExtraFeesFormValues = {
  fees: OrderExtraFeeFormValue[];
};

type InvoiceLanguageFormValues = {
  language: InvoiceLanguage;
};

type StoreProfileFormValues = StoreProfile;

const normalizeAccountName = (value: string): string => {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, (match) => (match === 'đ' ? 'd' : 'D'))
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trimStart();
};

const createFeeId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `fee-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

export const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { success, error: notifyError } = useNotification();
  const { user } = useAuthStore();
  const [form] = Form.useForm<BankReceiverFormValues>();
  const [extraFeesForm] = Form.useForm<OrderExtraFeesFormValues>();
  const [invoiceLanguageForm] = Form.useForm<InvoiceLanguageFormValues>();
  const [storeProfileForm] = Form.useForm<StoreProfileFormValues>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingExtraFees, setSavingExtraFees] = useState(false);
  const [savingInvoiceLanguage, setSavingInvoiceLanguage] = useState(false);
  const [savingStoreProfile, setSavingStoreProfile] = useState(false);
  const [banks, setBanks] = useState<VietQRBank[]>([]);
  const storeLogoUrl = String(Form.useWatch('logoUrl', storeProfileForm) ?? '').trim();

  const isReadOnly = user?.role !== UserRole.ADMIN;

  const bankOptions = useMemo(
    () =>
      banks.map((bank) => ({
        value: bank.bin,
        label: `${bank.shortName || bank.name} (${bank.code} - ${bank.bin})`,
      })),
    [banks]
  );

  const loadData = useCallback(async () => {
    setLoading(true);

    const [settingsResult, banksResult] = await Promise.all([
      settingsService.getSystemSettings(),
      settingsService.getVietQRBanks(),
    ]);

    if (settingsResult.success) {
      if (settingsResult.data.bankReceiver) {
        form.setFieldsValue({
          bankBin: settingsResult.data.bankReceiver.bankBin,
          accountNo: settingsResult.data.bankReceiver.accountNo,
          accountName: settingsResult.data.bankReceiver.accountName,
        });
      }

      extraFeesForm.setFieldsValue({
        fees: (settingsResult.data.orderExtraFees || []).map((fee) => ({
          id: fee.id,
          name: fee.name,
          defaultAmount: fee.defaultAmount,
        })),
      });
      invoiceLanguageForm.setFieldsValue({
        language: settingsResult.data.invoiceLanguage,
      });
      storeProfileForm.setFieldsValue({
        name: settingsResult.data.storeProfile.name,
        logoUrl: settingsResult.data.storeProfile.logoUrl || '',
      });
    } else {
      notifyError(
        t('settings.bankReceiver.loadSettingsFailed'),
        settingsResult.error.message
      );
    }

    if (banksResult.success) {
      setBanks(banksResult.data);
    } else {
      notifyError(
        t('settings.bankReceiver.loadBanksFailed'),
        banksResult.error.message
      );
    }

    setLoading(false);
  }, [extraFeesForm, form, invoiceLanguageForm, notifyError, storeProfileForm, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async (values: BankReceiverFormValues) => {
    setSaving(true);

    const result = await settingsService.updateBankReceiver({
      ...values,
      accountName: normalizeAccountName(values.accountName).trim(),
    });

    if (result.success) {
      success(t('settings.bankReceiver.saveSuccess'));
    } else {
      notifyError(t('settings.bankReceiver.saveFailed'), result.error.message);
    }

    setSaving(false);
  };

  const handleSaveExtraFees = async (values: OrderExtraFeesFormValues) => {
    setSavingExtraFees(true);

    const normalizedFees = (values.fees || [])
      .map((fee) => ({
        id: fee.id || createFeeId(),
        name: String(fee.name || '').trim(),
        defaultAmount: Number(fee.defaultAmount || 0),
      }))
      .filter((fee) => fee.name.length > 0);

    const result = await settingsService.updateOrderExtraFees({
      fees: normalizedFees,
    });

    if (result.success) {
      extraFeesForm.setFieldsValue({
        fees: result.data.map((fee) => ({
          id: fee.id,
          name: fee.name,
          defaultAmount: fee.defaultAmount,
        })),
      });
      success(t('settings.orderExtraFees.saveSuccess'));
    } else {
      notifyError(t('settings.orderExtraFees.saveFailed'), result.error.message);
    }

    setSavingExtraFees(false);
  };

  const handleSaveInvoiceLanguage = async (
    values: InvoiceLanguageFormValues
  ) => {
    setSavingInvoiceLanguage(true);

    const result = await settingsService.updateInvoiceLanguage({
      language: values.language,
    });

    if (result.success) {
      invoiceLanguageForm.setFieldsValue({
        language: result.data,
      });
      success(t('settings.invoiceLanguage.saveSuccess'));
    } else {
      notifyError(
        t('settings.invoiceLanguage.saveFailed'),
        result.error.message
      );
    }

    setSavingInvoiceLanguage(false);
  };

  const handleSaveStoreProfile = async (values: StoreProfileFormValues) => {
    setSavingStoreProfile(true);

    const result = await settingsService.updateStoreProfile({
      name: values.name,
      logoUrl: values.logoUrl?.trim() || null,
    });

    if (result.success) {
      storeProfileForm.setFieldsValue({
        name: result.data.name,
        logoUrl: result.data.logoUrl || '',
      });
      success(t('settings.storeProfile.saveSuccess'));
    } else {
      notifyError(t('settings.storeProfile.saveFailed'), result.error.message);
    }

    setSavingStoreProfile(false);
  };

  const bankReceiverTabContent = (
    <Card>
      {isReadOnly && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={t('settings.bankReceiver.readOnlyWarning')}
        />
      )}

      <Form<BankReceiverFormValues>
        form={form}
        layout="vertical"
        onFinish={handleSave}
        disabled={isReadOnly}
      >
        <Form.Item
          label={t('settings.bankReceiver.bankBinLabel')}
          name="bankBin"
          rules={[
            { required: true, message: t('settings.bankReceiver.bankBinRequired') },
          ]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            placeholder={t('settings.bankReceiver.bankBinPlaceholder')}
            options={bankOptions}
            notFoundContent={loading ? <Spin size="small" /> : <Empty description={t('settings.bankReceiver.noBanks')} />}
          />
        </Form.Item>

        <Form.Item
          label={t('settings.bankReceiver.accountNoLabel')}
          name="accountNo"
          rules={[
            { required: true, message: t('settings.bankReceiver.accountNoRequired') },
            { min: 6, message: t('settings.bankReceiver.accountNoMin') },
            { max: 19, message: t('settings.bankReceiver.accountNoMax') },
          ]}
        >
          <Input
            placeholder={t('settings.bankReceiver.accountNoPlaceholder')}
            maxLength={19}
          />
        </Form.Item>

        <Form.Item
          label={t('settings.bankReceiver.accountNameLabel')}
          name="accountName"
          getValueFromEvent={(event) =>
            normalizeAccountName(event?.target?.value ?? '')
          }
          rules={[
            { required: true, message: t('settings.bankReceiver.accountNameRequired') },
            { min: 2, message: t('settings.bankReceiver.accountNameMin') },
            { max: 120, message: t('settings.bankReceiver.accountNameMax') },
            {
              pattern: /^[A-Z0-9 ]+$/,
              message: t('settings.bankReceiver.accountNamePattern'),
            },
          ]}
          extra={t('settings.bankReceiver.accountNameHint')}
        >
          <Input
            placeholder={t('settings.bankReceiver.accountNamePlaceholder')}
            maxLength={120}
          />
        </Form.Item>

        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button type="primary" htmlType="submit" loading={saving} disabled={isReadOnly}>
            {t('settings.bankReceiver.saveButton')}
          </Button>
        </Space>
      </Form>
    </Card>
  );

  const orderExtraFeesTabContent = (
    <Card>
      {isReadOnly && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={t('settings.orderExtraFees.readOnlyWarning')}
        />
      )}

      <Form<OrderExtraFeesFormValues>
        form={extraFeesForm}
        layout="vertical"
        onFinish={handleSaveExtraFees}
        disabled={isReadOnly}
      >
        <Form.List name="fees">
          {(fields, { add, remove }) => (
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              {fields.map((field) => (
                <Space key={field.key} style={{ display: 'flex' }} align="baseline">
                  <Form.Item
                    {...field}
                    name={[field.name, 'id']}
                    style={{ marginBottom: 0, display: 'none' }}
                  >
                    <Input />
                  </Form.Item>
                  <Form.Item
                    {...field}
                    label={t('settings.orderExtraFees.nameLabel')}
                    name={[field.name, 'name']}
                    rules={[
                      {
                        required: true,
                        message: t('settings.orderExtraFees.nameRequired'),
                      },
                    ]}
                    style={{ marginBottom: 0, flex: 1 }}
                  >
                    <Input placeholder={t('settings.orderExtraFees.namePlaceholder')} />
                  </Form.Item>
                  <Form.Item
                    {...field}
                    label={t('settings.orderExtraFees.defaultAmountLabel')}
                    name={[field.name, 'defaultAmount']}
                    rules={[
                      {
                        required: true,
                        message: t('settings.orderExtraFees.defaultAmountRequired'),
                      },
                      {
                        type: 'number',
                        min: 0,
                        message: t('settings.orderExtraFees.defaultAmountMin'),
                      },
                    ]}
                    style={{ marginBottom: 0, width: 220 }}
                  >
                    <InputNumber
                      min={0}
                      precision={2}
                      style={{ width: '100%' }}
                      placeholder={t('settings.orderExtraFees.defaultAmountPlaceholder')}
                    />
                  </Form.Item>
                  {!isReadOnly && (
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => remove(field.name)}
                    />
                  )}
                </Space>
              ))}

              {!isReadOnly && (
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() => add({ id: createFeeId(), name: '', defaultAmount: 0 })}
                  block
                >
                  {t('settings.orderExtraFees.addButton')}
                </Button>
              )}
            </Space>
          )}
        </Form.List>

        <Space style={{ width: '100%', justifyContent: 'flex-end', marginTop: 16 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={savingExtraFees}
            disabled={isReadOnly}
          >
            {t('settings.orderExtraFees.saveButton')}
          </Button>
        </Space>
      </Form>
    </Card>
  );

  const invoiceLanguageTabContent = (
    <Card>
      {isReadOnly && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={t('settings.invoiceLanguage.readOnlyWarning')}
        />
      )}

      <Form<InvoiceLanguageFormValues>
        form={invoiceLanguageForm}
        layout="vertical"
        onFinish={handleSaveInvoiceLanguage}
        disabled={isReadOnly}
      >
        <Form.Item
          label={t('settings.invoiceLanguage.languageLabel')}
          name="language"
          rules={[
            {
              required: true,
              message: t('settings.invoiceLanguage.languageRequired'),
            },
          ]}
        >
          <Select<InvoiceLanguage>
            options={[
              {
                value: 'vi',
                label: t('settings.invoiceLanguage.options.vi'),
              },
              {
                value: 'en',
                label: t('settings.invoiceLanguage.options.en'),
              },
            ]}
            placeholder={t('settings.invoiceLanguage.languagePlaceholder')}
          />
        </Form.Item>

        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={savingInvoiceLanguage}
            disabled={isReadOnly}
          >
            {t('settings.invoiceLanguage.saveButton')}
          </Button>
        </Space>
      </Form>
    </Card>
  );

  const storeProfileTabContent = (
    <Card>
      {isReadOnly && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={t('settings.storeProfile.readOnlyWarning')}
        />
      )}

      <Form<StoreProfileFormValues>
        form={storeProfileForm}
        layout="vertical"
        onFinish={handleSaveStoreProfile}
        disabled={isReadOnly}
      >
        <Form.Item
          label={t('settings.storeProfile.nameLabel')}
          name="name"
          rules={[
            {
              required: true,
              message: t('settings.storeProfile.nameRequired'),
            },
            {
              max: 160,
              message: t('settings.storeProfile.nameMax'),
            },
          ]}
        >
          <Input
            placeholder={t('settings.storeProfile.namePlaceholder')}
            maxLength={160}
          />
        </Form.Item>

        <Form.Item
          label={t('settings.storeProfile.logoUploadLabel')}
          extra={t('settings.storeProfile.logoUploadHint')}
        >
          <FileUpload
            accept="image"
            disabled={isReadOnly || savingStoreProfile}
            showPreview={false}
            placeholder={t('settings.storeProfile.logoUploadPlaceholder')}
            onUploadSuccess={(file) => {
              const logoUrl = fileService.getStaticUrl(file.url);
              storeProfileForm.setFieldValue('logoUrl', logoUrl);
            }}
          />
        </Form.Item>

        <Form.Item
          label={t('settings.storeProfile.logoUrlLabel')}
          name="logoUrl"
          rules={[
            {
              max: 1000,
              message: t('settings.storeProfile.logoUrlMax'),
            },
          ]}
          extra={t('settings.storeProfile.logoUrlHint')}
        >
          <Input
            placeholder={t('settings.storeProfile.logoUrlPlaceholder')}
            maxLength={1000}
          />
        </Form.Item>

        {storeLogoUrl.length > 0 && (
          <Form.Item label={t('settings.storeProfile.logoPreviewLabel')}>
            <Space direction="vertical" size={8}>
              <Image
                src={storeLogoUrl}
                alt={t('settings.storeProfile.logoPreviewAlt')}
                style={{ maxWidth: 160, maxHeight: 160, objectFit: 'contain' }}
              />
              {!isReadOnly && (
                <Button
                  htmlType="button"
                  onClick={() => storeProfileForm.setFieldValue('logoUrl', '')}
                >
                  {t('settings.storeProfile.clearLogoButton')}
                </Button>
              )}
            </Space>
          </Form.Item>
        )}

        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={savingStoreProfile}
            disabled={isReadOnly}
          >
            {t('settings.storeProfile.saveButton')}
          </Button>
        </Space>
      </Form>
    </Card>
  );

  if (loading) {
    return <Spin />;
  }

  return (
    <div>
      <PageHeader
        title={t('settings.title')}
        subtitle={t('settings.subtitle')}
      />

      <Tabs
        defaultActiveKey="bank-receiver"
        items={[
          {
            key: 'bank-receiver',
            label: t('settings.tabs.bankReceiver'),
            children: bankReceiverTabContent,
          },
          {
            key: 'order-extra-fees',
            label: t('settings.tabs.orderExtraFees'),
            children: orderExtraFeesTabContent,
          },
          {
            key: 'invoice-language',
            label: t('settings.tabs.invoiceLanguage'),
            children: invoiceLanguageTabContent,
          },
          {
            key: 'store-profile',
            label: t('settings.tabs.storeProfile'),
            children: storeProfileTabContent,
          },
        ]}
      />
    </div>
  );
};
