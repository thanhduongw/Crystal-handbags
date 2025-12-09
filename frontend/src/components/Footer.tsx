import { Layout, Row, Col, Typography, Space } from 'antd';
import { FacebookOutlined, InstagramOutlined, PhoneOutlined, MailOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Footer: AntFooter } = Layout;
const { Title, Text } = Typography;

export default function Footer() {
    return (
        <AntFooter style={{ background: '#001529', color: '#fff', marginTop: 10 }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '10px 16px' }}>
                <Row gutter={[32, 32]}>
                    <Col xs={24} sm={12} md={6}>
                        <Title level={4} style={{ color: '#fff' }}>Về chúng tôi</Title>
                        <Space orientation="vertical" size="small">
                            <Link to="/about" style={{ color: '#aaa' }}>Giới thiệu</Link>
                            <Link to="/contact" style={{ color: '#aaa' }}>Liên hệ</Link>
                        </Space>
                    </Col>

                    <Col xs={24} sm={12} md={6}>
                        <Title level={4} style={{ color: '#fff' }}>Chính sách</Title>
                        <Space orientation="vertical" size="small">
                            <Link to="/privacy" style={{ color: '#aaa' }}>Chính sách bảo mật</Link>
                            <Link to="/terms" style={{ color: '#aaa' }}>Điều khoản sử dụng</Link>
                            <Link to="/shipping" style={{ color: '#aaa' }}>Chính sách vận chuyển</Link>
                            <Link to="/return" style={{ color: '#aaa' }}>Chính sách đổi trả</Link>
                        </Space>
                    </Col>

                    <Col xs={24} sm={12} md={6}>
                        <Title level={4} style={{ color: '#fff' }}>Hỗ trợ khách hàng</Title>
                        <Space orientation="vertical" size="small">
                            <Text style={{ color: '#aaa' }}>
                                <PhoneOutlined /> 1900-xxxx
                            </Text>
                            <Text style={{ color: '#aaa' }}>
                                <MailOutlined /> support@shop.com
                            </Text>
                            <Text style={{ color: '#aaa' }}>
                                <EnvironmentOutlined /> 123 Đường ABC, TP.HCM
                            </Text>
                        </Space>
                    </Col>

                    <Col xs={24} sm={12} md={6}>
                        <Title level={4} style={{ color: '#fff' }}>Kết nối với chúng tôi</Title>
                        <Space size="large">
                            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                                <FacebookOutlined style={{ fontSize: 24, color: '#1877f2' }} />
                            </a>
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                                <InstagramOutlined style={{ fontSize: 24, color: '#e4405f' }} />
                            </a>
                        </Space>
                    </Col>
                </Row>

                <div style={{ borderTop: '1px solid #444', marginTop: 32, paddingTop: 24, textAlign: 'center' }}>
                    <Text style={{ color: '#888' }}>
                        © 2024 E-Commerce Shop. All rights reserved.
                    </Text>
                </div>
            </div>
        </AntFooter>
    );
}