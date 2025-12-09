import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Col, Row, Spin, Pagination, Typography } from 'antd';
import { fetchProducts, fetchProductsByCat } from '../api/productAPI';
import ProductCard from '../components/ProductCard';
import { fetchCategory } from '../api/categoryAPI';
import type { CategoryDto, ProductListDto } from '../types';

const { Title } = Typography;

export default function ProductList() {
    const { id } = useParams<{ id?: string }>();
    const categoryId = id ? Number(id) : null;

    const [data, setData] = useState<ProductListDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [category, setCategory] = useState<CategoryDto>();
    const pageSize = 12;

    useEffect(() => {
        loadProducts();
    }, [id, currentPage]);

    const loadProducts = async () => {
        try {
            setLoading(true);
            let products: ProductListDto[];
            if (categoryId && !isNaN(categoryId)) {
                products = await fetchProductsByCat(categoryId);
                setCategory(await fetchCategory(categoryId))
            } else {
                products = await fetchProducts();
            }
            setData(products);
            setTotal(products.length);
        } catch (error) {
            console.error('Failed to load products:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Spin style={{ display: 'block', margin: '100px auto' }} />;

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
            <Title level={2}>
                {categoryId ? category?.name : 'Tất cả sản phẩm'}
            </Title>

            <Row gutter={[16, 16]}>
                {data
                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                    .map((product) => (
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

            <div style={{ textAlign: 'center', marginTop: 32 }}>
                <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={total}
                    onChange={(page) => setCurrentPage(page)}
                />
            </div>
        </div>
    );
}
