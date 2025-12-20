import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Button, Space, Dropdown, Avatar } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BulbOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useThemeStore } from '../../../stores/themeStore';
import { useAuthStore } from '../../../stores/authStore';
import type { HeaderProps } from './Header.types';

const { Header: AntHeader } = Layout;

export const Header: React.FC<HeaderProps> = ({ collapsed, onToggleSidebar }) => {
  const navigate = useNavigate();
  const { mode, toggleTheme } = useThemeStore();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
    },
  ];

  const getUserDisplayName = () => {
    if (!user) return 'Guest';
    return `${user.firstName} ${user.lastName}`;
  };

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
        <Button type="text" icon={<BulbOutlined />} onClick={toggleTheme} style={{ fontSize: 16 }}>
          {mode === 'light' ? 'Dark' : 'Light'}
        </Button>

        {user && (
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Button type="text" style={{ fontSize: 16, height: 'auto', padding: '4px 8px' }}>
              <Space>
                <Avatar size="small" icon={<UserOutlined />} />
                <span>{getUserDisplayName()}</span>
              </Space>
            </Button>
          </Dropdown>
        )}
      </Space>
    </AntHeader>
  );
};
