import * as React from 'react';
import { Icon, Link, TooltipHost } from '@fluentui/react';
import styles from './ResourceItem.module.scss';

export interface IResourceItemProps {
  name: string;
  url: string;
  description?: string;
  iconName: string;
}

export default function ResourceItem(props: IResourceItemProps): React.ReactElement {
  const link = (
    <Link
      className={styles.resourceLink}
      href={props.url}
      target="_blank"
      rel="noopener noreferrer"
    >
      <Icon className={styles.resourceIcon} iconName={props.iconName} aria-hidden="true" />
      <span>{props.name}</span>
      <Icon className={styles.externalIcon} iconName="OpenInNewWindow" aria-hidden="true" />
    </Link>
  );

  if (!props.description) {
    return link;
  }

  return (
    <TooltipHost
      content={<div className={styles.resourceTooltip}>{props.description}</div>}
      hostClassName={styles.resourceTooltipHost}
    >
      {link}
    </TooltipHost>
  );
}
