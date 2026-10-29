import * as React from 'react';
import { Icon, Link } from '@fluentui/react';
import styles from './ResourceItem.module.scss';

export interface IResourceItemProps {
  name: string;
  iconName: string;
}

const preventNavigation = (event: React.MouseEvent<HTMLElement>): void => {
  event.preventDefault();
};

export default function ResourceItem(props: IResourceItemProps): React.ReactElement {
  return (
    <Link className={styles.resourceLink} href="#" onClick={preventNavigation}>
      <Icon className={styles.resourceIcon} iconName={props.iconName} aria-hidden="true" />
      <span>{props.name}</span>
      <Icon className={styles.externalIcon} iconName="OpenInNewWindow" aria-hidden="true" />
    </Link>
  );
}
