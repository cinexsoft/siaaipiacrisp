"use client";

import { Card, Form, Input, Button, Typography, message } from "antd";
import { useRouter } from "next/navigation";

const { Title } = Typography;

export default function LoginPage() {
  const router = useRouter();
  const [form] = Form.useForm();

  async function onFinish(values: any) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      message.error("Invalid credentials");
      return;
    }
    const data = await res.json();
    if (data.role === "interviewer") router.push("/interviewer");
    else router.push("/interviewee");
  }

  return (
    <div className="flex justify-center">
      <Card className="w-full max-w-md">
        <Title level={3}>Login</Title>
        <Form layout="vertical" form={form} onFinish={onFinish}>
          <Form.Item name="email" label="Email" rules={[{ required: true, message: "Enter email" }]}>
            <Input placeholder="admin or candidate@example.com" />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, message: "Enter password" }]}>
            <Input.Password placeholder="admin or temp123" />
          </Form.Item>
          <Button type="primary" htmlType="submit">Login</Button>
        </Form>
      </Card>
    </div>
  );
}


