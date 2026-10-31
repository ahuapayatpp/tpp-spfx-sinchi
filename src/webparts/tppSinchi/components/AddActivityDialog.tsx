import * as React from 'react';
import {
  DefaultButton,
  Dropdown,
  MessageBar,
  MessageBarType,
  Panel,
  PanelType,
  PrimaryButton,
  ProgressIndicator,
  TextField
} from '@fluentui/react';
import { getLimaDateOnly } from '../../../services/activityDate';
import type { IActivityDraft, IActivityOption } from '../../../services/activityService';
import styles from './AddActivityDialog.module.scss';

export interface IAddActivityDialogProps {
  isOpen: boolean;
  userDisplayName: string;
  processOptions: IActivityOption[];
  projectOptions: IActivityOption[];
  catalogsStatus: 'loading' | 'error' | 'ready';
  catalogsError: string;
  isSaving: boolean;
  saveError: string;
  onDismiss: () => void;
  onRetryCatalogs: () => void;
  onSave: (activity: IActivityDraft) => void;
}

interface IActivityFormState {
  date: string;
  activity: string;
  process: string;
  project: string;
  module: string;
  hu: string;
  hours: string;
}

const QUICK_HOURS: number[] = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8];

function formatDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('es-PE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(year, month - 1, day));
}

function createEmptyForm(): IActivityFormState {
  return {
    date: getLimaDateOnly(),
    activity: '',
    process: '',
    project: '',
    module: '',
    hu: '',
    hours: '1'
  };
}

