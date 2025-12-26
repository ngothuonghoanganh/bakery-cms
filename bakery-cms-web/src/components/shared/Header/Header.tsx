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
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../../../stores/themeStore';
import { useAuthStore } from '../../../stores/authStore';
import { LanguageSelector } from '../LanguageSelector';
import type { HeaderProps } from './Header.types';

const { Header: AntHeader } = Layout;

export const Header: React.FC<HeaderProps> = ({ collapsed, onToggleSidebar }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
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
      label: t('common.navigation.profile'),
      onClick: () => navigate('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: t('common.navigation.settings'),
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('common.navigation.logout'),
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
        <LanguageSelector size="small" showFlag showFullName />

        <Button type="text" icon={<BulbOutlined />} onClick={toggleTheme} style={{ fontSize: 16 }}>
          {mode === 'light' ? t('common.theme.dark', 'Dark') : t('common.theme.light', 'Light')}
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
