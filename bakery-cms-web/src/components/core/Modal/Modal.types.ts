/**
 * Modal component props
 */

export type ModalProps = {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly title?: string;
  readonly children: React.ReactNode;
  readonly footer?: React.ReactNode;
  readonly size?: 'sm' | 'md' | 'lg';
};
