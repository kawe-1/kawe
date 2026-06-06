import { Provider } from 'react-redux';
import { store } from './store';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import React from 'react';

export function Providers() {
  return (
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  );
}
