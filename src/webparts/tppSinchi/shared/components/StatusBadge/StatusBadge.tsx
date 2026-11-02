import * as React from 'react';
import styles from './StatusBadge.module.scss';
import type { StatusBadgeVariant } from '../../types/statusBadge';

export interface IStatusBadgeProps {
  children: React.ReactNode;
  variant: StatusBadgeVariant;
  className?: string;
}

export default function StatusBadge(props: IStatusBadgeProps): React.ReactElement {
  return (
    <span className={`${styles.badge} ${styles[props.variant]} ${props.className || ''}`}>
      {props.children}
    </span>
  );
}
