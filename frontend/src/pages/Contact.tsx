import { useState } from 'react';
import { Card, Form, Input, Button, Row, Col, Typography, message } from 'antd';
import { PhoneOutlined, MailOutlined, EnvironmentOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

export default function Contact() {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const onFinish = async (values: any) => {
        try {
            setLoading(true);
            // TODO: Integrate with backend API
            console.log('Contact form values:', values);

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            message.success('Gửi tin nhắn thành công! Chúng tôi sẽ liên hệ với bạn sớm.');
            form.resetFields();
        } catch (error) {
            console.error('Contact form error:', error);
            message.error('Gửi tin nhắn thất bại! Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 16px' }}>
            <Title level={2} style={{ textAlign: 'center', marginBottom: 48 }}>
                Liên hệ với chúng tôi
            </Title>

            <Row gutter={[32, 32]}>
                <Col xs={24} md={12}>
                    <Card>
                        <Title level={4}>Gửi tin nhắn</Title>
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={onFinish}
                        >
                            <Form.Item
                                name="name"
                                label="Họ và tên"
                                rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
                            >
                                <Input placeholder="Nguyễn Văn A" />
                            </Form.Item>

                            <Form.Item
                                name="email"
                                label="Email"
                                rules={[
                                    { required: true, message: 'Vui lòng nhập email!' },
                                    { type: 'email', message: 'Email không hợp lệ!' }
                                ]}
                            >
                                <Input placeholder="example@email.com" />
                            </Form.Item>

                            <Form.Item
                                name="phone"
                                label="Số điện thoại"
                                rules={[
                                    { required: true, message: 'Vui lòng nhập số điện thoại!' },
                                    { pattern: /^[0-9]{10}$/, message: 'Số điện thoại không hợp lệ!' }
                                ]}
                            >
                                <Input placeholder="0369384679" />
                            </Form.Item>

                            <Form.Item
                                name="message"
                                label="Nội dung"
                                rules={[
                                    { required: true, message: 'Vui lòng nhập nội dung!' },
                                    { min: 10, message: 'Nội dung tối thiểu 10 ký tự!' }
                                ]}
                            >
                                <TextArea
                                    rows={4}
                                    placeholder="Nhập nội dung tin nhắn của bạn..."
                                    showCount
                                    maxLength={500}
                                />
                            </Form.Item>

                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    block
                                    loading={loading}
                                >
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
                            <PhoneOutlined style={{
                                fontSize: 20,
                                marginRight: 12,
                                color: '#1890ff'
                            }} />
                            <Text strong>Hotline: </Text>
                            <Text>0369384679</Text>
                            <br />
                            <Text type="secondary" style={{ marginLeft: 32 }}>
                                (8:00 - 22:00 hàng ngày)
                            </Text>
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <MailOutlined style={{
                                fontSize: 20,
                                marginRight: 12,
                                color: '#1890ff'
                            }} />
                            <Text strong>Email: </Text>
                            <Text copyable>levuthanhduong2004@gmail.com</Text>
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <EnvironmentOutlined style={{
                                fontSize: 20,
                                marginRight: 12,
                                color: '#1890ff'
                            }} />
                            <Text strong>Địa chỉ: </Text>
                            <Text>
                                313 Nguyễn Văn Công, phường Hạnh Thông Tây,
                                Quận Gò Vấp, TP. Hồ Chí Minh
                            </Text>
                        </div>

                        <Title level={5} style={{ marginTop: 32 }}>
                            Giờ làm việc
                        </Title>
                        <Paragraph>
                            <Text>• Thứ 2 - Thứ 6: 8:00 - 22:00</Text><br />
                            <Text>• Thứ 7 - Chủ nhật: 9:00 - 21:00</Text><br />
                            <Text type="secondary">• Nghỉ các ngày lễ, Tết</Text>
                        </Paragraph>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}