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
  StorefrontHomeContent,
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
type StorefrontHomeContentFormValues = StorefrontHomeContent;

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
  const [storefrontContentForm] = Form.useForm<StorefrontHomeContentFormValues>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingExtraFees, setSavingExtraFees] = useState(false);
  const [savingInvoiceLanguage, setSavingInvoiceLanguage] = useState(false);
  const [savingStoreProfile, setSavingStoreProfile] = useState(false);
  const [savingStorefrontContent, setSavingStorefrontContent] = useState(false);
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
      storefrontContentForm.setFieldsValue(settingsResult.data.storefrontHomeContent);
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
  }, [
    extraFeesForm,
    form,
    invoiceLanguageForm,
    notifyError,
    storeProfileForm,
    storefrontContentForm,
    t,
  ]);

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

  const handleSaveStorefrontContent = async (
    values: StorefrontHomeContentFormValues
  ) => {
    setSavingStorefrontContent(true);

    const result = await settingsService.updateStorefrontHomeContent({
      content: values,
    });

    if (result.success) {
      storefrontContentForm.setFieldsValue(result.data);
      success(
        t(
          'settings.storefrontContent.saveSuccess',
          'Storefront homepage content updated'
        )
      );
    } else {
      notifyError(
        t(
          'settings.storefrontContent.saveFailed',
          'Failed to save storefront homepage content'
        ),
        result.error.message
      );
    }

    setSavingStorefrontContent(false);
  };

  const renderStorefrontLocaleFields = (locale: 'vi' | 'en') => {
    const title =
      locale === 'vi'
        ? t('settings.storefrontContent.localeVi', 'Vietnamese content')
        : t('settings.storefrontContent.localeEn', 'English content');

    return (
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <h3 style={{ margin: 0 }}>{title}</h3>

        <Form.Item
          label={t('settings.storefrontContent.taglineLabel', 'Tagline')}
          name={[locale, 'tagline']}
          rules={[{ required: true }]}
        >
          <Input maxLength={200} />
        </Form.Item>

        <Form.Item
          label={t('settings.storefrontContent.heroEyebrowLabel', 'Hero Eyebrow')}
          name={[locale, 'heroEyebrow']}
          rules={[{ required: true }]}
        >
          <Input maxLength={200} />
        </Form.Item>

        <Form.Item
          label={t('settings.storefrontContent.heroTitleLabel', 'Hero Title')}
          name={[locale, 'heroTitle']}
          rules={[{ required: true }]}
        >
          <Input maxLength={280} />
        </Form.Item>

        <Form.Item
          label={t('settings.storefrontContent.heroDescriptionLabel', 'Hero Description')}
          name={[locale, 'heroDescription']}
          rules={[{ required: true }]}
        >
          <Input.TextArea rows={3} maxLength={1200} />
        </Form.Item>

        <Form.Item
          label={t(
            'settings.storefrontContent.heroBackgroundImageUploadLabel',
            'Hero Background Image Upload'
          )}
          extra={t(
            'settings.storefrontContent.heroBackgroundImageUploadHint',
            'Optional image shown as soft background on the right side of hero section.'
          )}
        >
          <FileUpload
            accept="image"
            disabled={isReadOnly || savingStorefrontContent}
            showPreview={false}
            placeholder={t(
              'settings.storefrontContent.heroBackgroundImageUploadPlaceholder',
              'Upload hero background image'
            )}
            onUploadSuccess={(file) => {
              const imageUrl = fileService.getStaticUrl(file.url);
              storefrontContentForm.setFieldValue(
                [locale, 'heroBackgroundImageUrl'],
                imageUrl
              );
            }}
          />
        </Form.Item>

        <Form.Item
          label={t(
            'settings.storefrontContent.heroBackgroundImageUrlLabel',
            'Hero Background Image URL'
          )}
          name={[locale, 'heroBackgroundImageUrl']}
          rules={[{ max: 1000 }]}
          extra={t(
            'settings.storefrontContent.heroBackgroundImageUrlHint',
            'Leave empty to hide hero background image.'
          )}
        >
          <Input
            maxLength={1000}
            placeholder={t(
              'settings.storefrontContent.heroBackgroundImageUrlPlaceholder',
              '/uploads/... or https://...'
            )}
          />
        </Form.Item>

        <Form.Item shouldUpdate noStyle>
          {() => {
            const heroBackgroundImageUrl = String(
              storefrontContentForm.getFieldValue([locale, 'heroBackgroundImageUrl']) ??
                ''
            ).trim();

            if (!heroBackgroundImageUrl) {
              return null;
            }

            return (
              <Form.Item
                label={t(
                  'settings.storefrontContent.heroBackgroundImagePreviewLabel',
                  'Hero Background Preview'
                )}
              >
                <Space direction="vertical" size={8}>
                  <Image
                    src={heroBackgroundImageUrl}
                    alt={t(
                      'settings.storefrontContent.heroBackgroundImagePreviewAlt',
                      'Hero background preview'
                    )}
                    style={{ maxWidth: 320, maxHeight: 180, objectFit: 'cover' }}
                  />
                  {!isReadOnly && (
                    <Button
                      htmlType="button"
                      onClick={() =>
                        storefrontContentForm.setFieldValue(
                          [locale, 'heroBackgroundImageUrl'],
                          ''
                        )
                      }
                    >
                      {t(
                        'settings.storefrontContent.heroBackgroundImageClearButton',
                        'Clear Hero Background Image'
                      )}
                    </Button>
                  )}
                </Space>
              </Form.Item>
            );
          }}
        </Form.Item>

        <Space size={12} style={{ width: '100%' }} wrap>
          <Form.Item
            label={t('settings.storefrontContent.heroPrimaryCtaLabel', 'Hero Primary CTA')}
            name={[locale, 'heroPrimaryCta']}
            rules={[{ required: true }]}
            style={{ minWidth: 240, flex: 1, marginBottom: 0 }}
          >
            <Input maxLength={120} />
          </Form.Item>
          <Form.Item
            label={t(
              'settings.storefrontContent.heroSecondaryCtaLabel',
              'Hero Secondary CTA'
            )}
            name={[locale, 'heroSecondaryCta']}
            rules={[{ required: true }]}
            style={{ minWidth: 240, flex: 1, marginBottom: 0 }}
          >
            <Input maxLength={120} />
          </Form.Item>
        </Space>

        <Space size={12} style={{ width: '100%' }} wrap>
          <Form.Item
            label={t(
              'settings.storefrontContent.highlightHandcraftedLabel',
              'Highlight: Handcrafted'
            )}
            name={[locale, 'highlightHandcrafted']}
            rules={[{ required: true }]}
            style={{ minWidth: 220, flex: 1, marginBottom: 0 }}
          >
            <Input maxLength={180} />
          </Form.Item>
          <Form.Item
            label={t(
              'settings.storefrontContent.highlightSeasonalLabel',
              'Highlight: Seasonal'
            )}
            name={[locale, 'highlightSeasonal']}
            rules={[{ required: true }]}
            style={{ minWidth: 220, flex: 1, marginBottom: 0 }}
          >
            <Input maxLength={180} />
          </Form.Item>
          <Form.Item
            label={t(
              'settings.storefrontContent.highlightFastDeliveryLabel',
              'Highlight: Fast Delivery'
            )}
            name={[locale, 'highlightFastDelivery']}
            rules={[{ required: true }]}
            style={{ minWidth: 220, flex: 1, marginBottom: 0 }}
          >
            <Input maxLength={180} />
          </Form.Item>
        </Space>

        <Form.Item
          label={t(
            'settings.storefrontContent.productsSectionTitleLabel',
            'Featured Products Title'
          )}
          name={[locale, 'productsSectionTitle']}
          rules={[{ required: true }]}
        >
          <Input maxLength={220} />
        </Form.Item>

        <Form.Item
          label={t(
            'settings.storefrontContent.productsSectionDescriptionLabel',
            'Featured Products Description'
          )}
          name={[locale, 'productsSectionDescription']}
          rules={[{ required: true }]}
        >
          <Input.TextArea rows={2} maxLength={1000} />
        </Form.Item>

        <Form.Item
          label={t('settings.storefrontContent.storySectionTitleLabel', 'Story Section Label')}
          name={[locale, 'storySectionTitle']}
          rules={[{ required: true }]}
        >
          <Input maxLength={220} />
        </Form.Item>

        <Form.Item
          label={t('settings.storefrontContent.storyHeadingLabel', 'Story Heading')}
          name={[locale, 'storyHeading']}
          rules={[{ required: true }]}
        >
          <Input maxLength={320} />
        </Form.Item>

        <Form.Item
          label={t('settings.storefrontContent.storyBodyLabel', 'Story Description')}
          name={[locale, 'storyBody']}
          rules={[{ required: true }]}
        >
          <Input.TextArea rows={4} maxLength={3000} />
        </Form.Item>

        <Space size={12} style={{ width: '100%' }} wrap>
          <Form.Item
            label={t('settings.storefrontContent.storyStatOneLabel', 'Story Stat 1')}
            name={[locale, 'storyStatOne']}
            rules={[{ required: true }]}
            style={{ minWidth: 220, flex: 1, marginBottom: 0 }}
          >
            <Input maxLength={240} />
          </Form.Item>
          <Form.Item
            label={t('settings.storefrontContent.storyStatTwoLabel', 'Story Stat 2')}
            name={[locale, 'storyStatTwo']}
            rules={[{ required: true }]}
            style={{ minWidth: 220, flex: 1, marginBottom: 0 }}
          >
            <Input maxLength={240} />
          </Form.Item>
          <Form.Item
            label={t('settings.storefrontContent.storyStatThreeLabel', 'Story Stat 3')}
            name={[locale, 'storyStatThree']}
            rules={[{ required: true }]}
            style={{ minWidth: 220, flex: 1, marginBottom: 0 }}
          >
            <Input maxLength={240} />
          </Form.Item>
        </Space>

        <Form.Item
          label={t('settings.storefrontContent.promoTitleLabel', 'Promo Title')}
          name={[locale, 'promoTitle']}
          rules={[{ required: true }]}
        >
          <Input maxLength={320} />
        </Form.Item>

        <Form.Item
          label={t('settings.storefrontContent.promoDescriptionLabel', 'Promo Description')}
          name={[locale, 'promoDescription']}
          rules={[{ required: true }]}
        >
          <Input.TextArea rows={3} maxLength={1200} />
        </Form.Item>

        <Form.Item
          label={t('settings.storefrontContent.promoCtaLabel', 'Promo CTA')}
          name={[locale, 'promoCta']}
          rules={[{ required: true }]}
        >
          <Input maxLength={120} />
        </Form.Item>

        <Form.Item
          label={t('settings.storefrontContent.promoCtaHrefLabel', 'Promo CTA Link')}
          name={[locale, 'promoCtaHref']}
          rules={[{ required: true }]}
        >
          <Input
            maxLength={1000}
            placeholder={t(
              'settings.storefrontContent.promoCtaHrefPlaceholder',
              '#contact, https://..., mailto:..., tel:...'
            )}
          />
        </Form.Item>

        <Space size={12} style={{ width: '100%' }} wrap>
          <Form.Item
            label={t('settings.storefrontContent.footerAddressLabel', 'Footer Address')}
            name={[locale, 'footerAddress']}
            rules={[{ required: true }]}
            style={{ minWidth: 280, flex: 2, marginBottom: 0 }}
          >
            <Input maxLength={280} />
          </Form.Item>
          <Form.Item
            label={t('settings.storefrontContent.footerPhoneLabel', 'Footer Phone')}
            name={[locale, 'footerPhone']}
            rules={[{ required: true }]}
            style={{ minWidth: 220, flex: 1, marginBottom: 0 }}
          >
            <Input maxLength={120} />
          </Form.Item>
          <Form.Item
            label={t('settings.storefrontContent.footerHoursLabel', 'Footer Hours')}
            name={[locale, 'footerHours']}
            rules={[{ required: true }]}
            style={{ minWidth: 220, flex: 1, marginBottom: 0 }}
          >
            <Input maxLength={220} />
          </Form.Item>
        </Space>
      </Space>
    );
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

  const storefrontContentTabContent = (
    <Card>
      {isReadOnly && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={t(
            'settings.storefrontContent.readOnlyWarning',
            'You have read-only access to storefront homepage content settings.'
          )}
        />
      )}

      <Form<StorefrontHomeContentFormValues>
        form={storefrontContentForm}
        layout="vertical"
        onFinish={handleSaveStorefrontContent}
        disabled={isReadOnly}
      >
        <Tabs
          defaultActiveKey="vi"
          items={[
            {
              key: 'vi',
              label: t('settings.storefrontContent.localeViTab', 'Vietnamese'),
              children: renderStorefrontLocaleFields('vi'),
            },
            {
              key: 'en',
              label: t('settings.storefrontContent.localeEnTab', 'English'),
              children: renderStorefrontLocaleFields('en'),
            },
          ]}
        />

        <Space style={{ width: '100%', justifyContent: 'flex-end', marginTop: 8 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={savingStorefrontContent}
            disabled={isReadOnly}
          >
            {t(
              'settings.storefrontContent.saveButton',
              'Save Storefront Homepage Content'
            )}
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
          {
            key: 'storefront-home-content',
            label: t('settings.tabs.storefrontContent', 'Storefront Homepage'),
            children: storefrontContentTabContent,
          },
        ]}
      />
    </div>
  );
};
