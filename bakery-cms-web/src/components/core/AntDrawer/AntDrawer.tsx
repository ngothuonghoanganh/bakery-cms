import { Drawer } from 'antd';
import type { AntDrawerProps } from './AntDrawer.types';

export const AntDrawer = (props: AntDrawerProps): React.ReactElement => {
  return <Drawer {...props} />;
};
