import { Modal } from 'antd';
import type { AntModalProps } from './AntModal.types';

export const AntModal = (props: AntModalProps): React.ReactElement => {
  return <Modal {...props} />;
};
