"use client";

import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import candidatesReducer from "@/store/slices/candidatesSlice";
import sessionReducer from "@/store/slices/sessionSlice";

const rootPersistConfig = {
  key: "root",
  storage,
  whitelist: ["candidates", "session"],
};

const rootReducer = combineReducers({
  candidates: candidatesReducer,
  session: sessionReducer,
});

const persistedReducer = persistReducer(rootPersistConfig, rootReducer as any);

export const makeStore = () =>
  configureStore({
    reducer: persistedReducer,
    middleware: (getDefault) =>
      getDefault({ serializableCheck: false }),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

export const setupStore = () => {
  const store = makeStore();
  const persistor = persistStore(store);
  return { store, persistor };
};

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;


