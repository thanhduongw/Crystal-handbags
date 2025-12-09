import { useEffect, useState } from 'react';
import { Carousel, Col, Row, Spin, Typography, Button, Space, Divider } from 'antd';
import type { ProductListDto, CategoryDto } from '../types';
import { fetchProducts } from '../api/productAPI';
import ProductCard from '../components/ProductCard';
import CategoryCard from '../components/CategoryCard';
import { useNavigate } from 'react-router-dom';
import { fetchCategories } from '../api/categoryAPI';

const { Title } = Typography;

export default function Home() {
    const [categories, setCategories] = useState<CategoryDto[]>([]);
    const [products, setProducts] = useState<ProductListDto[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const images = [
        'https://cdn.hstatic.net/files/1000003969/file/khong-lineee.jpg',
        'https://file.hstatic.net/1000003969/file/1920x870_6f0552ad424b4c4dba7d8ed47e215225.jpg',
        'https://file.hstatic.net/1000003969/file/kvm.jpg',
        'https://file.hstatic.net/1000003969/file/1920x870_b5e84ea3a70d430c8b33f479c64fb560.jpg'
    ];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [prods, cats] = await Promise.all([fetchProducts(), fetchCategories()]);
            setProducts(prods.filter((p) => p.showHomepage));
            setCategories(cats);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };


    if (loading) return <Spin style={{ display: 'block', margin: '100px auto' }} size="large" />;

    return (
        <div>
            <Carousel arrows draggable autoplay autoplaySpeed={3000}>
                {images.map((img, idx) => (
                    <div key={idx}>
                        <div style={{ height: 600 }}>
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


            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
                <div style={{ margin: '32px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <Title level={2} style={{ margin: 0 }}>Danh mục sản phẩm</Title>
                    </div>
                    <Row gutter={[24, 24]}>
                        {categories.slice(0, 6).map((cat) => (
                            <Col xs={24} sm={12} md={8} lg={6} key={cat.categoryId}>
                                <CategoryCard category={cat} />
                            </Col>
                        ))}
                    </Row>
                </div>

                <Divider />

                <div style={{ marginBottom: 48 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <Space>
                            <Title level={2} style={{ margin: 0 }}>Sản phẩm nổi bật</Title>
                        </Space>
                        <Button type="link" onClick={() => navigate('/products')}>Xem tất cả →</Button>
                    </div>
                    <Row gutter={[16, 16]}>
                        {products.slice(0, 8).map((product) => (
                            <Col xs={24} sm={12} md={8} lg={6} key={product.productId}>
                                <ProductCard product={product} />
                            </Col>
                        ))}
                    </Row>
                </div>
            </div>
        </div>
    );
}