import type { ThemeConfig } from 'antd';

export const lightTheme: ThemeConfig = {
  token: {
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#f5222d',
    colorInfo: '#1890ff',
    colorTextBase: '#000000',
    colorBgBase: '#ffffff',
    fontSize: 14,
    borderRadius: 6,
    wireframe: false,
  },
  components: {
    Layout: {
      headerBg: '#001529',
      siderBg: '#001529',
      bodyBg: '#f0f2f5',
      headerHeight: 64,
      headerPadding: '0 24px',
      footerBg: '#f0f2f5',
      footerPadding: '24px 50px',
    },
    Menu: {
      darkItemBg: '#001529',
      darkItemColor: 'rgba(255, 255, 255, 0.65)',
      darkItemHoverBg: '#1890ff',
      darkItemHoverColor: '#ffffff',
      darkItemSelectedBg: '#1890ff',
      darkItemSelectedColor: '#ffffff',
    },
    Button: {
      primaryColor: '#ffffff',
      borderRadius: 6,
      controlHeight: 32,
      paddingContentHorizontal: 15,
    },
    Table: {
      headerBg: '#fafafa',
      headerColor: 'rgba(0, 0, 0, 0.85)',
      rowHoverBg: '#fafafa',
      borderColor: '#f0f0f0',
    },
    Card: {
      headerBg: 'transparent',
      borderRadiusLG: 8,
      paddingLG: 24,
    },
  },
};

export const darkTheme: ThemeConfig = {
  token: {
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#f5222d',
    colorInfo: '#1890ff',
    colorTextBase: '#ffffff',
    colorBgBase: '#000000',
    colorBgContainer: '#141414',
    colorBgElevated: '#1f1f1f',
    fontSize: 14,
    borderRadius: 6,
    wireframe: false,
  },
  components: {
    Layout: {
      headerBg: '#001529',
      siderBg: '#001529',
      bodyBg: '#000000',
      headerHeight: 64,
      headerPadding: '0 24px',
      footerBg: '#000000',
      footerPadding: '24px 50px',
    },
    Menu: {
      darkItemBg: '#001529',
      darkItemColor: 'rgba(255, 255, 255, 0.65)',
      darkItemHoverBg: '#1890ff',
      darkItemHoverColor: '#ffffff',
      darkItemSelectedBg: '#1890ff',
      darkItemSelectedColor: '#ffffff',
    },
    Button: {
      primaryColor: '#ffffff',
      borderRadius: 6,
      controlHeight: 32,
      paddingContentHorizontal: 15,
    },
    Table: {
      headerBg: '#1f1f1f',
      headerColor: 'rgba(255, 255, 255, 0.85)',
      rowHoverBg: '#262626',
      borderColor: '#303030',
    },
    Card: {
      headerBg: 'transparent',
      borderRadiusLG: 8,
      paddingLG: 24,
    },
  },
};
