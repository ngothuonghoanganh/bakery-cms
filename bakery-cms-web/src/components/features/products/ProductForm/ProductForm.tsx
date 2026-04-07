import React, { useEffect, useState } from 'react';
import { Form, Input, InputNumber, Select, Row, Col, Tabs, Divider, Switch, Button } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { AntModal } from '../../../core';
import { FileUpload } from '../../../shared/FileUpload';
import { MultiFileUpload, type ProductImageItem } from '../../../shared/MultiFileUpload';
import { BusinessType, ProductStatus, ProductType } from '../../../../types/models/product.model';
import { fileService } from '../../../../services/file.service';
import { productService } from '../../../../services/product.service';
import type { ProductFormProps, ProductFormValues, ProductComboItemFormValue } from './ProductForm.types';

const { TextArea } = Input;
const { Option } = Select;

type ComboProductOption = {
  id: string;
  label: string;
};

export const ProductForm: React.FC<ProductFormProps> = ({
  visible,
  product,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const { t } = useTranslation();
  const [form] = Form.useForm<ProductFormValues>();
  const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
  const [uploadedFileId, setUploadedFileId] = useState<string | undefined>(undefined);
  const [productImages, setProductImages] = useState<ProductImageItem[]>([]);
  const [comboProductOptions, setComboProductOptions] = useState<ComboProductOption[]>([]);
  const [comboOptionsLoading, setComboOptionsLoading] = useState(false);
  const isEditMode = Boolean(product);

  useEffect(() => {
    if (visible && product) {
      form.setFieldsValue({
        name: product.name,
        description: product.description || undefined,
        price: product.price,
        category: product.category || undefined,
        businessType: product.businessType,
        status: product.status,
        productType: product.productType ?? ProductType.SINGLE,
        isPublished: product.isPublished ?? true,
        comboItems: (product.comboItems ?? []).map((comboItem) => ({
          id: comboItem.id,
          itemProductId: comboItem.itemProductId,
          quantity: comboItem.quantity,
          displayOrder: comboItem.displayOrder,
        })),
        imageUrl: product.imageUrl || undefined,
      });
      // If product has an imageFile, use upload mode
      if (product.imageFile) {
        setUploadedFileId(product.imageFile.id);
        setImageMode('upload');
      } else if (product.imageUrl) {
        setImageMode('url');
      }

      // Load multi-images if available
      if (product.images && product.images.length > 0) {
        const images: ProductImageItem[] = product.images.map(img => ({
          id: img.id,
          fileId: img.fileId,
          displayOrder: img.displayOrder,
          isPrimary: img.isPrimary,
          file: img.file,
          previewUrl: img.file?.url
            ? fileService.getStaticUrl(img.file.url)
            : fileService.getDownloadUrl(img.fileId),
        }));
        setProductImages(images);
      } else {
        setProductImages([]);
      }
    } else if (visible && !product) {
      form.resetFields();
      form.setFieldsValue({
        businessType: BusinessType.READY_TO_SELL,
        status: ProductStatus.AVAILABLE,
        productType: ProductType.SINGLE,
        isPublished: true,
        comboItems: [],
      });
      setUploadedFileId(undefined);
      setImageMode('upload');
      setProductImages([]);
    }
  }, [visible, product, form]);

  useEffect(() => {
    let isMounted = true;

    const loadComboProductOptions = async () => {
      if (!visible) {
        return;
      }

      setComboOptionsLoading(true);
      const result = await productService.getAll({
        page: 1,
        limit: 100,
        productType: ProductType.SINGLE,
      });

      if (!isMounted) {
        return;
      }

      if (result.success) {
        const options = result.data.products
          .filter((item) => item.id !== product?.id)
          .map((item) => ({
            id: item.id,
            label: `${item.name} (${item.productCode})`,
          }));
        setComboProductOptions(options);
      } else {
        setComboProductOptions([]);
      }
      setComboOptionsLoading(false);
    };

    void loadComboProductOptions();

    return () => {
      isMounted = false;
    };
  }, [visible, product?.id]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // If using upload mode, set imageFileId and clear imageUrl
      if (imageMode === 'upload') {
        values.imageFileId = uploadedFileId || null;
        values.imageUrl = undefined;
      } else {
        // If using URL mode, clear imageFileId
        values.imageFileId = null;
      }

      // Add product images to values
      values.images = productImages;

      if (values.productType === ProductType.COMBO) {
        values.comboItems = (values.comboItems ?? []).map((comboItem, index) => ({
          ...comboItem,
          displayOrder: comboItem.displayOrder ?? index,
        }));
      } else {
        values.comboItems = [];
      }

      await onSubmit(values);
      form.resetFields();
      setUploadedFileId(undefined);
      setImageMode('upload');
      setProductImages([]);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setUploadedFileId(undefined);
    setImageMode('upload');
    setProductImages([]);
    onCancel();
  };

  const handleFileChange = (fileId: string | undefined) => {
    setUploadedFileId(fileId);
    if (fileId) {
      // Clear the URL field when using file upload
      form.setFieldValue('imageUrl', undefined);
    }
  };

  const handleImageModeChange = (key: string) => {
    setImageMode(key as 'upload' | 'url');
    if (key === 'upload') {
      form.setFieldValue('imageUrl', undefined);
    } else {
      setUploadedFileId(undefined);
    }
  };

  const handleMultiImageChange = (images: ProductImageItem[]) => {
    setProductImages(images);
  };

  return (
    <AntModal
      title={isEditMode ? t('products.form.editTitle') : t('products.form.createTitle')}
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={700}
      okText={isEditMode ? t('products.form.updateButton') : t('products.form.createButton')}
    >
      <Form form={form} layout="vertical" requiredMark="optional">
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              name="name"
              label={t('products.form.name')}
              rules={[
                { required: true, message: t('products.form.validation.nameRequired') },
                { min: 3, message: t('products.form.validation.nameMin') },
                { max: 255, message: t('products.form.validation.nameMax') },
              ]}
            >
              <Input placeholder={t('products.form.namePlaceholder')} />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item
              name="description"
              label={t('products.form.description')}
              rules={[{ max: 1000, message: t('products.form.validation.descriptionMax') }]}
            >
              <TextArea rows={4} placeholder={t('products.form.descriptionPlaceholder')} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="price"
              label={t('products.form.price')}
              rules={[
                { required: true, message: t('products.form.validation.priceRequired') },
                { type: 'number', min: 0.01, message: t('products.form.validation.priceMin') },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                prefix="$"
                min={0}
                precision={2}
                placeholder={t('products.form.pricePlaceholder')}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="category"
              label={t('products.form.category')}
              rules={[{ max: 100, message: t('products.form.validation.categoryMax') }]}
            >
              <Input placeholder={t('products.form.categoryPlaceholder')} />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="productType"
              label={t('products.form.productType')}
              rules={[{ required: true, message: t('products.form.validation.productTypeRequired') }]}
            >
              <Select placeholder={t('products.form.productTypePlaceholder')}>
                <Option value={ProductType.SINGLE}>{t('products.productType.single')}</Option>
                <Option value={ProductType.COMBO}>{t('products.productType.combo')}</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="businessType"
              label={t('products.form.businessType')}
              rules={[{ required: true, message: t('products.form.validation.businessTypeRequired') }]}
            >
              <Select placeholder={t('products.form.businessTypePlaceholder')}>
                <Option value={BusinessType.READY_TO_SELL}>{t('products.businessType.readyToSell')}</Option>
                <Option value={BusinessType.MADE_TO_ORDER}>{t('products.businessType.madeToOrder')}</Option>
                <Option value={BusinessType.BOTH}>{t('products.businessType.both')}</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item
              name="status"
              label={t('products.form.status')}
              rules={[{ required: true, message: t('products.form.validation.statusRequired') }]}
            >
              <Select placeholder={t('products.form.statusPlaceholder')}>
                <Option value={ProductStatus.AVAILABLE}>{t('products.status.available')}</Option>
                <Option value={ProductStatus.OUT_OF_STOCK}>{t('products.status.outOfStock')}</Option>
              </Select>
            </Form.Item>
          </Col>

          <Form.Item noStyle shouldUpdate={(prev, next) => prev.productType !== next.productType}>
            {({ getFieldValue }) =>
              getFieldValue('productType') === ProductType.COMBO ? (
                <Col span={24}>
                  <Divider>{t('products.form.comboItems')}</Divider>
                  <Form.List
                    name="comboItems"
                    rules={[
                      {
                        validator: async (_, value: ProductComboItemFormValue[] | undefined) => {
                          if (!value || value.length === 0) {
                            throw new Error(t('products.form.validation.comboItemsRequired'));
                          }
                        },
                      },
                    ]}
                  >
                    {(fields, { add, remove }, { errors }) => (
                      <>
                        {fields.map((field) => (
                          <Row key={field.key} gutter={8} align="middle">
                            <Col span={14}>
                              <Form.Item
                                {...field}
                                name={[field.name, 'itemProductId']}
                                rules={[
                                  {
                                    required: true,
                                    message: t('products.form.validation.comboProductRequired'),
                                  },
                                ]}
                              >
                                <Select
                                  showSearch
                                  loading={comboOptionsLoading}
                                  placeholder={t('products.form.comboProductPlaceholder')}
                                  optionFilterProp="label"
                                  options={comboProductOptions.map((option) => ({
                                    value: option.id,
                                    label: option.label,
                                  }))}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={8}>
                              <Form.Item
                                {...field}
                                name={[field.name, 'quantity']}
                                rules={[
                                  {
                                    required: true,
                                    message: t('products.form.validation.comboQuantityRequired'),
                                  },
                                  {
                                    type: 'number',
                                    min: 0.001,
                                    message: t('products.form.validation.comboQuantityMin'),
                                  },
                                ]}
                              >
                                <InputNumber
                                  min={0.001}
                                  step={0.001}
                                  precision={3}
                                  style={{ width: '100%' }}
                                  placeholder={t('products.form.comboQuantityPlaceholder')}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={2}>
                              <MinusCircleOutlined onClick={() => remove(field.name)} />
                            </Col>
                          </Row>
                        ))}
                        <Form.ErrorList errors={errors} />
                        <Form.Item>
                          <Button
                            type="dashed"
                            onClick={() => add({ quantity: 1 } as ProductComboItemFormValue)}
                            icon={<PlusOutlined />}
                            block
                          >
                            {t('products.form.addComboItem')}
                          </Button>
                        </Form.Item>
                      </>
                    )}
                  </Form.List>
                </Col>
              ) : null
            }
          </Form.Item>

          <Col span={24}>
            <Form.Item
              name="isPublished"
              label={t('products.form.storefrontVisibility')}
              valuePropName="checked"
              extra={t('products.form.storefrontVisibilityHint')}
            >
              <Switch
                checkedChildren={t('products.visibility.published')}
                unCheckedChildren={t('products.visibility.hidden')}
              />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Divider>{t('products.form.images', 'Product Images')}</Divider>
          </Col>

          {/* Multi-image upload section */}
          <Col span={24}>
            <Form.Item label={t('products.form.multiImages', 'Gallery Images')}>
              <MultiFileUpload
                productId={product?.id}
                value={productImages}
                onChange={handleMultiImageChange}
                disabled={loading}
                maxFiles={10}
              />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Divider>{t('products.form.legacyImage', 'Cover Image (Legacy)')}</Divider>
          </Col>

          {/* Legacy single image upload (for backward compatibility) */}
          <Col span={24}>
            <Form.Item label={t('products.form.image')}>
              <Tabs
                activeKey={imageMode}
                onChange={handleImageModeChange}
                items={[
                  {
                    key: 'upload',
                    label: t('files.upload', 'Upload'),
                    children: (
                      <FileUpload
                        value={uploadedFileId}
                        onChange={handleFileChange}
                        accept="image"
                        disabled={loading}
                      />
                    ),
                  },
                  {
                    key: 'url',
                    label: t('products.form.imageUrl', 'Image URL'),
                    children: (
                      <Form.Item
                        name="imageUrl"
                        noStyle
                        rules={[{ type: 'url', message: t('products.form.validation.imageUrlInvalid') }]}
                      >
                        <Input placeholder={t('products.form.imageUrlPlaceholder')} />
                      </Form.Item>
                    ),
                  },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </AntModal>
  );
};
