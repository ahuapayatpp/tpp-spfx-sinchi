import * as React from 'react';
import styles from '../../../styles/TppSinchi.module.scss';

export default function AdminPage(): React.ReactElement {
  return (
    <section className={styles.activitiesPage} aria-labelledby="adminTitle">
      <header className={styles.activitiesHeader}>
        <div>
          <h1 id="adminTitle">Administración</h1>
          <p>Esta vista estará disponible solo para administradores.</p>
        </div>
      </header>
      <p id="adminContent">admin</p>
    </section>
  );
}
