import React, { useState, useEffect } from 'react';
import { Layout } from 'antd';
import { Sidebar } from '../Sidebar';
import { Header } from '../Header';
import type { DashboardLayoutProps } from './DashboardLayout.types';

const { Content } = Layout;

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setCollapsed((prev) => !prev);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar collapsed={collapsed} isMobile={isMobile} />
      <Layout style={{ marginLeft: isMobile ? 0 : collapsed ? 80 : 256 }}>
        <Header collapsed={collapsed} onToggleSidebar={toggleSidebar} />
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};
