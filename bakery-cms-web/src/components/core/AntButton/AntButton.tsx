import { Button } from 'antd';
import type { AntButtonProps } from './AntButton.types';

export const AntButton = (props: AntButtonProps): React.ReactElement => {
  return <Button {...props} />;
};
