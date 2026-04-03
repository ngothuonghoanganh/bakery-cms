/**
 * SettingsPage
 * System settings management
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Empty, Form, Input, Select, Space, Spin, Tabs, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/shared/PageHeader/PageHeader';
import { settingsService } from '@/services/settings.service';
import { useNotification } from '@/hooks/useNotification';
import { useAuthStore } from '@/stores/authStore';
import { UserRole } from '@/services/auth.service';
import type { VietQRBank } from '@/types/models/settings.model';

const { Text } = Typography;

type BankReceiverFormValues = {
  bankBin: string;
  accountNo: string;
  accountName: string;
};

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

export const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { success, error: notifyError } = useNotification();
  const { user } = useAuthStore();
  const [form] = Form.useForm<BankReceiverFormValues>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [banks, setBanks] = useState<VietQRBank[]>([]);

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
  }, [form, notifyError, t]);

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
            key: 'general',
            label: t('settings.tabs.general'),
            children: (
              <Card>
                <Text type="secondary">{t('settings.comingSoon')}</Text>
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
};
