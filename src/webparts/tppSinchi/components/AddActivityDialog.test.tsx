import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import AddActivityDialog, { type IAddActivityDialogProps } from './AddActivityDialog';

function createProps(overrides: Partial<IAddActivityDialogProps> = {}): IAddActivityDialogProps {
  return {
    isOpen: true,
    mode: 'create',
    initialDate: '2026-10-30',
    userDisplayName: 'Alex User',
    processOptions: [{ key: 'Proyecto', text: 'Proyecto' }],
    projectOptions: [{ key: 'Portal TI', text: 'Portal TI' }],
    catalogsStatus: 'ready',
    catalogsError: '',
    isSaving: false,
    saveError: '',
    onDismiss: jest.fn(),
    onRetryCatalogs: jest.fn(),
    onSave: jest.fn(),
    ...overrides
  };
}

describe('AddActivityDialog', () => {
  it('shows required-field feedback and does not save an empty form', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const props = createProps();

    try {
      act(() => {
        ReactDOM.render(<AddActivityDialog {...props} />, container);
      });

      const saveButton = Array.from(document.querySelectorAll('button'))
        .find(button => button.textContent?.includes('Guardar actividad'));
      expect(saveButton).toBeDefined();

      act(() => {
        saveButton?.click();
      });

      expect(props.onSave).not.toHaveBeenCalled();
      expect(document.body.textContent).toContain('Selecciona un proceso.');
    } finally {
      act(() => {
        ReactDOM.unmountComponentAtNode(container);
      });
      container.remove();
    }
  });
});
