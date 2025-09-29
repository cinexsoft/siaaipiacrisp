"use client";

import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { setupStore } from "@/store";

const { store, persistor } = setupStore();

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate persistor={persistor}>{children}</PersistGate>
    </Provider>
  );
}


