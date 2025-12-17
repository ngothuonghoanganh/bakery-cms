export interface ActivityItem {
  id: string;
  type: 'order' | 'payment' | 'product';
  title: string;
  description: string;
  timestamp: string;
  status?: 'success' | 'warning' | 'error' | 'info';
}

export interface RecentActivityProps {
  items: ActivityItem[];
  loading?: boolean;
  onItemClick?: (item: ActivityItem) => void;
}
