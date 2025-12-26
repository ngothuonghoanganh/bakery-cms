import React from 'react';
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as Icons from '@ant-design/icons';
import { getMenuItems } from '../../../config/routes.config';
import type { SidebarProps } from './Sidebar.types';

const { Sider } = Layout;

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, isMobile = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const menuItems = getMenuItems().map((item) => {
    // Dynamically get icon component
    const IconComponent = Icons[item.icon as keyof typeof Icons] as React.ComponentType;

    return {
      key: item.path,
      icon: IconComponent ? <IconComponent /> : null,
      label: t(item.titleKey, item.name),
      onClick: () => navigate(item.path),
    };
  });

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      trigger={null}
      width={256}
      collapsedWidth={isMobile ? 0 : 80}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 999,
      }}
    >
      <div
        style={{
          height: 64,
          margin: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: collapsed ? 20 : 24,
          fontWeight: 'bold',
        }}
      >
        {collapsed ? 'B' : 'Bakery CMS'}
      </div>
      <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]} items={menuItems} />
    </Sider>
  );
};