export default function AddActivityDialog(props: IAddActivityDialogProps): React.ReactElement {
  const [form, setForm] = React.useState<IActivityFormState>(createEmptyForm);
  const [hasSubmitted, setHasSubmitted] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (props.isOpen) {
      setForm(createEmptyForm());
      setHasSubmitted(false);
    }
  }, [props.isOpen]);

  const hours = Number(form.hours);
  const isHoursValid = Number.isFinite(hours) && hours >= 0.5;
  const hasValidForm =
    form.activity.trim().length > 0 &&
    form.process.length > 0 &&
    form.project.length > 0 &&
    form.hu.trim().length > 0 &&
    isHoursValid;
  const canSave =
    hasValidForm &&
    !props.isSaving &&
    props.catalogsStatus === 'ready' &&
    props.processOptions.length > 0 &&
    props.projectOptions.length > 0;

  const setField = (field: keyof IActivityFormState, value: string): void => {
    setForm(previous => ({ ...previous, [field]: value }));
  };

  const saveActivity = (): void => {
    setHasSubmitted(true);

    if (!canSave) {
      return;
    }

    props.onSave({
      date: form.date,
      responsibleUser: props.userDisplayName.trim(),
      activity: form.activity.trim(),
      process: form.process,
      project: form.project,
      module: form.module.trim() || undefined,
      hu: form.hu.trim(),
      hours
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    saveActivity();
  };

  return (
    <Panel
      className={styles.activityPanel}
      isOpen={props.isOpen}
      onDismiss={props.onDismiss}
      type={PanelType.custom}
      customWidth="448px"
      headerText="Registrar actividad"
      closeButtonAriaLabel="Cerrar"
      isBlocking
      isLightDismiss
      isFooterAtBottom
      onRenderFooterContent={() => (
        <div className={styles.actions}>
          <DefaultButton text="Cancelar" onClick={props.onDismiss} />
          <PrimaryButton
            text={props.isSaving ? 'Guardando...' : 'Guardar actividad'}
            onClick={saveActivity}
            disabled={!canSave}
          />
        </div>
      )}
    >
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {props.catalogsStatus === 'loading' && (
          <ProgressIndicator label="Cargando procesos y proyectos..." />
        )}
        {props.catalogsStatus === 'error' && (
          <MessageBar messageBarType={MessageBarType.error}>
            {props.catalogsError}
            <DefaultButton
              text="Reintentar"
              onClick={props.onRetryCatalogs}
            />
          </MessageBar>
        )}
        {props.catalogsStatus === 'ready' && (!props.processOptions.length || !props.projectOptions.length) && (
          <MessageBar messageBarType={MessageBarType.warning}>
            {!props.processOptions.length && !props.projectOptions.length
              ? 'No hay procesos ni proyectos activos disponibles.'
              : !props.processOptions.length
                ? 'No hay procesos activos disponibles.'
                : 'No hay proyectos activos disponibles.'}
          </MessageBar>
        )}
        {props.saveError && (
          <MessageBar messageBarType={MessageBarType.error}>
            {props.saveError}
          </MessageBar>
        )}
        <dl className={styles.context}>
          <div>
            <dt>Fecha</dt>
            <dd>{formatDate(form.date)}</dd>
          </div>
          <div>
            <dt>Responsable</dt>
            <dd>{props.userDisplayName.trim() || 'Usuario actual'}</dd>
          </div>
        </dl>

        <TextField
          label="Actividad"
          placeholder="Describe lo que realizaste"
          multiline
          rows={3}
          required
          value={form.activity}
          onChange={(_, value) => setField('activity', value || '')}
          disabled={props.isSaving}
          errorMessage={hasSubmitted && !form.activity.trim() ? 'Describe la actividad.' : undefined}
        />

        <div className={styles.fieldGrid}>
          <Dropdown
            label="Proceso"
            placeholder="Seleccionar"
            required
            disabled={props.catalogsStatus !== 'ready' || props.processOptions.length === 0 || props.isSaving}
            options={props.processOptions}
            selectedKey={form.process || undefined}
            onChange={(_, option) => setField('process', option ? String(option.key) : '')}
            errorMessage={hasSubmitted && !form.process ? 'Selecciona un proceso.' : undefined}
          />
          <Dropdown
            label="Proyecto"
            placeholder="Seleccionar"
            required
            disabled={props.catalogsStatus !== 'ready' || props.projectOptions.length === 0 || props.isSaving}
            options={props.projectOptions}
            selectedKey={form.project || undefined}
            onChange={(_, option) => setField('project', option ? String(option.key) : '')}
            errorMessage={hasSubmitted && !form.project ? 'Selecciona un proyecto.' : undefined}
          />
          <TextField
            label="Módulo"
            placeholder="Ej.: tpp-web"
            value={form.module}
            onChange={(_, value) => setField('module', value || '')}
            disabled={props.isSaving}
          />
          <TextField
            label="HU"
            placeholder="Ej.: HU-12345"
            required
            value={form.hu}
            onChange={(_, value) => setField('hu', value || '')}
            disabled={props.isSaving}
            errorMessage={hasSubmitted && !form.hu.trim() ? 'Ingresa la HU.' : undefined}
          />
        </div>

        <div className={styles.hoursSection}>
          <TextField
            className={styles.hoursInput}
            label="Horas"
            type="number"
            required
            min={0.5}
            step={0.5}
            inputMode="decimal"
            value={form.hours}
            onChange={(_, value) => setField('hours', value || '')}
            disabled={props.isSaving}
            errorMessage={hasSubmitted && !isHoursValid ? 'Ingresa al menos 0,5 horas.' : undefined}
          />
          <div className={styles.quickHours} role="group" aria-label="Horas frecuentes">
            {QUICK_HOURS.map(quickHour => {
              const isSelected = hours === quickHour;
              const Button = isSelected ? PrimaryButton : DefaultButton;
              return (
                <Button
                  key={quickHour}
                  className={`${styles.hourButton} ${isSelected ? styles.selectedHourButton : ''}`}
                  text={String(quickHour).replace('.', ',')}
                  ariaLabel={`${quickHour.toLocaleString('es-PE')} horas`}
                  aria-pressed={isSelected}
                  disabled={props.isSaving}
                  onClick={() => setField('hours', String(quickHour))}
                />
              );
            })}
          </div>
        </div>
      </form>
    </Panel>
  );
}
