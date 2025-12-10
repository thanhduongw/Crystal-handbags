import { Card, Form, Input, Button, Row, Col, Typography, Alert } from 'antd';
import { PhoneOutlined, MailOutlined, EnvironmentOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

export default function Contact() {
    const [form] = Form.useForm();

    const onFinish = async () => {
        try {
            <Alert title='Gửi tin nhắn thành công! Chúng tôi sẽ liên hệ với bạn sớm.' type='success' showIcon closable />;
            form.resetFields();
        } catch (error) {
            <Alert title='Gửi tin nhắn thất bại!' type='error' showIcon closable />;
        }
    };

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 16px' }}>
            <Title level={2} style={{ textAlign: 'center', marginBottom: 48 }}>Liên hệ với chúng tôi</Title>
            <Row gutter={[32, 32]}>
                <Col xs={24} md={12}>
                    <Card>
                        <Title level={4}>Gửi tin nhắn</Title>
                        <Form form={form} layout="vertical" onFinish={onFinish}>
                            <Form.Item name="name" label="Họ và tên" rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>
                            <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                                <Input />
                            </Form.Item>
                            <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>
                            <Form.Item name="message" label="Nội dung" rules={[{ required: true }]}>
                                <TextArea rows={4} />
                            </Form.Item>
                            <Form.Item>
                                <Button type="primary" htmlType="submit" block>
                                    Gửi tin nhắn
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>
                </Col>

                <Col xs={24} md={12}>
                    <Card>
                        <Title level={4}>Thông tin liên hệ</Title>
                        <div style={{ marginBottom: 24 }}>
                            <PhoneOutlined style={{ fontSize: 20, marginRight: 12, color: '#1890ff' }} />
                            <Text strong>Hotline: </Text>
                            <Text>0369384679 (8:00 - 22:00)</Text>
                        </div>
                        <div style={{ marginBottom: 24 }}>
                            <MailOutlined style={{ fontSize: 20, marginRight: 12, color: '#1890ff' }} />
                            <Text strong>Email: </Text>
                            <Text>levuthanhduong2004@gmail.com</Text>
                        </div>
                        <div style={{ marginBottom: 24 }}>
                            <EnvironmentOutlined style={{ fontSize: 20, marginRight: 12, color: '#1890ff' }} />
                            <Text strong>Địa chỉ: </Text>
                            <Text>313 Nguyễn Văn Công, phường Hạnh Thông, TP. Hồ Chí Minh</Text>
                        </div>

                        <Title level={5} style={{ marginTop: 32 }}>Giờ làm việc</Title>
                        <Paragraph>
                            <Text>Thứ 2 - Thứ 6: 8:00 - 22:00</Text><br />
                            <Text>Thứ 7 - Chủ nhật: 9:00 - 21:00</Text>
                        </Paragraph>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}