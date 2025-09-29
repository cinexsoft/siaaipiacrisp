"use client";

import { useMemo, useState } from "react";
import { Card, Input, Table, Typography, Tag, Space, Drawer, List, Button, Form, message } from "antd";
import { useAppDispatch, useAppSelector } from "@/store";
import { nanoid } from "@reduxjs/toolkit";
import { upsertCandidate } from "@/store/slices/candidatesSlice";
import { startSessionWithCandidate } from "@/store/slices/sessionSlice";

const { Title, Text } = Typography;

export default function InterviewerPage() {
  const all = useAppSelector((s) => Object.values(s.candidates.all));
  const dispatch = useAppDispatch();
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | undefined>();
  const [form] = Form.useForm();

  const data = useMemo(() => {
    const list = all
      .map((c) => ({
        key: c.id,
        ...c,
      }))
      .filter((c) =>
        [c.name, c.email, c.phone].some((v) => (v || "").toLowerCase().includes(q.toLowerCase()))
      )
      .sort((a, b) => (b.finalScore ?? 0) - (a.finalScore ?? 0));
    return list;
  }, [all, q]);

  return (
    <div className="space-y-6">
      <Card>
        <Title level={3}>Interviewer Dashboard</Title>
        <Input.Search
          placeholder="Search by name, email, phone"
          allowClear
          onChange={(e) => setQ(e.target.value)}
          className="max-w-md"
        />
        <div className="mt-4">
          <Form
            layout="inline"
            form={form}
            onFinish={async (values) => {
              const email = values.email as string;
              if (!email) return;
              // Create candidate locally for dashboard view
              const existing = all.find((c) => c.email === email);
              const candidateId = existing?.id ?? nanoid();
              if (!existing) {
                dispatch(
                  upsertCandidate({ id: candidateId, name: "", email, phone: "", createdAt: Date.now(), completed: false, finalScore: 0, summary: "", qas: [] })
                );
              }
              dispatch(startSessionWithCandidate({ candidateId }));
              // Notify backend anonymous session by email
              await fetch("/api/interviews/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
              message.success("Started a new interview session.");
              form.resetFields();
            }}
          >
            <Form.Item name="email" rules={[{ required: true, type: "email", message: "Enter candidate email" }]}> 
              <Input placeholder="Enter candidate email to start new interview" className="min-w-[320px]" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">Start Interview</Button>
            </Form.Item>
          </Form>
        </div>
      </Card>

      <Card>
        <Table
          dataSource={data}
          onRow={(r) => ({ onClick: () => setOpenId(r.id) })}
          columns={[
            { title: "Name", dataIndex: "name" },
            { title: "Email", dataIndex: "email" },
            { title: "Phone", dataIndex: "phone" },
            {
              title: "Status",
              render: (_, r) => (
                <Tag color={r.completed ? "green" : "blue"}>{r.completed ? "Completed" : "In Progress"}</Tag>
              ),
            },
            {
              title: "Final Score",
              dataIndex: "finalScore",
              render: (v: number) => (v ? `${v}` : "-"),
              sorter: (a: any, b: any) => (a.finalScore ?? 0) - (b.finalScore ?? 0),
            },
            { title: "Summary", dataIndex: "summary" },
          ]}
        />
      </Card>

      <CandidateDrawer openId={openId} onClose={() => setOpenId(undefined)} />
    </div>
  );
}

function CandidateDrawer({ openId, onClose }: { openId?: string; onClose: () => void }) {
  const candidate = useAppSelector((s) => (openId ? s.candidates.all[openId] : undefined));
  return (
    <Drawer title={candidate ? candidate.name : "Candidate"} width={640} open={!!openId} onClose={onClose}>
      {candidate ? (
        <Space direction="vertical" className="w-full">
          <Text>Email: {candidate.email}</Text>
          <Text>Phone: {candidate.phone}</Text>
          <Text>Final Score: {candidate.finalScore || "-"}</Text>
          <Text>Summary: {candidate.summary || "-"}</Text>
          <List
            header={<div>Q/A with Scores</div>}
            dataSource={candidate.qas}
            renderItem={(qa, idx) => (
              <List.Item>
                <Space direction="vertical">
                  <Text>
                    {idx + 1}. [{qa.difficulty.toUpperCase()}] {qa.question}
                  </Text>
                  <Text strong>Answer:</Text>
                  <Text>{qa.answer || "(no answer)"}</Text>
                  <Text type="secondary">Score: {qa.score}/10 — Time: {qa.secondsUsed}/{qa.secondsAllocated}s</Text>
                </Space>
              </List.Item>
            )}
          />
        </Space>
      ) : (
        <Text type="secondary">Select a candidate to view details.</Text>
      )}
    </Drawer>
  );
}


