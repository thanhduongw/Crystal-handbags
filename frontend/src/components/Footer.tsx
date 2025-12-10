import { Layout, Row, Col, Typography, Space, Divider } from 'antd';
import {
    FacebookOutlined,
    InstagramOutlined,
    PhoneOutlined,
    MailOutlined,
    EnvironmentOutlined,
    YoutubeOutlined,
    TwitterOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Footer: AntFooter } = Layout;
const { Title, Text, Paragraph } = Typography;

export default function Footer() {
    return (
        <AntFooter style={{
            background: '#001529',
            color: '#fff',
            marginTop: 48,
            padding: '48px 24px 24px'
        }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <Row gutter={[32, 32]}>
                    {/* Company Info */}
                    <Col xs={24} sm={12} md={6}>
                        <Title level={4} style={{ color: '#fff', marginBottom: 16 }}>
                            Crystal Shop
                        </Title>
                        <Paragraph style={{ color: '#bfbfbf' }}>
                            Cửa hàng thời trang uy tín, chất lượng cao với nhiều mẫu mã đa dạng.
                        </Paragraph>
                        <Space size="middle" style={{ marginTop: 16 }}>
                            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                                <FacebookOutlined style={{ fontSize: 24, color: '#1877f2' }} />
                            </a>
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                                <InstagramOutlined style={{ fontSize: 24, color: '#e4405f' }} />
                            </a>
                            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
                                <YoutubeOutlined style={{ fontSize: 24, color: '#ff0000' }} />
                            </a>
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                                <TwitterOutlined style={{ fontSize: 24, color: '#1da1f2' }} />
                            </a>
                        </Space>
                    </Col>

                    {/* About Us */}
                    <Col xs={24} sm={12} md={6}>
                        <Title level={5} style={{ color: '#fff', marginBottom: 16 }}>
                            Về chúng tôi
                        </Title>
                        <Space orientation="vertical" size="small">
                            <Link to="/about" style={{ color: '#bfbfbf', display: 'block' }}>
                                Giới thiệu
                            </Link>
                            <Link to="/contact" style={{ color: '#bfbfbf', display: 'block' }}>
                                Liên hệ
                            </Link>
                            <Link to="/careers" style={{ color: '#bfbfbf', display: 'block' }}>
                                Tuyển dụng
                            </Link>
                            <Link to="/blog" style={{ color: '#bfbfbf', display: 'block' }}>
                                Blog
                            </Link>
                        </Space>
                    </Col>

                    {/* Policies */}
                    <Col xs={24} sm={12} md={6}>
                        <Title level={5} style={{ color: '#fff', marginBottom: 16 }}>
                            Chính sách
                        </Title>
                        <Space orientation="vertical" size="small">
                            <Link to="/privacy" style={{ color: '#bfbfbf', display: 'block' }}>
                                Chính sách bảo mật
                            </Link>
                            <Link to="/terms" style={{ color: '#bfbfbf', display: 'block' }}>
                                Điều khoản sử dụng
                            </Link>
                            <Link to="/shipping" style={{ color: '#bfbfbf', display: 'block' }}>
                                Chính sách vận chuyển
                            </Link>
                            <Link to="/return" style={{ color: '#bfbfbf', display: 'block' }}>
                                Chính sách đổi trả
                            </Link>
                            <Link to="/payment" style={{ color: '#bfbfbf', display: 'block' }}>
                                Phương thức thanh toán
                            </Link>
                        </Space>
                    </Col>

                    {/* Contact */}
                    <Col xs={24} sm={12} md={6}>
                        <Title level={5} style={{ color: '#fff', marginBottom: 16 }}>
                            Liên hệ
                        </Title>
                        <Space orientation="vertical" size="middle">
                            <Space style={{ color: '#bfbfbf' }}>
                                <PhoneOutlined />
                                <Text style={{ color: '#bfbfbf' }}>0369384679</Text>
                            </Space>
                            <Space style={{ color: '#bfbfbf' }}>
                                <MailOutlined />
                                <Text style={{ color: '#bfbfbf' }}>
                                    levuthanhduong2004@gmail.com
                                </Text>
                            </Space>
                            <Space align="start" style={{ color: '#bfbfbf' }}>
                                <EnvironmentOutlined style={{ marginTop: 4 }} />
                                <Text style={{ color: '#bfbfbf' }}>
                                    313 Nguyễn Văn Công, Phường Hạnh Thông, TP.HCM
                                </Text>
                            </Space>
                        </Space>
                    </Col>
                </Row>

                <Divider style={{ borderColor: '#434343', margin: '32px 0 24px' }} />

                <Row justify="space-between" align="middle">
                    <Col xs={24} md={12} style={{ textAlign: 'center', marginBottom: 16 }}>
                        <Text style={{ color: '#8c8c8c' }}>
                            © 2024 Crystal Shop. All rights reserved.
                        </Text>
                    </Col>
                    <Col xs={24} md={12} style={{ textAlign: 'center' }}>
                        <Space separator={<Divider orientation="vertical" style={{ borderColor: '#434343' }} />}>
                            <Link to="/sitemap" style={{ color: '#8c8c8c' }}>
                                Sitemap
                            </Link>
                            <Link to="/support" style={{ color: '#8c8c8c' }}>
                                Hỗ trợ
                            </Link>
                            <Link to="/faq" style={{ color: '#8c8c8c' }}>
                                FAQ
                            </Link>
                        </Space>
                    </Col>
                </Row>
            </div>
        </AntFooter>
    );
}