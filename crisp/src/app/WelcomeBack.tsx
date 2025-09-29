"use client";

import { Modal } from "antd";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { restoreSession, setWelcomeBackSeen } from "@/store/slices/sessionSlice";

export default function WelcomeBack() {
  const dispatch = useAppDispatch();
  const { activeSessionId, sessions, welcomeBackSeen } = useAppSelector((s) => s.session);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!welcomeBackSeen) {
      const unfinished = Object.entries(sessions).find(([, s]) => s.stage !== "completed");
      if (unfinished) {
        setOpen(true);
      }
    }
  }, [sessions, welcomeBackSeen]);

  return (
    <Modal
      open={open}
      title="Welcome Back"
      okText="Resume"
      cancelText="Dismiss"
      onOk={() => {
        const unfinished = Object.entries(sessions).find(([, s]) => s.stage !== "completed");
        if (unfinished) dispatch(restoreSession(unfinished[0]));
        setOpen(false);
        dispatch(setWelcomeBackSeen(true));
      }}
      onCancel={() => {
        setOpen(false);
        dispatch(setWelcomeBackSeen(true));
      }}
    >
      You have an unfinished interview session. Would you like to resume?
    </Modal>
  );
}


