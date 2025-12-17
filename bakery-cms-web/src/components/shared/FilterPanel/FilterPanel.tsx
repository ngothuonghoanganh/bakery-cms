import React from 'react';
import { Card, Space, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import type { FilterPanelProps } from './FilterPanel.types';

export const FilterPanel: React.FC<FilterPanelProps> = ({ children, onReset }) => {
  return (
    <Card
      style={{ marginBottom: 16 }}
      bodyStyle={{ padding: 16 }}
      extra={
        onReset && (
          <Button icon={<ReloadOutlined />} onClick={onReset}>
            Reset
          </Button>
        )
      }
    >
      <Space size="middle" wrap style={{ width: '100%' }}>
        {children}
      </Space>
    </Card>
  );
};
