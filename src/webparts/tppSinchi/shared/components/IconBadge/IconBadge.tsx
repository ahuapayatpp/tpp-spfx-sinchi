import * as React from 'react';
import { Icon } from '@fluentui/react';
import styles from './IconBadge.module.scss';

export type IconBadgeVariant = 'default' | 'info' | 'success' | 'warning' | 'error' | 'primary';
export type IconBadgeSize = 'default' | 'compact';

export interface IIconBadgeProps {
  iconName: string;
  variant: IconBadgeVariant;
  size?: IconBadgeSize;
}

export default function IconBadge(props: IIconBadgeProps): React.ReactElement {
  const sizeClass = props.size === 'compact' ? styles.compact : '';

  return (
    <span className={`${styles.iconBadge} ${styles[props.variant]} ${sizeClass}`}>
      <Icon iconName={props.iconName} aria-hidden="true" />
    </span>
  );
}
