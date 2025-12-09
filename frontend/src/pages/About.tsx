import { Card, Typography, Row, Col, Statistic } from 'antd';
import { ShopOutlined, TeamOutlined, TrophyOutlined, CustomerServiceOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

export default function About() {
    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 16px' }}>
            <Card>
                <Title level={2} style={{ textAlign: 'center' }}>Về chúng tôi</Title>
                <Paragraph style={{ fontSize: 16, textAlign: 'center', marginBottom: 48 }}>
                    Chúng tôi là nền tảng thương mại điện tử hàng đầu, mang đến trải nghiệm mua sắm tuyệt vời
                    với hàng ngàn sản phẩm chất lượng cao.
                </Paragraph>

                <Row gutter={[32, 32]} style={{ marginBottom: 48 }}>
                    <Col xs={24} sm={12} md={6}>
                        <Card style={{ textAlign: 'center' }}>
                            <ShopOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                            <Statistic title="Sản phẩm" value={10000} suffix="+" />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card style={{ textAlign: 'center' }}>
                            <TeamOutlined style={{ fontSize: 48, color: '#52c41a' }} />
                            <Statistic title="Khách hàng" value={50000} suffix="+" />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card style={{ textAlign: 'center' }}>
                            <TrophyOutlined style={{ fontSize: 48, color: '#faad14' }} />
                            <Statistic title="Đơn hàng" value={100000} suffix="+" />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Card style={{ textAlign: 'center' }}>
                            <CustomerServiceOutlined style={{ fontSize: 48, color: '#f5222d' }} />
                            <Statistic title="Hỗ trợ 24/7" value="100" suffix="%" />
                        </Card>
                    </Col>
                </Row>

                <Title level={3}>Sứ mệnh của chúng tôi</Title>
                <Paragraph>
                    Mang đến cho khách hàng những sản phẩm chất lượng cao với giá cả hợp lý,
                    cùng dịch vụ chăm sóc khách hàng tận tâm và chuyên nghiệp.
                </Paragraph>

                <Title level={3}>Giá trị cốt lõi</Title>
                <ul>
                    <li><strong>Chất lượng:</strong> Cam kết 100% hàng chính hãng</li>
                    <li><strong>Uy tín:</strong> Minh bạch trong mọi giao dịch</li>
                    <li><strong>Khách hàng:</strong> Luôn đặt lợi ích khách hàng lên hàng đầu</li>
                    <li><strong>Đổi mới:</strong> Không ngừng cải tiến và phát triển</li>
                </ul>
            </Card>
        </div>
    );
}