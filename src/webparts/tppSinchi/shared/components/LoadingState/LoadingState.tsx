import * as React from 'react';
import { Spinner, SpinnerSize } from '@fluentui/react';
import styles from './LoadingState.module.scss';

export interface ILoadingStateProps {
  label: string;
  size?: SpinnerSize;
  className?: string;
}

export default function LoadingState(props: ILoadingStateProps): React.ReactElement {
  const className = [styles.loadingState, props.className].filter(Boolean).join(' ');

  return (
    <div className={className} role="status" aria-live="polite">
      <Spinner size={props.size || SpinnerSize.medium} label={props.label} />
    </div>
  );
}
