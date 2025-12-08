import { useEffect, useState } from 'react';
import { Carousel, Col, Row, Spin, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { Product, Category } from '../types';
import { fetchCategories, fetchProducts, searchProducts } from '../api/productAPI';
import ProductCard from '../components/ProductCard';
import CategoryCard from '../components/CategoryCard';

const { Search } = Input;

export default function Home() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

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

    const onSearch = async (keyword: string) => {
        if (!keyword.trim()) {
            loadData();
            return;
        }
        try {
            setLoading(true);
            const results = await searchProducts(keyword);
            setProducts(results);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Spin style={{ display: 'block', margin: '100px auto' }} />;

    return (
        <div>
            <Carousel arrows draggable autoplay autoplaySpeed={4000}>
                {['slide1', 'slide2', 'slide3'].map((slide, idx) => (
                    <div key={slide}>
                        <img
                            src="https://placehold.co/1200x400"
                            alt={`Slide ${idx + 1}`}
                            style={{ width: '100%', height: 400, objectFit: 'cover' }}
                        />
                    </div>
                ))}
            </Carousel>

            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
                <Search
                    placeholder="Tìm kiếm sản phẩm..."
                    enterButton="Tìm kiếm"
                    size="large"
                    onSearch={onSearch}
                    style={{ margin: '24px 0' }}
                    prefix={<SearchOutlined />}
                />

                <div style={{ marginTop: 32 }}>
                    <h2>Danh mục sản phẩm</h2>
                    <Row gutter={[16, 16]}>
                        {categories.map((cat) => (
                            <Col xs={24} sm={12} md={8} key={cat.id}>
                                <CategoryCard category={cat} />
                            </Col>
                        ))}
                    </Row>
                </div>

                <div style={{ marginTop: 48 }}>
                    <h2>Sản phẩm mới</h2>
                    <Row gutter={[16, 16]}>
                        {products.map((product) => (
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