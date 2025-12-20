import React from 'react';
import { Card, Row, Col, Space, Typography } from 'antd';
import type { QuickActionsProps } from './QuickActions.types';

const { Title, Text } = Typography;

export const QuickActions: React.FC<QuickActionsProps> = ({ actions }) => {
  return (
    <Card title="Quick Actions" bordered={false}>
      <Row gutter={[16, 16]}>
        {actions.map((action) => (
          <Col xs={24} sm={12} md={8} lg={6} key={action.key}>
            <Card
              hoverable
              onClick={action.onClick}
              style={{
                textAlign: 'center',
                borderColor: action.color,
              }}
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div style={{ fontSize: 32, color: action.color }}>{action.icon}</div>
                <div>
                  <Title level={5} style={{ margin: 0 }}>
                    {action.title}
                  </Title>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {action.description}
                  </Text>
                </div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </Card>
  );
};
