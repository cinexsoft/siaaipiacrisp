"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Card, Form, Input, Progress, Upload, Typography, message, Space } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "@/store";
import { startNewSession, markFieldProvided, tickToNextQuestion, completeInterview, restoreTiming } from "@/store/slices/sessionSlice";
import { upsertCandidate, addQA, finalizeCandidate } from "@/store/slices/candidatesSlice";
import dayjs from "dayjs";

const { Title, Text } = Typography;

async function extractFieldsFromAPI(file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/ai/extract", { method: "POST", body: form });
  if (!res.ok) throw new Error("extract failed");
  return (await res.json()) as { name: string; email: string; phone: string; resumeFileName: string };
}

async function getQuestion(index: number): Promise<{ difficulty: "easy" | "medium" | "hard"; q: string; seconds: number }>{
  const res = await fetch("/api/ai/questions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ index }) });
  if (!res.ok) throw new Error("question failed");
  const data = await res.json();
  return { difficulty: data.difficulty, q: data.question, seconds: data.seconds };
}

export default function IntervieweePage() {
  const dispatch = useAppDispatch();
  const session = useAppSelector((s) => (s.session.activeSessionId ? s.session.sessions[s.session.activeSessionId] : undefined));
  const candidates = useAppSelector((s) => s.candidates.all);
  const [form] = Form.useForm();
  const [messages, setMessages] = useState<{ role: "system"|"ai"|"user"; text: string }[]>([]);
  const [answer, setAnswer] = useState("");
  const [nowMs, setNowMs] = useState(Date.now());
  const [email, setEmail] = useState<string>("");
  const [backendStarted, setBackendStarted] = useState<boolean>(false);

  // Do not auto-start; session must be started from Interviewer tab

  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 200);
    return () => clearInterval(t);
  }, []);

  // Poll backend for interview start after email known
  useEffect(() => {
    if (!email) return;
    let timer: any;
    const poll = async () => {
      try {
        const res = await fetch(`/api/interviews/current?email=${encodeURIComponent(email)}`);
        const data = await res.json();
        if (data.session) setBackendStarted(true);
      } catch {}
      timer = setTimeout(poll, 1500);
    };
    poll();
    return () => clearTimeout(timer);
  }, [email]);

  const remaining = useMemo(() => {
    if (!session?.deadlineMs) return 0;
    return Math.max(0, Math.floor((session.deadlineMs - nowMs) / 1000));
  }, [session?.deadlineMs, nowMs]);

  const candidate = useMemo(() => {
    if (!session) return undefined;
    return candidates[session.candidateId];
  }, [session, candidates]);

  async function handleResume(file: File) {
    try {
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      const isDocx = file.type.includes("officedocument") || file.name.toLowerCase().endsWith(".docx");
      if (!isPdf && !isDocx) {
        message.error("Please upload a PDF or DOCX resume.");
        return false;
      }
      const fields = await extractFieldsFromAPI(file);
      dispatch(
        upsertCandidate({
          id: session ? session.candidateId : "temp",
          name: fields.name ?? "",
          email: fields.email ?? "",
          phone: fields.phone ?? "",
          resumeFileName: file.name,
        })
      );
      if (fields.email) setEmail(fields.email);
      if (fields.name) dispatch(markFieldProvided({ field: "name" }));
      if (fields.email) dispatch(markFieldProvided({ field: "email" }));
      if (fields.phone) dispatch(markFieldProvided({ field: "phone" }));
      message.success("Resume processed. Waiting for interviewer to start...");
      return true;
    } catch (e: any) {
      message.error("Failed to parse resume. Try another file.");
      return false;
    }
  }

  async function handleProvideMissing(values: any) {
    if (!session) return;
    const payload: any = { id: session.candidateId };
    if (values.name) {
      payload.name = values.name;
      dispatch(markFieldProvided({ field: "name" }));
    }
    if (values.email) {
      payload.email = values.email;
      dispatch(markFieldProvided({ field: "email" }));
      setEmail(values.email);
    }
    if (values.phone) {
      payload.phone = values.phone;
      dispatch(markFieldProvided({ field: "phone" }));
    }
    dispatch(upsertCandidate(payload));
    // sync to backend profile
    if (values.email || values.name || values.phone) {
      await fetch("/api/interviews/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email || email,
          phone: values.phone,
          resumeFileName: candidate?.resumeFileName,
        }),
      });
    }
  }

  async function handleSubmitAnswer() {
    if (!session) return;
    const { difficulty, q, seconds } = await getQuestion(session.currentIndex);
    const scoreRes = await fetch("/api/ai/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answer: answer.trim(),
        difficulty,
        allScores: (candidates[session.candidateId]?.qas || []).map((x) => x.score),
      }),
    });
    const { score, done, finalScore, summary } = await scoreRes.json();
    // persist to backend anonymous store
    if (email) {
      await fetch("/api/interviews/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          question: q,
          difficulty,
          answer: answer.trim(),
          secondsAllocated: seconds,
          secondsUsed: (session.startedAtMs && session.deadlineMs) ? Math.min(seconds, Math.floor((session.deadlineMs - session.startedAtMs) / 1000) - Math.max(0, remaining)) : seconds,
          score,
        }),
      });
    }
    dispatch(
      addQA({
        candidateId: session.candidateId,
        qa: {
          difficulty,
          question: q,
          answer: answer.trim(),
          secondsAllocated: seconds,
          secondsUsed: (session.startedAtMs && session.deadlineMs) ? Math.min(seconds, Math.floor((session.deadlineMs - session.startedAtMs) / 1000) - Math.max(0, remaining)) : seconds,
          score,
        },
      })
    );
    setAnswer("");
    if (done || session.currentIndex >= 5) {
      dispatch(finalizeCandidate({ candidateId: session.candidateId, finalScore: finalScore ?? 0, summary: summary ?? "Generated summary" }));
      dispatch(completeInterview());
      setMessages((m) => [...m, { role: "ai", text: `Interview completed. Final score: ${finalScore ?? 0}. ${summary ?? ""}` }]);
    } else {
      dispatch(tickToNextQuestion());
      const next = await getQuestion(session.currentIndex + 1);
      setMessages((m) => [...m, { role: "ai", text: next.q }]);
    }
  }

  useEffect(() => {
    if (!session) return;
    // Ensure timers restored after reload
    dispatch(restoreTiming());
    if (session.stage === "interview" && messages.length === 0) {
      const idx = session.currentIndex ?? 0;
      getQuestion(idx).then((q) => setMessages([{ role: "ai", text: q.q }]));
    }
  }, [session?.stage, session?.currentIndex]);

  useEffect(() => {
    if (!session || session.stage !== "interview") return;
    if (remaining === 0) {
      // auto submit
      handleSubmitAnswer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, session?.stage]);

  return (
    <div className="space-y-6">
      <Card>
        <Title level={3}>Interviewee</Title>
        {!session && (
          <Text type="secondary">Upload your resume and wait for the interviewer to start the interview. This page will update automatically.</Text>
        )}
        {session && !candidate && <Text type="secondary">Start by uploading your resume.</Text>}
        <div className="mt-4">
          <Upload.Dragger
            multiple={false}
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            beforeUpload={async (file) => {
              const ok = await handleResume(file as unknown as File);
              return Upload.LIST_IGNORE && ok;
            }}
            showUploadList={false}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Click or drag file to this area to upload</p>
            <p className="ant-upload-hint">PDF required, DOCX optional.</p>
          </Upload.Dragger>
          {candidate && (
            <div className="mt-2">
              <Text strong>Loaded:</Text> <Text>{candidate.resumeFileName}</Text>
            </div>
          )}
        </div>
      </Card>

      {session && (session.requiredFields.name || session.requiredFields.email || session.requiredFields.phone) && (
        <Card>
          <Title level={4}>Profile</Title>
          <Form
            layout="vertical"
            form={form}
            initialValues={{ name: candidate?.name, email: candidate?.email, phone: candidate?.phone }}
            onFinish={handleProvideMissing}
          >
            {session.requiredFields.name && (
              <Form.Item label="Name" name="name" rules={[{ required: true, message: "Please provide your name" }]}>
                <Input placeholder="Your full name" />
              </Form.Item>
            )}
            {session.requiredFields.email && (
              <Form.Item label="Email" name="email" rules={[{ required: true, message: "Please provide your email" }, { type: "email", message: "Invalid email" }]}>
                <Input placeholder="you@example.com" />
              </Form.Item>
            )}
            {session.requiredFields.phone && (
              <Form.Item label="Phone" name="phone" rules={[{ required: true, message: "Please provide your phone" }]}>
                <Input placeholder="+1 234 567 8901" />
              </Form.Item>
            )}
            <Button type="primary" htmlType="submit">Save Missing Fields</Button>
          </Form>
        </Card>
      )}

      <Card>
        <Title level={4}>Interview</Title>
        {session?.stage !== "interview" && !backendStarted && (
          <Text type="secondary">Waiting for the interviewer to start your interview…</Text>
        )}
        {session?.stage !== "interview" && backendStarted && (
          <Text type="secondary">Provide any missing fields to begin the interview.</Text>
        )}
        {session?.stage === "interview" && (
          <div className="space-y-4">
            <Space direction="vertical" className="w-full">
              <Text>Time remaining: {remaining}s</Text>
              <Progress percent={session.deadlineMs && session.startedAtMs ? Math.min(100, Math.round(((nowMs - session.startedAtMs) / (session.deadlineMs - session.startedAtMs)) * 100)) : 0} />
            </Space>
            <div className="bg-gray-50 rounded p-3 space-y-2 max-h-64 overflow-auto">
              {messages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                  <span className={m.role === "user" ? "bg-blue-100 px-2 py-1 rounded" : "bg-gray-200 px-2 py-1 rounded"}>{m.text}</span>
                </div>
              ))}
            </div>
            <Input.TextArea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={3}
              placeholder="Type your answer here..."
            />
            <Button type="primary" onClick={() => { setMessages((m) => [...m, { role: "user", text: answer }]); handleSubmitAnswer(); }}>
              Submit Answer
            </Button>
          </div>
        )}
        {session?.stage === "completed" && (
          <div>
            <Title level={5}>Interview finished</Title>
            <Text>Check the Interviewer tab for your final score and summary.</Text>
          </div>
        )}
      </Card>
    </div>
  );
}

function scoreAnswer(ans: string, diff: "easy"|"medium"|"hard"): number {
  if (!ans.trim()) return 0;
  const base = ans.length > 20 ? 6 : 3;
  const bonus = /react|node|next|typescript|optimization/i.test(ans) ? 3 : 1;
  const diffBonus = diff === "hard" ? 2 : diff === "medium" ? 1 : 0;
  return Math.min(10, base + bonus + diffBonus);
}

function computeFinalScore(qas: { score: number }[]): number {
  if (!qas.length) return 0;
  const sum = qas.reduce((a, b) => a + (b.score || 0), 0);
  return Math.round((sum / (qas.length * 10)) * 100);
}

function generateSummary(candidate: any): string {
  const name = candidate?.name || "Candidate";
  const avg = computeFinalScore(candidate?.qas || []);
  return `${name} demonstrated skills across React/Node. Overall performance ${avg}%.`;
}


