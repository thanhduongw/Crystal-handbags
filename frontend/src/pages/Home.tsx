import { useEffect, useState } from 'react';
import { Carousel, Col, Row, Spin, Typography, Button, Divider, Empty } from 'antd';
import { ShoppingOutlined } from '@ant-design/icons';
import type { ProductListDto, CategoryDto } from '../types';
import { fetchProducts } from '../api/productAPI';
import ProductCard from '../components/ProductCard';
import CategoryCard from '../components/CategoryCard';
import { useNavigate } from 'react-router-dom';
import { fetchCategories } from '../api/categoryAPI';

const { Title } = Typography;

const CAROUSEL_IMAGES = [
    'https://cdn.hstatic.net/files/1000003969/file/khong-lineee.jpg',
    'https://file.hstatic.net/1000003969/file/1920x870_6f0552ad424b4c4dba7d8ed47e215225.jpg',
    'https://file.hstatic.net/1000003969/file/kvm.jpg',
    'https://file.hstatic.net/1000003969/file/1920x870_b5e84ea3a70d430c8b33f479c64fb560.jpg'
];

export default function Home() {
    const [categories, setCategories] = useState<CategoryDto[]>([]);
    const [products, setProducts] = useState<ProductListDto[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [prods, cats] = await Promise.all([
                fetchProducts(),
                fetchCategories()
            ]);

            setProducts(prods.filter((p) => p.showHomepage));
            setCategories(cats);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '60vh'
            }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div>
            {/* Hero Carousel */}
            <Carousel
                arrows
                draggable
                autoplay
                autoplaySpeed={4000}
                effect="fade"
            >
                {CAROUSEL_IMAGES.map((img, idx) => (
                    <div key={idx}>
                        <div style={{
                            height: 600,
                            position: 'relative',
                        }}>
                            <img
                                src={img}
                                alt={`Slide ${idx + 1}`}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                }}
                            />
                        </div>
                    </div>
                ))}
            </Carousel>

            <div style={{
                maxWidth: 1200,
                margin: '0 auto',
                padding: '48px 16px'
            }}>
                {/* Categories Section */}
                <section style={{ marginBottom: 64 }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 32
                    }}>
                        <Title level={2} style={{ margin: 0 }}>
                            Danh mục sản phẩm
                        </Title>
                    </div>

                    {categories.length > 0 ? (
                        <Row gutter={[24, 24]}>
                            {categories.slice(0, 6).map((cat) => (
                                <Col
                                    xs={24}
                                    sm={12}
                                    md={8}
                                    lg={6}
                                    key={cat.categoryId}
                                >
                                    <CategoryCard category={cat} />
                                </Col>
                            ))}
                        </Row>
                    ) : (
                        <Empty description="Chưa có danh mục nào" />
                    )}
                </section>

                <Divider />

                {/* Featured Products Section */}
                <section style={{ marginBottom: 48 }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 32
                    }}>
                        <Title level={2} style={{ margin: 0 }}>
                            Sản phẩm nổi bật
                        </Title>
                        <Button
                            type="link"
                            onClick={() => navigate('/products')}
                            icon={<ShoppingOutlined />}
                        >
                            Xem tất cả
                        </Button>
                    </div>

                    {products.length > 0 ? (
                        <Row gutter={[16, 16]}>
                            {products.slice(0, 8).map((product) => (
                                <Col
                                    xs={24}
                                    sm={12}
                                    md={8}
                                    lg={6}
                                    key={product.productId}
                                >
                                    <ProductCard product={product} />
                                </Col>
                            ))}
                        </Row>
                    ) : (
                        <Empty
                            description="Chưa có sản phẩm nổi bật"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                    )}
                </section>
            </div>
        </div>
    );
}