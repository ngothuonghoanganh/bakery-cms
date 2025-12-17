import React from 'react';
import { Layout, Button, Space, Dropdown } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BulbOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useThemeStore } from '../../../stores/themeStore';
import { useAuthStore } from '../../../stores/authStore';
import type { HeaderProps } from './Header.types';

const { Header: AntHeader } = Layout;

export const Header: React.FC<HeaderProps> = ({ collapsed, onToggleSidebar }) => {
  const { mode, toggleTheme } = useThemeStore();
  const { user, logout } = useAuthStore();

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: logout,
    },
  ];

  return (
    <AntHeader
      style={{
        padding: '0 24px',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #f0f0f0',
      }}
    >
      <Button
        type="text"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={onToggleSidebar}
        style={{ fontSize: 16, width: 64, height: 64 }}
      />

      <Space size="middle">
        <Button
          type="text"
          icon={<BulbOutlined />}
          onClick={toggleTheme}
          style={{ fontSize: 16 }}
        >
          {mode === 'light' ? 'Dark' : 'Light'}
        </Button>

        {user && (
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Button type="text" icon={<UserOutlined />} style={{ fontSize: 16 }}>
              {user.name}
            </Button>
          </Dropdown>
        )}
      </Space>
    </AntHeader>
  );
};
