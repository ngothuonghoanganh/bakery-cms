import React from 'react';
import { Card, Row, Col, Space, Typography } from 'antd';
import type { QuickActionsProps } from './QuickActions.types';
import type { CSSProperties } from 'react';

const { Title, Text } = Typography;

export const QuickActions: React.FC<QuickActionsProps> = ({ actions, title = 'Quick Actions' }) => {
  return (
    <Card title={title} bordered={false} className="dashboard-quick-actions-card">
      <Row gutter={[16, 16]}>
        {actions.map((action) => (
          <Col xs={24} sm={12} md={8} lg={6} key={action.key} className="dashboard-quick-action-col">
            <Card
              className="dashboard-quick-action-item"
              hoverable
              onClick={action.onClick}
              style={{ '--quick-action-color': action.color } as CSSProperties}
            >
              <Space direction="vertical" size="middle" className="dashboard-quick-action-content">
                <div className="dashboard-quick-action-icon">{action.icon}</div>
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
