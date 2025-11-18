import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import FeedbackComponent from '../src/components/FeedbackComponent';

describe('Confirmación y Mensajes', () => {
  test('muestra mensaje de éxito correctamente', () => {
    const { getByText, getByTestId } = render(
      <FeedbackComponent 
        visible={true}
        type="success"
        message="Operación completada con éxito"
        onDismiss={() => {}}
      />
    );
    
    expect(getByText('Operación completada con éxito')).toBeTruthy();
    expect(getByTestId('success-icon')).toBeTruthy();
  });

  test('muestra mensaje de error correctamente', () => {
    const { getByText, getByTestId } = render(
      <FeedbackComponent 
        visible={true}
        type="error"
        message="Ha ocurrido un error"
        onDismiss={() => {}}
      />
    );
    
    expect(getByText('Ha ocurrido un error')).toBeTruthy();
    expect(getByTestId('error-icon')).toBeTruthy();
  });

  test('llama a onDismiss cuando se cierra el mensaje', () => {
    const onDismissMock = jest.fn();
    const { getByTestId } = render(
      <FeedbackComponent 
        visible={true}
        type="info"
        message="Información importante"
        onDismiss={onDismissMock}
      />
    );
    
    const closeButton = getByTestId('close-button');
    fireEvent.press(closeButton);
    
    expect(onDismissMock).toHaveBeenCalled();
  });

  test('no renderiza nada cuando visible es false', () => {
    const { queryByTestId } = render(
      <FeedbackComponent 
        visible={false}
        type="success"
        message="Este mensaje no debería verse"
        onDismiss={() => {}}
      />
    );
    
    expect(queryByTestId('feedback-container')).toBeNull();
  });
});